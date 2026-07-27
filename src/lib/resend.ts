import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export function getResendFromAddress(): string | null {
  const resendFromAddress = process.env.RESEND_FROM_EMAIL?.trim();

  return resendFromAddress || null;
}

export function hasResendConfiguration(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && getResendFromAddress());
}
