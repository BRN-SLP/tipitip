"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { Heart } from "lucide-react";

interface Burst {
  id: number;
  dx: number;
  dy: number;
  rotate: number;
}

interface Ripple {
  id: number;
}

let nextId = 0;

// Lub-dub timing. The pressed scale array runs across these times,
// so the visual peaks land at ~110ms (lub) and ~325ms (dub) — close
// to the ~270ms gap of a real resting heartbeat.
const PRESS_MS = 600;
const BURST_MS = 1400;

// Shockwave: a single tap emits multiple concentric rings staggered
// in time. At any moment you see a near ring (just born), a middle
// ring (mid-flight), and a far ring (almost gone) — reads as a real
// water-ripple wavefront, not a single circle popping outward.
const RIPPLE_DURATION_MS = 1400;
const RIPPLE_STAGGER_MS = 220;
const RIPPLES_PER_CLICK = 3;
const RIPPLE_LAST_CLEANUP_MS =
  RIPPLE_DURATION_MS + (RIPPLES_PER_CLICK - 1) * RIPPLE_STAGGER_MS;

/**
 * Animated tipping heart for the TipiTip landing hero.
 * - Idle: gentle heartbeat scale loop.
 * - Click: triggers a more pronounced two-beat (lub-dub) pulse on
 *   the button itself, emits a multi-ring water-ripple shockwave
 *   that radiates outward in all directions, AND fires 4-5 small
 *   hearts that float up — mimicking the per-paragraph tip flow.
 *
 * Multiple rapid taps stack ripples + bursts naturally.
 * Respects prefers-reduced-motion: animations collapse to a static
 * resting heart with no shockwave or bursts.
 */
export function FloatingHeart() {
  const prefersReduced = useReducedMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [pressed, setPressed] = useState(false);

  const spawn = useCallback(() => {
    if (prefersReduced) return;

    // Floating mini-hearts — keep the original tip-flow analogue.
    const count = 4 + Math.floor(Math.random() * 2);
    const next: Burst[] = Array.from({ length: count }, () => ({
      id: nextId++,
      dx: (Math.random() - 0.5) * 140,
      dy: -120 - Math.random() * 80,
      rotate: (Math.random() - 0.5) * 60,
    }));
    setBursts((b) => [...b, ...next]);

    // Shockwave rings — spawn N rings staggered in time so they
    // form a moving wavefront rather than one solitary circle.
    const ripIds: number[] = [];
    for (let i = 0; i < RIPPLES_PER_CLICK; i++) {
      const rid = nextId++;
      ripIds.push(rid);
      window.setTimeout(() => {
        setRipples((r) => [...r, { id: rid }]);
        window.setTimeout(() => {
          setRipples((r) => r.filter((x) => x.id !== rid));
        }, RIPPLE_DURATION_MS);
      }, i * RIPPLE_STAGGER_MS);
    }

    // Drive the lub-dub on the button itself.
    setPressed(true);

    setTimeout(() => setPressed(false), PRESS_MS);
    setTimeout(() => {
      setBursts((b) => b.filter((x) => !next.find((n) => n.id === x.id)));
    }, BURST_MS);
    // Belt-and-braces cleanup in case any per-ring cleanup got
    // skipped (e.g. component unmounted mid-flight then remounted).
    setTimeout(() => {
      setRipples((r) => r.filter((x) => !ripIds.includes(x.id)));
    }, RIPPLE_LAST_CLEANUP_MS + 100);
  }, [prefersReduced]);

  return (
    <div className="relative inline-block">
      {/* Burst particles */}
      <div className="pointer-events-none absolute inset-0">
        {bursts.map((b) => (
          <motion.div
            key={b.id}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
            animate={{
              x: b.dx,
              y: b.dy,
              opacity: 0,
              rotate: b.rotate,
              scale: 1,
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2"
          >
            <Heart
              className="h-5 w-5 -translate-x-1/2 -translate-y-1/2 fill-primary text-primary"
              aria-hidden="true"
            />
          </motion.div>
        ))}
      </div>

      {/* Main heart */}
      <motion.button
        type="button"
        onClick={spawn}
        aria-label="Try a tip — taps spawn a flurry of hearts"
        className="relative grid h-32 w-32 place-items-center rounded-full bg-primary/10 text-primary outline-none ring-primary/30 transition focus-visible:ring-4 sm:h-40 sm:w-40"
        animate={
          prefersReduced
            ? undefined
            : {
                // Pressed: lub-dub — two peaks (1.18, 1.22) separated
                // by a partial release (1.05), matching a real beat
                // pattern. Idle: gentle ambient breathing.
                scale: pressed
                  ? [1, 1.18, 1.05, 1.22, 1]
                  : [1, 1.04, 1, 1.04, 1],
              }
        }
        transition={
          prefersReduced
            ? undefined
            : pressed
              ? {
                  duration: PRESS_MS / 1000,
                  ease: "easeOut",
                  times: [0, 0.18, 0.45, 0.6, 1],
                }
              : {
                  duration: 1.4,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "loop",
                }
        }
        whileHover={prefersReduced ? undefined : { scale: 1.06 }}
        whileTap={prefersReduced ? undefined : { scale: 0.94 }}
      >
        {/* Fading shockwave rings — children of the button so they
            scale outward from the button's exact center. Each ripple
            starts at the button's outline (inset-0, scale 1) and
            expands to 2.6× while fading from 0.5 → 0 opacity. Multiple
            rings per click, staggered in time, create a continuous
            wavefront. The opacity decay is non-linear — it sits near
            full strength for the first ~25% and then trails off —
            which sells the "deeper, slower" feel. The button's own
            pulse compounds slightly with each ripple's scale, so the
            wave reads as emitted BY the beat. */}
        {!prefersReduced &&
          ripples.map((r) => (
            <motion.span
              key={r.id}
              aria-hidden="true"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{
                scale: 2.6,
                opacity: [0.5, 0.45, 0.18, 0],
              }}
              transition={{
                duration: RIPPLE_DURATION_MS / 1000,
                // ease-out-quart — softer deceleration than expo,
                // pushes more of the motion into the early phase so
                // the ring "drifts" the rest of the way out.
                ease: [0.22, 1, 0.36, 1],
                opacity: { times: [0, 0.25, 0.7, 1] },
              }}
              className="pointer-events-none absolute inset-0 rounded-full border border-primary/80"
            />
          ))}
        <Heart className="h-14 w-14 fill-primary sm:h-20 sm:w-20" aria-hidden="true" />
      </motion.button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        tap me
      </p>
    </div>
  );
}
