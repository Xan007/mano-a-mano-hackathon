import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { Clock, Mail, Palette, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { RARITY_LABELS, type Rarity } from "../../config/game";
import { TravelCancelled, useTravel } from "../lib/travel";
import { errorMessage } from "../lib/errors";
import { play } from "../lib/audio";
import { markMailboxSeen } from "../lib/notifications";
import { formatDue } from "../lib/game";
import { useNow } from "../lib/useNow";
import { useToken } from "../lib/session";
import { cn } from "../lib/utils";
import { PositiveNotePicker } from "../components/PositiveNotePicker";
import { PlushArt } from "../components/PlushArt";
import { HopTrack } from "../components/HopTrack";
import { NoteCard, NoteGrid } from "../components/NoteCard";

function storedDraft(transitId: string) {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(`manoamano.draft.mailbox.${transitId}`) ?? "";
}

export default function Buzon() {
  const token = useToken();
  const travel = useTravel();
  const mailboxes = useQuery(api.mailbox.list, { token });
  const plushes = useQuery(api.plush.getMyPlushes, { token });
  const passPlush = useAction(api.plush.pass);
  const reportNote = useMutation(api.notes.report);
  const voteNote = useMutation(api.notes.toggleLike);
  const ensureDaily = useMutation(api.mailbox.ensureDaily);
  const now = useNow(1000);
  const [activeTransitId, setActiveTransitId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [writing, setWriting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ensureDaily({ token }).catch(() => undefined);
  }, [ensureDaily, token]);

  const mailbox =
    mailboxes?.find((item) => item.transitId === activeTransitId) ??
    mailboxes?.[0] ??
    null;

  useEffect(() => {
    if (!mailboxes?.length) return;
    markMailboxSeen(mailboxes.map((item) => item.transitId));
  }, [mailboxes]);

  const note = mailbox
    ? (drafts[mailbox.transitId] ?? storedDraft(mailbox.transitId))
    : "";

  function changeNote(value: string) {
    if (!mailbox) return;
    setDrafts((current) => ({ ...current, [mailbox.transitId]: value }));
    const key = `manoamano.draft.mailbox.${mailbox.transitId}`;
    if (value.trim()) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  }

  async function handlePass() {
    if (!mailbox) return;
    const transitId = mailbox.transitId;
    setBusy(true);
    try {
      const result = await travel(
        {
          note,
          imagePath: mailbox.plush.catalog?.imagePath,
          name: mailbox.plush.catalog?.species ?? "El peluche",
          hasNote: Boolean(note.trim()),
        },
        () =>
          passPlush({
            token,
            transitId,
            note: note.trim() || undefined,
          }),
      );
      toast.success(
        result.returned
          ? "El peluche vuelve a su dueño con todas las notas"
          : "El peluche sigue su camino",
      );
      sessionStorage.removeItem(`manoamano.draft.mailbox.${transitId}`);
      setDrafts((current) => {
        const next = { ...current };
        delete next[transitId];
        return next;
      });
      setWriting(false);
      setActiveTransitId(null);
    } catch (error) {
      if (error instanceof TravelCancelled) return;
      play("error");
      toast.error(errorMessage(error, "No pudimos pasar el peluche"));
    } finally {
      setBusy(false);
    }
  }

  async function handleReport(noteId: string) {
    try {
      await reportNote({ token, noteId: noteId as Id<"notes"> });
      play("click");
      toast.success("Reportaste la nota: queda oculta");
    } catch (error) {
      play("error");
      toast.error(errorMessage(error, "No pudimos reportar la nota"));
    }
  }

  async function handleVote(noteId: string, vote: "up" | "down") {
    try {
      await voteNote({ token, noteId: noteId as Id<"notes">, vote });
    } catch (error) {
      toast.error(errorMessage(error, "No pudimos actualizar la reputación"));
    }
  }

  const remaining = mailbox ? Math.max(0, mailbox.dueAt - now) : 0;
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const traveling =
    plushes?.filter((item) => item.status === "traveling").length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-mango shadow-[3px_3px_0_var(--color-ink)]">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-3xl sm:text-4xl">Tu buzón</h1>
          <p className="mt-1 text-sm text-ink/70">
            Puedes recibir hasta dos peluches. Elige uno, lee sus notas y
            ayúdalo a seguir.
          </p>
        </div>
      </header>

      {mailboxes === undefined && (
        <p role="status" className="text-sm text-ink/70">
          Abriendo el buzón…
        </p>
      )}

      {mailboxes?.length === 0 && (
        <section className="card flex flex-col items-center gap-3 p-8 text-center">
          <PlushArt alt="" size="md" />
          <h2 className="text-2xl">Todavía no llegó nadie</h2>
          <p className="max-w-sm text-sm text-ink/70">
            Mientras esperas, puedes explorar otra historia o enviar uno de tus
            peluches.
          </p>
          <Link to="/mapa" className="btn btn-ink">
            Explorar el mapa
          </Link>
        </section>
      )}

      {mailboxes && mailboxes.length > 0 && (
        <>
          {mailboxes.length > 1 && (
          <section aria-label="Peluches en tu buzón">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="label">Esperando por ti</p>
              <span className="text-xs font-bold text-ink/60">
                {mailboxes.length} de 2 lugares ocupados
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {mailboxes.map((item) => {
                const active = item.transitId === mailbox?.transitId;
                return (
                  <button
                    key={item.transitId}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setActiveTransitId(item.transitId);
                      setWriting(false);
                    }}
                    className={cn(
                      "relative flex min-h-24 items-center gap-2 overflow-hidden rounded-2xl border-2 p-2.5 text-left transition-[transform,background-color,box-shadow] active:translate-y-0.5 sm:gap-3 sm:p-3",
                      active
                        ? "border-ink bg-mist shadow-[4px_4px_0_var(--color-ink)]"
                        : "border-ink/25 bg-paper hover:border-ink/60",
                    )}
                  >
                    <PlushArt
                      imagePath={item.plush.catalog?.imagePath}
                      alt=""
                      size="sm"
                      className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold sm:text-base">
                        {item.plush.catalog?.species ?? "Peluche"}
                      </span>
                      <span className="mt-1 block text-[11px] font-semibold text-ink/65">
                        {item.allNotes.length} {item.allNotes.length === 1 ? "nota" : "notas"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          )}

          {mailbox && (
            <section className="card overflow-hidden" key={mailbox.transitId}>
              <div className="relative overflow-hidden border-b-2 border-ink bg-mist p-4 sm:p-5">
                <Sparkles className="absolute -right-5 -top-5 h-24 w-24 text-white/40" aria-hidden="true" />
                <div className="relative flex items-center gap-3 sm:gap-4">
                  <PlushArt
                    imagePath={mailbox.plush.catalog?.imagePath}
                    alt={mailbox.plush.catalog?.species ?? "Peluche viajero"}
                    size="md"
                    className="h-24 w-24 shrink-0 sm:h-28 sm:w-28"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="label">
                      Llegó de visita · {mailboxes.length} de 2 lugares
                    </p>
                    <h2 className="mt-1 truncate text-2xl sm:text-3xl">
                      {mailbox.plush.catalog?.species ?? "Peluche"}
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-ink/65">
                      {RARITY_LABELS[(mailbox.plush.catalog?.rarity ?? "comun") as Rarity]}
                      {" · "}parada {mailbox.hopIndex} de {mailbox.plush.hopsTarget}
                    </p>
                    <div className="mt-2">
                      <HopTrack
                        hops={mailbox.hopIndex - 1}
                        total={mailbox.plush.hopsTarget}
                      />
                    </div>
                  </div>
                </div>
                <div className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-ink/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {hours} h {minutes} min contigo
                  </span>
                  <span>Pasa solo {formatDue(mailbox.dueAt)}</span>
                </div>
              </div>

              <div className="space-y-6 p-4 sm:p-6">
                <section aria-labelledby="journey-notes-title">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="label">Su viaje hasta ti</p>
                      <h3 id="journey-notes-title" className="mt-1 text-2xl">
                        Todas las notas que trae
                      </h3>
                    </div>
                    <span className="chip bg-mango">{mailbox.allNotes.length}</span>
                  </div>
                  {mailbox.allNotes.length === 0 ? (
                    <p className="rounded-2xl bg-sand p-4 text-sm text-ink/70">
                      Este peluche llegó sin notas. Puedes dejarle la primera.
                    </p>
                  ) : (
                    <NoteGrid>
                      {mailbox.allNotes.map((item, index) => (
                        <NoteCard
                          key={item._id}
                          body={item.body}
                          alias={`${item.alias}${item.isNpc ? " · Demo" : ""}`}
                          themeId={item.theme}
                          coverId={item.cover}
                          effectId={item.effect}
                          upvotes={item.upvotes}
                          downvotes={item.downvotes}
                          vote={item.vote}
                          reputationHidden={item.reputationHidden || item.autoHidden}
                          onVote={(vote) => void handleVote(item._id, vote)}
                          compact
                          tilt={index % 2 === 0 ? -0.45 : 0.45}
                          onReport={() => handleReport(item._id)}
                          badge={
                            <span className="inline-flex w-fit rounded-full bg-paper/80 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/65">
                              {item.hopIndex === 0
                                ? "Donde empezó"
                                : `Parada ${item.hopIndex}`}
                            </span>
                          }
                        />
                      ))}
                    </NoteGrid>
                  )}
                </section>

                {!writing ? (
                  <div className="grid gap-2 border-t-2 border-dashed border-ink/20 pt-5 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setWriting(true)}
                      className="btn btn-guava"
                    >
                      <Send className="h-4 w-4" aria-hidden="true" />
                      Dejar una nota
                    </button>
                    <button
                      type="button"
                      onClick={handlePass}
                      disabled={busy}
                      className="btn btn-ghost"
                    >
                      {busy ? "Pasando…" : "Pasarlo sin nota"}
                    </button>
                  </div>
                ) : (
                  <section className="space-y-4 rounded-2xl border-2 border-ink bg-sand p-4 sm:p-5" aria-label="Tu respuesta">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl">Tu nota para el camino</h3>
                      <Link
                        to="/taller"
                        className="inline-flex min-h-11 items-center gap-1.5 text-xs font-bold underline decoration-dotted underline-offset-2"
                      >
                        <Palette className="h-4 w-4" aria-hidden="true" />
                        Decorar
                      </Link>
                    </div>
                    <PositiveNotePicker value={note} onChange={changeNote} />
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <button
                        type="button"
                        onClick={handlePass}
                        disabled={busy || !note.trim()}
                        className="btn btn-guava"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        {busy ? "Revisando…" : "Revisar y pasar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setWriting(false)}
                        className="btn btn-ghost"
                      >
                        Ahora no
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {traveling > 0 && (
        <p className="text-center text-xs font-semibold text-ink/55">
          Tus {traveling} peluches viajeros siguen avanzando desde Casa.
        </p>
      )}
    </div>
  );
}
