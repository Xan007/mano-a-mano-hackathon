import { cn } from "../lib/utils";

export function HopTrack({ hops, total }: { hops: number; total: number }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-hidden="true">
      {Array.from({ length: total }).map((_, index) => (
        <span key={index} className={cn("step-dot", index < hops && "step-dot-done")} />
      ))}
    </div>
  );
}
