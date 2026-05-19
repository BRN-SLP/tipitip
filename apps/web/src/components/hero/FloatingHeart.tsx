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

// Water-droplet ripple, modelled after real surface waves (see
// reference photos). In real water:
//   1. Rings move at CONSTANT velocity outward (v), so the spacing
//      between consecutive wavefronts stays fixed at λ = v/f. Ease
//      curves bunch rings at the outer edge, which doesn't happen
//      on water. We use linear scale animation below.
//   2. Each crest holds visible amplitude almost all of its travel,
//      then fades quickly when it dissipates at the far edge. We
//      hold opacity at 1 for the first 85% of life and drop to 0
//      in the last 15%.
//
// Tuned so 11 rings are visible in flight at any moment in steady
// state (D / Δt = 4000 / 350 ≈ 11), evenly distributed from the
// button outline out to 2.2× the button radius.
const RIPPLE_DURATION_MS = 4000;
const RIPPLE_STAGGER_MS = 350;
const RIPPLES_PER_CLICK = 12;
const RIPPLE_FINAL_SCALE = 2.2;
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
        {/* Water-droplet shockwave rings — children of the button so
            they scale outward from its exact center.

            Linear scale easing is critical: it gives each ring a
            constant outward velocity, which keeps the spacing
            between consecutive rings even — that's the defining
            visual property of real water ripples (wavelength = v/f,
            independent of distance from source). An ease-out curve
            would bunch all the older rings at the outer edge and
            leave the middle empty, which is what was wrong before.

            Opacity holds at full strength for the first 85% of each
            ring's life, then drops to 0 in the last 15%. Matches
            how a real wavefront stays sharp until it dissipates at
            the outer edge of its travel. */}
        {!prefersReduced &&
          ripples.map((r) => (
            <motion.span
              key={r.id}
              aria-hidden="true"
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                scale: RIPPLE_FINAL_SCALE,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: RIPPLE_DURATION_MS / 1000,
                ease: "linear",
                opacity: { times: [0, 0.85, 1], ease: "linear" },
              }}
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary/55"
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
