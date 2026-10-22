import { m as motion } from "motion/react";
import { useCalmMotion } from "../lib/motion";

export function AnimatedText({ text }: { text: string }) {
  const reduce = useCalmMotion();
  if (reduce) return <>{text}</>;
  const words = text.split(/\s+/);
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <motion.span
            key={`${index}-${word}`}
            className="inline-block whitespace-pre-wrap"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.24,
              delay: index * Math.min(0.025, 0.65 / Math.max(1, words.length)),
              ease: "easeOut",
            }}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </span>
    </>
  );
}
