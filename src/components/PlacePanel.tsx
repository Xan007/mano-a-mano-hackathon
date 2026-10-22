import { AnimatedText } from "./AnimatedText";
import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { useMutation, useQuery } from "convex/react";
import { m as motion } from "motion/react";
import { ArrowRight, Check, X } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { RescueReveal } from "./RescueReveal";
import { RARITY_LABELS, type Rarity } from "../../config/game";
import { StoryScene } from "./StoryScene";
import { storyFrames } from "../../config/storyboards";
import { PLACE_CAPSULE_MIN_READ_MS } from "../../config/places";
import { journeyScene } from "../../config/journey";
import { SUPPORT_CHANNELS, type Perspective } from "../../config/support";
import type { Id } from "../../convex/_generated/dataModel";
import { errorMessage } from "../lib/errors";
import { play } from "../lib/audio";
import { PlushArt } from "./PlushArt";
import type { Place } from "./placeTypes";
export type { Place } from "./placeTypes";

type Visit = {
  id: Id<"placeSessions">;
  prompt: string;
  options: string[];
  reward: { species: string; imagePath: string; rarity: Rarity };
};
type Answer = {
  correct: boolean;
  explanation: string;
  plush?: { species: string; imagePath: string } | null;
};

export function PlacePanel({
  place,
  token,
  perspective = "self",
  onClose,
  onRescued,
}: {
  place: Place;
  token: string;
  perspective?: Perspective;
  onClose: () => void;
  onRescued: (id: string) => void;
}) {
  const started = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [step, setStep] = useState(0);
  const [choosing, setChoosing] = useState(false);
  const start = useMutation(api.places.startVisit);
  const respond = useMutation(api.places.answer);
  const reduce = useReducedMotion();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [result, setResult] = useState<Answer | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scene = journeyScene(place.id, perspective)!;
  const frames = storyFrames(place.id, perspective);
  const channels = useQuery(api.channels.list);
  const channel = (channels ?? SUPPORT_CHANNELS).find((item) => item.id === scene.channelId)!;

  useEffect(() => {
    if (!revealed || choosing || result || remaining <= 0) return;
    const timer = window.setTimeout(
      () => setRemaining((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [remaining, revealed, choosing, result]);

  const begin = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await start({ token, placeId: place.id, perspective });
      setVisit({
        id: response.sessionId,
        ...response.capsule,
        reward: response.reward,
      });
      setRemaining(Math.ceil(response.minReadMs / 1000));
      setResult(null);
      play("click");
    } catch (caught) {
      setError(
        errorMessage(caught, "No pudimos abrir la historia. Intenta de nuevo."),
      );
    } finally {
      setBusy(false);
    }
  }, [start, token, place.id, perspective]);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void begin();
    }
  }, [begin]);
  async function answer(option: string) {
    if (!visit) return;
    setBusy(true);
    setError("");
    try {
      const response = await respond({ token, sessionId: visit.id, option });
      setResult(response);
      if (response.correct) {
        play("success");
        onRescued(place.id);
      } else play("error");
    } catch (caught) {
      setError(
        errorMessage(
          caught,
          "No pudimos revisar la respuesta. Intenta de nuevo.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  if (!revealed)
    return (
      <RescueReveal
        reward={visit?.reward ?? null}
        onComplete={() => setRevealed(true)}
        onClose={onClose}
        error={error}
        onRetry={begin}
      />
    );
  return (
    <Modal
      labelledBy="place-title"
      onClose={() => onClose()}
      className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-[1.5rem] border-2 border-ink bg-paper p-0 text-ink shadow-[6px_6px_0_var(--color-ink)]"
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 p-4 sm:p-6"
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="label">
              Historia ficticia ·{" "}
              {perspective === "self" ? "Para mí" : "Para acompañar"}
            </p>
            <h2 id="place-title" className="mt-1 text-3xl">
              {scene.title}
            </h2>
            {visit && (
              <p className="mt-1 text-xs font-bold capitalize text-ink/65">
                {RARITY_LABELS[visit.reward.rarity]}
              </p>
            )}
          </div>
          <button
            data-autofocus
            type="button"
            onClick={onClose}
            aria-label="Cerrar historia"
            className="btn btn-ghost h-11 w-11 shrink-0 p-0"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        {!result && !choosing && (
          <>
            <div
              className="flex gap-2"
              aria-label={`Escena ${step + 1} de ${frames.length}`}
            >
              {frames.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-lagoon" : "bg-ink/10"}`}
                />
              ))}
            </div>
            {visit && (
              <p className="text-xs font-semibold text-ink/65">
                {place.rescued ? "Tu recuerdo:" : "Rescatarás:"}{" "}
                {visit.reward.species}
              </p>
            )}
            <StoryScene
              text={frames[step]}
              imagePath={visit?.reward.imagePath ?? ""}
              placeName={place.name}
              placeId={place.id}
            />
            {step === frames.length - 1 && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-mist p-3 text-sm">
                <span className="font-bold">{channel.name}</span>
                <span>
                  {channel.contact} · {channel.cost}
                </span>
              </div>
            )}
          </>
        )}
        {result ? (
          <section className="space-y-4" aria-live="polite">
            <div
              className={`rounded-xl border-2 border-ink p-4 ${result.correct ? "bg-mango" : "bg-blush"}`}
            >
              <h3 className="text-xl">
                {result.correct
                  ? result.plush
                    ? "Un nuevo compañero de viaje"
                    : "Historia completada"
                  : "Miremos otra vez"}
              </h3>
              <p className="mt-2 text-sm leading-relaxed">
                <AnimatedText text={result.explanation} />
              </p>
            </div>
            {result.plush && (
              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4"
              >
                <PlushArt
                  size="md"
                  imagePath={result.plush.imagePath}
                  alt={result.plush.species}
                />
                <div>
                  <p className="label">Peluche rescatado</p>
                  <h3 className="mt-1 text-2xl">{result.plush.species}</h3>
                  <p className="mt-2 text-sm">
                    Te espera en tu colección para empezar a viajar.
                  </p>
                </div>
              </motion.div>
            )}
            {result.correct ? (
              <button
                type="button"
                className="btn btn-guava w-full"
                onClick={onClose}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Continuar mi recorrido
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ink w-full"
                onClick={() => setResult(null)}
              >
                Revisar las opciones
              </button>
            )}
          </section>
        ) : choosing && visit ? (
          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setChoosing(false)}
              className="min-h-11 text-sm font-semibold underline"
            >
              Volver a la pista
            </button>
            <h3 className="text-xl leading-snug">
              <AnimatedText key={visit.prompt} text={visit.prompt} />
            </h3>
            {visit.options.map((option) => (
              <button
                key={option}
                type="button"
                disabled={busy || remaining > 0}
                onClick={() => answer(option)}
                className="btn btn-ghost min-h-12 w-full justify-start rounded-2xl text-left leading-relaxed"
              >
                {option}
              </button>
            ))}
            {busy && (
              <p role="status" className="text-sm">
                Revisando…
              </p>
            )}
          </section>
        ) : (
          <button
            type="button"
            disabled={
              busy || remaining > 0 || (step === frames.length - 1 && !visit)
            }
            onClick={() => {
              if (remaining > 0) return;
              if (step < frames.length - 1) {
                setStep(step + 1);
                setRemaining(Math.ceil(PLACE_CAPSULE_MIN_READ_MS / 1000));
                play("page");
              } else setChoosing(true);
            }}
            className="btn btn-ink w-full"
          >
            {busy
              ? "Preparando…"
              : remaining > 0
                ? `${step < frames.length - 1 ? "Sigue" : "Opciones"} en ${remaining} s`
                : step < frames.length - 1
                  ? "Seguir la historia"
                  : "Ayudar y rescatar"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-blush p-3 text-sm font-semibold"
          >
            {error}
            {!visit && step === frames.length - 1 && (
              <button
                type="button"
                onClick={begin}
                disabled={busy}
                className="btn btn-ghost mt-2 w-full"
              >
                Reintentar
              </button>
            )}
          </p>
        )}
      </motion.div>
    </Modal>
  );
}
