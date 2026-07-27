'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import {
  CreateSessionInputSchema,
  SubtopicSchema,
  TopicInputSchema
} from '@/lib/schemas';

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

const CreateSessionResponseSchema = z
  .object({
    sessionId: z.string().regex(/^[a-f\d]{24}$/i),
    objectives: z
      .array(
        z
          .object({
            id: z.string().min(1),
            title: z.string().min(1),
            description: z.string().min(1),
            isCompleted: z.boolean()
          })
          .strict()
      )
      .min(3)
      .max(4)
  })
  .strict();

type RequestState = 'idle' | 'preparing' | 'creating';

type ApiRequestResult =
  | {
      isSuccess: true;
      body: unknown;
    }
  | {
      isSuccess: false;
      message: string;
    };

function getUserFacingApiError(code: string): string {
  switch (code) {
    case 'INSUFFICIENT_CREDITS':
      return 'You need at least one credit to start a new session.';
    case 'UNAUTHORIZED':
      return 'Your session has expired. Please sign in and try again.';
    case 'USER_NOT_FOUND':
      return 'Your account is still being set up. Please try again shortly.';
    case 'AI_CALL_FAILED':
      return 'Billy is unavailable right now. Please try again shortly.';
    default:
      return 'We could not complete that request. Please try again.';
  }
}

async function postJson(
  endpoint: string,
  body: unknown
): Promise<ApiRequestResult> {
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch (error: unknown) {
    console.error(`Unable to reach ${endpoint}.`, error);
    return {
      isSuccess: false,
      message: 'Unable to reach MentorLoop right now. Please try again.'
    };
  }

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch (error: unknown) {
    console.error(`Received an invalid response from ${endpoint}.`, error);
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
        : 'We could not complete that request. Please try again.'
    };
  }

  return {
    isSuccess: true,
    body: responseBody
  };
}

export function TopicForm(): React.JSX.Element {
  const router = useRouter();
  const [broadTopic, setBroadTopic] = useState('');
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [isSpecificTopic, setIsSpecificTopic] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [requestState, setRequestState] = useState<RequestState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = requestState !== 'idle';

  async function handlePrepare(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const normalizedTopic = broadTopic.trim();
    const inputResult = TopicInputSchema.safeParse({
      topic: normalizedTopic
    });

    if (!inputResult.success) {
      setErrorMessage('Enter a topic between 2 and 100 characters.');
      return;
    }

    setBroadTopic(normalizedTopic);
    setErrorMessage(null);
    setSelectedSubtopic(null);
    setRequestState('preparing');

    const result = await postJson('/api/v1/sessions/prepare', inputResult.data);

    if (!result.isSuccess) {
      setErrorMessage(result.message);
      setRequestState('idle');
      return;
    }

    const subtopicResult = SubtopicSchema.safeParse(result.body);

    if (!subtopicResult.success) {
      setErrorMessage(
        'We could not prepare a focused set of topics. Please try again.'
      );
      setRequestState('idle');
      return;
    }

    const returnedSubtopics = subtopicResult.data.subtopics;

    setSubtopics(returnedSubtopics ?? [normalizedTopic]);
    setIsSpecificTopic(returnedSubtopics === null);
    setRequestState('idle');
  }

  async function handleSubtopicSelect(subtopic: string): Promise<void> {
    const inputResult = CreateSessionInputSchema.safeParse({
      topic: subtopic,
      broadTopic
    });

    if (!inputResult.success) {
      setErrorMessage('Choose a topic between 2 and 100 characters.');
      return;
    }

    setSelectedSubtopic(subtopic);
    setErrorMessage(null);
    setRequestState('creating');

    const result = await postJson('/api/v1/sessions/create', inputResult.data);

    if (!result.isSuccess) {
      setErrorMessage(result.message);
      setRequestState('idle');
      return;
    }

    const sessionResult = CreateSessionResponseSchema.safeParse(result.body);

    if (!sessionResult.success) {
      setErrorMessage(
        'Your session was created, but we could not open it. Please try again.'
      );
      setRequestState('idle');
      return;
    }

    router.push(`/teach/${sessionResult.data.sessionId}`);
  }

  function returnToTopicEntry(): void {
    if (isLoading) {
      return;
    }

    setSubtopics([]);
    setSelectedSubtopic(null);
    setIsSpecificTopic(false);
    setErrorMessage(null);
  }

  return (
    <section
      aria-labelledby="topic-form-heading"
      className="border border-border bg-surface-card p-6 sm:p-8"
    >
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          New learning session
        </p>
        <h2
          className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl"
          id="topic-form-heading"
        >
          Choose what Billy should learn.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted sm:text-base">
          Start broad. We will turn it into a focused concept you can explain
          with confidence.
        </p>
      </div>

      {subtopics.length === 0 ? (
        <form className="mt-8 max-w-2xl" onSubmit={handlePrepare}>
          <label
            className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted"
            htmlFor="broad-topic"
          >
            Broad topic
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              aria-describedby={errorMessage ? 'topic-form-error' : undefined}
              className="min-w-0 flex-1 border border-border bg-surface px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-surface-muted"
              disabled={isLoading}
              id="broad-topic"
              maxLength={100}
              minLength={2}
              name="topic"
              onChange={(event) => setBroadTopic(event.target.value)}
              placeholder="For example, JavaScript"
              required
              type="text"
              value={broadTopic}
            />
            <button
              className="bg-primary-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              type="submit"
            >
              {requestState === 'preparing' ? 'Preparing…' : 'Prepare'}
            </button>
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            Pick a subject you want to be able to teach, not just recognize.
          </p>
        </form>
      ) : (
        <div className="mt-8 max-w-3xl">
          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
                {isSpecificTopic ? 'Focused topic' : 'Select a focus'}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
                {isSpecificTopic
                  ? 'This topic is already focused.'
                  : 'What should the session cover?'}
              </h2>
            </div>
            <button
              className="w-fit text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              onClick={returnToTopicEntry}
              type="button"
            >
              Change topic
            </button>
          </div>

          <div
            aria-busy={requestState === 'creating'}
            className="mt-5 grid gap-3 sm:grid-cols-2"
          >
            {subtopics.map((subtopic, index) => {
              const isSelected = selectedSubtopic === subtopic;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60 ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-border bg-surface hover:border-primary-600 hover:bg-primary-50'
                  }`}
                  disabled={isLoading}
                  key={`${subtopic}-${index}`}
                  onClick={() => {
                    void handleSubtopicSelect(subtopic);
                  }}
                  type="button"
                >
                  <span className="font-display text-lg font-bold tracking-tight text-ink">
                    {subtopic}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-ink-muted">
                    Build a session around this specific explanation.
                  </span>
                  {isSelected && requestState === 'creating' ? (
                    <span className="mt-4 block font-mono text-xs uppercase tracking-[0.18em] text-primary-900">
                      Building session…
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {errorMessage ? (
        <p
          aria-live="polite"
          className="mt-6 border-l-2 border-primary-600 bg-primary-50 px-4 py-3 text-sm leading-6 text-primary-900"
          id="topic-form-error"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}

export default TopicForm;
