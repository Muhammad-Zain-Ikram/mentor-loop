"use client";
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-surface overflow-hidden">
      {/* Subtle dotted background texture */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:32px_32px] opacity-60" />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold tracking-tight text-ink">
            mentor<span className="text-primary-700">loop</span>
          </Link>
          <Button asChild variant="outline" className="border-border text-ink hover:bg-surface-muted">
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Copy */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary-200 bg-primary-50 rounded-full mb-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary-700">Protégé Effect Active</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter text-ink leading-[0.95]">
              Stop studying. <br />
              Start proving.
            </h1>

            <p className="mt-6 text-lg text-ink-muted max-w-xl leading-relaxed">
              Watching tutorials doesn&apos;t mean you know the material. MentorLoop forces you to teach concepts to an AI named Billy. If you can&apos;t make Billy understand it, you just found your blind spot.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <Button asChild size="lg" className="bg-primary-700 hover:bg-primary-800 text-white font-medium px-8">
                <Link href="/login">
                  Validate your knowledge <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>


          <div className="lg:col-span-5">
            <div className="relative flex flex-col items-center justify-center bg-surface-card border border-border rounded-xl p-8 shadow-sm aspect-square">

              {/* SVG Animated Gauge */}
              <svg viewBox="0 0 200 120" className="w-full max-w-sm overflow-visible">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                </defs>

                {/* Background Track */}
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" strokeWidth="14" strokeLinecap="round" className="stroke-surface-muted" />

                {/* Animated Progress Arc */}
                <motion.path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={251.3} // (2 * PI * 80) / 2
                  initial={{ strokeDashoffset: 251.3 }}
                  animate={{ strokeDashoffset: [251.3, 251.3 - (251.3 * 0.70), 251.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Tick Marks */}
                {Array.from({ length: 11 }).map((_, i) => {
                  const angle = -90 + (i / 10) * 180;
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 100 + 80 * Math.cos(rad);
                  const y1 = 100 + 80 * Math.sin(rad);
                  const x2 = 100 + 70 * Math.cos(rad);
                  const y2 = 100 + 70 * Math.sin(rad);
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2" className="stroke-ink-subtle/40" />;
                })}

                {/* Animated Needle */}
                <motion.g
                  style={{ transformOrigin: "100px 100px" }}
                  initial={{ rotate: -90 }}
                  animate={{ rotate: [-90, 36, -90] }} // 0% to 70% (approx 36deg)
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <line x1="100" y1="100" x2="100" y2="30" strokeWidth="4" strokeLinecap="round" className="stroke-ink" />
                </motion.g>

                {/* Center Hub */}
                <circle cx="100" cy="100" r="8" className="fill-ink" />
              </svg>

              {/* Digital Readout */}
              <div className="absolute bottom-8 text-center">
                <div className="flex items-start justify-center">
                  <motion.span
                    className="font-display text-5xl font-bold text-ink tabular-nums"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                  >
                    70
                  </motion.span>
                  <span className="font-display text-xl font-bold text-ink-muted mt-1">%</span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted mt-1">
                  Billy&apos;s Understanding
                </p>
              </div>
            </div>

            {/* Context Line */}
            <p className="mt-4 text-center text-xs text-ink-muted font-mono">
              Watch Billy&apos;s understanding climb as you explain.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}