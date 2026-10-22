import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { m as motion } from "motion/react";
import type { CoverMotion } from "../../config/covers";
import { cn } from "../lib/utils";

const petals = Array.from({ length: 9 }, (_, index) => ({
  left: 4 + index * 11,
  delay: index * 0.9,
  duration: 8 + (index % 3) * 1.6,
  width: 6 + (index % 3) * 3,
}));

const embers = Array.from({ length: 10 }, (_, index) => ({
  left: 8 + index * 9,
  delay: index * 0.55,
  duration: 3.4 + (index % 4) * 0.8,
  width: 3 + (index % 3),
}));

const fireflies = Array.from({ length: 8 }, (_, index) => ({
  left: 10 + ((index * 13) % 80),
  top: 12 + ((index * 21) % 66),
  delay: index * 0.6,
  duration: 2.6 + (index % 3) * 1.1,
}));

const drops = Array.from({ length: 11 }, (_, index) => ({
  left: 4 + index * 9,
  delay: index * 0.28,
  duration: 1.5 + (index % 3) * 0.4,
}));

export function NoteAtmosphere({
  motion: kind,
  dense = true,
  className,
}: {
  motion: CoverMotion;
  dense?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion || kind === "none") return null;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {kind === "petals" &&
        petals.slice(0, dense ? 9 : 5).map((petal, index) => (
          <motion.span
            key={index}
            className="absolute top-0 block rounded-[100%_0_100%_0] bg-[#ffd4e0]/90 shadow-[0_0_6px_rgba(255,190,210,0.6)]"
            style={{ left: `${petal.left}%`, width: petal.width, height: petal.width + 3 }}
            animate={{
              y: [-20, 320],
              x: [0, 14, -8, 0],
              rotate: [0, 160, 320],
              opacity: [0, 0.95, 0.95, 0],
            }}
            transition={{
              duration: petal.duration,
              delay: petal.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

      {kind === "embers" &&
        embers.slice(0, dense ? 10 : 6).map((ember, index) => (
          <motion.span
            key={index}
            className="absolute bottom-0 block rounded-full bg-mango"
            style={{
              left: `${ember.left}%`,
              width: ember.width,
              height: ember.width,
              boxShadow: "0 0 8px 2px rgba(255,140,60,0.55)",
            }}
            animate={{
              y: [0, -60, -260],
              x: [0, index % 2 === 0 ? 12 : -12, 0],
              opacity: [0, 1, 0],
              scale: [0.6, 1, 0.4],
            }}
            transition={{
              duration: ember.duration,
              delay: ember.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}

      {kind === "embers" && (
        <motion.div
          className="absolute -bottom-10 left-1/2 h-32 w-44 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_80%,rgba(255,120,40,0.55),transparent_70%)] blur-md"
          animate={{ opacity: [0.5, 0.85, 0.55], scale: [1, 1.12, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {kind === "fireflies" &&
        fireflies.slice(0, dense ? 8 : 5).map((fly, index) => (
          <motion.span
            key={index}
            className="absolute block h-1.5 w-1.5 rounded-full bg-[#ffe9a8]"
            style={{
              left: `${fly.left}%`,
              top: `${fly.top}%`,
              boxShadow: "0 0 8px 3px rgba(255,230,150,0.55)",
            }}
            animate={{
              opacity: [0.15, 1, 0.15],
              scale: [0.7, 1.35, 0.7],
              x: [0, index % 2 === 0 ? 8 : -8, 0],
            }}
            transition={{
              duration: fly.duration,
              delay: fly.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

      {kind === "rain" &&
        drops.slice(0, dense ? 11 : 7).map((drop, index) => (
          <motion.span
            key={index}
            className="absolute top-0 block w-px rounded-full bg-[#cfe6ff]/70"
            style={{ left: `${drop.left}%`, height: 18 }}
            animate={{ y: [-20, 320], opacity: [0, 0.8, 0] }}
            transition={{
              duration: drop.duration,
              delay: drop.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

      {kind === "sun" && (
        <>
          <motion.div
            className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(255,236,170,0.85),rgba(255,182,39,0.25)_55%,transparent_72%)] blur-sm"
            animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.08, 1] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-16 -top-16 h-56 w-56 opacity-40"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(255,240,190,0.75) 10deg, transparent 30deg)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
          />
        </>
      )}
    </div>
  );
}
