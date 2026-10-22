import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Modal } from "./Modal";
import {
  animate,
  useMotionValue,
  useTransform,
  AnimatePresence,
  m as motion,
} from "motion/react";
import { Check, Feather, Loader2, Send } from "lucide-react";
import { NoteConfirmation } from "./NoteConfirmation";
import {
  TravelCancelled,
  TravelContext,
  type TravelRequest,
} from "../lib/travel";
import { useCalmMotion } from "../lib/motion";
import { AnimatedText } from "./AnimatedText";
import { play } from "../lib/audio";

type Flight = TravelRequest & { phase: "reviewing" | "flying" };

function routePoint(progress: number) {
  const second = progress > 0.55;
  const t = second ? (progress - 0.55) / 0.45 : progress / 0.55;
  const points = second
    ? [
        [330, 120],
        [410, -20],
        [460, 50],
        [520, 65],
      ]
    : [
        [80, 220],
        [160, 50],
        [250, 260],
        [330, 120],
      ];
  const u = 1 - t;
  return {
    x:
      u * u * u * points[0][0] +
      3 * u * u * t * points[1][0] +
      3 * u * t * t * points[2][0] +
      t * t * t * points[3][0],
    y:
      u * u * u * points[0][1] +
      3 * u * u * t * points[1][1] +
      3 * u * t * t * points[2][1] +
      t * t * t * points[3][1],
  };
}

function Departure({
  flight,
  onFinish,
}: {
  flight: Flight;
  onFinish: () => void;
}) {
  const reduce = useCalmMotion();
  const ready = flight.phase === "flying";
  const progress = useMotionValue(0);
  const x = useTransform(progress, (value) => routePoint(value).x);
  const y = useTransform(progress, (value) => routePoint(value).y);
  useEffect(() => {
    if (!ready) return;
    const animation = animate(progress, 1, {
      duration: reduce ? 0 : 2.6,
      ease: [0.18, 0.05, 0.25, 1],
    });
    const timer = window.setTimeout(onFinish, reduce ? 350 : 3300);
    return () => {
      animation.stop();
      window.clearTimeout(timer);
    };
  }, [ready, reduce, onFinish, progress]);
  return (
    <Modal
      labelledBy="departure-title"
      onClose={() => (ready ? onFinish() : undefined)}
      className="w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-[2rem] border-2 border-ink bg-paper p-0 text-ink shadow-[8px_8px_0_var(--color-ink)]"
    >
      <div className="relative overflow-hidden bg-mango px-5 pb-6 pt-6 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="label">De mano en mano</p>
          <span className="chip bg-paper">
            {ready ? "Envío confirmado" : "Antes de partir"}
          </span>
        </div>
        <div role="status" aria-live="polite" className="mt-4 h-28">
          <h2 id="departure-title" className="text-3xl sm:text-4xl">
            {ready ? <AnimatedText text="¡Buen viaje!" /> : "Listo para partir"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            {ready
              ? `${flight.name} salió de viaje con tu gesto de compañía.`
              : flight.hasNote === false
                ? "Preparando la siguiente parada."
                : "Revisando tu nota para partir."}
          </p>
        </div>
        <div className="relative mt-2 aspect-[2/1] w-full" aria-hidden="true">
          <svg
            viewBox="0 0 600 300"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <defs>
              <clipPath id="travel-photo-clip">
                <circle r="46" />
              </clipPath>
            </defs>
            <circle
              cx="485"
              cy="65"
              r="40"
              fill="var(--color-paper)"
              opacity=".6"
            />
            <path
              d="M0 270 Q160 195 300 270 T620 245 V320 H0Z"
              fill="var(--color-lagoon)"
              opacity=".18"
            />
            <path
              d="M0 290 Q180 245 340 290 T620 260"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="2"
              opacity=".2"
            />
            <path
              d="M80 220 C160 50 250 260 330 120 S460 50 520 65"
              fill="none"
              stroke="var(--color-ink)"
              strokeDasharray="5 8"
              strokeWidth="3"
              opacity=".22"
            />
            {ready && (
              <motion.path
                d="M80 220 C160 50 250 260 330 120 S460 50 520 65"
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.1, ease: "easeInOut" }}
              />
            )}
            {[
              { x: 80, y: 220 },
              { x: 330, y: 120 },
              { x: 520, y: 65 },
            ].map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="11"
                  fill="var(--color-paper)"
                  stroke="var(--color-ink)"
                  strokeWidth="2"
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="var(--color-guava)"
                />
              </g>
            ))}
            <motion.g data-testid="travel-plush" style={{ x, y }}>
              <ellipse
                cx="0"
                cy="52"
                rx="43"
                ry="8"
                fill="var(--color-ink)"
                opacity=".13"
              />
              <circle
                r="49"
                fill="var(--color-paper)"
                stroke="var(--color-ink)"
                strokeWidth="3"
              />
              {flight.imagePath && (
                <image
                  href={flight.imagePath}
                  x="-43"
                  y="-43"
                  width="86"
                  height="86"
                  preserveAspectRatio="xMidYMid meet"
                  clipPath="url(#travel-photo-clip)"
                  style={{ mixBlendMode: "multiply" }}
                />
              )}
              <g transform="translate(30 25) rotate(-12)">
                <rect
                  x="-15"
                  y="-12"
                  width="32"
                  height="26"
                  rx="5"
                  fill="var(--color-mist)"
                  stroke="var(--color-ink)"
                  strokeWidth="2"
                />
                <path
                  d="M-10 -5 L2 4 L13 -5"
                  fill="none"
                  stroke="var(--color-ink)"
                  strokeWidth="2"
                />
              </g>
            </motion.g>
            {ready &&
              [0, 1, 2, 3, 4, 5].map((index) => (
                <motion.circle
                  key={index}
                  cx={470 + index * 12}
                  cy={55 + (index % 2) * 15}
                  r="3"
                  fill={index % 2 ? "var(--color-plum)" : "var(--color-guava)"}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: [0, 1, 0], scale: [0, 1.4, 0], y: [0, -25] }
                  }
                  transition={{ delay: 1.8 + index * 0.06, duration: 0.7 }}
                />
              ))}
          </svg>
          {!ready && (
            <div className="absolute right-[12%] top-[23%] rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
              <Feather className="h-7 w-7" />
            </div>
          )}
        </div>
      </div>
      <div className="flex h-32 flex-wrap items-center justify-between gap-3 p-5">
        <p className="flex items-center gap-2 text-sm font-bold">
          {ready ? (
            <Check className="h-5 w-5 text-lagoon" aria-hidden="true" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          )}
          {ready
            ? "Puedes seguir el viaje en tu colección."
            : "Revisando antes de enviar"}
        </p>
        {ready && (
          <button type="button" onClick={onFinish} className="btn btn-ink">
            Continuar
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </Modal>
  );
}

