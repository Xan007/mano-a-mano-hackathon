import { useId } from "react";
import { Feather } from "lucide-react";
import { POSITIVE_NOTES } from "../../config/support";
import { NOTE_MAX_CHARS } from "../../config/operations";

export function PositiveNotePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (note: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="label flex items-center gap-2">
        <Feather className="h-4 w-4" aria-hidden="true" />
        Escribe tu nota
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, NOTE_MAX_CHARS))}
        maxLength={NOTE_MAX_CHARS}
        rows={4}
        className="field"
        placeholder="Unas palabras amables para quien reciba el peluche…"
        aria-describedby={`${id}-help`}
      />
      <div className="flex items-start justify-between gap-4 text-xs leading-relaxed text-ink/75">
        <p id={`${id}-help`}>
          Sin datos personales ni relatos de salud. Revisamos tu nota antes de
          enviarla.
        </p>
        <span className="shrink-0 tabular-nums">{value.length}/{NOTE_MAX_CHARS}</span>
      </div>
      <details className="rounded-xl border-2 border-ink/20 bg-paper p-3">
        <summary className="min-h-7 cursor-pointer text-sm font-bold">
          ¿Quieres una idea para empezar?
        </summary>
        <div className="mt-3 space-y-2">
          {POSITIVE_NOTES.map((note) => (
            <button
              key={note}
              type="button"
              onClick={() => onChange(note)}
              className="btn btn-ghost w-full justify-start rounded-xl text-left text-xs leading-relaxed"
            >
              {note}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
