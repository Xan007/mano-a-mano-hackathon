import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { motion } from "motion/react";
import { levelProgress } from "../../config/progression";
import { cn } from "../lib/utils";

export function LevelBar({
  xp,
  tone = "dark",
  className,
}: {
  xp: number;
  tone?: "dark" | "light";
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { level, current, needed, ratio } = levelProgress(xp);
  const scale = Math.max(.03, Math.min(1, ratio));
  const light = tone === "light";

  return (
    <div className={cn("space-y-1", className)}>
      <div
        className={cn(
          "flex items-baseline justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.14em]",
          light ? "text-paper/85" : "text-ink/70"
        )}
      >
        <span>Nivel {level}</span>
        <span className="tabular-nums">
          {current}/{needed} xp
        </span>
      </div>
      <div
        className={cn(
          "h-2.5 overflow-hidden rounded-full border-2",
          light ? "border-paper bg-paper/25" : "border-ink bg-sand"
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={needed}
        aria-valuenow={current}
        aria-label={`Nivel ${level}`}
      >
        <motion.div
          className={cn("h-full rounded-full", light ? "bg-paper" : "bg-lagoon")}
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: scale }}
          style={{ transformOrigin: "left" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
