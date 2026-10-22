import { TravelCancelled, useTravel } from "../lib/travel";
import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { m as motion } from "motion/react";
import { ArrowRight, Check, MapPin, Send } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { companionById } from "../../config/catalog";
import type { Perspective } from "../../config/support";
import { journeyScene } from "../../config/journey";
import { useToken } from "../lib/session";
import { errorMessage } from "../lib/errors";
import { Brand } from "./Brand";
import { PlushArt } from "./PlushArt";

import { PositiveNotePicker } from "./PositiveNotePicker";
import { PlacePanel, type Place } from "./PlacePanel";
import { AccountAccess } from "./AccountAccess";
import { SoundToggle } from "./SoundToggle";

function JourneyIntro({
  rescued,
  companionId,
}: {
  rescued: boolean;
  companionId?: string;
}) {
  const companion = companionById(companionId);
  const reduce = useReducedMotion();
  return (
    <>
      <div
        className="flex gap-2"
        aria-label={`Paso ${rescued ? 3 : 2} de 3`}
      >
        {["Tu compañero", "Tu primera historia", "Una nota que viaja"].map(
          (label, index) => (
            <div key={label} className="flex-1 space-y-2">
              <div
                className={`h-1.5 rounded-full ${index < (rescued ? 3 : 2) ? "bg-lagoon" : "bg-ink/15"}`}
              />
              <p className="text-xs font-semibold text-ink/70">{label}</p>
            </div>
          ),
        )}
      </div>
      <section className="flex items-center gap-4">
        <motion.div
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <PlushArt
            imagePath={companion?.imagePath}
            alt={companion?.name ?? "Tu compañero"}
            size="md"
          />
        </motion.div>
        <div>
          <h1 className="text-3xl">
            {rescued ? "¡Ya tienes un peluche!" : "Vamos por tu primer peluche"}
          </h1>
          <p className="mt-2 text-sm text-ink/70">
            {rescued
              ? "Déjale una nota y ponlo a viajar."
              : "Una historia corta. Un nuevo amigo."}
          </p>
        </div>
      </section>
    </>
  );
}

export function FirstJourney() {
  const token = useToken();
  const travel = useTravel();
  const me = useQuery(api.auth.me, { token });
  const map = useQuery(api.places.list, { token });
  const plushes = useQuery(api.plush.getMyPlushes, { token });
  const finish = useMutation(api.players.finishJourney);
  const send = useAction(api.plush.send);
  const perspective: Perspective = "self";
  const [opened, setOpened] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saveStepKey = `manoamano.save-step.${token}`;
  const [saveStep, setSaveStep] = useState(() => sessionStorage.getItem(saveStepKey) === "1");
  const place = map?.places.find((item) => item.id === "clinica");
  const scene = journeyScene("clinica", perspective)!;
  const firstPlush = plushes?.find((item) => item.status === "collection");
  const sentFirstPlush = Boolean(place?.rescued && plushes?.some((item) => item.status !== "collection"));
  function showSaveStep() {
    sessionStorage.setItem(saveStepKey, "1");
    setSaveStep(true);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  useEffect(() => {
    if (firstPlush && note)
      sessionStorage.setItem(`manoamano.demo-note.${firstPlush._id}`, note);
  }, [firstPlush, note]);

  async function continueLater() {
    setBusy(true);
    setError("");
    try {
      await finish({ token, perspective });
      sessionStorage.removeItem(saveStepKey);
    } catch (caught) {
      setError(
        errorMessage(caught, "No pudimos entrar a Casa. Intenta de nuevo."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    setBusy(true);
    setError("");
    try {
      if (firstPlush)
        await travel(
          {
            note,
            imagePath: firstPlush.catalog?.imagePath,
            name: firstPlush.catalog?.species ?? "Tu peluche",
          },
          () =>
            send({
              token,
              plushId: firstPlush._id,
              note,
            }),
        );
      sessionStorage.removeItem(`manoamano.demo-note.${firstPlush?._id}`);
      showSaveStep();
    } catch (caught) {
      if (caught instanceof TravelCancelled) return;
      setError(
        errorMessage(
          caught,
          "No pudimos completar el viaje. Intenta de nuevo.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  if (saveStep || sentFirstPlush) {
    const companion = companionById(me?.companion);
    const saved = Boolean(me?.hasPassword || me?.hasGoogle);
    return (
      <div className="mx-auto max-w-md space-y-5 px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between gap-3"><Brand /><SoundToggle className="h-11 w-11" /></div>
        <section className="card space-y-5 p-5 text-center sm:p-7">
          <PlushArt imagePath={companion?.imagePath} alt="" size="md" className="mx-auto" />
          <div>
            <p className="label">Último paso</p>
            <h1 className="mt-2 text-3xl">Guarda tu recorrido</h1>
            <p className="mt-3 text-sm text-ink/75">Para volver otro día con tu mascota, tus peluches y tus notas.</p>
          </div>
          <AccountAccess initialAlias={me?.alias ?? ""} saved={saved} loginName={me?.loginName} label="Guardar mi cuenta" />
          {error && <p role="alert" className="rounded-xl bg-blush p-3 text-sm">{error}</p>}
          <button type="button" onClick={continueLater} disabled={busy} className={saved ? "btn btn-ink w-full" : "btn btn-ghost w-full"}>
            {busy ? "Entrando…" : saved ? "Entrar a Casa" : "Ahora no, entrar a Casa"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Brand />
        <div className="flex items-center gap-2">
        <SoundToggle className="h-11 w-11" />
        <Link to="/apoyo" className="btn btn-ghost">
          Ver apoyo sin jugar
        </Link>
        </div>
      </header>
      <JourneyIntro
        rescued={place?.rescued ?? false}
        companionId={me?.companion}
      />
      {!place?.rescued ? (
        <section className="card space-y-4 p-5">
          <button
            type="button"
            onClick={() => setOpened(true)}
            disabled={!place}
            className="btn btn-ink w-full"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {place ? "Rescatar mi primer peluche" : "Cargando la historia…"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      ) : (
        <section className="card space-y-4 p-5">
          <p className="chip bg-mist">
            <Check className="h-4 w-4" aria-hidden="true" />
            Primera historia completada
          </p>
          <h2 className="text-2xl">Ahora, una nota para el camino.</h2>
          <PositiveNotePicker value={note} onChange={setNote} />
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-blush p-3 text-sm font-semibold"
            >
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={busy || !note || plushes === undefined}
            onClick={complete}
            className="btn btn-ink w-full"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {busy
              ? "Revisando tu nota y preparando el viaje…"
              : firstPlush
                ? "Enviar mi peluche"
                : "Continuar"}
          </button>
          <button
            type="button"
            onClick={showSaveStep}
            disabled={busy}
            className="btn btn-ghost w-full"
          >
            Enviar después
          </button>
        </section>
      )}
      {opened && place && (
        <PlacePanel
          key={`${place.id}-${perspective}`}
          place={
            {
              ...place,
              story: scene.story,
              challengeLabel: scene.title,
            } as Place
          }
          perspective={perspective}
          token={token}
          onClose={() => setOpened(false)}
          onRescued={() => undefined}
        />
      )}
    </div>
  );
}
