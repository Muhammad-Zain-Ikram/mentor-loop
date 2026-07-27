import { TopicForm } from '@/components/teach/TopicForm';

export default function TeachPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <section aria-labelledby="teach-page-heading" className="border-b border-border pb-10">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          New practice session
        </p>
        <h1
          className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl"
          id="teach-page-heading"
        >
          Start with a topic you want to prove.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">
          Billy will help you narrow the subject into one focused concept before
          you start teaching it.
        </p>
      </section>

      <section aria-label="Create a teaching session" className="pt-10">
        <TopicForm />
      </section>
    </div>
  );
}
