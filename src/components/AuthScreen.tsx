import { AccountModal } from "./AccountAccess";
import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { Link } from "react-router";
import { useState } from "react";
import { errorMessage } from "../lib/errors";
import { useMutation } from "convex/react";
import { m as motion } from "motion/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../lib/session";
import { play } from "../lib/audio";
import { Brand, SunDisc } from "./Brand";
import { PlushArt } from "./PlushArt";
import { Ticker } from "./Ticker";
import { cn } from "../lib/utils";

const heroPlush = [
  {
    src: "/plush/charapa.webp",
    alt: "Peluche de tortuga charapa",
    size: "sm",
    rotate: -8,
    delay: 0.18,
  },
  {
    src: "/plush/chiguiro.webp",
    alt: "Peluche de chigüiro",
    size: "lg",
    rotate: 0,
    delay: 0.08,
  },
  {
    src: "/plush/delfin-rosado.webp",
    alt: "Peluche de delfín rosado",
    size: "sm",
    rotate: 8,
    delay: 0.26,
  },
] as const;

export function AuthScreen() {
  const { start } = useSession();
  const createDemo = useMutation(api.auth.createGuest);
  const reduceMotion = useReducedMotion();
  const [accountOpen, setAccountOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function enterDemo() {
    setBusy(true);
    setError(null);
    try {
      const result = await createDemo({});
      start(result.token);
      play("success");
    } catch (caught) {
      setError(
        errorMessage(
          caught,
          "No pudimos abrir tu recorrido. Intenta de nuevo.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-10 pt-5 sm:px-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:py-4">
        <section className="relative">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Brand />
          </motion.div>

          <div className="mt-4 space-y-3 lg:mt-4">
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.05,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="chip bg-mango"
            >
              Hackathon Villavicencio 2026
            </motion.span>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.05,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-balance text-[2.2rem] leading-[0.94] sm:text-5xl lg:text-[3.55rem]"
            >
              Un peluche que viaja.
              <br />
              <span className="text-guava">Una nota que acompaña.</span>
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="max-w-md text-sm leading-relaxed text-ink/80 sm:text-base"
            >
              Explora historias para ti y para acompañar a otros. Rescata
              peluches, envía notas positivas y conoce opciones de apoyo en
              Villavicencio.
            </motion.p>
          </div>

          <Link to="/apoyo" className="btn btn-ink relative z-10 mt-5 lg:mt-4">
            Ver opciones de apoyo sin cuenta
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <div className="relative mt-1 h-40 sm:h-48 lg:h-44">
            <motion.div
              initial={
                reduceMotion ? false : { opacity: 0, scale: 0.75, rotate: -12 }
              }
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 14 }}
              className="absolute inset-x-0 top-0 flex justify-center"
            >
              <motion.div
                animate={
                  reduceMotion
                    ? { x: 0, y: 0, rotate: 0, scale: 1 }
                    : { scale: [1, 1.03, 1] }
                }
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <SunDisc className="h-40 w-40 sm:h-48 sm:w-48 lg:h-44 lg:w-44" />
              </motion.div>
            </motion.div>

            <div className="absolute inset-x-0 top-6 flex items-end justify-center gap-0.5 sm:top-8 sm:gap-2 lg:top-4">
              {heroPlush.map((plush, index) => (
                <motion.div
                  key={plush.src}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: 24, rotate: plush.rotate * 2 }
                  }
                  animate={{ opacity: 1, y: 0, rotate: plush.rotate }}
                  transition={{
                    delay: plush.delay,
                    type: "spring",
                    stiffness: 140,
                    damping: 16,
                  }}
                  className="relative"
                >
                  <motion.div
                    animate={
                      reduceMotion
                        ? { x: 0, y: 0, rotate: 0, scale: 1 }
                        : { y: [0, -6, 0] }
                    }
                    transition={{
                      duration: 9 + index * 1.5,
                      delay: 1 + index * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <PlushArt
                      imagePath={plush.src}
                      alt={plush.alt}
                      size={plush.size}
                      className={cn(
                        "bg-paper",
                        plush.size === "lg"
                          ? "h-20 w-20 sm:h-28 sm:w-28 lg:h-28 lg:w-28"
                          : "h-14 w-14 sm:h-20 sm:w-20 lg:h-20 lg:w-20",
                      )}
                    />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative z-10 hidden flex-wrap gap-x-5 gap-y-2 pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/55 sm:flex lg:pt-1">
            <span>Cuenta opcional</span>
            <span>Tu apodo</span>
            <span>A tu ritmo</span>
            <span>Sin ubicación</span>
          </div>
        </section>

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="card relative p-4 sm:p-6"
        >
          <p className="chip bg-mist">Hecho en Villavicencio</p>
          <h2 className="mt-4 text-3xl">Tu primer viaje empieza aquí.</h2>
          <p className="my-4 text-sm leading-relaxed text-ink/80">
            Elige tu mascota, rescata peluches y envía notas amables.
          </p>
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-blush p-3 text-sm font-semibold"
            >
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={enterDemo}
            disabled={busy}
            className="btn btn-guava w-full"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )}
            {busy ? "Preparando tu recorrido…" : "Empezar mi recorrido"}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-ink/70">
            Puedes empezar sin cuenta y guardarla después.
          </p>
          <button type="button" onClick={()=>setAccountOpen(true)} className="btn btn-ghost mt-3 w-full">Ya tengo una cuenta</button>
        </motion.section>
      </div>
      {accountOpen && <AccountModal onClose={()=>setAccountOpen(false)} />}
      <Ticker className="lg:shrink-0" />
    </div>
  );
}
