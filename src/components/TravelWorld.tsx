import { useId, useRef, useState, type CSSProperties } from "react";
import { useInView } from "motion/react";
import { Link } from "react-router";
import { ArrowUpRight, Send } from "lucide-react";
import { PlushArt } from "./PlushArt";

type Traveler = {
  _id: string;
  hopCount: number;
  hopsTarget: number;
  currentHop?: number | null;
  currentHolderNpc?: boolean | null;
  waitingSince?: number;
  catalog: { imagePath: string; species: string } | null;
};

// Stable paths keep existing travelers in place when another one departs or returns.
function orbitFor(id: string) {
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return { phase: hash % 360, lane: Math.floor(hash / 360) % 3 };
}

function Earth() {
  const id = useId();
  return (
    <svg viewBox="0 0 200 200" className="travel-earth" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-clip`}><circle cx="100" cy="100" r="94" /></clipPath>
        <radialGradient id={`${id}-sea`} cx="30%" cy="25%" r="80%">
          <stop stopColor="#74dce0" /><stop offset=".5" stopColor="#298caf" /><stop offset="1" stopColor="#1d456d" />
        </radialGradient>
        <radialGradient id={`${id}-shade`} cx="32%" cy="28%" r="74%">
          <stop offset=".35" stopColor="#d6ffed" stopOpacity="0" />
          <stop offset=".8" stopColor="#0b2347" stopOpacity=".18" />
          <stop offset="1" stopColor="#061a35" stopOpacity=".7" />
        </radialGradient>
        <g id={`${id}-land`}>
          <path d="M20 36 34 20 61 15 80 29 79 43 65 50 61 62 49 66 47 78 37 72 29 55 17 48ZM53 79 65 84 73 96 69 105 59 97ZM74 100 91 106 103 121 98 139 86 153 81 171 72 178 68 155 60 139 63 117Z" />
          <path d="M92 10 109 8 118 20 109 35 96 30ZM150 42 163 29 178 29 188 38 183 48 164 54 157 66 145 61ZM167 68 189 61 210 73 217 93 206 106 198 132 184 148 176 141 170 121 158 104 157 84Z" />
          <path d="M182 29 210 17 246 23 265 16 290 34 310 38 323 57 307 65 292 57 280 74 266 78 257 95 246 91 234 73 225 71 218 89 205 74 188 67 190 49 180 43ZM260 100 276 104 283 119 298 124 303 135 286 137 273 123ZM296 145 313 138 335 150 340 170 324 180 302 174 290 160ZM345 183 352 175 355 184 348 192Z" />
        </g>
      </defs>
      <circle cx="100" cy="100" r="97" fill="#8ce2dd" opacity=".2" />
      <circle cx="100" cy="100" r="94" fill={`url(#${id}-sea)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <g className="travel-land" fill="#a7e4b1" stroke="#d3f1b5" strokeWidth=".8" strokeLinejoin="round">
          <use href={`#${id}-land`} /><use href={`#${id}-land`} x="360" />
        </g>
        <g fill="none" stroke="#ddffff" strokeWidth=".6" opacity=".17">
          <ellipse cx="100" cy="100" rx="48" ry="94" /><ellipse cx="100" cy="100" rx="78" ry="94" />
          <ellipse cx="100" cy="100" rx="94" ry="29" /><ellipse cx="100" cy="100" rx="94" ry="65" />
          <path d="M6 100h188M100 6v188" />
        </g>
        <circle cx="100" cy="100" r="94" fill={`url(#${id}-shade)`} />
        <path d="M32 66c12-23 34-37 58-40" fill="none" stroke="#e5ffff" strokeWidth="6" opacity=".3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function TravelWorld({ travelers, returnedCount = 0, readyCount = 0, loading = false }: {
  travelers: Traveler[];
  returnedCount?: number;
  readyCount?: number;
  loading?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { margin: "80px" });
  const [active, setActive] = useState<string | null>(null);
  return (
    <section ref={ref} className="card travel-world overflow-hidden" aria-labelledby="travel-world-title"
      style={{ "--world-play": visible ? "running" : "paused" } as CSSProperties}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
        <div><p className="label">De mano en mano</p><h2 id="travel-world-title" className="mt-1 text-2xl">Tus peluches en camino</h2></div>
        <span className="inline-flex items-center gap-2 rounded-full bg-mist px-3 py-2 text-xs font-bold"><Send className="h-3.5 w-3.5" aria-hidden="true" />{loading ? "Comprobando viajes…" : `${travelers.length} de viaje`}</span>
      </header>
      <div className="travel-world-layout">
        <div className="travel-space" aria-hidden="true" data-testid="travel-world-scene">
          <div className="travel-universe">
            {Array.from({ length: 16 }, (_, i) => <span key={i} className="travel-star" style={{left:`${6 + (i * 31) % 88}%`,top:`${7 + (i * 19) % 85}%`,opacity:.2 + (i % 4) * .15}} />)}
            <span className="travel-orbit-line travel-orbit-inner" /><span className="travel-orbit-line travel-orbit-middle" /><span className="travel-orbit-line travel-orbit-outer" />
            <div className="travel-earth-halo" /><Earth />
            {travelers.map((item) => {
              const { lane, phase } = orbitFor(item._id);
              return <div key={item._id} className="travel-orbit-wheel" data-traveler={item._id}
                style={{"--orbit-size":`${64 + lane * 13}%`,"--orbit-phase":`${phase}deg`,"--orbit-duration":`${30 + lane * 9}s`} as CSSProperties}>
                <div className="travel-orbit-position"><div className={`travel-orbit-counter${active === item._id ? " is-active" : ""}`}>
                  <PlushArt imagePath={item.catalog?.imagePath} alt="" className="travel-orbit-photo" blend={false} />
                </div></div>
              </div>;
            })}
          </div>
          <div className="travel-space-caption"><span className="travel-live-dot" />{travelers.length ? "Palabras que siguen viajando" : "Un mundo de palabras por compartir"}</div>
        </div>
        {travelers.length === 0 ? (
          <div className="flex flex-col items-start justify-center gap-4 p-5 sm:p-7" role="status">
            <h3 className="text-2xl">{loading ? "Buscando tus viajeros…" : "Ahora no hay peluches de viaje"}</h3>
            {!loading && <>
              <p className="text-sm leading-relaxed text-ink/75">
                {returnedCount > 0
                  ? `${returnedCount === 1 ? "Un peluche ya regresó" : `${returnedCount} peluches ya regresaron`}. Sus notas te esperan en la colección.`
                  : "Cuando envíes un peluche, aparecerá aquí alrededor de la Tierra."}
              </p>
              <Link to={returnedCount ? "/coleccion" : readyCount ? "/enviar" : "/mapa"} className="btn btn-ink">
                {returnedCount ? "Leer las notas" : readyCount ? "Enviar un peluche" : "Rescatar un peluche"}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {returnedCount > 0 && readyCount > 0 && <Link to="/enviar" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold underline"><Send className="h-4 w-4" aria-hidden="true" />Enviar un peluche</Link>}
            </>}
          </div>
        ) : (
        <ul className="travel-manifest" aria-label="Progreso de tus peluches en viaje">
          {travelers.map(item => {
            const stops = item.waitingSince !== undefined ? item.hopCount : item.currentHop ?? item.hopCount;
            const progress = Math.min(Math.max(stops, 0), item.hopsTarget);
            const percent = item.hopsTarget > 0 ? progress / item.hopsTarget * 100 : 0;
            const name = item.catalog?.species ?? "Peluche";
            return <li key={item._id}>
              <Link to={`/peluche/${item._id}`} className="travel-manifest-row" onMouseEnter={()=>setActive(item._id)} onMouseLeave={()=>setActive(null)} onFocus={()=>setActive(item._id)} onBlur={()=>setActive(null)}>
                <PlushArt imagePath={item.catalog?.imagePath} alt="" size="sm" className="h-14 w-14 border-ink/10" blend={false} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><h3 className="truncate text-base font-bold">{name}</h3><ArrowUpRight className="h-4 w-4 shrink-0 text-ink/55" aria-hidden="true" /></div>
                  <p className="mt-1 text-xs text-ink/65">{item.waitingSince !== undefined ? `Buscando parada · ${progress}/${item.hopsTarget}` : `Parada ${progress}/${item.hopsTarget} · ${item.currentHolderNpc === true ? "personaje" : item.currentHolderNpc === false ? "persona" : "en tránsito"}`}</p>
                  <div className="travel-progress" role="progressbar" aria-label={`Viaje de ${name}`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={item.hopsTarget}>
                    <span style={{width:`${percent}%`}} />
                  </div>
                </div>
              </Link>
            </li>;
          })}
        </ul>
        )}
      </div>
    </section>
  );
}
