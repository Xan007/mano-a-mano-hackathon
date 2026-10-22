import { NoteCard } from "./NoteCard";

export function NotePreview({ body, alias, coverId, effectId, coverName }: {
  body: string;
  alias: string;
  coverId: string;
  effectId: string;
  coverName: string;
}) {
  return (
    <aside data-testid="note-sticky-preview" className="note-sticky-preview sticky order-1 z-30 w-full self-start lg:order-2" aria-label="Vista previa de tu nota">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm sm:text-base">Así se ve tu nota</h2>
        <span className="text-xs font-semibold text-ink/65">{coverName}</span>
      </div>
      <div className="note-preview-frame">
        <NoteCard
          body={body}
          alias={alias}
          coverId={coverId}
          effectId={effectId}
          className="note-studio-card"
        />
      </div>
    </aside>
  );
}
