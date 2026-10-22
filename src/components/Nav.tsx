import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { HeartHandshake, Home, Mail, Map, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { companionById } from "../../config/catalog";
import { useSession } from "../lib/session";
import { useSeenState } from "../lib/notifications";
import { cn } from "../lib/utils";
import { Brand } from "./Brand";
import { PlushArt } from "./PlushArt";
import { PlusBadge } from "./PlusBadge";
import { DemoBanner } from "./DemoBanner";
import { SoundToggle } from "./SoundToggle";
import { play } from "../lib/audio";

const links = [
  { to: "/casa", label: "Casa", Icon: Home },
  { to: "/mapa", label: "Mapa", Icon: Map },
  { to: "/apoyo", label: "Apoyo", Icon: HeartHandshake },
  { to: "/buzon", label: "Buzón", Icon: Mail },
  { to: "/coleccion", label: "Colección", Icon: Star },
];

const mobileLinks = links;

export function Nav({
  companion,
  alias,
}: {
  companion?: string;
  alias?: string | null;
  tokens: number;
  keys: number;
  xp: number;
}) {
  const { token } = useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const header = useRef<HTMLElement>(null);
  const [supportEndVisible, setSupportEndVisible] = useState(false);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty("--app-header-height", `${entry.target.getBoundingClientRect().height}px`);
    });
    if (header.current) observer.observe(header.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (pathname !== "/apoyo") return;
    const end = document.getElementById("support-scroll-end");
    if (!end) return;
    const observer = new IntersectionObserver(([entry]) => setSupportEndVisible(entry.isIntersecting), { rootMargin: "0px 0px 140px 0px" });
    observer.observe(end);
    return () => observer.disconnect();
  }, [pathname]);
  const hideMobileDock = pathname === "/apoyo" && !supportEndVisible;
  const arrivals = useQuery(api.mailbox.arrivals, { token: token ?? "" });
  const plushes = useQuery(api.plush.getMyPlushes, { token: token ?? "" });
  const seen = useSeenState();
  const unseenMailbox = (arrivals ?? []).filter((item) => !seen.mailbox.includes(item.transitId));
  const newPlushes = (plushes ?? []).filter(
    (item) => item.createdAt > seen.collection,
  );
  const lastArrival = useRef<{ token: string; ids: Set<string> } | null>(null);

  useEffect(() => {
    if (!token || arrivals === undefined) return;
    const currentIds = new Set(arrivals.map((item) => item.transitId));
    const previous = lastArrival.current;
    if (previous?.token === token) {
      const fresh = arrivals.filter((item) => !previous.ids.has(item.transitId));
      if (fresh.length === 1) {
        toast.info(`¡${fresh[0].species} llegó a tu buzón!`, {
          description: "Sus notas ya te esperan.",
          action: { label: "Abrir buzón", onClick: () => navigate("/buzon") },
          id: `mailbox-arrival-${fresh[0].transitId}`,
        });
        play("message");
      } else if (fresh.length > 1) {
        toast.info(`¡Llegaron ${fresh.length} peluches a tu buzón!`, {
          description: "Ya puedes leer sus notas.",
          action: { label: "Abrir buzón", onClick: () => navigate("/buzon") },
          id: `mailbox-arrival-${fresh.map((item) => item.transitId).join("-")}`,
        });
        play("message");
      }
    }
    lastArrival.current = { token, ids: currentIds };
  }, [arrivals, navigate, token]);

  const mailboxNew = unseenMailbox.length;
  const hasNewPlush = newPlushes.length;

  const badges: Record<string, number> = {
    "/buzon": mailboxNew,
    "/coleccion": hasNewPlush,
  };

  const badgeTitles: Record<string, string | undefined> = {
    "/buzon": mailboxNew
      ? `${mailboxNew} ${mailboxNew === 1 ? "peluche nuevo" : "peluches nuevos"} en el buzón`
      : undefined,
    "/coleccion": hasNewPlush
      ? `${hasNewPlush} ${hasNewPlush === 1 ? "peluche nuevo" : "peluches nuevos"} en tu colección`
      : undefined,
  };

  const avatar = companionById(companion);

  return (
    <>
      <header ref={header} data-testid="app-topbar" className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <DemoBanner />
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-2.5 sm:px-6">
          <NavLink
            to="/casa"
            aria-label="Mano a Mano, ir a la casa"
            className="top-brand-link shrink-0"
          >
            <Brand compact />
          </NavLink>

          <nav
            className="ml-2 hidden items-center gap-0.5 md:flex"
            aria-label="Secciones"
          >
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                data-tour={to === "/apoyo" ? "support" : undefined}
                title={badgeTitles[to]}
                className={({ isActive }) =>
                  cn(
                    "top-nav-link relative flex items-center rounded-full px-2.5 py-1.5 text-[13px] font-bold",
                    isActive
                      ? "top-nav-link-current bg-ink text-paper"
                      : "text-ink/65 hover:bg-sand hover:text-ink",
                  )
                }
              >
                {label}
                {Boolean(badges[to]) && <PlusBadge count={badges[to]} className="ml-1" />}
              </NavLink>
            ))}
          </nav>

          <SoundToggle className="top-sound-toggle ml-auto h-11 w-11 shrink-0" />
          <NavLink
            to="/perfil"
            aria-label={`Tu perfil${alias ? `, ${alias}` : ""}`}
            title="Tu compañero y tus ajustes"
            className="top-profile-link flex items-center gap-2 rounded-2xl border-2 border-ink bg-[#fffdf7] py-1 pl-1 pr-2.5 shadow-[3px_3px_0_var(--color-ink)]"
          >
            <span className="relative shrink-0">
              <PlushArt
                imagePath={avatar?.imagePath}
                alt=""
                size="sm"
                className="h-9 w-9 border-0 p-0"
              />
            </span>

            <span className="hidden text-sm font-bold sm:block">
              {alias || "Tu compañero"}
            </span>
          </NavLink>
        </div>
      </header>

      <nav
        className={`app-bottom-dock fixed inset-x-0 bottom-0 z-40 md:hidden${hideMobileDock ? " app-bottom-dock-hidden" : ""}`}
        data-testid="app-bottom-dock"
        aria-hidden={hideMobileDock || undefined}
        inert={hideMobileDock || undefined}
        aria-label="Navegación principal"
      >
        <div className="mx-auto w-full max-w-lg px-3 pb-[max(0.55rem,env(safe-area-inset-bottom))]">
          <div className="flex items-stretch gap-1 rounded-[1.7rem] border-2 border-ink bg-[#fffdf7]/95 p-1.5 shadow-[0_10px_30px_rgba(23,35,59,0.2)] backdrop-blur">
            {mobileLinks.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                data-tour={to === "/apoyo" ? "support" : undefined}
                title={badgeTitles[to]}
                className={({ isActive }) =>
                  cn(
                    "dock-link relative flex flex-1 flex-col items-center gap-0.5 rounded-[1.2rem] px-1 py-2 text-[9px] font-bold uppercase tracking-wide",
                    isActive
                      ? "dock-link-current bg-ink text-paper"
                      : "text-ink/55 active:bg-sand",
                  )
                }
              >
                <span className="relative">
                  <Icon className="h-[21px] w-[21px]" aria-hidden="true" />
                  {Boolean(badges[to]) && (
                    <span className="absolute -right-3 -top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full border-2 border-ink bg-guava px-0.5 text-[8px] font-extrabold leading-none text-white">
                      +{badges[to]}
                    </span>
                  )}
                </span>
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
