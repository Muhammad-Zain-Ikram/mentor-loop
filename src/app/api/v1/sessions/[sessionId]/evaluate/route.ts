import { isValidObjectId, type HydratedDocument } from 'mongoose';
import { NextResponse } from 'next/server';

import { callAI } from '@/lib/ai';
import { getAuthUserId } from '@/lib/clerk';
import connectToDatabase from '@/lib/db';
import { EVALUATION_PROMPT } from '@/lib/prompts';
import { EvaluateInputSchema, EvaluationSchema } from '@/lib/schemas';
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

export async function POST(
  request: Request,
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

  const inputResult = EvaluateInputSchema.safeParse(requestBody);

  if (!inputResult.success) {
    return createErrorResponse(
      'INVALID_REQUEST',
      'The user message must be between 5 and 2000 characters.',
      400
    );
  }

  let session: HydratedDocument<SessionDocument> | null;

  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId }).select('_id');

    if (!user) {
      return createErrorResponse(
        'SESSION_NOT_FOUND',
        'Session not found.',
        404
      );
    }

    session = await Session.findOne({
      _id: sessionId,
      userId: user._id
    });
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

  const objective = session.objectives.find(
    (currentObjective) => currentObjective.isCompleted === false
  );

  if (!objective) {
    return createErrorResponse(
      'NO_PENDING_OBJECTIVES',
      'All learning objectives have already been completed.',
      409
    );
  }

  const systemPrompt = EVALUATION_PROMPT.replace(
    '{OBJECTIVE_TITLE}',
    objective.title
  )
    .replace('{OBJECTIVE_DESCRIPTION}', objective.description)
    .replace('{USER_MESSAGE}', inputResult.data.userMessage);

  let aiContent: string;

  try {
    aiContent = await callAI({
      systemPrompt,
      userMessage: inputResult.data.userMessage
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

  const evaluationResult = EvaluationSchema.safeParse(aiResponse);

  if (!evaluationResult.success) {
    return createErrorResponse(
      'AI_PARSE_FAILED',
      'The AI response could not be processed.',
      500
    );
  }

  if (evaluationResult.data.objective_met) {
    objective.isCompleted = true;
    session.markModified('objectives');
  }

  const completedObjectives = session.objectives.filter(
    (currentObjective) => currentObjective.isCompleted
  ).length;
  const totalObjectives = session.objectives.length;

  session.billyUnderstanding =
    totalObjectives === 0
      ? 0
      : (completedObjectives / totalObjectives) * 100;

  const messageTimestamp = new Date();

  session.chatHistory.push(
    {
      role: 'user',
      content: inputResult.data.userMessage,
      timestamp: messageTimestamp
    },
    {
      role: 'billy',
      content: evaluationResult.data.billy_reply,
      timestamp: messageTimestamp
    }
  );

  try {
    await session.save();
  } catch (error){
    console.log("LekrEr", error);
    
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Unable to update the learning session.',
      500
    );
  }

  return NextResponse.json({
    billy_reply: evaluationResult.data.billy_reply,
    billyUnderstanding: session.billyUnderstanding,
    objectives: session.objectives
  });
}
