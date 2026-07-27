import type { TeachingObjective } from '@/lib/schemas';

type ObjectiveListProps = Readonly<{
  objectives: ReadonlyArray<TeachingObjective>;
}>;

export function ObjectiveList({
  objectives
}: ObjectiveListProps): React.JSX.Element {
  const completedCount = objectives.filter(
    (objective) => objective.isCompleted
  ).length;

  return (
    <section
      aria-labelledby="learning-objectives-heading"
      className="border border-border bg-surface-card"
    >
      <header className="flex items-end justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
            Learning plan
          </p>
          <h2
            className="mt-1 font-display text-xl font-bold tracking-tight text-ink"
            id="learning-objectives-heading"
          >
            Objectives
          </h2>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          {completedCount}/{objectives.length} complete
        </p>
      </header>

      {objectives.length > 0 ? (
        <ol className="divide-y divide-border">
          {objectives.map((objective, index) => {
            const statusLabel = objective.isCompleted
              ? 'Completed'
              : 'Not completed';

            return (
              <li className="px-5 py-4" key={objective.id}>
                <div className="flex items-start gap-3">
                  <span
                    aria-label={statusLabel}
                    className={
                      objective.isCompleted
                        ? 'mt-0.5 flex size-5 shrink-0 items-center justify-center text-primary-600'
                        : 'mt-0.5 flex size-5 shrink-0 items-center justify-center border border-border font-mono text-xs text-ink-muted'
                    }
                    role="img"
                  >
                    {objective.isCompleted ? (
                      <svg
                        aria-hidden="true"
                        className="size-5"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="m4.5 10.25 3.25 3.25 7.75-7.25"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    ) : (
                      <span aria-hidden="true">{index + 1}</span>
                    )}
                  </span>

                  <div className="min-w-0">
                    <h3 className="font-body text-sm font-semibold text-ink">
                      {objective.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      {objective.description}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="px-5 py-6 text-sm leading-6 text-ink-muted">
          Learning objectives are not available for this session.
        </p>
      )}
    </section>
  );
}
