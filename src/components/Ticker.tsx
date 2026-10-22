import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

const items = [
  "Para mí y para acompañar",
  "Historias ficticias, palabras amables",
  "Tu compañero se queda contigo",
  "Los peluches llevan notas de mano en mano",
  "Opciones de apoyo sin cuenta ni fichas",
];

export function Ticker({
  framed = true,
  className,
}: {
  framed?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const loop = [...items, ...items];

  return (
    <div
      className={cn(
        "overflow-hidden bg-ink py-2 text-paper",
        framed && "border-y-2 border-ink",
        className
      )}
      aria-label="Servicios y datos del juego"
    >
      <motion.div
        className="flex w-max items-center gap-10 whitespace-nowrap px-6 text-[11px] font-bold uppercase tracking-[0.2em]"
        animate={reduceMotion ? { x: 0, y: 0, rotate: 0, scale: 1 } : { x: ["0%", "-50%"] }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-10">
            {item}
            <span className="h-1.5 w-1.5 rounded-full bg-mango" aria-hidden="true" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
