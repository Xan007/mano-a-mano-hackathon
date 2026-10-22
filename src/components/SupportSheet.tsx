import { Modal } from "./Modal";
import { X } from "lucide-react";
import { SupportContent } from "../routes/apoyo";

export function SupportSheet({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      labelledBy="support-title"
      onClose={() => onClose()}
      className="max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border-2 border-ink bg-paper p-5 text-ink shadow-[6px_6px_0_var(--color-ink)]"
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 id="support-title" className="text-3xl">
          Opciones de apoyo
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar apoyo"
          className="btn btn-ghost h-11 w-11 p-0"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      <SupportContent />
    </Modal>
  );
}
