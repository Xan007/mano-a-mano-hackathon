import { useRef, type CSSProperties } from "react";
import { m, useInView } from "motion/react";
import { Heart, Snowflake, Sparkles, Star } from "lucide-react";
import { effectById } from "../../config/noteEffects";
import { useCalmMotion } from "../lib/motion";

export function NoteDecor({ effectId, active = true, preview = false }: { effectId?: string | null; active?: boolean; preview?: boolean }) {
  const effect = effectById(effectId);
  if (effect.id === "ninguno") return null;
  return <DecorLayer key={effect.id} effect={effect} active={active} preview={preview} />;
}

function DecorLayer({ effect, active, preview }: { effect: ReturnType<typeof effectById>; active: boolean; preview: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: "40px" });
  const reduce = useCalmMotion();
  const Icon =
    effect.id === "hielo"
      ? Snowflake
      : effect.id === "corazones"
        ? Heart
        : effect.id === "brillos"
          ? Sparkles
          : Star;
  const count =
    effect.id === "aurora"
      ? 3
      : effect.id === "estrellas"
        ? 5
        : effect.id === "fuego" ||
            effect.id === "lluvia" ||
            effect.id === "hielo"
          ? 10
          : 8;
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.35 }}
      ref={ref}
      className={`note-decor decor-${effect.id}${preview ? " decor-preview" : ""}`}
      data-note-effect={effect.id}
      style={
        {
          "--decor-color": effect.color,
          "--decor-play": visible && active && !reduce ? "running" : "paused",
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <span className="decor-halo" />
      <span className="decor-sheen" />
      {effect.id === "orbita" && <div className="decor-solar-system">
        <span className="decor-planet" />
        <span className="decor-orbit"><i /></span>
        <span className="decor-orbit decor-orbit-outer"><i /></span>
      </div>}
      {effect.id === "lluvia" && <div className="decor-ripples">{[0, 1, 2].map(i => <span key={i} style={{ "--i": i } as CSSProperties} />)}</div>}
      {effect.id === "fuego" && (
        <div className="decor-flames">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
      )}
      {effect.id === "hielo" && <Snowflake className="decor-crystal" />}
      {effect.id === "estrellas" && <Star className="decor-north-star" />}

      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="decor-particle"
          style={
            {
              "--i": i,
              "--drift": `${i % 2 === 0 ? 24 : -24}px`,
              left: `${effect.id === "aurora" ? 28 + i * 20 : 8 + ((i * 13) % 86)}%`,
              top: `${12 + ((i * 23) % 72)}%`,
              animationDelay: `${-1.2 - i * 0.65}s`,
            } as CSSProperties
          }
        >
          {!["fuego", "aurora", "lluvia", "petalos", "confeti", "burbujas"].includes(effect.id) && (
            <Icon className="h-full w-full" />
          )}
        </span>
      ))}
    </m.div>
  );
}
