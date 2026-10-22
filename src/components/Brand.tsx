import { cn } from "../lib/utils";

export function SunDisc({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <clipPath id="sun-disc-clip">
          <circle cx="100" cy="100" r="94" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="94" fill="var(--color-mango)" />
      <g clipPath="url(#sun-disc-clip)">
        <rect x="0" y="84" width="200" height="8" fill="var(--color-paper)" opacity="0.85" />
        <rect x="0" y="104" width="200" height="14" fill="var(--color-guava)" />
        <rect x="0" y="126" width="200" height="6" fill="var(--color-paper)" opacity="0.85" />
        <rect x="0" y="146" width="200" height="10" fill="var(--color-guava)" opacity="0.7" />
        <rect x="0" y="164" width="200" height="40" fill="var(--color-paper)" />
      </g>
      <circle cx="100" cy="100" r="94" fill="none" stroke="var(--color-ink)" strokeWidth="3" />
    </svg>
  );
}

export function Brand({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2 whitespace-nowrap", className)}>
      <img
        src="/brand/wordmark.webp"
        alt="Mano a Mano"
        decoding="async"
        fetchPriority="high"
        className={cn(
          compact ? "h-9 max-w-[154px]" : "h-12 max-w-[205px]",
          "w-auto object-contain",
        )}
      />
      {!compact && (
        <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.22em] opacity-60 sm:block">
          Villavicencio
        </span>
      )}
    </span>
  );
}
