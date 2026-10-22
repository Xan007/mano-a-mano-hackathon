import { useCalmMotion as useReducedMotion } from "../lib/motion";
import { SupportSheet } from "../components/SupportSheet";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router";
import { m as motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Heart,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { companionById } from "../../config/catalog";
import { useToken } from "../lib/session";
import { PlushArt } from "../components/PlushArt";
import { SunDisc } from "../components/Brand";
import { TravelWorld } from "../components/TravelWorld";

export default function Casa() {
  const token = useToken();
  const [supportOpen, setSupportOpen] = useState(false);
  const me = useQuery(api.auth.me, { token });
  const plushes = useQuery(api.plush.getMyPlushes, { token });
  const map = useQuery(api.places.list, { token });
  const mailbox = useQuery(api.mailbox.today, { token });
  const ensureDaily = useMutation(api.mailbox.ensureDaily);
  const reduce = useReducedMotion();
  useEffect(() => {
    ensureDaily({ token }).catch(() => undefined);
  }, [ensureDaily, token]);
  if (!me) return <p role="status">Abriendo tu casa…</p>;
  const companion = companionById(me.companion);
  const traveling =
    plushes?.filter((item) => item.status === "traveling") ?? [];
  const returned = plushes?.filter((item) => item.status === "returned") ?? [];
  const atHome = plushes?.filter((item) => item.status === "collection") ?? [];
  return (
    <div className="space-y-6">
      <section className="card relative isolate overflow-hidden bg-guava text-ink">
        <SunDisc className="world-sun pointer-events-none absolute -right-16 -top-16 h-80 w-80 opacity-30" />
        <div className="relative grid items-center gap-5 p-5 sm:grid-cols-[1fr_auto] sm:p-8">
          <div className="relative z-10 max-w-md space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-[.18em]">
              La casa de {me.alias || "tu compañero"}
            </p>
            <h1 className="text-4xl leading-[.98] sm:text-5xl">
              Un lugar para ti.
              <br />
              Un gesto para alguien.
            </h1>
            <p className="text-sm leading-relaxed">
              Tu {companion?.name ?? "compañero"} se queda contigo. Los peluches
              llevan palabras amables de mano en mano.
            </p>
            <div className="flex flex-wrap items-center gap-3">
                <Link to="/enviar" data-tour={plushes ? "send" : undefined} data-ready-count={atHome.length} className={`btn ${atHome.length ? "btn-ink" : "btn-ghost order-2"}`}>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Enviar un peluche
                </Link>
              <Link to="/mapa" data-tour={plushes && map ? "map" : undefined} className={atHome.length ? "inline-flex min-h-11 items-center gap-2 text-sm font-bold underline" : "btn btn-ink"}>
                Seguir explorando
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            {atHome.length > 0 && <p className="text-xs font-semibold">{atHome.length === 1 ? "Tienes un peluche listo" : `Tienes ${atHome.length} peluches listos`}. Elige uno y escribe su nota.</p>}
          </div>
          <div className="relative mx-auto flex h-44 w-60 items-center justify-center sm:h-60 sm:w-64">
            <span
              aria-hidden="true"
              className="absolute inset-3 rounded-full border-2 border-dashed border-ink/40"
            />
            <motion.div
              animate={
                reduce
                  ? { x: 0, y: 0, rotate: 0, scale: 1 }
                  : { y: [0, -9, 0], rotate: [-3, 2, -3] }
              }
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <PlushArt
                imagePath={companion?.imagePath}
                alt={companion?.name ?? "Tu compañero"}
                size="lg"
                className="h-36 w-36 sm:h-44 sm:w-44"
              />
            </motion.div>
            <motion.div
              aria-hidden="true"
              className="postit absolute -right-1 top-3 rotate-6 bg-mango p-3"
              animate={
                reduce
                  ? { x: 0, y: 0, rotate: 0, scale: 1 }
                  : { y: [0, -5, 0], rotate: [6, 10, 6] }
              }
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="h-6 w-6" />
            </motion.div>
            <motion.div
              aria-hidden="true"
              className="postit absolute bottom-0 left-0 -rotate-6 bg-mist p-3"
              animate={
                reduce
                  ? { x: 0, y: 0, rotate: 0, scale: 1 }
                  : { y: [0, 5, 0], rotate: [-6, -10, -6] }
              }
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Send className="h-6 w-6" />
            </motion.div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t-2 border-ink bg-mango px-5 py-3 text-xs font-bold sm:px-8">
          <span>{map?.rescuedCount ?? 0} historias exploradas</span>
          <span>{plushes?.length ?? 0} peluches en tu colección</span>
          <span>{traveling.length} de viaje</span>
        </div>
      </section>

      <TravelWorld travelers={traveling} returnedCount={returned.length} readyCount={atHome.length} loading={plushes === undefined} />

      <section
        className="grid gap-4 sm:grid-cols-2"
        aria-label="Dos formas de explorar"
      >
        {[
          {
            to: "/mapa?para=self",
            title: "Para mí",
            description: "Conoce tus opciones de apoyo.",
            Icon: Heart,
            color: "bg-mist",
          },
          {
            to: "/mapa?para=others",
            title: "Para acompañar",
            description: "Descubre cómo estar para alguien.",
            Icon: BookOpen,
            color: "bg-mango",
          },
        ].map(({ to, title, description, Icon, color }, index) => (
          <motion.div
            key={to}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={to}
              className={`tile flex h-full items-start gap-3 p-5 ${color}`}
            >
              <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
              <div className="space-y-2">
                <h2 className="text-2xl">{title}</h2>
                <p className="text-sm leading-relaxed">{description}</p>
                <span className="inline-flex items-center gap-2 text-xs font-bold">
                  Elegir una historia
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="card space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="label">De mano en mano</p>
            <h2 className="mt-1 text-2xl">¿Qué sigue en tu recorrido…</h2>
          </div>
          <Sparkles className="h-6 w-6 shrink-0" aria-hidden="true" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              to: "/mapa",
              Icon: Compass,
              title: "Descubre una historia",
              hint: "Explora y rescata un peluche.",
            },
            {
              to: "/buzon",
              Icon: Mail,
              title: mailbox ? "Hay un peluche en tu buzón" : "Visita tu buzón",
              hint: "Unas palabras te esperan.",
            },
            {
              to: atHome.length ? "/enviar" : "/coleccion",
              Icon: Send,
              title: atHome.length
                ? "Enviar un peluche"
                : returned.length
                  ? "Volvieron con notas"
                  : "Mira tu colección",
              hint: atHome.length
                ? "Elige tu peluche, escribe una nota y envíalo."
                : returned.length
                ? `${returned.length} peluches te esperan. Las notas nuevas se guardan gratis.`
                : "Cada libreta guarda las notas de su viaje.",
            },
          ].map(({ to, Icon, title, hint }) => (
            <Link key={to} to={to} className="tile space-y-3 bg-paper p-4">
              <Icon className="h-5 w-5" aria-hidden="true" />
              <h3 className="text-lg">{title}</h3>
              <p className="text-sm leading-relaxed text-ink/75">{hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => setSupportOpen(true)}
        className="tile flex w-full items-center gap-3 bg-mist p-5 text-left"
      >
        <Heart className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="flex-1 font-bold">¿Buscas apoyo?</span>
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </button>
      {supportOpen && <SupportSheet onClose={() => setSupportOpen(false)} />}
    </div>
  );
}
