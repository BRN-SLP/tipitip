"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Heart,
  PenLine,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { RevealOnScroll } from "@/components/hero/RevealOnScroll";
import { cn } from "@/lib/utils";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Single-line caption rendered inside the live demo card. */
  demoCaption: string;
}

const WRITER_STEPS: Step[] = [
  {
    icon: PenLine,
    title: "Write",
    body: "Markdown editor with live preview. Your slug is auto-derived from the title.",
    demoCaption: "# On the small dignity of a paid paragraph…",
  },
  {
    icon: Sparkles,
    title: "Publish",
    body: "One transaction registers the article on Celo. The body is content-addressed by a keccak256 hash, so edits don't break existing tips.",
    demoCaption: "tx 0x9a3f…b14e confirmed",
  },
  {
    icon: Heart,
    title: "Earn",
    body: "Readers tap the heart under any paragraph and send a small cUSD micro-tip. Your balance accumulates inside the contract — no off-chain bookkeeping.",
    demoCaption: "+ 0.005 cUSD  (12 tips today)",
  },
  {
    icon: Wallet,
    title: "Claim",
    body: "Sweep everything to your wallet in one cUSD transfer, anytime. Gas is sub-cent on Celo.",
    demoCaption: "claimEarnings()  → 3.421 cUSD",
  },
];

const READER_STEPS: Step[] = [
  {
    icon: Wallet,
    title: "Connect",
    body: "Any Celo-compatible wallet works. MiniPay is auto-detected — readers there never see a wallet popup.",
    demoCaption: "0xab12…cd34  •  MiniPay",
  },
  {
    icon: CheckCircle2,
    title: "Approve once",
    body: "A single cUSD allowance covers every future tip. After that, every tap is a one-click micro-payment.",
    demoCaption: "approve(TipJar, 100 cUSD)",
  },
  {
    icon: Heart,
    title: "Tap",
    body: "Hit the heart under the paragraph that made you stop. The micro-tip lands on the author's balance in the same block.",
    demoCaption: "tipParagraph(…)  →  13 tips",
  },
  {
    icon: BookOpen,
    title: "Keep reading",
    body: "The tip counter under each paragraph updates in real time, so you see what other readers loved too.",
    demoCaption: "live counter: 13 → 14 tips",
  },
];

type Persona = "writer" | "reader";

const PERSONAS: Array<{ key: Persona; label: string; steps: Step[] }> = [
  { key: "writer", label: "If you're writing", steps: WRITER_STEPS },
  { key: "reader", label: "If you're reading", steps: READER_STEPS },
];

// 7 seconds per step — slow enough to actually read the body copy on the
// active card without the next step yanking out from under the reader.
// Bumped from 3.5s after live testing showed people couldn't finish the
// "Earn" / "Approve once" bodies before the timer rolled over.
const ADVANCE_MS = 7000;
// Resume auto-advance after the visitor has been still for ~12s so the
// pause window comfortably outlives one full step duration above.
const RESUME_AFTER_INTERACTION_MS = 12000;

/**
 * Two-flow, auto-advancing walkthrough. The visitor sees one persona at a
 * time (writer / reader). Steps cycle on a 3.5s timer; tapping a step
 * pauses the timer for ~9 seconds so the visitor can read without the UI
 * yanking out from under them.
 *
 * Replaces the older abstract feature grid, which described capabilities
 * but never told a first-time visitor what to actually do.
 *
 * `useReducedMotion` disables the auto-advance and the height/opacity
 * transitions for visitors who have asked the OS to reduce motion.
 */
