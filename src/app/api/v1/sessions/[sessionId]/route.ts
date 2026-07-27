import { isValidObjectId } from 'mongoose';
import { NextResponse } from 'next/server';

import { getAuthUserId } from '@/lib/clerk';
import connectToDatabase from '@/lib/db';
import Session from '@/models/session';
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

    const session = await Session.findOne({
      _id: sessionId,
      userId: user._id
    });

    if (!session) {
      return createErrorResponse(
        'SESSION_NOT_FOUND',
        'Session not found.',
        404
      );
    }

    return NextResponse.json({
      session: session.toObject()
    });
  } catch {
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Unable to retrieve the session.',
      500
    );
  }
}
