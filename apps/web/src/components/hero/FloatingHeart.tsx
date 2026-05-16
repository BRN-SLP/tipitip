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

let nextId = 0;

/**
 * Animated tipping heart for the TipiTip landing hero.
 * - Idle: gentle heartbeat scale loop.
 * - Click: spawns 3-5 small hearts that float up and fade, plus a
 *   single beat on the main heart. Mimics what a reader sees when
 *   tipping a real paragraph.
 *
 * Respects prefers-reduced-motion: animations collapse to a static
 * resting heart with no bursts.
 */
export function FloatingHeart() {
  const prefersReduced = useReducedMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [pressed, setPressed] = useState(false);

  const spawn = useCallback(() => {
    if (prefersReduced) return;
    const count = 4 + Math.floor(Math.random() * 2);
    const next: Burst[] = Array.from({ length: count }, () => ({
      id: nextId++,
      dx: (Math.random() - 0.5) * 140,
      dy: -120 - Math.random() * 80,
      rotate: (Math.random() - 0.5) * 60,
    }));
    setBursts((b) => [...b, ...next]);
    setPressed(true);
    setTimeout(() => setPressed(false), 200);
    setTimeout(() => {
      setBursts((b) => b.filter((x) => !next.find((n) => n.id === x.id)));
    }, 1400);
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
                scale: pressed ? [1, 1.18, 1] : [1, 1.04, 1, 1.04, 1],
              }
        }
        transition={
          prefersReduced
            ? undefined
            : pressed
              ? { duration: 0.32, ease: "easeOut" }
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
        <Heart className="h-14 w-14 fill-primary sm:h-20 sm:w-20" aria-hidden="true" />
      </motion.button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        tap me
      </p>
    </div>
  );
}