export function HowItWorks() {
  const [persona, setPersona] = useState<Persona>("writer");
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const steps =
    persona === "writer" ? WRITER_STEPS : READER_STEPS;

  // Auto-advance through the active persona's steps.
  // Pauses on direct user interaction (click a step), then resumes after
  // RESUME_AFTER_INTERACTION_MS so the page keeps showing motion.
  // Completely disabled when prefers-reduced-motion is set.
  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;
    const id = window.setInterval(() => {
      setActiveStep((s) => (s + 1) % steps.length);
    }, ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [isPaused, prefersReducedMotion, steps.length, persona]);

  useEffect(() => {
    if (!isPaused) return;
    const id = window.setTimeout(
      () => setIsPaused(false),
      RESUME_AFTER_INTERACTION_MS,
    );
    return () => window.clearTimeout(id);
  }, [isPaused]);

  function switchPersona(next: Persona) {
    if (next === persona) return;
    setPersona(next);
    setActiveStep(0);
    setIsPaused(false);
  }

  function focusStep(i: number) {
    setActiveStep(i);
    setIsPaused(true);
  }

  return (
    <section
      className="container mx-auto max-w-6xl px-4 py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mb-10 max-w-2xl">
        <RevealOnScroll>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            How it works
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.05}>
          <h2
            id="how-it-works-heading"
            className="font-serif text-3xl font-semibold leading-tight md:text-4xl"
          >
            <span className="text-foreground">Two flows,</span>{" "}
            <span className="italic text-primary">one contract.</span>
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={0.12}>
          <p className="mt-4 text-base text-muted-foreground">
            TipiTip has exactly two personas. Pick one — the walkthrough
            runs itself. Tap any step to pause.
          </p>
        </RevealOnScroll>
      </div>

      {/* Persona tabs */}
      <RevealOnScroll delay={0.18}>
        <div
          role="tablist"
          aria-label="Choose a persona"
          className="mb-8 inline-flex rounded-full border border-border bg-card/40 p-1"
        >
          {PERSONAS.map((p) => {
            const isActive = p.key === persona;
            return (
              <button
                key={p.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => switchPersona(p.key)}
                className={cn(
                  "relative rounded-full px-5 py-2 text-sm font-medium transition",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="persona-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary shadow-sm shadow-primary/30"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {p.label}
              </button>
            );
          })}
        </div>
      </RevealOnScroll>

      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:gap-10">
        {/* Step list — fixed-height rows so nothing shifts as the
            walkthrough auto-advances. The active step's body lives
            in the demo pane on the right; here we only show number,
            icon, and title. The previous design rendered the body
            inline via AnimatePresence with height: 0 -> auto, which
            relayed-out the entire list on every advance and made
            the rest of the page jitter. */}
        <RevealOnScroll delay={0.22}>
          <ol className="space-y-3">
            {steps.map((step, i) => {
              const isActive = i === activeStep;
              return (
                <li
                  key={`${persona}-${step.title}`}
                  className={cn(
                    "group cursor-pointer rounded-lg border bg-card/40 p-4 transition",
                    isActive
                      ? "border-primary/40 bg-card shadow-sm shadow-primary/10"
                      : "border-border/60 hover:border-primary/30 hover:bg-card",
                  )}
                  onClick={() => focusStep(i)}
                  aria-current={isActive ? "step" : undefined}
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.05 : 1,
                        borderColor: isActive
                          ? "hsl(var(--primary) / 0.5)"
                          : "hsl(var(--primary) / 0.2)",
                      }}
                      transition={{ duration: 0.25 }}
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-primary/5 text-primary"
                    >
                      <step.icon className="h-5 w-5" />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground/80">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3
                          className={cn(
                            "font-serif text-lg font-semibold transition-colors",
                            isActive
                              ? "text-foreground"
                              : "text-foreground/85",
                          )}
                        >
                          {step.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </RevealOnScroll>

        {/* Live demo pane */}
        <RevealOnScroll delay={0.3}>
          <div className="sticky top-6">
            <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6 md:p-8">
              {/* Progress dots */}
              <div className="mb-6 flex items-center gap-2">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => focusStep(i)}
                    aria-label={`Jump to step ${i + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === activeStep
                        ? "w-8 bg-primary"
                        : "w-1.5 bg-border hover:bg-primary/40",
                    )}
                  />
                ))}
              </div>

              {/* Animated step preview. Every step variant is stacked in the
                  same grid cell (all children pinned to row/col 1), so the
                  pane is always as tall as the TALLEST step in this flow, not
                  whichever one is active. Inactive variants stay mounted at
                  opacity 0 (opacity and transform never change layout), so the
                  pane height is constant at all times, including mid-fade. That
                  stops the page from jumping when the walkthrough auto-advances
                  or a shorter step replaces a taller one. */}
              <div className="grid min-h-[220px]">
                {steps.map((step, i) => {
                  const isActive = i === activeStep;
                  const StepIcon = step.icon;
                  return (
                    <motion.div
                      key={`${persona}-${i}`}
                      aria-hidden={!isActive}
                      initial={false}
                      animate={
                        prefersReducedMotion
                          ? { opacity: isActive ? 1 : 0 }
                          : { opacity: isActive ? 1 : 0, y: isActive ? 0 : 14 }
                      }
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className={cn(
                        "col-start-1 row-start-1 space-y-5",
                        !isActive && "pointer-events-none",
                      )}
                    >
                      <div
                        aria-hidden="true"
                        className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary shadow-sm shadow-primary/20"
                      >
                        <StepIcon className="h-7 w-7" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Step {String(i + 1).padStart(2, "0")} /{" "}
                          {String(steps.length).padStart(2, "0")}
                        </p>
                        <h4 className="font-serif text-2xl font-semibold text-foreground">
                          {step.title}
                        </h4>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {step.body}
                        </p>
                      </div>
                      {/* Mock terminal-style caption */}
                      <div className="rounded-md border border-border/80 bg-background/80 px-3 py-2 font-mono text-[12px] text-foreground/80">
                        <span className="mr-2 text-primary/70">›</span>
                        {step.demoCaption}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Auto-advance indicator */}
              {!prefersReducedMotion && !isPaused && (
                <motion.div
                  key={`progress-${persona}-${activeStep}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: ADVANCE_MS / 1000, ease: "linear" }}
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary/60"
                  aria-hidden="true"
                />
              )}
              {isPaused && (
                <p
                  aria-live="polite"
                  className="absolute bottom-2 right-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                >
                  paused
                </p>
              )}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
