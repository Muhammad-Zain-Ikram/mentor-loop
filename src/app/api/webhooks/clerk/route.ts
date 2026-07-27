import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { type NextRequest, NextResponse } from 'next/server';

import { connectToDatabase } from '@/lib/db';
import { createWelcomeEmailHtml } from '@/lib/emails/welcome';
import {
  getResendFromAddress,
  hasResendConfiguration,
  resend
} from '@/lib/resend';
import { User } from '@/models/user';

export const runtime = 'nodejs';

const WELCOME_EMAIL_SUBJECT = 'Welcome to MentorLoop';

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

function createUserName(firstName: string | null, lastName: string | null): string {
  const nameParts = [firstName, lastName].filter(
    (name): name is string => Boolean(name?.trim())
  );

  return nameParts.join(' ').trim() || 'there';
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim()) {
    return createErrorResponse(
      'WEBHOOK_CONFIGURATION_MISSING',
      'The Clerk webhook configuration is unavailable.',
      500
    );
  }

  let event: Awaited<ReturnType<typeof verifyWebhook>>;

  try {
    event = await verifyWebhook(request);
  } catch {
    return createErrorResponse(
      'INVALID_WEBHOOK_SIGNATURE',
      'The webhook signature could not be verified.',
      400
    );
  }

  if (event.type !== 'user.created') {
    return NextResponse.json({ received: true });
  }

  const primaryEmailAddress = event.data.email_addresses.find(
    (emailAddress) => emailAddress.id === event.data.primary_email_address_id
  )?.email_address;

  if (!primaryEmailAddress) {
    return createErrorResponse(
      'INVALID_WEBHOOK_PAYLOAD',
      'The user creation event does not include a primary email address.',
      400
    );
  }

  if (!hasResendConfiguration()) {
    return createErrorResponse(
      'EMAIL_CONFIGURATION_MISSING',
      'The email delivery configuration is unavailable.',
      500
    );
  }

  const clerkId = event.data.id;
  const email = primaryEmailAddress.toLowerCase();
  const name = createUserName(event.data.first_name, event.data.last_name);

  try {
    await connectToDatabase();

    const existingUser = await User.exists({ clerkId });

    if (existingUser) {
      return NextResponse.json({ received: true });
    }

    await User.create({
      _id: clerkId,
      clerkId,
      email,
      name,
      credits: 1
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ received: true });
    }

    return createErrorResponse(
      'USER_CREATION_FAILED',
      'The user account could not be created.',
      500
    );
  }

  const resendFromAddress = getResendFromAddress();

  if (!resendFromAddress) {
    return createErrorResponse(
      'EMAIL_CONFIGURATION_MISSING',
      'The email delivery configuration is unavailable.',
      500
    );
  }

  try {
    const emailResult = await resend.emails.send(
      {
        from: resendFromAddress,
        to: [email],
        subject: WELCOME_EMAIL_SUBJECT,
        html: createWelcomeEmailHtml(name)
      },
      {
        idempotencyKey: `clerk-welcome-${clerkId}`
      }
    );

    if (emailResult.error) {
      return createErrorResponse(
        'EMAIL_SEND_FAILED',
        'The welcome email could not be sent.',
        500
      );
    }
  } catch {
    return createErrorResponse(
      'EMAIL_SEND_FAILED',
      'The welcome email could not be sent.',
      500
    );
  }

  return NextResponse.json({ received: true });
}
