'use client';

import Link from 'next/link';
import {
  motion,
  type Variants,
  useReducedMotion
} from 'motion/react';

const heroContainerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.1
    }
  }
};

const heroItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut'
    }
  }
};

export function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = !shouldReduceMotion;

  return (
    <section
      className="flex min-h-svh flex-col bg-surface"
      aria-labelledby="hero-title"
    >
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
        >
          MentorLoop
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-20 sm:py-28 lg:px-8">
        <motion.div
          className="max-w-3xl"
          variants={shouldAnimate ? heroContainerVariants : undefined}
          initial={shouldAnimate ? 'hidden' : false}
          animate={shouldAnimate ? 'visible' : undefined}
        >
          <motion.p
            className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-ink-muted"
            variants={shouldAnimate ? heroItemVariants : undefined}
          >
            Knowledge validation for developers
          </motion.p>

          <motion.h1
            id="hero-title"
            className="mt-6 font-display text-5xl font-bold tracking-tight text-ink sm:text-6xl lg:text-7xl"
            variants={shouldAnimate ? heroItemVariants : undefined}
          >
            Stop studying.
            <br />
            <span className="text-primary-900">Start proving.</span>
          </motion.h1>

          <motion.p
            className="mt-8 max-w-2xl text-lg leading-8 text-ink-muted sm:text-xl"
            variants={shouldAnimate ? heroItemVariants : undefined}
          >
            Watching tutorials doesn&apos;t mean you know the material.
            MentorLoop forces you to teach concepts to an AI named Billy. If you
            can make Billy understand it, you&apos;re ready for the interview. If
            you can&apos;t, you just found your blind spot.
          </motion.p>

          <motion.div
            className="mt-10"
            variants={shouldAnimate ? heroItemVariants : undefined}
          >
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
            >
              Validate your knowledge
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
