import { type NextRequest, NextResponse } from 'next/server';

import { callAI } from '@/lib/ai';
import { connectToDatabase } from '@/lib/db';
import { createBillyFollowUpEmailHtml } from '@/lib/emails/billy-followup';
import { SPACED_REPETITION_PROMPT } from '@/lib/prompts';
import { resend } from '@/lib/resend';
import { FollowUpQuestionSchema } from '@/lib/schemas';
import { Session } from '@/models/session';
import { User } from '@/models/user';

export const runtime = 'nodejs';

const HOUR_IN_MS = 60 * 60 * 1000;
const FOLLOW_UP_MIN_AGE_MS = 72 * HOUR_IN_MS;
const FOLLOW_UP_MAX_AGE_MS = 96 * HOUR_IN_MS;
const SESSION_BATCH_SIZE = 100;
const FOLLOW_UP_EMAIL_FROM = 'onboarding@resend.dev';
const FOLLOW_UP_EMAIL_SUBJECT = 'Billy has a quick refresher question';

interface SessionCursor {
  id: string;
  updatedAt: Date;
}

interface SpacedRepetitionSession {
  _id: {
    toString(): string;
  };
  userId: string;
  topic: string;
  updatedAt: Date;
}

function createErrorResponse(
  code: string,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message
      }
    },
    {
      status
    }
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  const authorizationHeader = request.headers.get('authorization');

  if (
    !cronSecret?.trim() ||
    authorizationHeader !== `Bearer ${cronSecret}`
  ) {
    return createErrorResponse(
      'UNAUTHORIZED',
      'Authorization is required.',
      401
    );
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return createErrorResponse(
      'EMAIL_CONFIGURATION_MISSING',
      'The email delivery configuration is unavailable.',
      500
    );
  }

  const now = new Date();
  const earliestUpdatedAt = new Date(
    now.getTime() - FOLLOW_UP_MAX_AGE_MS
  );
  const latestUpdatedAt = new Date(now.getTime() - FOLLOW_UP_MIN_AGE_MS);
  let emailsSent = 0;
  let cursor: SessionCursor | null = null;

  try {
    await connectToDatabase();

    while (true) {
      const sessions: SpacedRepetitionSession[] =
        cursor === null
          ? await Session.find({
              status: 'completed',
              spacedRepetitionSentAt: null,
              updatedAt: {
                $gte: earliestUpdatedAt,
                $lte: latestUpdatedAt
              }
            })
              .select({
                _id: 1,
                userId: 1,
                topic: 1,
                updatedAt: 1
              })
              .sort({
                updatedAt: 1,
                _id: 1
              })
              .limit(SESSION_BATCH_SIZE)
              .exec()
          : await Session.find({
              status: 'completed',
              spacedRepetitionSentAt: null,
              updatedAt: {
                $gte: earliestUpdatedAt,
                $lte: latestUpdatedAt
              },
              $or: [
                {
                  updatedAt: {
                    $gt: cursor.updatedAt
                  }
                },
                {
                  updatedAt: cursor.updatedAt,
                  _id: {
                    $gt: cursor.id
                  }
                }
              ]
            })
              .select({
                _id: 1,
                userId: 1,
                topic: 1,
                updatedAt: 1
              })
              .sort({
                updatedAt: 1,
                _id: 1
              })
              .limit(SESSION_BATCH_SIZE)
              .exec();

      if (sessions.length === 0) {
        break;
      }

      const lastSession = sessions.at(-1);

      if (!lastSession) {
        break;
      }

      cursor = {
        id: lastSession._id.toString(),
        updatedAt: lastSession.updatedAt
      };

      const userIds: string[] = [
        ...new Set(sessions.map((session) => session.userId))
      ];
      const users = await User.find({
        _id: {
          $in: userIds
        },
        deletedAt: null
      })
        .select({
          _id: 1,
          email: 1
        })
        .exec();
      const emailByUserId = new Map(
        users.map((user) => [String(user._id), user.email])
      );

      for (const session of sessions) {
        const recipientEmail = emailByUserId.get(session.userId);

        if (!recipientEmail) {
          continue;
        }

        try {
          const aiContent = await callAI({
            systemPrompt: SPACED_REPETITION_PROMPT.replace(
              '{TOPIC}',
              session.topic
            ),
            userMessage: `Generate a refresher question about ${session.topic}.`
          });

          let aiResponse: unknown;

          try {
            aiResponse = JSON.parse(aiContent);
          } catch {
            console.error('A spaced-repetition AI response was not valid JSON.');
            continue;
          }

          const questionResult = FollowUpQuestionSchema.safeParse(aiResponse);

          if (!questionResult.success) {
            console.error('A spaced-repetition AI response did not match the schema.');
            continue;
          }

          const emailResult = await resend.emails.send(
            {
              from: FOLLOW_UP_EMAIL_FROM,
              to: [recipientEmail],
              subject: FOLLOW_UP_EMAIL_SUBJECT,
              html: createBillyFollowUpEmailHtml(
                session.topic,
                questionResult.data.question
              )
            },
            {
              idempotencyKey: `spaced-repetition-${session._id.toString()}`
            }
          );

          if (emailResult.error) {
            console.error('A spaced-repetition email could not be sent.');
            continue;
          }

          const updateResult = await Session.updateOne(
            {
                _id: session._id.toString(),
              spacedRepetitionSentAt: null
            },
            {
              $set: {
                spacedRepetitionSentAt: new Date()
              }
            }
          );

          if (updateResult.modifiedCount === 1) {
            emailsSent += 1;
          }
        } catch {
          console.error('A spaced-repetition follow-up could not be processed.');
        }
      }
    }
  } catch {
    return createErrorResponse(
      'CRON_EXECUTION_FAILED',
      'The spaced-repetition job could not be completed.',
      500
    );
  }

  return NextResponse.json({ emailsSent });
}
