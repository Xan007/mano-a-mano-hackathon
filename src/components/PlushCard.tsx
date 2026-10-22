import { useCalmMotion as useReducedMotion } from "../lib/motion";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Lock, Layers, MoonStar, Sparkles } from "lucide-react";
import { RARITY_LABELS, type Rarity } from "../../config/game";
import { rarityChip, rarityText } from "../lib/game";
import { EVOLUTION_STAGES } from "../../config/care";
import { PlushVariantOverlay } from "./PlushVariant";
import { cn } from "../lib/utils";

const strip: Record<Rarity, string> = {
  comun: "bg-lagoon",
  raro: "bg-plum",
  epico: "bg-[#b764d5]",
  legendario: "bg-mango",
};

type PlushCardProps = {
  species: string;
  imagePath?: string;
  rarity: Rarity;
  href?: string;
  locked?: boolean;
  isNew?: boolean;
  evolution?: number;
  variant?: "shiny" | "secret" | null;
  count?: number;
  footer?: ReactNode;
  className?: string;
};

export function PlushCard({
  species,
  imagePath,
  rarity,
  href,
  locked = false,
  isNew = false,
  evolution = 1,
  variant = null,
  count = 1,
  footer,
  className,
}: PlushCardProps) {
  const reduceMotion = useReducedMotion();
  const stage = Math.min(3, Math.max(1, evolution ?? 1));
  const stacked = count > 1;

  const body = (
    <motion.article
      whileHover={reduceMotion || locked ? undefined : { y: -3 }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.1rem] border-[3px] border-ink bg-[#fffdf7] shadow-[5px_5px_0_var(--color-ink)] transition-shadow",
        !locked && "hover:shadow-[8px_10px_0_var(--color-ink)]",
        variant === "secret" && "border-plum shadow-[5px_5px_0_var(--color-plum)]",
        variant === "shiny" && "border-mango shadow-[5px_5px_0_#d99b00]",
        className
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 z-10 w-2.5 border-r-2 border-ink",
          strip[rarity],
          locked && "opacity-40"
        )}
        aria-hidden="true"
      />

      <div className="relative aspect-square w-full overflow-hidden border-b-2 border-ink bg-sand">
        {imagePath ? (
          <img
            src={imagePath}
            alt={species}
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition-transform duration-500",
              !locked && "group-hover:scale-[1.04]",
              locked && "opacity-45 grayscale"
            )}
          />
        ) : null}
        <PlushVariantOverlay variant={variant} />
        {variant && !locked && (
          <span
            className={cn(
              "absolute left-3 top-2 z-20 inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide",
              variant === "secret" ? "bg-plum text-paper" : "bg-mango text-ink"
            )}
          >
            {variant === "secret" ? (
              <MoonStar className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3 w-3" aria-hidden="true" />
            )}
            {variant === "secret" ? "Secreto" : "Brillante"}
          </span>
        )}
        {isNew && !locked && (
          <span className="absolute right-2 top-2 z-20 rounded-full border-2 border-ink bg-guava px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
            Nuevo
          </span>
        )}
        {stacked && !locked && (
          <span
            className="absolute bottom-2 right-2 z-20 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-ink px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-paper"
            title={`${count} copias de este peluche`}
            aria-label={`${count} copias de este peluche`}
          >
            <Layers className="h-3 w-3" aria-hidden="true" />×{count}
          </span>
        )}
        {locked && (
          <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-paper">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 p-3 pl-4">
        <p className="font-display text-sm font-bold leading-tight">{species}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("chip", rarityChip[rarity], rarityText[rarity])}>
            {RARITY_LABELS[rarity]}
          </span>
          {stage > 1 && (
            <span className="chip bg-ink text-paper">{EVOLUTION_STAGES[stage as 1 | 2 | 3].name}</span>
          )}
          {footer}
        </div>
      </div>
    </motion.article>
  );

  const layered = stacked ? (
    <div className="relative h-full">
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-2 translate-y-2 rounded-[1.1rem] border-2 border-ink bg-sand"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-1 translate-y-1 rounded-[1.1rem] border-2 border-ink bg-paper"
      />
      {body}
    </div>
  ) : (
    body
  );

  if (href && !locked) {
    return (
      <Link to={href} className="block h-full">
        {layered}
      </Link>
    );
  }

  return layered;
}

export function Shelf({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto mt-2 h-2.5 w-[94%] rounded-[3px] border-2 border-ink bg-[linear-gradient(180deg,#d9a36a,#b9763c)] shadow-[0_3px_0_var(--color-ink)]",
        className
      )}
      aria-hidden="true"
    />
  );
}
