'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion
} from 'motion/react';
import { z } from 'zod';

import {
  EvaluateInputSchema,
  EvaluateSessionResponseSchema,
  type TeachingChatMessage,
  type TeachingObjective as SchemaTeachingObjective
} from '@/lib/schemas';

export type ChatMessage = TeachingChatMessage;
export type TeachingObjective = SchemaTeachingObjective;

export type MasteryReport = Readonly<{
  summary: string;
  gaps: string[];
  insights: string;
}>;

export type SessionUpdate = Readonly<{
  billyUnderstanding: number;
  objectives: TeachingObjective[];
}>;

export type ChatPanelProps = Readonly<{
  sessionId: string;
  initialChatHistory: readonly ChatMessage[];
  initialBillyUnderstanding: number;
  initialReport?: MasteryReport | null;
  onSessionUpdate: (update: SessionUpdate) => void;
  onReportGenerated?: (report: MasteryReport) => void;
}>;

type EvaluationResponse = Readonly<{
  billyReply: string;
  billyUnderstanding: number;
  objectives: TeachingObjective[];
}>;

type ApiRequestResult =
  | Readonly<{
      isSuccess: true;
      data: EvaluationResponse;
    }>
  | Readonly<{
      isSuccess: false;
      message: string;
    }>;

type ReportRequestResult =
  | Readonly<{
      isSuccess: true;
      data: MasteryReport;
    }>
  | Readonly<{
      isSuccess: false;
      message: string;
    }>;

const ApiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string().min(1)
      })
      .strict()
  })
  .strict();

const MasteryReportSchema = z
  .object({
    summary: z.string().min(1),
    gaps: z.array(z.string()),
    insights: z.string().min(1)
  })
  .strict();

function getUserFacingApiError(code: string): string {
  switch (code) {
    case 'NO_PENDING_OBJECTIVES':
      return 'All objectives are complete. Generate your mastery report from the session overview.';
    case 'SESSION_NOT_FOUND':
      return 'This learning session is no longer available.';
    case 'UNAUTHORIZED':
      return 'Your session has expired. Please sign in and try again.';
    case 'AI_CALL_FAILED':
      return 'Billy is unavailable right now. Please try again shortly.';
    case 'INVALID_REQUEST':
      return 'Write an explanation between 5 and 2,000 characters.';
    default:
      return 'We could not evaluate that explanation. Please try again.';
  }
}

async function evaluateExplanation(
  sessionId: string,
  userMessage: string
): Promise<ApiRequestResult> {
  let response: Response;

  try {
    response = await fetch(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/evaluate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userMessage })
      }
    );
  } catch (error: unknown) {
    console.error('Unable to reach the session evaluation endpoint.', error);

    return {
      isSuccess: false,
      message: 'Unable to reach MentorLoop right now. Please try again.'
    };
  }

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch (error: unknown) {
    console.error('Received an invalid response from the session evaluation endpoint.', error);

    return {
      isSuccess: false,
      message: 'We received an unexpected response. Please try again.'
    };
  }

  if (!response.ok) {
    const errorResult = ApiErrorResponseSchema.safeParse(responseBody);

    return {
      isSuccess: false,
      message: errorResult.success
        ? getUserFacingApiError(errorResult.data.error.code)
        : 'We could not evaluate that explanation. Please try again.'
    };
  }

  const evaluationResult = EvaluateSessionResponseSchema.safeParse(responseBody);

  if (!evaluationResult.success) {
    return {
      isSuccess: false,
      message: 'We received an unexpected response. Please try again.'
    };
  }

  return {
    isSuccess: true,
    data: {
      billyReply: evaluationResult.data.billy_reply,
      billyUnderstanding: evaluationResult.data.billyUnderstanding,
      objectives: evaluationResult.data.objectives
    }
  };
}

