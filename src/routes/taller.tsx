import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { m as motion } from "motion/react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { POSITIVE_NOTES } from "../../config/support";
import { PositiveNotePicker } from "../components/PositiveNotePicker";
import { NotePreview } from "../components/NotePreview";
import { NoteDecor } from "../components/NoteDecor";
import { useToken } from "../lib/session";
import { errorMessage } from "../lib/errors";
import { play } from "../lib/audio";
import { cn } from "../lib/utils";

const SAMPLE = POSITIVE_NOTES[0];

type Cover = {
  id: string;
  name: string;
  description: string;
  image: string;
  cost: number;
  owned: boolean;
  selected: boolean;
};

export default function Taller() {
  const token = useToken();
  const me = useQuery(api.auth.me, { token });
  const styles = useQuery(api.noteStyles.list, { token });
  const buyCover = useMutation(api.noteStyles.buyCover);
  const selectEffect = useMutation(api.noteStyles.selectEffect).withOptimisticUpdate((store, { token, effectId }) => {
    const current = store.getQuery(api.noteStyles.list, { token });
    if (current) store.setQuery(api.noteStyles.list, { token }, {
      ...current,
      effect: effectId,
      effects: current.effects.map(effect => ({ ...effect, selected: effect.id === effectId })),
    });
  });
  const selectCover = useMutation(api.noteStyles.selectCover).withOptimisticUpdate((store, { token, coverId }) => {
    const current = store.getQuery(api.noteStyles.list, { token });
    if (current) store.setQuery(api.noteStyles.list, { token }, {
      ...current, cover: coverId,
      covers: current.covers.map(cover => ({ ...cover, selected: cover.id === coverId })),
    });
  });
  const reduceMotion = useReducedMotion();
  const [busy, setBusy] = useState<string | null>(null);
  const [sample, setSample] = useState<string>(SAMPLE);
  const [previewEffect, setPreviewEffect] = useState<string | null>(null);

  if (!styles) return null;

  const selectedCover =
    styles.covers.find((cover) => cover.selected) ?? styles.covers[0];

  async function handleCover(cover: Cover) {
    setBusy(cover.id);
    try {
      if (cover.owned) {
        await selectCover({ token, coverId: cover.id });
        play("click");
        toast.success(`Fondo ${cover.name}`);
      } else {
        const result = await buyCover({ token, coverId: cover.id });
        play("coin");
        toast.success(
          `Compraste ${cover.name} · te quedan ${result.tokens} fichas`,
        );
      }
    } catch (error) {
      play("error");
      toast.error(errorMessage(error, "No pudimos cambiar el fondo"));
    } finally {
      setBusy(null);
    }
  }

  async function changeEffect(effectId: string) {
    setBusy(effectId);
    try {
      await selectEffect({ token, effectId });
    } catch (error) {
      toast.error(errorMessage(error, "No pudimos cambiar el efecto."));
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">Taller</p>
          <h1 className="text-3xl sm:text-4xl">Tu estudio de notas</h1>
          <p className="mt-1 max-w-lg text-sm text-ink/70">
            Combina un fondo y un efecto. Todo es gratis.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-start">
        <section className="order-2 min-w-0 space-y-3 lg:order-1">
          <div className="card-tight mb-5 space-y-2 p-3">
            <PositiveNotePicker value={sample} onChange={setSample} />
          </div>
          <div className="mb-6 space-y-3">
            <p className="label flex items-center gap-2">
              Efectos
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {styles.effects.map((effect) => (
                <button
                  key={effect.id}
                  type="button"
                  aria-pressed={effect.selected}
                  disabled={Boolean(busy)}
                  onClick={() => changeEffect(effect.id)}
                  onMouseEnter={() => setPreviewEffect(effect.id)}
                  onMouseLeave={() => setPreviewEffect(null)}
                  onFocus={() => setPreviewEffect(effect.id)}
                  onBlur={() => setPreviewEffect(null)}
                  className={`tile relative overflow-hidden text-left ${effect.selected ? "bg-mist ring-2 ring-lagoon" : "bg-paper"}`}
                >
                  <div className="note-effect-swatch relative h-20 overflow-hidden border-b-2 border-ink/15" style={{ backgroundColor: effect.id === "orbita" || effect.id === "estrellas" || effect.id === "aurora" ? "#26395a" : "#fff4e0" }}>
                    <NoteDecor effectId={effect.id} preview active={previewEffect === effect.id || effect.selected} />

                  </div>
                  <span className="block px-2 pt-2 text-sm font-bold">{effect.name}</span>
                  <span className="block px-2 pb-2 pt-1 text-xs text-ink/65">
                    {effect.description}
                  </span>
                  {effect.selected && (
                    <Check className="absolute right-2 top-2 h-5 w-5 rounded-full bg-mist p-0.5 text-ink" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="label">Fondos</p>
            </div>
            <span className="text-[11px] font-semibold text-ink/50">
              Fotos para tu nota
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {styles.covers.map((cover) => {
              const affordable = styles.tokens >= cover.cost;
              const disabled =
                busy === cover.id || (!cover.owned && !affordable);

              return (
                <motion.button
                  key={cover.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleCover(cover)}
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border-2 border-ink bg-[#fffdf7] text-left shadow-[3px_3px_0_var(--color-ink)]",
                    cover.selected && "ring-4 ring-lagoon/45",
                    disabled && "opacity-60",
                  )}
                >
                  <div className="relative h-24 w-full overflow-hidden border-b-2 border-ink">
                    {cover.image ? (
                      <img
                        src={cover.image}
                        alt={cover.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#fffdf7] to-sand">
                        <span className="text-xs font-semibold text-ink/60">Solo papel</span>
                      </div>
                    )}

                    {cover.selected && (
                      <span className="absolute left-1.5 top-1.5 chip bg-lagoon text-paper">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        Puesto
                      </span>
                    )}

                    {!cover.owned && (
                      <span className="absolute right-1.5 top-1.5 chip bg-paper">
                        {cover.cost} fichas
                      </span>
                    )}
                  </div>

                  <div className="px-2 py-1.5">
                    <p className="text-xs font-bold leading-tight">
                      {cover.name}
                    </p>
                    <p className="truncate text-[10px] text-ink/55">
                      {cover.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <p className="text-[11px] leading-relaxed text-ink/55">
            El fondo y el efecto viajan con tu nota. Las notas anteriores
            conservan su diseño.
          </p>
        </section>

        <NotePreview
          body={sample || SAMPLE}
          alias={me?.alias ?? "T?"}
          coverId={styles.cover}
          effectId={styles.effect}
          coverName={selectedCover.name}
        />
      </div>
    </div>
  );
}
