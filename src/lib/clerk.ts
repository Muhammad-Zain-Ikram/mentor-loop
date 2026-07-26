import { auth } from '@clerk/nextjs/server';

export async function getAuthUserId(): Promise<string | null> {
  if (process.env.NODE_ENV === 'development') {
    return process.env.DEV_CLERK_ID || 'user_test_123';
  }
  const session = await auth();
  return session.userId;
}
