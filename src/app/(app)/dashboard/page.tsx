/* eslint-disable @next/next/no-img-element -- Clerk avatar hosts are dynamic, so this intentionally avoids a restrictive image allowlist. */

import Link from 'next/link';
import { headers } from 'next/headers';

import { Button } from '@/components/ui/button';
import {
  DashboardUserResponseSchema,
  type DashboardUserResponse
} from '@/lib/schemas';

type DashboardFetchResult =
  | {
      isSuccess: true;
      data: DashboardUserResponse;
    }
  | {
      isSuccess: false;
    };

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

async function fetchDashboardData(): Promise<DashboardFetchResult> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol =
    requestHeaders.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const cookie = requestHeaders.get('cookie');

  if (!host) {
    console.error('Dashboard request is missing a host header.');
    return { isSuccess: false };
  }

  try {
    const apiUrl = new URL('/api/v1/user', `${protocol}://${host}`);
    const response = await fetch(apiUrl, {
      headers: cookie ? { cookie } : undefined,
      cache: 'no-store'
    });

    if (!response.ok) {
      return { isSuccess: false };
    }

    const responseBody: unknown = await response.json();
    const parsedResponse = DashboardUserResponseSchema.safeParse(responseBody);

    if (!parsedResponse.success || !parsedResponse.data.name.trim()) {
      return { isSuccess: false };
    }

    return {
      isSuccess: true,
      data: parsedResponse.data
    };
  } catch (error: unknown) {
    console.error('Unable to load dashboard data.', error);
    return { isSuccess: false };
  }
}

function DashboardErrorState(): React.JSX.Element {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="max-w-xl border border-border bg-surface-card p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          Dashboard unavailable
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
          We could not load your workspace.
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          Refresh the page in a moment. If this continues, sign out and sign
          back in.
        </p>
      </div>
    </section>
  );
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const dashboardResult = await fetchDashboardData();

  if (!dashboardResult.isSuccess) {
    return <DashboardErrorState />;
  }

  const { avatarUrl, credits, name, sessions } = dashboardResult.data;
  const initial = getInitial(name);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <section className="border-b border-border pb-10 sm:pb-12">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                alt={`${name}'s avatar`}
                className="h-12 w-12 rounded-full border border-border bg-surface-muted object-cover"
                height={48}
                src={avatarUrl}
                width={48}
              />
            ) : (
              <div
                aria-label={`${name}'s avatar`}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-muted font-display text-lg font-bold text-ink"
                role="img"
              >
                {initial}
              </div>
            )}

            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
                Your workspace
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Welcome back, {name}.
              </h1>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-3 border border-primary-600 bg-primary-100 px-4 py-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-primary-900">
              Credits
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-primary-900">
              {credits}
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="recent-sessions-heading" className="pt-10 sm:pt-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
              Practice history
            </p>
            <h2
              className="mt-1 font-display text-2xl font-bold tracking-tight text-ink"
              id="recent-sessions-heading"
            >
              Recent sessions
            </h2>
          </div>

          <Button asChild>
            <Link href="/teach">Start New Session</Link>
          </Button>
        </div>

        {sessions.length > 0 ? (
          <ul className="mt-7 border-t border-border">
            {sessions.map((session) => (
              <li
                className="flex flex-col gap-4 border-b border-border py-5 sm:flex-row sm:items-center sm:justify-between"
                key={session.sessionId}
              >
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-ink">
                    {session.topic}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {session.billyUnderstanding}% demonstrated understanding
                  </p>
                </div>

                <Link
                  className="w-fit text-sm font-medium text-primary-900 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  href={`/teach/${session.sessionId}`}
                >
                  View session <span aria-hidden="true">&rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-7 border border-border bg-surface-card p-6 sm:p-8">
            <p className="font-display text-lg font-bold tracking-tight text-ink">
              No sessions yet.
            </p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-ink-muted">
              Start with a topic you want to understand well enough to explain.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
