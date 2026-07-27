'use client';

import { useId } from 'react';
import {
  motion,
  type Transition,
  useReducedMotion
} from 'motion/react';

type BillyGaugeProps = Readonly<{
  value: number;
}>;

type GaugeTick = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  value: number;
};

const CENTER_X = 120;
const CENTER_Y = 120;
const GAUGE_RADIUS = 82;
const TICK_COUNT = 21;
const OUTER_TICK_RADIUS = 97;
const MINOR_TICK_RADIUS = 92;
const MAJOR_TICK_RADIUS = 88;
const ARC_PATH = `M ${CENTER_X - GAUGE_RADIUS} ${CENTER_Y} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${CENTER_X + GAUGE_RADIUS} ${CENTER_Y}`;

const ticks: GaugeTick[] = Array.from({ length: TICK_COUNT }, (_, index) => {
  const value = (index / (TICK_COUNT - 1)) * 100;
  const angle = Math.PI - (value / 100) * Math.PI;
  const isMajorTick = index % 5 === 0;
  const innerRadius = isMajorTick ? MAJOR_TICK_RADIUS : MINOR_TICK_RADIUS;

  return {
    x1: CENTER_X + OUTER_TICK_RADIUS * Math.cos(angle),
    y1: CENTER_Y - OUTER_TICK_RADIUS * Math.sin(angle),
    x2: CENTER_X + innerRadius * Math.cos(angle),
    y2: CENTER_Y - innerRadius * Math.sin(angle),
    value
  };
});

function clampGaugeValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

export function BillyGauge({ value }: BillyGaugeProps): React.JSX.Element {
  const shouldReduceMotion = useReducedMotion();
  const gaugeValue = clampGaugeValue(value);
  const roundedValue = Math.round(gaugeValue);
  const needleRotation = -90 + gaugeValue * 1.8;
  const componentId = useId().replace(/:/g, '');
  const gradientId = `billy-gauge-gradient-${componentId}`;
  const titleId = `billy-gauge-title-${componentId}`;
  const descriptionId = `billy-gauge-description-${componentId}`;
  const motionTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : {
        type: 'spring',
        stiffness: 180,
        damping: 22,
        mass: 0.7
      };

  return (
    <svg
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="h-auto w-full"
      role="img"
      viewBox="0 0 240 154"
    >
      <title id={titleId}>Billy&apos;s demonstrated understanding</title>
      <desc id={descriptionId}>
        Billy&apos;s demonstrated understanding is {roundedValue} percent.
      </desc>

      <defs>
        <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
          <stop
            offset="0%"
            stopColor="var(--color-primary-600)"
            stopOpacity="0.62"
          />
          <stop
            offset="100%"
            stopColor="var(--color-primary-600)"
            stopOpacity="1"
          />
        </linearGradient>
      </defs>

      <path
        d={ARC_PATH}
        fill="none"
        stroke="var(--color-border)"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <motion.path
        animate={{ strokeDashoffset: 100 - gaugeValue }}
        d={ARC_PATH}
        fill="none"
        initial={false}
        pathLength="100"
        stroke={`url(#${gradientId})`}
        strokeDasharray="100"
        strokeLinecap="round"
        strokeWidth="8"
        transition={motionTransition}
      />

      {ticks.map((tick) => {
        const isActive = tick.value <= gaugeValue;
        const isMajorTick = Number.isInteger(tick.value / 25);

        return (
          <line
            key={tick.value}
            stroke={
              isActive
                ? 'var(--color-primary-600)'
                : 'var(--color-ink-subtle)'
            }
            strokeLinecap="round"
            strokeOpacity={isMajorTick ? 0.9 : 0.55}
            strokeWidth={isMajorTick ? 2 : 1}
            x1={tick.x1}
            x2={tick.x2}
            y1={tick.y1}
            y2={tick.y2}
          />
        );
      })}

      <motion.g
        animate={{ rotate: needleRotation }}
        initial={false}
        style={{
          transformBox: 'view-box',
          transformOrigin: `${CENTER_X}px ${CENTER_Y}px`
        }}
        transition={motionTransition}
      >
        <line
          stroke="var(--color-primary-600)"
          strokeLinecap="round"
          strokeWidth="3"
          x1={CENTER_X}
          x2={CENTER_X}
          y1={CENTER_Y}
          y2="53"
        />
      </motion.g>
      <circle
        cx={CENTER_X}
        cy={CENTER_Y}
        fill="var(--color-surface-card)"
        r="7"
        stroke="var(--color-primary-600)"
        strokeWidth="3"
      />

      <text
        className="fill-ink font-display text-3xl font-bold tracking-tight"
        textAnchor="middle"
        x={CENTER_X}
        y="108"
      >
        {roundedValue}%
      </text>
      <text
        className="fill-ink-muted font-mono text-xs uppercase tracking-[0.18em]"
        textAnchor="middle"
        x={CENTER_X}
        y="138"
      >
        Demonstrated understanding
      </text>
      <text
        className="fill-ink-subtle font-mono text-xs"
        textAnchor="start"
        x="22"
        y="142"
      >
        0
      </text>
      <text
        className="fill-ink-subtle font-mono text-xs"
        textAnchor="end"
        x="218"
        y="142"
      >
        100
      </text>
    </svg>
  );
}
