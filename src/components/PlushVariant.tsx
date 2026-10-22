import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

const shinyDots = [
  { top: "14%", left: "16%", size: 10, delay: 0 },
  { top: "26%", left: "78%", size: 7, delay: 0.5 },
  { top: "58%", left: "10%", size: 6, delay: 0.9 },
  { top: "72%", left: "84%", size: 11, delay: 0.2 },
  { top: "38%", left: "48%", size: 5, delay: 1.2 },
];

const secretDots = [
  { top: "18%", left: "22%", size: 4, delay: 0 },
  { top: "30%", left: "72%", size: 5, delay: 0.7 },
  { top: "48%", left: "14%", size: 3, delay: 1.1 },
  { top: "62%", left: "80%", size: 4, delay: 0.3 },
  { top: "76%", left: "34%", size: 3, delay: 0.9 },
  { top: "12%", left: "58%", size: 3, delay: 1.4 },
];

export function PlushVariantOverlay({
  variant,
  className,
}: {
  variant: "shiny" | "secret" | null | undefined;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (!variant) return null;

  if (variant === "shiny") {
    return (
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 z-10 overflow-hidden", className)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,210,90,0.42),transparent_58%)]" />
        <div className="absolute inset-2 rounded-[0.8rem] border border-[#ffe7a3]/70" />
        {shinyDots.map((dot, index) => (
          <motion.span
            key={index}
            className="absolute text-[#fff1b8] drop-shadow-[0_0_4px_rgba(255,193,7,0.95)]"
            style={{ top: dot.top, left: dot.left }}
            initial={reduce ? false : { opacity: 0.35, scale: 0.7 }}
            animate={
              reduce
                ? { opacity: 0.85 }
                : { opacity: [0.35, 1, 0.45], scale: [0.7, 1.15, 0.8] }
            }
            transition={{
              duration: 2.4,
              delay: dot.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles style={{ width: dot.size, height: dot.size }} />
          </motion.span>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-10 overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(93,57,129,0.38),rgba(23,35,59,0.35))]" />
      <div className="absolute inset-2 rounded-[0.8rem] border border-dashed border-[#efd7ff]/60" />
      {secretDots.map((dot, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full bg-[#f6e7ff] shadow-[0_0_8px_rgba(220,180,255,0.9)]"
          style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size }}
          initial={reduce ? false : { opacity: 0.25 }}
          animate={reduce ? { opacity: 0.8 } : { opacity: [0.25, 0.95, 0.3] }}
          transition={{
            duration: 3.2,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
