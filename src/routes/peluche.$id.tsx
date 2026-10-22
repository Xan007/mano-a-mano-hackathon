import { Modal } from "../components/Modal";
import { AnimatePresence } from "motion/react";
import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { m as motion } from "motion/react";
import { ArrowLeft, Bookmark, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useToken } from "../lib/session";
import { errorMessage } from "../lib/errors";
import { PlushArt } from "../components/PlushArt";
import { HopTrack } from "../components/HopTrack";
import { NoteCard, NoteGrid } from "../components/NoteCard";
import { EVOLUTION_COSTS, EVOLUTION_STAGES } from "../../config/care";

export default function PelucheDetail() {
  const token = useToken();
  const { id } = useParams<{ id: string }>();
  const plushId = id as Id<"plushItems">;
  const item = useQuery(api.plush.getOne, { token, plushId });
  const notes = useQuery(api.notes.byPlush, { token, plushId });
  const keep = useMutation(api.notes.makePermanent);
  const remove = useMutation(api.notes.remove);
  const report = useMutation(api.notes.report);
  const voteNote = useMutation(api.notes.toggleLike);
  const evolve = useMutation(api.plush.evolve);
  const [deleting, setDeleting] = useState<Id<"notes"> | null>(null);
  const [busy, setBusy] = useState(false);
  const reduce = useReducedMotion();
  if (item === undefined) return <p role="status">Buscando el pelucheâ€¦</p>;
  if (!item)
    return (
      <div className="card space-y-4 p-6">
        <h1 className="text-2xl">No encontramos ese peluche</h1>
        <Link to="/coleccion" className="btn btn-ghost">
          Volver a la colecciÃ³n
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

  async function handleVote(noteId: Id<"notes">, vote: "up" | "down") {
    try { await voteNote({ token, noteId, vote }); }
    catch (error) { toast.error(errorMessage(error, "No pudimos actualizar la reputaciÃ³n")); }
  }

  async function handleEvolve() {
    try {
      const result = await evolve({ token, plushId });
      toast.success(`${item?.catalog?.species ?? "Tu peluche"} evolucionÃ³`, { description: `Ahora es ${EVOLUTION_STAGES[result.evolution as 1 | 2 | 3].name}.` });
    } catch (error) {
      toast.error(errorMessage(error, "No pudimos evolucionar el peluche"));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/coleccion"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Tu colecciÃ³n
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
                ? "Buscando a quiÃ©n llegar"
                : "De mano en mano"
              : item.status === "returned"
                ? "VolviÃ³ con su libreta"
                : "Listo para viajar"}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl">
            {item.catalog?.species ?? "Tu peluche"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed">
            Un pequeÃ±o lugar para guardar palabras amables.
          </p>
          {item.status === "traveling" && (
            <div className="mt-3 space-y-2">
              {item.waitingSince !== undefined ? (
                <p className="text-sm leading-relaxed text-ink/75">
                  AÃºn no hay otra persona disponible. Lo intentaremos de nuevo y, si nadie puede recibirlo en 48 horas, volverÃ¡ a tu colecciÃ³n con tu nota.
                </p>
              ) : (
                <>
                  <p className="text-xs font-bold">Parada {item.currentHop ?? item.hopCount} de {item.hopsTarget} Â· {item.holderIsNpc === true ? "con un personaje" : item.holderIsNpc === false ? "con otra persona" : "en trÃ¡nsito"}</p>
                  <HopTrack hops={item.currentHop ?? item.hopCount} total={item.hopsTarget} />
                </>
              )}
            </div>
          )}
        </div>
      </section>
      {item.status === "collection" && (
        <div className="space-y-3">
          <Link to={`/enviar?id=${item._id}`} className="btn btn-guava w-full">
            <Send className="h-4 w-4" aria-hidden="true" />
            Enviar de viaje
          </Link>
          {(item.evolution ?? 1) < 3 && <section className="rounded-2xl border-2 border-ink bg-mist p-4 shadow-[3px_3px_0_var(--color-ink)]">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-paper"><Sparkles className="h-5 w-5 text-lagoon" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1"><h2 className="font-display text-lg">EvoluciÃ³n {EVOLUTION_STAGES[((item.evolution ?? 1) + 1) as 2 | 3].name}</h2><p className="mt-1 text-sm text-ink/70">ReÃºne los repetidos necesarios de esta especie para mejorar su tarjeta.</p><p className="mt-1 text-xs font-bold">{Math.min(item.duplicateCount, EVOLUTION_COSTS[((item.evolution ?? 1) + 1) as 2 | 3].duplicates)} / {EVOLUTION_COSTS[((item.evolution ?? 1) + 1) as 2 | 3].duplicates} repetidos</p></div>
            </div>
            <button type="button" onClick={() => void handleEvolve()} disabled={item.duplicateCount < EVOLUTION_COSTS[((item.evolution ?? 1) + 1) as 2 | 3].duplicates || busy} className="btn btn-ink mt-3 w-full disabled:cursor-not-allowed disabled:opacity-45">{item.duplicateCount >= EVOLUTION_COSTS[((item.evolution ?? 1) + 1) as 2 | 3].duplicates ? "Evolucionar ahora" : `Faltan ${EVOLUTION_COSTS[((item.evolution ?? 1) + 1) as 2 | 3].duplicates - item.duplicateCount}`}</button>
          </section>}
        </div>
      )}
        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-2xl">Su libreta</h2>
          </div>
          {notes === undefined && <p role="status">Abriendo la libretaâ€¦</p>}
          {notes?.length === 0 && (
            <p className="text-sm text-ink/70">
              {item.status === "traveling"
                ? "EstÃ¡ reuniendo notas. PodrÃ¡s leerlas cuando vuelva."
                : "TodavÃ­a no hay notas. Su primer viaje empieza con una frase tuya."}
            </p>
          )}
          <NoteGrid>
            <AnimatePresence initial={false}>
              {notes?.map((entry) => (
                <NoteCard
                  key={entry._id}
                  compact
                  body={entry.body}
                  alias={`${entry.author.alias ?? "Alguien"}${entry.author.isNpc ? " Â· Demo" : ""}`}
                  coverId={entry.cover}
                  effectId={entry.effect}
                  themeId={entry.theme}
                  upvotes={entry.upvotes}
                  downvotes={entry.downvotes}
                  vote={entry.vote}
                  reputationHidden={entry.reputationHidden || entry.autoHidden}
                  onVote={(vote) => void handleVote(entry._id, vote)}
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
              Â¿Borrar esta nota?
            </h2>
            <p className="mt-2 text-sm text-ink/70">
              Se quitarÃ¡ de tu libreta.
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



