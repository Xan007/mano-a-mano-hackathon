import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { m as motion, useInView } from "motion/react";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { noteAppearance } from "../../config/noteAppearance";
import { Heart, Flag } from "lucide-react";
import { coverById } from "../../config/covers";
import { NoteDecor } from "./NoteDecor";
import { NoteAtmosphere } from "./NoteAtmosphere";
import { cn } from "../lib/utils";

export const NOTE_THEMES_UI = {
  papel: {
    name: "Papel",
    surface: "bg-[#fffdf7] text-ink",
    border: "border-ink",
  },
  noche: {
    name: "Noche llanera",
    surface: "bg-[#26395a] text-[#f6efdf]",
    border: "border-[#0d1727]",
  },
  menta: {
    name: "Menta",
    surface: "bg-[#d7efdc] text-[#14351f]",
    border: "border-[#14351f]",
  },
  oro: {
    name: "Oro",
    surface: "bg-[#f7dfa5] text-[#3f2d07]",
    border: "border-[#6b4d0d]",
  },
} as const;

export type NoteThemeId = keyof typeof NOTE_THEMES_UI;

export function noteTheme(themeId?: string | null) {
  if (themeId && themeId in NOTE_THEMES_UI) {
    return NOTE_THEMES_UI[themeId as NoteThemeId];
  }
  return NOTE_THEMES_UI.papel;
}

function NoteFooter({
  alias,
  onReport,
  footer,
  likes,
  liked,
  onLike,
  actions,
}: {
  alias?: string | null;
  onReport?: () => void;
  footer?: ReactNode;
  likes?: number;
  liked?: boolean;
  onLike?: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
      <span className="truncate">{alias || "Alguien"}</span>
      <div className="note-footer-actions flex shrink-0 items-center gap-1">
        {footer}
        {actions}
        {onLike && (
          <button
            type="button"
            onClick={onLike}
            aria-pressed={Boolean(liked)}
            aria-label={liked ? "Quitar corazón" : "Dar corazón"}
            className={cn(
              "inline-flex min-h-11 items-center gap-1 rounded-full px-2 transition-colors",
              liked
                ? "border-guava/60 bg-guava/15 text-guava"
                : "border-current/20 text-current opacity-70 hover:opacity-100",
            )}
          >
            <Heart
              className={cn("h-3.5 w-3.5", liked && "fill-current")}
              aria-hidden="true"
            />
            <span className="tabular-nums">{likes ?? 0}</span>
          </button>
        )}
        {onReport && (
          <button
            type="button"
            onClick={onReport}
            aria-label="Reportar nota"
            title="Reportar nota"
            className="grid h-11 w-11 place-items-center rounded-full opacity-70 transition-opacity hover:opacity-100"
          >
            <Flag className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export function NoteCard({
  body,
  alias,
  themeId,
  coverId,
  effectId,
  tilt = 0,
  compact = false,
  hideAuthor = false,
  onReport,
  likes,
  liked,
  onLike,
  className,
  footer,
  badge,
  actions,
}: {
  body: string;
  alias?: string | null;
  themeId?: string | null;
  coverId?: string | null;
  effectId?: string | null;
  tilt?: number;
  compact?: boolean;
  hideAuthor?: boolean;
  onReport?: () => void;
  likes?: number;
  liked?: boolean;
  onLike?: () => void;
  className?: string;
  footer?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const card = useRef<HTMLElement>(null);
  const visible = useInView(card, { margin: "40px" });
  const cover = coverById(coverId);
  const hasCover = cover.id !== "ninguno";

  if (hasCover) {
    const appearance = noteAppearance(cover.id);
    return (
      <motion.article
        ref={card}
        className={cn(
          "note-cover relative isolate flex flex-col overflow-hidden rounded-[0.9rem] border-2 border-ink shadow-[3px_3px_0_var(--color-ink)]",
          compact ? "p-3" : "p-4",
          className,
        )}
        layout="position"
        exit={{ opacity: 0, scale: 0.96 }}
        style={
          {
            rotate: `${tilt}deg`,
            backgroundColor: appearance.paper,
            color: appearance.ink,
            "--note-paper": appearance.paper,
            "--note-accent": appearance.accent,
            "--note-play": visible && !reduceMotion ? "running" : "paused",
          } as CSSProperties
        }
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="note-cover-scene" aria-hidden="true">
          <img
            key={cover.id}
            src={cover.image}
            alt=""
            loading="lazy"
            className="note-cover-image"
          />
          <span className="note-cover-light" />
        </div>
        {effectId == null && visible && <NoteAtmosphere motion={cover.motion} />}
        <NoteDecor effectId={effectId} />

        <div className="relative z-10 flex flex-1 flex-col justify-between gap-2">
          <p
            className={cn(
              "note-cover-copy break-words leading-relaxed",
              compact ? "text-[13px]" : "text-sm",
            )}
          >
            {body}
          </p>
          {badge}
          {!hideAuthor && (
            <NoteFooter
              alias={alias}
              onReport={onReport}
              footer={footer}
              likes={likes}
              liked={liked}
              onLike={onLike}
              actions={actions}
            />
          )}
        </div>
      </motion.article>
    );
  }

  const theme = noteTheme(themeId);

  return (
    <motion.article
      ref={card}
      className={cn(
        "relative isolate overflow-hidden rounded-[0.9rem] border-2 p-3 shadow-[3px_3px_0_var(--color-ink)]",
        theme.surface,
        theme.border,
        compact ? "text-[13px]" : "text-sm",
        className,
      )}
      layout="position"
      exit={{ opacity: 0, scale: 0.96 }}
      style={{ rotate: tilt }}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <NoteDecor effectId={effectId} />
      <p className="relative z-10 break-words leading-relaxed">{body}</p>
      {badge && <div className="relative z-10 mt-2">{badge}</div>}
      {!hideAuthor && (
        <div className="relative z-10 mt-2">
          <NoteFooter
            alias={alias}
            onReport={onReport}
            footer={footer}
            likes={likes}
            liked={liked}
            onLike={onLike}
            actions={actions}
          />
        </div>
      )}
    </motion.article>
  );
}

export function NoteGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-3 sm:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
