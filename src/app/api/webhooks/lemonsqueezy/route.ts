import { createHmac, timingSafeEqual } from 'node:crypto';

import { NextResponse } from 'next/server';

import { connectToDatabase } from '@/lib/db';
import { createPaymentSuccessEmailHtml } from '@/lib/emails/payment-success';
import {
  getResendFromAddress,
  hasResendConfiguration,
  resend
} from '@/lib/resend';
import {
  LemonSqueezyEventSchema,
  LemonSqueezyOrderCreatedSchema
} from '@/lib/schemas';
import { User } from '@/models/user';

export const runtime = 'nodejs';

const CREDIT_GRANT = 50;
const PAYMENT_SUCCESS_EMAIL_SUBJECT = 'Your MentorLoop credits are ready';

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

function verifyLemonSqueezySignature(
  rawBody: string,
  signature: string,
  signingSecret: string
): boolean {
  const expectedSignature = Buffer.from(
    createHmac('sha256', signingSecret).update(rawBody).digest('hex'),
    'hex'
  );
  const receivedSignature = Buffer.from(signature, 'hex');

  return (
    expectedSignature.length === receivedSignature.length &&
    timingSafeEqual(expectedSignature, receivedSignature)
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const signingSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!signingSecret?.trim()) {
    return createErrorResponse(
      'WEBHOOK_CONFIGURATION_MISSING',
      'The Lemon Squeezy webhook configuration is unavailable.',
      500
    );
  }

  const signature = request.headers.get('x-signature');

  if (!signature) {
    return createErrorResponse(
      'INVALID_WEBHOOK_SIGNATURE',
      'The webhook signature is missing.',
      400
    );
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return createErrorResponse(
      'INVALID_WEBHOOK_PAYLOAD',
      'The webhook payload could not be read.',
      400
    );
  }

  if (!verifyLemonSqueezySignature(rawBody, signature, signingSecret)) {
    return createErrorResponse(
      'INVALID_WEBHOOK_SIGNATURE',
      'The webhook signature could not be verified.',
      400
    );
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return createErrorResponse(
      'INVALID_WEBHOOK_PAYLOAD',
      'The webhook payload must be valid JSON.',
      400
    );
  }

  const eventResult = LemonSqueezyEventSchema.safeParse(payload);

  if (!eventResult.success) {
    return createErrorResponse(
      'INVALID_WEBHOOK_PAYLOAD',
      'The webhook payload is invalid.',
      400
    );
  }

  if (eventResult.data.meta.event_name !== 'order_created') {
    return NextResponse.json({ received: true });
  }

  const orderResult = LemonSqueezyOrderCreatedSchema.safeParse(payload);

  if (!orderResult.success) {
    return createErrorResponse(
      'INVALID_WEBHOOK_PAYLOAD',
      'The order payload is invalid.',
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

  const orderId = orderResult.data.data.id;
  const email = orderResult.data.data.attributes.user_email.toLowerCase();

  let user = null;

  try {
    await connectToDatabase();

    user = await User.findOneAndUpdate(
      {
        email,
        deletedAt: null,
        processedLemonSqueezyOrderIds: {
          $ne: orderId
        }
      },
      {
        $inc: {
          credits: CREDIT_GRANT
        },
        $addToSet: {
          processedLemonSqueezyOrderIds: orderId
        }
      },
      {
        new: true
      }
    );

    user ??= await User.findOne({
      email,
      deletedAt: null
    });
  } catch {
    return createErrorResponse(
      'CREDIT_GRANT_FAILED',
      'The payment credits could not be applied.',
      500
    );
  }

  if (!user) {
    return createErrorResponse(
      'USER_NOT_FOUND',
      'No account matches the payment email.',
      404
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
        subject: PAYMENT_SUCCESS_EMAIL_SUBJECT,
        html: createPaymentSuccessEmailHtml(user.name)
      },
      {
        idempotencyKey: `lemon-order-${orderId}`
      }
    );

    if (emailResult.error) {
      return createErrorResponse(
        'EMAIL_SEND_FAILED',
        'The payment confirmation email could not be sent.',
        500
      );
    }
  } catch {
    return createErrorResponse(
      'EMAIL_SEND_FAILED',
      'The payment confirmation email could not be sent.',
      500
    );
  }

  return NextResponse.json({ received: true });
}
