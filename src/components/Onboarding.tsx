import { AccountModal } from "./AccountAccess";
import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { useState } from "react";
import { errorMessage } from "../lib/errors";
import { useAction, useQuery } from "convex/react";
import { m as motion } from "motion/react";
import { ArrowRight, Check, Loader2, LogIn } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { COMPANIONS, companionById } from "../../config/catalog";
import { useSession } from "../lib/session";
import { play } from "../lib/audio";
import { Brand } from "./Brand";
import { PlushArt } from "./PlushArt";
import { cn } from "../lib/utils";
import { SoundToggle } from "./SoundToggle";

export function Onboarding() {
  const { token } = useSession();
  const me = useQuery(api.auth.me, {token: token ?? ""});
  const setCompanion = useAction(api.players.setCompanion);
  const [draft] = useState<{ alias?: string; selected?: string }>(()=> { try { return JSON.parse(sessionStorage.getItem("manoamano.onboarding-draft") ?? "{}"); } catch { return {}; } });
  const [aliasDraft, setAlias] = useState<string | null>(draft.alias ?? null);
  const alias = aliasDraft ?? ((me?.hasPassword || me?.hasGoogle) ? me.alias ?? "" : "");
  const [selected, setSelected] = useState<string | null>(draft.selected ?? null);
  function saveDraft(nextAlias: string, nextSelected: string | null) { sessionStorage.setItem("manoamano.onboarding-draft", JSON.stringify({alias:nextAlias,selected:nextSelected})); }
  const [error, setError] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const reduceMotion = useReducedMotion();

  const chosen = companionById(selected ?? undefined);

  async function confirm() {
    if (!token) return;
    if (!selected) {
      setError("Elige una mascota para empezar.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await setCompanion({ token, companion: selected, alias });
      sessionStorage.removeItem("manoamano.onboarding-draft");
      play("success");
    } catch (caught) {
      play("error");
      setError(errorMessage(caught, "No pudimos guardar tu mascota."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Brand />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SoundToggle className="h-11 w-11" />
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="btn btn-ghost"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Ya tengo una cuenta
            </button>
          </div>
        </header>

        <div className="space-y-2">
          <h1 className="text-4xl leading-[0.95] sm:text-5xl">
            Elige a tu compañero
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-ink/75">
            Tu mascota se queda contigo. Los peluches viajan.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COMPANIONS.map((companion, index) => {
            const active = selected === companion.id;
            return (
              <motion.button
                key={companion.id}
                type="button"
                onClick={() => {setSelected(companion.id);saveDraft(alias,companion.id);}}
                aria-pressed={active}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.04 * index,
                  type: "spring",
                  stiffness: 220,
                  damping: 22,
                }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                className={cn(
                  "tile relative flex flex-col items-center gap-2 p-3 text-center",
                  active ? "bg-mango" : "bg-[#fffdf7]",
                )}
              >
                {active && (
                  <motion.span
                    initial={reduceMotion ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-paper"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </motion.span>
                )}
                <PlushArt
                  imagePath={companion.imagePath}
                  alt={`Peluche de ${companion.name}`}
                  size="sm"
                />
                <span className="font-display text-sm font-bold leading-tight">
                  {companion.name}
                </span>
                <span className="text-[11px] leading-tight text-ink/70">
                  {companion.blurb}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="card space-y-3 p-5">
          <label htmlFor="player-alias" className="label">
            ¿Cómo quieres que te llamen?
          </label>
          <input
            id="player-alias"
            className="field"
            value={alias}
            onChange={(event) => {setAlias(event.target.value);saveDraft(event.target.value,selected);}}
            maxLength={24}
            placeholder="Tu apodo"
            autoComplete="off"
            aria-describedby="alias-hint"
            disabled={busy}
          />
          <p id="alias-hint" className="text-xs text-ink/70">
            3–24 caracteres. Sin nombre completo ni datos personales.
          </p>

          {error && (
            <p className="rounded-xl border-2 border-ink bg-blush px-3 py-2 text-sm font-semibold">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={confirm}
            disabled={busy || !selected || alias.trim().length < 3}
            className="btn btn-guava w-full"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Revisando tu apodo…
              </>
            ) : (
              <>
                {chosen ? `Adoptar a ${chosen.name}` : "Adoptar mi mascota"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
      {loginOpen && (
        <AccountModal
          initialMode="login"
          onClose={() => setLoginOpen(false)}
        />
      )}
    </div>
  );
}
