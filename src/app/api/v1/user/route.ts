import { NextResponse } from 'next/server';

import { getAuthUserId } from '@/lib/clerk';
import connectToDatabase from '@/lib/db';
import Session from '@/models/session';
import User from '@/models/user';

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

export async function GET(): Promise<NextResponse> {
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

  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId }).select('_id credits email name avatarUrl');

    if (!user) {
      return createErrorResponse('USER_NOT_FOUND', 'User not found.', 404);
    }

    const sessionDocuments = await Session.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    const sessions = sessionDocuments.map((session) => ({
      topic: session.topic,
      status: session.status,
      billyUnderstanding: session.billyUnderstanding,
      createdAt: session.createdAt
    }));

    // In your GET /api/v1/user route, update the return statement:
    return NextResponse.json({
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      credits: user.credits,
      sessions: sessions
    });
  } catch {
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Unable to retrieve dashboard information.',
      500
    );
  }
}
