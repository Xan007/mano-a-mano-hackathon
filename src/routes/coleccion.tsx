import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import { ArrowUpRight, BookOpen, ChevronDown, House, Library, Mail, Send, Sparkles } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import { PLUSH_CATALOG } from "../../config/catalog";
import { RARITY_LABELS } from "../../config/game";
import { PlushVariantOverlay } from "../components/PlushVariant";
import { useCalmMotion } from "../lib/motion";
import { rarityChip, rarityText } from "../lib/game";
import { cn } from "../lib/utils";
import { useToken } from "../lib/session";
import { markCollectionSeen, useSeenState } from "../lib/notifications";

type Plush = FunctionReturnType<typeof api.plush.getMyPlushes>[number];
type Filter = "all" | Plush["status"];
const sections = [
  { id: "returned", title: "De vuelta en casa", subtitle: "Abre su libreta y descubre lo que trae.", icon: Mail },
  { id: "collection", title: "En casa", subtitle: "El próximo viaje empieza contigo.", icon: House },
  { id: "traveling", title: "De viaje", subtitle: "Cada parada, una nueva conexión.", icon: Send },
] as const;

function DisplayPlush({ item, isNew }: { item: Plush; isNew: boolean }) {
  const reduce = useCalmMotion();
  const traveling = item.status === "traveling";
  const returned = item.status === "returned";
  const notes = item.receivedNoteCount ?? 0;
  const rarity = item.catalog?.rarity ?? "comun";
  const progress = item.hopsTarget > 0 ? Math.max(0, Math.min(1, item.hopCount / item.hopsTarget)) : 0;
  const StatusIcon = traveling ? Send : returned ? Mail : House;
  return (
    <Link to={`/peluche/${item._id}`} className="group block h-full rounded-[1.1rem] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-lagoon" aria-label={`${item.catalog?.species ?? "Peluche"}, ${traveling ? "de viaje" : returned ? `regresó con ${notes} notas recibidas` : "en casa"}`}>
      <motion.article whileHover={reduce ? undefined : { y: -5 }} transition={{ type: "spring", stiffness: 330, damping: 25 }} className="flex h-full flex-col overflow-hidden rounded-[1.1rem] border-[3px] border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)]">
        <div className={cn("relative overflow-hidden border-b-2 border-ink p-2 pb-9 sm:p-3 sm:pb-10", traveling ? "bg-mist" : returned ? "bg-blush" : "bg-sand")}>
          <div className="relative overflow-hidden rounded-lg border-2 border-ink bg-paper">
            <img src={item.catalog?.imagePath} alt="" loading="lazy" width="320" height="320" className="aspect-square w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.045]" />
            <PlushVariantOverlay variant={item.variant} />
            {isNew && !returned && <span className="absolute right-2 top-2 rounded-full border-2 border-ink bg-mango px-2 py-0.5 text-[10px] font-extrabold">Nuevo</span>}
          </div>
          <span className={cn("absolute bottom-1.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-ink px-2 py-0.5 text-[10px] font-extrabold sm:text-xs", traveling ? "bg-mist text-lagoon" : returned ? "bg-blush text-ink" : "bg-paper text-ink")}>
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            {traveling ? "De viaje" : returned ? notes > 0 ? `${notes} ${notes === 1 ? "nota recibida" : "notas recibidas"}` : "Ya regresó" : "En casa"}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-display text-sm font-extrabold leading-tight sm:text-base">{item.catalog?.species ?? "Peluche"}</h3>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-ink/45 transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
          <div className="flex flex-wrap gap-1">
            <span className={cn("chip", rarityChip[rarity], rarityText[rarity])}>{RARITY_LABELS[rarity]}</span>
            {item.variant && <span className="text-[10px] font-bold text-plum">{item.variant === "secret" ? "Secreto" : "Brillante"}</span>}
            {(item.evolution ?? 1) > 1 && <span className="text-[10px] font-bold text-ink/65">Nivel {item.evolution}</span>}
          </div>
          {traveling ? (
            <div className="mt-auto space-y-1 pt-1">
              <div role="progressbar" aria-label="Paradas completadas" aria-valuemin={0} aria-valuemax={item.hopsTarget || 1} aria-valuenow={Math.min(item.hopCount, item.hopsTarget)} className="h-2 overflow-hidden rounded-full border border-ink bg-paper">
                <motion.div initial={false} animate={{ scaleX: progress }} transition={{ duration: reduce ? 0 : 0.5 }} className="h-full origin-left rounded-full bg-lagoon" />
              </div>
              <p className="text-[11px] text-ink/65">{item.waitingSince ? "Buscando su próxima parada" : `${item.hopCount} de ${item.hopsTarget} paradas`}</p>
            </div>
          ) : returned ? <p className="mt-auto flex items-center gap-1 pt-1 text-xs font-semibold text-ink/70"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" />Ver libreta</p> : null}
        </div>
      </motion.article>
    </Link>
  );
}

export default function Coleccion() {
  const token = useToken();
  const plushes = useQuery(api.plush.getMyPlushes, { token });
  const seen = useSeenState();
  const [firstSeen] = useState(seen.collection);
  const [filter, setFilter] = useState<Filter>("all");
  const reduce = useCalmMotion();
  useEffect(() => {
    if (plushes?.length) markCollectionSeen(Math.max(...plushes.map(item => item.createdAt)));
  }, [plushes]);
  const items = plushes ?? [];
  const discovered = new Set(items.map(item => item.catalog?.slug));
  const missing = PLUSH_CATALOG.filter(entry => !discovered.has(entry.slug));
  const total = PLUSH_CATALOG.length;
  const found = total - missing.length;
  const homeCount = items.filter(item => item.status === "collection").length;
  const filters = [
    { id: "all", label: "Todos", icon: Library, count: items.length },
    ...sections.map(section => ({ id: section.id, label: section.id === "returned" ? "Volvieron" : section.title, icon: section.icon, count: items.filter(item => item.status === section.id).length })),
  ] as const;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl">Mi colección</h1>
          <p className="mt-1 text-sm text-ink/70">Tus peluches, sus viajes y sus notas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {homeCount > 0 && <Link to="/enviar" className="btn btn-guava"><Send className="h-4 w-4" aria-hidden="true" />Enviar un peluche</Link>}
          <Link to="/mapa" className="btn btn-mango"><Sparkles className="h-4 w-4" aria-hidden="true" />Rescatar un peluche</Link>
        </div>
      </header>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-sand px-4 py-4 sm:px-6">
          <h2 className="text-lg">Tus peluches</h2>
          <div className="min-w-28">
            <p className="mb-1.5 text-right text-xs font-bold">{plushes === undefined ? "…" : found} / {total} especies</p>
            <div className="h-2 overflow-hidden rounded-full border border-ink bg-paper"><div className="h-full rounded-full bg-lagoon transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${found / total * 100}%` }} /></div>
          </div>
        </div>
        <div className="p-3 sm:p-6">
          <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label="Filtrar colección">
            {filters.map(({ id, label, icon: Icon, count }) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={cn("btn min-h-11 justify-center text-xs", filter === id ? "btn-ink" : "bg-paper text-ink")}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}<span className={cn("rounded-md px-1.5 py-0.5 tabular-nums", filter === id ? "bg-white/15" : "bg-ink/5")}>{count}</span></button>)}
          </div>
          {plushes === undefined ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-label="Cargando colección" role="status">{[0,1,2,3].map(i => <div key={i} className="aspect-[3/4] rounded-2xl bg-ink/5 motion-safe:animate-pulse" />)}</div> : (
            <div className="space-y-8">
              {sections.filter(section => filter === "all" || filter === section.id).map(section => {
                const group = items.filter(item => item.status === section.id);
                if (!group.length) return null;
                const Icon = section.icon;
                return <section key={section.id} aria-labelledby={`collection-${section.id}`}>
                  <div className="mb-4 flex items-center gap-3">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]", section.id === "returned" ? "bg-blush" : section.id === "traveling" ? "bg-mist" : "bg-sand")}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                    <div><h2 id={`collection-${section.id}`} className="text-base">{section.title} <span className="ml-1 font-sans text-xs font-normal text-ink/55">{group.length}</span></h2><p className="text-xs text-ink/65">{section.subtitle}</p></div>
                  </div>
                  <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
                    {group.map(item => <DisplayPlush key={item._id} item={item} isNew={item.createdAt > firstSeen} />)}
                  </motion.div>
                </section>;
              })}
              {!items.some(item => filter === "all" || item.status === filter) && <div className="py-10 text-center"><House className="mx-auto mb-3 h-8 w-8 text-lagoon" aria-hidden="true" /><h2 className="text-lg">{items.length ? "Todavía no hay peluches aquí" : "Un lugar para tu primer peluche"}</h2><p className="mx-auto mt-2 max-w-xs text-sm text-ink/65">{filter === "traveling" ? "Envía uno desde el botón de arriba." : filter === "returned" ? "Aquí aparecerán cuando termine su viaje." : "Rescata un compañero en el mapa para empezar."}</p></div>}
            </div>
          )}
        </div>
      </div>
      {plushes !== undefined && missing.length > 0 && <details className="card group p-4 sm:p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden"><div><h2 className="text-base">Por descubrir</h2><p className="mt-0.5 text-xs text-ink/65">{missing.length} especies te esperan en el mapa.</p></div><ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">{missing.map(entry => <div key={entry.slug} className="text-center"><img src={entry.imagePath} alt="" loading="lazy" width="160" height="160" className="aspect-square w-full rounded-xl border-2 border-ink object-cover opacity-60 grayscale" /><p className="mt-2 text-[11px] font-semibold leading-tight">{entry.species}</p></div>)}</div>
      </details>}
    </div>
  );
}
