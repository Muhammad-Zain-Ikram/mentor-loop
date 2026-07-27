import Link from 'next/link';
import { headers } from 'next/headers';

import { SessionWorkspace } from '@/components/teach/SessionWorkspace';
import {
  SessionDetailResponseSchema,
  type SessionDetail
} from '@/lib/schemas';

type TeachingSessionPageProps = Readonly<{
  params: Promise<{
    sessionId: string;
  }>;
}>;

type SessionFetchResult =
  | {
      isSuccess: true;
      session: SessionDetail;
    }
  | {
      isSuccess: false;
    };

const SESSION_ID_PATTERN = /^[a-f\d]{24}$/i;

async function fetchSessionData(
  sessionId: string
): Promise<SessionFetchResult> {
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    return { isSuccess: false };
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol =
    requestHeaders.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const cookie = requestHeaders.get('cookie');

  if (!host) {
    console.error('Teaching session request is missing a host header.');
    return { isSuccess: false };
  }

  try {
    const apiUrl = new URL(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}`,
      `${protocol}://${host}`
    );
    const response = await fetch(apiUrl, {
      headers: cookie ? { cookie } : undefined,
      cache: 'no-store'
    });

    if (!response.ok) {
      return { isSuccess: false };
    }

    const responseBody: unknown = await response.json();
    const parsedResponse = SessionDetailResponseSchema.safeParse(responseBody);

    if (!parsedResponse.success) {
      return { isSuccess: false };
    }

    return {
      isSuccess: true,
      session: parsedResponse.data.session
    };
  } catch (error: unknown) {
    console.error('Unable to load teaching session data.', error);
    return { isSuccess: false };
  }
}

function SessionUnavailableState(): React.JSX.Element {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="max-w-xl border border-border bg-surface-card p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          Session unavailable
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
          We could not load this session.
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          It may no longer be available, or your session may have expired.
        </p>
        <Link
          className="mt-6 inline-flex text-sm font-medium text-primary-900 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          href="/dashboard"
        >
          Return to dashboard <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}

export default async function TeachingSessionPage({
  params
}: TeachingSessionPageProps): Promise<React.JSX.Element> {
  const { sessionId } = await params;
  const sessionResult = await fetchSessionData(sessionId);

  if (!sessionResult.isSuccess) {
    return <SessionUnavailableState />;
  }

  const { session } = sessionResult;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="border-b border-border pb-8 sm:pb-10">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          Teaching session
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {session.topic}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">
          Explain each objective clearly enough for Billy to put it into
          practice.
        </p>
      </header>

      <SessionWorkspace
        initialBillyUnderstanding={session.billyUnderstanding}
        initialChatHistory={session.chatHistory}
        initialObjectives={session.objectives}
        initialReport={session.report}
        sessionId={sessionId}
      />
    </div>
  );
}
