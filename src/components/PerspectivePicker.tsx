import type { Perspective } from "../../config/support";
import { cn } from "../lib/utils";

export function PerspectivePicker({
  value,
  onChange,
}: {
  value: Perspective;
  onChange: (value: Perspective) => void;
}) {
  return (
    <div
      className="inline-flex max-w-full flex-wrap gap-2"
      role="group"
      aria-label="Desde dónde quieres explorar"
    >
      {(
        [
          { id: "self", label: "Para mí" },
          { id: "others", label: "Para acompañar" },
        ] as const
      ).map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={id === value}
          onClick={() => onChange(id)}
          className={cn(
            "min-h-10 rounded-full border-2 border-ink px-4 py-2 text-sm font-bold transition-colors",
            id === value ? "bg-ink text-paper" : "bg-paper text-ink/70 hover:bg-mist",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
