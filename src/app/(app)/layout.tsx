import { SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import type { ReactNode } from 'react';

type ApplicationLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function ApplicationLayout({
  children
}: ApplicationLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface">
        <nav
          aria-label="Application navigation"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
        >
          <Link
            aria-label="MentorLoop dashboard"
            className="font-display text-lg font-bold tracking-tight text-ink"
            href="/dashboard"
          >
            MentorLoop
          </Link>

          <SignOutButton>
            <button
              className="rounded-md border border-border bg-surface-card px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-primary-600 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              type="button"
            >
              Sign out
            </button>
          </SignOutButton>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
