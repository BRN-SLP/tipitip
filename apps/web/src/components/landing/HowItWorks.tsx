import {
  BookOpen,
  CheckCircle2,
  Heart,
  PenLine,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { RevealOnScroll } from "@/components/hero/RevealOnScroll";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

const WRITER_STEPS: Step[] = [
  {
    icon: PenLine,
    title: "Write",
    body: "Markdown editor with live preview. Your slug is auto-derived from the title.",
  },
  {
    icon: Sparkles,
    title: "Publish",
    body: "One transaction registers the article on Celo. The body is content-addressed by a keccak256 hash so edits don't break existing tips.",
  },
  {
    icon: Heart,
    title: "Earn",
    body: "Readers tap the heart under any paragraph and send a small cUSD micro-tip. Your balance accumulates inside the contract — no off-chain bookkeeping.",
  },
  {
    icon: Wallet,
    title: "Claim",
    body: "Sweep everything to your wallet in one cUSD transfer, anytime. Gas is sub-cent on Celo.",
  },
];

const READER_STEPS: Step[] = [
  {
    icon: Wallet,
    title: "Connect",
    body: "Any Celo-compatible wallet works. MiniPay is auto-detected — readers there never see a wallet popup.",
  },
  {
    icon: CheckCircle2,
    title: "Approve once",
    body: "A single cUSD allowance covers every future tip. After that, every tap is a one-click micro-payment.",
  },
  {
    icon: Heart,
    title: "Tap",
    body: "Hit the heart under the paragraph that made you stop. The micro-tip lands on the author's balance in the same block.",
  },
  {
    icon: BookOpen,
    title: "Keep reading",
    body: "The tip counter under each paragraph updates in real time so you see what other readers loved too.",
  },
];

interface ColumnProps {
  label: string;
  accent: string;
  steps: Step[];
  delay: number;
}

function Column({ label, accent, steps, delay }: ColumnProps) {
  return (
    <RevealOnScroll delay={delay}>
      <div className="space-y-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}{" "}
          <span className={`italic ${accent}`}>(read top to bottom)</span>
        </p>
        <ol className="space-y-5">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="group relative flex gap-4 rounded-lg border border-border/60 bg-card/40 p-4 transition hover:border-primary/40 hover:bg-card"
            >
              <div
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary"
              >
                <step.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground/80">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </RevealOnScroll>
  );
}

/**
 * Two-column "how to use this" walkthrough. Writers on the left, readers
 * on the right — the two main personas the landing page has to onboard.
 * Replaces the older abstract feature grid, which described capabilities
 * but never told a first-time visitor what to actually do.
 */
export function HowItWorks() {
  return (
    <section
      className="container mx-auto max-w-6xl px-4 py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mb-12 max-w-2xl">
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
            TipiTip has exactly two personas. Writers publish and claim;
            readers approve once and tap. Everything else is glue.
          </p>
        </RevealOnScroll>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <Column
          label="If you're writing"
          accent="text-primary"
          steps={WRITER_STEPS}
          delay={0.18}
        />
        <Column
          label="If you're reading"
          accent="text-primary"
          steps={READER_STEPS}
          delay={0.26}
        />
      </div>
    </section>
  );
}
