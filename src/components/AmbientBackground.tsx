import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { motion } from "motion/react";

const blobs = [
  {
    className: "-left-32 top-0 h-[26rem] w-[26rem]",
    background: "radial-gradient(circle, rgba(255,182,39,0.32), transparent 68%)",
    drift: { x: [0, 44, 0], y: [0, -26, 0] },
    duration: 62,
    delay: 0,
  },
  {
    className: "-right-24 top-1/4 h-[30rem] w-[30rem]",
    background: "radial-gradient(circle, rgba(255,90,60,0.18), transparent 66%)",
    drift: { x: [0, -38, 0], y: [0, 30, 0] },
    duration: 78,
    delay: 4,
  },
  {
    className: "bottom-[-10rem] left-1/3 h-[28rem] w-[28rem]",
    background: "radial-gradient(circle, rgba(14,131,136,0.16), transparent 68%)",
    drift: { x: [0, 30, 0], y: [0, -20, 0] },
    duration: 70,
    delay: 8,
  },
];

export function AmbientBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {blobs.map((blob) => (
        <motion.div
          key={blob.className}
          className={`absolute rounded-full ${blob.className}`}
          style={{ background: blob.background }}
          animate={reduceMotion ? { x: 0, y: 0, rotate: 0, scale: 1 } : blob.drift}
          transition={{
            duration: blob.duration,
            delay: blob.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
