import { cn } from "../lib/utils";

export function PlusBadge({ count = 1, className }: { count?: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border-2 border-ink bg-guava px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white shadow-[1px_1px_0_var(--color-ink)]",
        className
      )}
    >
      +{count}
    </span>
  );
}
