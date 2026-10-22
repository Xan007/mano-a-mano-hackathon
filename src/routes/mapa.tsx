import { cityTerritory } from "../../config/cityMap";
import { useSearchParams } from "react-router";
import { PerspectivePicker } from "../components/PerspectivePicker";
import { journeyScene } from "../../config/journey";
import type { Perspective } from "../../config/support";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { companionById } from "../../config/catalog";
import { useToken } from "../lib/session";
import { PlacePanel, type Place } from "../components/PlacePanel";
import { PlushArt } from "../components/PlushArt";
import { cn } from "../lib/utils";
import { CityMapScene } from "../components/CityMapScene";
import { useNow } from "../lib/useNow";

function countdown(ms: number) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function Mapa() {
  const token = useToken();
  const [params, setParams] = useSearchParams();
  const perspective: Perspective =
    params.get("para") === "others" ? "others" : "self";
  const data = useQuery(api.places.list, { token });
  const me = useQuery(api.auth.me, { token });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapViewport = useRef<HTMLDivElement>(null);
  const centered = useRef(false);
  const [rescueSnapshot, setRescueSnapshot] = useState<string[]>([]);
  const now = useNow(1000);

  useEffect(() => {
    const viewport = mapViewport.current;
    const next = viewport?.querySelector<HTMLElement>("[data-next-place]");
    if (viewport && next && !centered.current) {
      centered.current = true;
      viewport.scrollLeft = next.offsetLeft - viewport.clientWidth / 2;
    }
  }, [data?.rescuedCount]);

  if (!data) return null;

  const selected = data.places.find((place) => place.id === selectedId) ?? null;
  const nextPlace =
    data.places.find((place) => !place.rescued) ?? data.places[0];
  const route = data.route;
  const last = cityTerritory(route[route.length - 1]?.id ?? "");
  const companion = companionById(me?.companion);
  const rescuedIds = data.places.filter(place => place.rescued).map(place => place.id);
  const visibleRescues = selectedId ? rescueSnapshot : rescuedIds;
  function openNextPlace() {
    setRescueSnapshot(rescuedIds);
    setSelectedId(nextPlace.id);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl">Mapa de Villavicencio</h1>
          <p className="mt-1 text-sm text-ink/70">
            Cada rescate devuelve el color a un barrio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip bg-mist" title="Paradas completadas">
            {data.rescuedCount} de {data.totalPlaces} paradas
          </span>
        </div>
      </header>

      <section className="card flex flex-wrap items-center gap-4 bg-paper p-4 sm:p-5">
        <PlushArt imagePath={companion?.imagePath} alt="" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-ink/65">
            {data.rescuedCount < data.totalPlaces
              ? "Tu próxima parada"
              : "Puedes volver cuando quieras"}
          </p>
          <h2 className="mt-1 text-2xl">{nextPlace.name}</h2>
        </div>
        <button
          data-tour="rescue"
          data-all-rescued={data.rescuedCount >= data.totalPlaces}
          type="button"
          onClick={openNextPlace}
          className="btn btn-ink w-full sm:w-auto"
        >
          {data.rescuedCount < data.totalPlaces
            ? "Rescatar un peluche"
            : "Volver a explorar"}
        </button>
      </section>
      <div className="max-w-sm">
        <PerspectivePicker
          value={perspective}
          onChange={(value) => {
            setSelectedId(null);
            setParams({ para: value });
          }}
        />
      </div>
      <section className="mx-auto w-full max-w-5xl">
        <div ref={mapViewport} data-testid="city-map" role="region" aria-label="Mapa ilustrado del recorrido" tabIndex={0} className="relative w-full overflow-x-auto overscroll-x-contain rounded-2xl bg-mist">
          <div data-testid="city-map-canvas" className="relative isolate aspect-[2/1] w-full min-w-[800px]">
          <CityMapScene rescued={visibleRescues} nextId={nextPlace.rescued ? undefined : nextPlace.id} />

          {last && (
            <div
              className="pointer-events-none absolute z-[15] -translate-x-1/2 translate-y-2"
              style={{ left: `${last.x * 100}%`, top: `${last.y * 100}%` }}
            >
              <PlushArt
                imagePath={companion?.imagePath}
                alt={companion ? `Tu ${companion.name}` : "Tu mascota"}
                size="sm"
                className="h-8 w-8 border-2 bg-paper md:h-9 md:w-9"
              />
            </div>
          )}

          {data.places.map((place) => {
            const next = place.id === nextPlace.id && !place.rescued;
            const position = cityTerritory(place.id);
            return (
              <div
                key={place.id}
                data-next-place={next ? "true" : undefined}
                data-place-status={next ? "next" : place.rescued ? "visited" : place.unlocked ? "available" : "locked"}
                aria-label={`${place.name}: ${next ? "siguiente lugar" : place.rescued ? "visitado" : place.unlocked ? "disponible" : "bloqueado"}`}
                className={cn(
                  "city-map-label absolute z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border px-2 py-1 text-[10px] font-bold leading-none tracking-[0.025em] shadow-[0_1px_4px_#17233b25] backdrop-blur-sm sm:px-2.5 sm:py-1.5 sm:text-xs",
                  next && "border-ink bg-mango text-ink shadow-[0_2px_0_var(--color-ink)]",
                  place.rescued && "border-white/95 bg-[#fffaf0]/90 text-ink",
                  !next && !place.rescued && place.unlocked && "border-white/90 bg-[#fffaf0]/82 text-ink",
                  !place.unlocked && "border-white/65 bg-[#fffaf0]/60 text-ink/70",
                )}
                style={{
                  left: `clamp(2.5rem, ${(position?.ax ?? place.anchorX) * 100}%, calc(100% - 2.5rem))`,
                  top: `clamp(2.1rem, ${(position?.ay ?? place.anchorY) * 100}%, calc(100% - 2.1rem))`,
                }}
              >
                <span className="inline-flex items-center gap-2"><span>{place.name}</span>{place.rescued && place.nextRescueAt !== null && <span className="rounded-full bg-ink/10 px-1.5 py-0.5 font-mono text-[9px] tabular-nums" aria-label="Tiempo para volver a rescatar">{countdown(place.nextRescueAt - now)}</span>}</span>
              </div>
            );
          })}
          </div>
        </div>

        <p className="mt-3 text-xs text-ink/60">
          <span className="block sm:hidden">Desliza el mapa para ver la ciudad.</span>
          Mapa ilustrado del juego · Sin ubicación real.
        </p>
      </section>

      {selected && (
        <PlacePanel
          key={`${selected.id}-${perspective}`}
          perspective={perspective}
          place={
            {
              ...selected,
              story: journeyScene(selected.id, perspective)!.story,
            } as Place
          }
          token={token}
          onClose={() => setSelectedId(null)}
          onRescued={() => undefined}
        />
      )}
    </div>
  );
}
