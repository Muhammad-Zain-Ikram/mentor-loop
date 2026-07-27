import { isValidObjectId, type HydratedDocument } from 'mongoose';
import { NextResponse } from 'next/server';

import { callAI } from '@/lib/ai';
import { getAuthUserId } from '@/lib/clerk';
import connectToDatabase from '@/lib/db';
import { REPORT_PROMPT } from '@/lib/prompts';
import { ReportSchema } from '@/lib/schemas';
import Session, { type SessionDocument } from '@/models/session';
import User from '@/models/user';

type SessionRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

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

async function findOwnedSession(
  clerkUserId: string,
  sessionId: string
): Promise<HydratedDocument<SessionDocument> | null> {
  await connectToDatabase();

  const user = await User.findOne({ clerkId: clerkUserId }).select('_id');

  if (!user) {
    return null;
  }

  return Session.findOne({
    _id: sessionId,
    userId: user._id
  });
}

export async function POST(
  _request: Request,
  context: SessionRouteContext
): Promise<NextResponse> {
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

  const { sessionId } = await context.params;

  if (!isValidObjectId(sessionId)) {
    return createErrorResponse('SESSION_NOT_FOUND', 'Session not found.', 404);
  }

  let session: HydratedDocument<SessionDocument> | null;

  try {
    session = await findOwnedSession(userId, sessionId);
  } catch {
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Unable to retrieve the session.',
      500
    );
  }

  if (!session) {
    return createErrorResponse('SESSION_NOT_FOUND', 'Session not found.', 404);
  }

  const chatHistory = session.chatHistory.map((message) => ({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.toISOString()
  }));
  const systemPrompt = REPORT_PROMPT.replace('{TOPIC}', session.topic).replace(
    '{CHAT_HISTORY}',
    JSON.stringify(chatHistory)
  );

  let aiContent: string;

  try {
    aiContent = await callAI({
      systemPrompt,
      userMessage: 'Generate the mastery report.'
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

  const reportResult = ReportSchema.safeParse(aiResponse);

  if (!reportResult.success) {
    return createErrorResponse(
      'AI_PARSE_FAILED',
      'The AI response could not be processed.',
      500
    );
  }

  session.status = 'completed';
  session.report = reportResult.data;

  try {
    await session.save();
  } catch {
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Unable to save the mastery report.',
      500
    );
  }

  return NextResponse.json(reportResult.data);
}

export async function GET(
  _request: Request,
  context: SessionRouteContext
): Promise<NextResponse> {
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

  const { sessionId } = await context.params;

  if (!isValidObjectId(sessionId)) {
    return createErrorResponse('SESSION_NOT_FOUND', 'Session not found.', 404);
  }

  let session: HydratedDocument<SessionDocument> | null;

  try {
    session = await findOwnedSession(userId, sessionId);
  } catch {
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Unable to retrieve the session.',
      500
    );
  }

  if (!session) {
    return createErrorResponse('SESSION_NOT_FOUND', 'Session not found.', 404);
  }

  const report = session.report;

  if (!report) {
    return createErrorResponse(
      'REPORT_NOT_GENERATED',
      'The mastery report has not been generated.',
      404
    );
  }

  return NextResponse.json({
    topic: session.topic,
    ...report
  });
}