async function generateMasteryReport(
  sessionId: string
): Promise<ReportRequestResult> {
  let response: Response;

  try {
    response = await fetch(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/report`,
      {
        method: 'POST'
      }
    );
  } catch (error: unknown) {
    console.error('Unable to reach the mastery report endpoint.', error);

    return {
      isSuccess: false,
      message: 'Unable to reach MentorLoop right now. Please try again.'
    };
  }

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch (error: unknown) {
    console.error('Received an invalid response from the mastery report endpoint.', error);

    return {
      isSuccess: false,
      message: 'We received an unexpected response. Please try again.'
    };
  }

  if (!response.ok) {
    const errorResult = ApiErrorResponseSchema.safeParse(responseBody);

    return {
      isSuccess: false,
      message: errorResult.success
        ? getUserFacingApiError(errorResult.data.error.code)
        : 'We could not generate your mastery report. Please try again.'
    };
  }

  const reportResult = MasteryReportSchema.safeParse(responseBody);

  if (!reportResult.success) {
    return {
      isSuccess: false,
      message: 'We received an unexpected response. Please try again.'
    };
  }

  return {
    isSuccess: true,
    data: reportResult.data
  };
}

function messageLabel(role: ChatMessage['role']): string {
  return role === 'billy' ? 'Billy' : 'You';
}

function messageKey(message: ChatMessage, index: number): string {
  return `${message.role}-${message.timestamp}-${index}`;
}

export function ChatPanel({
  sessionId,
  initialChatHistory,
  initialBillyUnderstanding,
  initialReport = null,
  onSessionUpdate,
  onReportGenerated
}: ChatPanelProps): React.JSX.Element {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    ...initialChatHistory
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [understanding, setUnderstanding] = useState(initialBillyUnderstanding);
  const [report, setReport] = useState<MasteryReport | null>(initialReport);
  const [isReportOpen, setIsReportOpen] = useState(Boolean(initialReport));
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportErrorMessage, setReportErrorMessage] = useState<string | null>(
    null
  );
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const reportDialogRef = useRef<HTMLDialogElement | null>(null);

  const messageTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : {
        duration: 0.2,
        ease: 'easeOut'
      };

  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'nearest'
    });
  }, [isSending, messages, shouldReduceMotion]);

  useEffect(() => {
    const dialog = reportDialogRef.current;

    if (!dialog || !report) {
      return;
    }

    if (isReportOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isReportOpen && dialog.open) {
      dialog.close();
    }
  }, [isReportOpen, report]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const normalizedMessage = userMessage.trim();
    const inputResult = EvaluateInputSchema.safeParse({
      userMessage: normalizedMessage
    });

    if (!inputResult.success) {
      setErrorMessage('Write an explanation between 5 and 2,000 characters.');
      return;
    }

    setErrorMessage(null);
    setIsSending(true);

    const result = await evaluateExplanation(sessionId, inputResult.data.userMessage);

    if (!result.isSuccess) {
      setErrorMessage(result.message);
      setIsSending(false);
      return;
    }

    const timestamp = new Date().toISOString();

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        role: 'user',
        content: inputResult.data.userMessage,
        timestamp
      },
      {
        role: 'billy',
        content: result.data.billyReply,
        timestamp
      }
    ]);
    setUnderstanding(result.data.billyUnderstanding);
    onSessionUpdate({
      billyUnderstanding: result.data.billyUnderstanding,
      objectives: result.data.objectives
    });
    setUserMessage('');
    setIsSending(false);

    // The page is a Server Component. Refreshing it fetches the saved session
    // again so the gauge and objective list receive the updated values.
    router.refresh();
  }

  async function handleReportAction(): Promise<void> {
    if (report) {
      setIsReportOpen(true);
      return;
    }

    setReportErrorMessage(null);
    setIsGeneratingReport(true);

    const result = await generateMasteryReport(sessionId);

    if (!result.isSuccess) {
      setReportErrorMessage(result.message);
      setIsGeneratingReport(false);
      return;
    }

    setReport(result.data);
    setIsReportOpen(true);
    onReportGenerated?.(result.data);
    setIsGeneratingReport(false);
    router.refresh();
  }

  const isSessionComplete = understanding >= 100;
  const isSubmitDisabled =
    isSending || isSessionComplete || userMessage.trim().length < 5;

  return (
    <section
      aria-labelledby="teaching-transcript-heading"
      className="flex min-h-96 flex-col border border-border bg-surface-card"
    >
      <header className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
            Structured teaching loop
          </p>
          <h2
            className="mt-2 font-display text-2xl font-bold tracking-tight text-ink"
            id="teaching-transcript-heading"
          >
            Teach Billy
          </h2>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <p className="max-w-sm text-sm leading-6 text-ink-muted sm:text-right">
            Explain the current objective in your own words. Billy will test the
            edges of your explanation.
          </p>
          {isSessionComplete ? (
            <button
              className="bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isGeneratingReport}
              onClick={() => {
                void handleReportAction();
              }}
              type="button"
            >
              {isGeneratingReport
                ? 'Generating report…'
                : report
                  ? 'View mastery report'
                  : 'Generate report'}
            </button>
          ) : null}
        </div>
      </header>

      <div
        aria-busy={isSending}
        className="min-h-72 flex-1 overflow-y-auto px-5 py-6 sm:px-6"
      >
        {messages.length === 0 ? (
          <div className="border-l-2 border-primary-600 bg-primary-50 px-4 py-4">
            <p className="font-medium text-primary-900">Your turn to begin.</p>
            <p className="mt-1 text-sm leading-6 text-primary-900">
              Explain the first objective as if Billy has never encountered the
              concept before.
            </p>
          </div>
        ) : (
          <ol className="space-y-6" role="log">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const isBilly = message.role === 'billy';

                return (
                  <motion.li
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden"
                    initial={
                      shouldReduceMotion
                        ? false
                        : {
                            height: 0,
                            opacity: 0
                          }
                    }
                    key={messageKey(message, index)}
                    transition={messageTransition}
                  >
                    <article
                      className={`border-l-2 py-1 pl-4 ${
                        isBilly
                          ? 'border-primary-600'
                          : 'border-border'
                      }`}
                    >
                      <p
                        className={`font-mono text-xs uppercase tracking-[0.18em] ${
                          isBilly ? 'text-primary-900' : 'text-ink-muted'
                        }`}
                      >
                        {messageLabel(message.role)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink sm:text-base">
                        {message.content}
                      </p>
                    </article>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        )}

        {isSending ? (
          <div
            aria-live="polite"
            className="mt-6 flex items-center gap-3 border-l-2 border-primary-600 bg-primary-50 px-4 py-3 text-sm text-primary-900"
            role="status"
          >
            <span aria-hidden="true" className="font-mono tracking-[0.18em]">
              ...
            </span>
            Billy is reviewing your explanation.
          </div>
        ) : null}

        {understanding !== null ? (
          <p aria-live="polite" className="sr-only">
            Billy&apos;s demonstrated understanding is now {Math.round(understanding)}
            percent.
          </p>
        ) : null}

        <div ref={latestMessageRef} />
      </div>

      <form
        className="border-t border-border px-5 py-5 sm:px-6"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <label
          className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted"
          htmlFor="teaching-explanation"
        >
          Your explanation
        </label>
        <textarea
          aria-describedby={errorMessage ? 'teaching-error' : 'teaching-hint'}
          className="mt-3 min-h-28 w-full resize-y border border-border bg-surface px-4 py-3 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-surface-muted"
          disabled={isSending || isSessionComplete}
          id="teaching-explanation"
          maxLength={2000}
          minLength={5}
          name="userMessage"
          onChange={(event) => {
            setUserMessage(event.target.value);
          }}
          placeholder="Start with the core idea, then explain why it matters and how it works."
          required
          rows={4}
          value={userMessage}
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-ink-muted" id="teaching-hint">
              {userMessage.trim().length}/2000 characters
            </p>
            {isSessionComplete ? (
              <p className="mt-1 text-sm text-primary-900">
                Every objective is demonstrated. Your mastery report is ready.
              </p>
            ) : null}
          </div>
          <button
            className="bg-primary-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitDisabled}
            type="submit"
          >
            {isSending ? 'Billy is thinking…' : 'Send explanation'}
          </button>
        </div>

        {errorMessage ? (
          <p
            aria-live="polite"
            className="mt-4 border-l-2 border-primary-600 bg-primary-50 px-4 py-3 text-sm leading-6 text-primary-900"
            id="teaching-error"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
      </form>

      {reportErrorMessage ? (
        <p
          aria-live="polite"
          className="border-t border-border bg-primary-50 px-5 py-3 text-sm leading-6 text-primary-900 sm:px-6"
          role="alert"
        >
          {reportErrorMessage}
        </p>
      ) : null}

      <dialog
        aria-labelledby="mastery-report-heading"
        className="m-auto w-full max-w-2xl border border-border bg-surface-card p-0 text-ink backdrop:bg-ink/20"
        onCancel={() => {
          setIsReportOpen(false);
        }}
        onClose={() => {
          setIsReportOpen(false);
        }}
        ref={reportDialogRef}
      >
        {report ? (
          <section className="max-h-svh overflow-y-auto p-6 sm:p-8">
            <div className="flex items-start justify-between gap-6 border-b border-border pb-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
                  Mastery report
                </p>
                <h2
                  className="mt-2 font-display text-2xl font-bold tracking-tight text-ink"
                  id="mastery-report-heading"
                >
                  What Billy understood
                </h2>
              </div>
              <button
                className="text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                onClick={() => {
                  setIsReportOpen(false);
                }}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="space-y-6 pt-6">
              <section aria-labelledby="report-summary-heading">
                <h3
                  className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted"
                  id="report-summary-heading"
                >
                  Summary
                </h3>
                <p className="mt-3 text-sm leading-7 text-ink sm:text-base">
                  {report.summary}
                </p>
              </section>

              <section aria-labelledby="report-gaps-heading">
                <h3
                  className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted"
                  id="report-gaps-heading"
                >
                  Gaps to revisit
                </h3>
                {report.gaps.length > 0 ? (
                  <ul className="mt-3 space-y-2 border-l-2 border-primary-600 pl-4 text-sm leading-6 text-ink sm:text-base">
                    {report.gaps.map((gap, index) => (
                      <li key={`${gap}-${index}`}>{gap}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-ink-muted">
                    No critical gaps were identified in this session.
                  </p>
                )}
              </section>

              <section aria-labelledby="report-insights-heading">
                <h3
                  className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted"
                  id="report-insights-heading"
                >
                  Learning insight
                </h3>
                <p className="mt-3 text-sm leading-7 text-ink sm:text-base">
                  {report.insights}
                </p>
              </section>
            </div>
          </section>
        ) : null}
      </dialog>
    </section>
  );
}

export default ChatPanel;