export function TravelExperience({ children }: { children: ReactNode }) {
  const [confirmation, setConfirmation] = useState<TravelRequest | null>(null);
  const decision = useRef<((confirmed: boolean) => void) | null>(null);
  const decide = useCallback((confirmed: boolean) => {
    decision.current?.(confirmed);
    decision.current = null;
    setConfirmation(null);
  }, []);
  const [flight, setFlight] = useState<Flight | null>(null);
  const completion = useRef<(() => void) | null>(null);
  const locked = useRef(false);
  const finish = useCallback(() => {
    completion.current?.();
    completion.current = null;
    setFlight(null);
  }, []);
  const run = useCallback(
    async <T,>(
      request: TravelRequest,
      submit: () => Promise<T>,
    ): Promise<T> => {
      if (locked.current)
        throw new Error("Ya hay un peluche preparando su viaje.");
      locked.current = true;
      try {
        if (request.hasNote !== false) {
          const accepted = await new Promise<boolean>((resolve) => {
            decision.current = resolve;
            setConfirmation(request);
          });
          if (!accepted) throw new TravelCancelled();
        }
        setFlight({ ...request, phase: "reviewing" });
        const result = await submit();
        play("pass");
        await new Promise<void>((resolve) => {
          completion.current = resolve;
          setFlight({ ...request, phase: "flying" });
        });
        return result;
      } finally {
        locked.current = false;
        setFlight(null);
      }
    },
    [],
  );
  return (
    <TravelContext.Provider value={run}>
      {children}
      {confirmation && (
        <NoteConfirmation note={confirmation.note} onDecision={decide} />
      )}
      <AnimatePresence>
        {flight && <Departure flight={flight} onFinish={finish} />}
      </AnimatePresence>
    </TravelContext.Provider>
  );
}
