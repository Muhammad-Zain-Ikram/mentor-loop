import { NextResponse } from 'next/server';
import type { HydratedDocument } from 'mongoose';

import { callAI } from '@/lib/ai';
import { getAuthUserId } from '@/lib/clerk';
import connectToDatabase from '@/lib/db';
import { OBJECTIVE_PROMPT } from '@/lib/prompts';
import { CreateSessionInputSchema, ObjectiveSchema } from '@/lib/schemas';
import Session, { type SessionDocument } from '@/models/session';
import User, { type UserDocument } from '@/models/user';

export const runtime = 'nodejs';

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

export async function POST(request: Request): Promise<NextResponse> {
  let userId: string | null;

  try {
    userId = await getAuthUserId();
  } catch {
    return createErrorResponse(
      'UNAUTHORIZED',
      'Authentication is required.',
      401
    );
  }

  if (!userId) {
    return createErrorResponse(
      'UNAUTHORIZED',
      'Authentication is required.',
      401
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return createErrorResponse(
      'INVALID_REQUEST',
      'The request body must be valid JSON.',
      400
    );
  }

  const inputResult = CreateSessionInputSchema.safeParse(requestBody);

  if (!inputResult.success) {
    return createErrorResponse(
      'INVALID_REQUEST',
      'The topic and broad topic must each be between 2 and 100 characters.',
      400
    );
  }

  let user: HydratedDocument<UserDocument> | null;

  try {
    await connectToDatabase();
    user = await User.findOne({ clerkId: userId });
  } catch {
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Unable to retrieve the user account.',
      500
    );
  }

  if (!user) {
    return createErrorResponse('USER_NOT_FOUND', 'User not found.', 404);
  }

  if (user.credits <= 0) {
    return createErrorResponse(
      'INSUFFICIENT_CREDITS',
      'You do not have enough credits to start a session.',
      402
    );
  }

  
  let aiContent: string;

  try {
    aiContent = await callAI({
      systemPrompt: OBJECTIVE_PROMPT
        .replace('{TOPIC}', inputResult.data.topic)
        .replace('{BROAD_TOPIC}', inputResult.data.broadTopic || 'General Programming'),
      userMessage: inputResult.data.topic
    });
  } catch {
    return createErrorResponse(
      'AI_CALL_FAILED',
      'The AI service is currently unavailable.',
      500
    );
  }

  let aiResponse: unknown;

  try {
    aiResponse = JSON.parse(aiContent);
  } catch {
    return createErrorResponse(
      'AI_PARSE_FAILED',
      'The AI response could not be processed.',
      500
    );
  }

  const objectiveResult = ObjectiveSchema.safeParse(aiResponse);

  if (!objectiveResult.success) {
    return createErrorResponse(
      'AI_PARSE_FAILED',
      'The AI response could not be processed.',
      500
    );
  }

  const objectives = objectiveResult.data.objectives.map((objective) => ({
    ...objective,
    isCompleted: false
  }));

  let session: HydratedDocument<SessionDocument>;

  try {
    session = await Session.create({
      userId: user._id,
      topic: inputResult.data.topic,
      broadTopic: inputResult.data.broadTopic,
      objectives
    });
  } catch {
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Unable to create the learning session.',
      500
    );
  }

  try {
    user.credits -= 1;
    await user.save();
  } catch {
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Unable to update the user credits.',
      500
    );
  }

  return NextResponse.json({
    sessionId: session._id.toString(),
    objectives: session.objectives
  });
}
