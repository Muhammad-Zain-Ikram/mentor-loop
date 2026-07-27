import { NextResponse } from 'next/server';

import { callAI } from '@/lib/ai';
import { getAuthUserId } from '@/lib/clerk';
import { SUBTOPIC_PROMPT } from '@/lib/prompts';
import { SubtopicSchema, TopicInputSchema } from '@/lib/schemas';

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

  const inputResult = TopicInputSchema.safeParse(requestBody);

  if (!inputResult.success) {
    return createErrorResponse(
      'INVALID_REQUEST',
      'The topic must be between 2 and 100 characters.',
      400
    );
  }

  let aiContent: string;

  try {
    aiContent = await callAI({
      systemPrompt: SUBTOPIC_PROMPT.replace('{TOPIC}', inputResult.data.topic),
      userMessage: inputResult.data.topic
    });
  } catch (error){
    console.log("error::", error);
    
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

  const subtopicResult = SubtopicSchema.safeParse(aiResponse);

  if (!subtopicResult.success) {
    return createErrorResponse(
      'AI_PARSE_FAILED',
      'The AI response could not be processed.',
      500
    );
  }

  return NextResponse.json({
    subtopics: subtopicResult.data.subtopics
  });
}
