import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Sparkles, X } from "lucide-react";
import { PLUSH_CATALOG } from "../../config/catalog";
import { RARITY_LABELS, type Rarity } from "../../config/game";
import { Modal } from "./Modal";
import { useCalmMotion } from "../lib/motion";
import { play } from "../lib/audio";

type Reward = { species: string; imagePath: string; rarity: Rarity };
const DELAYS = [55, 55, 55, 55, 55, 55, 65, 70, 75, 80, 90, 110, 130, 160, 210, 280, 380, 520];
const COLORS = {
  comun: "#81d6b4",
  raro: "#8ebdf5",
  epico: "#d89bfa",
  legendario: "#ffd16f",
};
export function RescueReveal({
  reward,
  onComplete,
  onClose,
  error,
  onRetry,
}: {
  reward: Reward | null;
  onComplete: () => void;
  onClose: () => void;
  error: string;
  onRetry: () => void;
}) {
  const reduce = useCalmMotion();
  const filterId = useId();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "search" | "locked" | "color">("intro");
  const latestReward = useRef(reward);
  const complete = useRef(onComplete);
  useEffect(() => {
    latestReward.current = reward;
    complete.current = onComplete;
  }, [reward, onComplete]);
  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    let frame = 0;
    const images = PLUSH_CATALOG.map((entry) => {
      const image = new Image();
      image.src = entry.imagePath;
      return image.decode();
    });
    function tick() {
      if (stopped) return;
      if (frame >= (reduce ? 1 : DELAYS.length) && latestReward.current) {
        setPhase("locked");
        timer = window.setTimeout(() => {
          setPhase("color");
          if (latestReward.current) play(`rarity.${latestReward.current.rarity}`);
          timer = window.setTimeout(() => complete.current(), reduce ? 1200 : 1900);
        }, reduce ? 700 : 950);
        return;
      }
      if (!reduce) {
        setIndex((previous) => (previous + 5) % PLUSH_CATALOG.length);
        // Each plush change gets a soft tick; the pitch lowers as the roll slows.
        const progress = Math.min(frame / (DELAYS.length - 1), 1);
        play("click", { playbackRate: 1.16 - progress * 0.28 });
      }
      timer = window.setTimeout(tick, reduce ? 700 : DELAYS[Math.min(frame, DELAYS.length - 1)]);
      frame++;
    }
    // Keep the opening message on its own and decode the images before cycling.
    void Promise.allSettled(images).then(() => {
      if (stopped) return;
      timer = window.setTimeout(() => {
        setPhase("search");
        play("search");
        tick();
      }, reduce ? 700 : 950);
    });
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [reduce]);
  const found = (phase === "locked" || phase === "color") && reward;
  const image = found ? reward.imagePath : PLUSH_CATALOG[index].imagePath;
  const color = reward ? COLORS[reward.rarity] : "#b7c4e6";
  return (
    <Modal
      labelledBy="search-plush-title"
      onClose={onClose}
      dark
      className="rescue-search-panel relative max-h-[92dvh] w-full max-w-lg overflow-x-hidden overflow-y-auto rounded-[2rem] px-4 py-8 text-center text-paper outline-none"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar búsqueda"
        className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/5"
      >
        <X className="h-5 w-5" />
      </button>
      <h2 id="search-plush-title" className="mt-2 text-2xl sm:text-3xl">
        {phase === "intro" || phase === "search"
          ? "Buscando al peluche perdido..."
          : phase === "locked"
            ? "Aquí hay alguien…"
            : "¡Lo encontramos!"}
      </h2>
      <div
        data-testid="rescue-reveal"
        data-phase={phase}
        className="relative mx-auto mt-6 grid h-80 w-80 max-w-full place-items-center"
        aria-hidden="true"
      >
        <m.div
          className="absolute inset-4 rounded-full"
          style={{
            background: `radial-gradient(circle,${color}50,${color}12 55%,transparent 72%)`,
          }}
          animate={reduce ? undefined : { scale: [0.9, 1.06, 0.9] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        />
        {phase === "intro" && (
          <div className="rescue-search-dots"><span /><span /><span /></div>
        )}
        <svg viewBox="0 0 260 260" className="absolute inset-0 h-full w-full" style={{ opacity: phase === "intro" ? 0 : 1 }}>
          <defs>
            <filter
              id={filterId}
              x="-12%"
              y="-12%"
              width="124%"
              height="124%"
              colorInterpolationFilters="sRGB"
            >
              <feColorMatrix type="saturate" values="0" />
              <feGaussianBlur stdDeviation="3.2" />
            </filter>
            <clipPath id={`${filterId}-round`}>
              <circle cx="130" cy="130" r="112" />
            </clipPath>
          </defs>
            <clipPath id={`${filterId}-color`}>
              <m.circle cx="130" cy="130" initial={{ r: reduce ? 112 : 0 }} animate={{ r: phase === "color" ? 112 : 0 }} transition={{ duration: reduce ? 0 : 1, ease: [0.2, 0.7, 0.2, 1] }} />
            </clipPath>
          <g clipPath={`url(#${filterId}-round)`}>
            <image key={image} href={image} x="18" y="18" width="224" height="224"
              preserveAspectRatio="xMidYMid slice" filter={`url(#${filterId})`} />
            {phase === "color" && reward && (
              <image data-testid="rescue-color-image" href={reward.imagePath} x="18" y="18" width="224" height="224"
                preserveAspectRatio="xMidYMid slice" clipPath={`url(#${filterId}-color)`} />
            )}
          </g>
        </svg>
        {phase === "color" && reward && (
          <>
            {!reduce && (
              <>
                <m.span
                  className="absolute inset-8 rounded-full border-2"
                  style={{ borderColor: color }}
                  initial={{ scale: 0.1, opacity: 1 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.1 }}
                />
                {Array.from({ length: 20 }, (_, i) => (
                  <m.span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
                    data-testid="rescue-particle"
                    style={{ background: color }}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos((i * Math.PI) / 10) * (128 + (i % 3) * 12),
                      y: Math.sin((i * Math.PI) / 10) * (128 + (i % 3) * 12),
                      scale: [0, 1.5, 0.5],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1.1,
                      delay: (i % 3) * 0.04,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
      <div className="mt-4 h-16" role="status" aria-live="polite">
        <AnimatePresence>
          {phase === "color" && reward && (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-2xl font-bold">{reward.species}</p>
              <p
                className="mt-1 flex items-center justify-center gap-2 text-sm font-bold capitalize"
                style={{ color }}
              >
                <Sparkles className="h-4 w-4" />
                {RARITY_LABELS[reward.rarity]}
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <div role="alert" className="mt-3 space-y-2 text-sm">
          <p>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="btn border-white/40 bg-white/10 text-paper"
          >
            Reintentar búsqueda
          </button>
        </div>
      )}
    </Modal>
  );
}
