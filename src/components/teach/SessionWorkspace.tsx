'use client';

import { useState } from 'react';

import { BillyGauge } from '@/components/teach/BillyGauge';
import {
  ChatPanel,
  type ChatMessage,
  type MasteryReport,
  type SessionUpdate,
  type TeachingObjective
} from '@/components/teach/ChatPanel';
import { ObjectiveList } from '@/components/teach/ObjectiveList';

type SessionWorkspaceProps = Readonly<{
  sessionId: string;
  initialChatHistory: readonly ChatMessage[];
  initialObjectives: readonly TeachingObjective[];
  initialBillyUnderstanding: number;
  initialReport: MasteryReport | null;
}>;

export function SessionWorkspace({
  sessionId,
  initialChatHistory,
  initialObjectives,
  initialBillyUnderstanding,
  initialReport
}: SessionWorkspaceProps): React.JSX.Element {
  const [billyUnderstanding, setBillyUnderstanding] = useState(
    initialBillyUnderstanding
  );
  const [objectives, setObjectives] = useState<TeachingObjective[]>(() => [
    ...initialObjectives
  ]);
  const [report, setReport] = useState<MasteryReport | null>(initialReport);

  function handleSessionUpdate({
    billyUnderstanding: nextBillyUnderstanding,
    objectives: nextObjectives
  }: SessionUpdate): void {
    setBillyUnderstanding(nextBillyUnderstanding);
    setObjectives(nextObjectives);
  }

  function handleReportGenerated(nextReport: MasteryReport): void {
    setReport(nextReport);
  }

  return (
    <div className="grid gap-6 pt-8 lg:grid-cols-3 lg:gap-8 lg:pt-10">
      <aside className="space-y-6 lg:col-span-1">
        <section
          aria-labelledby="understanding-meter-heading"
          className="border border-border bg-surface-card p-5 sm:p-6"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
            Billy&apos;s meter
          </p>
          <h2
            className="mt-1 font-display text-xl font-bold tracking-tight text-ink"
            id="understanding-meter-heading"
          >
            Demonstrated understanding
          </h2>
          <div className="mt-5">
            <BillyGauge value={billyUnderstanding} />
          </div>
        </section>

        <ObjectiveList objectives={objectives} />
      </aside>

      <div className="min-w-0 lg:col-span-2">
        <ChatPanel
          initialBillyUnderstanding={billyUnderstanding}
          initialChatHistory={initialChatHistory}
          initialReport={report}
          onReportGenerated={handleReportGenerated}
          onSessionUpdate={handleSessionUpdate}
          sessionId={sessionId}
        />
      </div>
    </div>
  );
}
