import { Modal } from "../components/Modal";
import { AnimatePresence } from "motion/react";
import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { m as motion } from "motion/react";
import { ArrowLeft, Bookmark, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useToken } from "../lib/session";
import { errorMessage } from "../lib/errors";
import { PlushArt } from "../components/PlushArt";
import { HopTrack } from "../components/HopTrack";
import { NoteCard, NoteGrid } from "../components/NoteCard";

export default function PelucheDetail() {
  const token = useToken();
  const { id } = useParams<{ id: string }>();
  const plushId = id as Id<"plushItems">;
  const item = useQuery(api.plush.getOne, { token, plushId });
  const notes = useQuery(api.notes.byPlush, { token, plushId });
  const keep = useMutation(api.notes.makePermanent);
  const remove = useMutation(api.notes.remove);
  const report = useMutation(api.notes.report);
  const [deleting, setDeleting] = useState<Id<"notes"> | null>(null);
  const [busy, setBusy] = useState(false);
  const reduce = useReducedMotion();
  if (item === undefined) return <p role="status">Buscando el peluche…</p>;
  if (!item)
    return (
      <div className="card space-y-4 p-6">
        <h1 className="text-2xl">No encontramos ese peluche</h1>
        <Link to="/coleccion" className="btn btn-ghost">
          Volver a la colección
        </Link>
      </div>
    );

  async function noteAction(
    action: "keep" | "delete" | "report",
    noteId: Id<"notes">,
  ) {
    setBusy(true);
    try {
      if (action === "keep") await keep({ token, noteId });
      else if (action === "delete") await remove({ token, noteId });
      else await report({ token, noteId });
      toast.success(
        action === "keep"
          ? "Nota guardada gratis"
          : action === "delete"
            ? "Nota borrada"
            : "Nota reportada y oculta",
      );
    } catch (caught) {
      toast.error(errorMessage(caught, "No pudimos actualizar la nota"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/coleccion"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Tu colección
      </Link>
      <section className="card flex items-center gap-5 overflow-hidden bg-mango p-5 sm:p-7">
        <motion.div
          className="shrink-0"
          animate={
            reduce
              ? { x: 0, y: 0, rotate: 0, scale: 1 }
              : { y: [0, -6, 0], rotate: [-2, 2, -2] }
          }
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <PlushArt
            imagePath={item.catalog?.imagePath}
            alt={item.catalog?.species ?? "Peluche"}
            size="md"
            className="h-24 w-24 sm:h-32 sm:w-32"
          />
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="label">
            {item.status === "traveling"
              ? item.waitingSince !== undefined
                ? "Buscando a quién llegar"
                : "De mano en mano"
              : item.status === "returned"
                ? "Volvió con su libreta"
                : "Listo para viajar"}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl">
            {item.catalog?.species ?? "Tu peluche"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed">
            Un pequeño lugar para guardar palabras amables.
          </p>
          {item.status === "traveling" && (
            <div className="mt-3 space-y-2">
              {item.waitingSince !== undefined ? (
                <p className="text-sm leading-relaxed text-ink/75">
                  Aún no hay otra persona disponible. Lo intentaremos de nuevo y, si nadie puede recibirlo en 48 horas, volverá a tu colección con tu nota.
                </p>
              ) : (
                <>
                  <p className="text-xs font-bold">Parada {item.currentHop ?? item.hopCount} de {item.hopsTarget} · {item.holderIsNpc === true ? "con un personaje" : item.holderIsNpc === false ? "con otra persona" : "en tránsito"}</p>
                  <HopTrack hops={item.currentHop ?? item.hopCount} total={item.hopsTarget} />
                </>
              )}
            </div>
          )}
        </div>
      </section>
      {item.status === "collection" && (
        <Link to={`/enviar?id=${item._id}`} className="btn btn-guava w-full">
          <Send className="h-4 w-4" aria-hidden="true" />
          Enviar de viaje
        </Link>
      )}
        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-2xl">Su libreta</h2>
          </div>
          {notes === undefined && <p role="status">Abriendo la libreta…</p>}
          {notes?.length === 0 && (
            <p className="text-sm text-ink/70">
              {item.status === "traveling"
                ? "Está reuniendo notas. Podrás leerlas cuando vuelva."
                : "Todavía no hay notas. Su primer viaje empieza con una frase tuya."}
            </p>
          )}
          <NoteGrid>
            <AnimatePresence initial={false}>
              {notes?.map((entry) => (
                <NoteCard
                  key={entry._id}
                  compact
                  body={entry.body}
                  alias={`${entry.author.alias ?? "Alguien"}${entry.author.isNpc ? " · Demo" : ""}`}
                  coverId={entry.cover}
                  effectId={entry.effect}
                  themeId={entry.theme}
                  onReport={() => noteAction("report", entry._id)}
                  actions={
                    <>
                      {!entry.permanent && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => noteAction("keep", entry._id)}
                          aria-label="Guardar nota"
                          title="Guardar nota"
                          className="grid h-11 w-11 place-items-center rounded-full"
                        >
                          <Bookmark className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setDeleting(entry._id)}
                        aria-label="Borrar nota"
                        title="Borrar nota"
                        className="grid h-11 w-11 place-items-center rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  }
                />
              ))}
            </AnimatePresence>
          </NoteGrid>
        </section>
      <AnimatePresence>
        {deleting && (
          <Modal
            labelledBy="delete-note-title"
            onClose={() => setDeleting(null)}
            className="w-full max-w-sm rounded-3xl border-2 border-ink bg-paper p-5 text-ink shadow-[6px_6px_0_var(--color-ink)]"
          >
            <h2 id="delete-note-title" className="text-2xl">
              ¿Borrar esta nota?
            </h2>
            <p className="mt-2 text-sm text-ink/70">
              Se quitará de tu libreta.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="btn btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await noteAction("delete", deleting);
                  setDeleting(null);
                }}
                className="btn btn-ink flex-1"
              >
                Borrar
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
