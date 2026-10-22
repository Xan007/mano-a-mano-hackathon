import { Modal } from "./Modal";

export function NoteConfirmation({
  note,
  onDecision,
}: {
  note?: string;
  onDecision: (confirmed: boolean) => void;
}) {
  return (
    <Modal
      labelledBy="note-confirm-title"
      describedBy="note-confirm-hint"
      onClose={() => onDecision(false)}
      className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-[1.5rem] border-2 border-ink bg-paper p-5 text-ink shadow-[6px_6px_0_var(--color-ink)] sm:p-6"
    >
      <h2 id="note-confirm-title" className="text-3xl">
        Revisa tu nota
      </h2>
      <p id="note-confirm-hint" className="mt-3 text-sm leading-relaxed">
        Evita tu dirección, teléfono u otros datos que te identifiquen.
      </p>
      {note && (
        <blockquote className="postit my-5 break-words text-sm leading-relaxed">
          {note}
        </blockquote>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          data-autofocus
          type="button"
          onClick={() => onDecision(false)}
          className="btn btn-ghost flex-1"
        >
          Volver a editar
        </button>
        <button
          type="button"
          onClick={() => onDecision(true)}
          className="btn btn-ink flex-1"
        >
          Sí, enviar
        </button>
      </div>
    </Modal>
  );
}
