import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

const STORAGE_KEY = "manoamano.support-nudge.last-shown";
const COOLDOWN_MS = 8 * 60 * 60 * 1000;

function getMode(pathname: string) {
  if (pathname === "/mapa" || pathname === "/coleccion" || pathname === "/apoyo" || pathname === "/admin") return null;
  if (pathname === "/enviar" || pathname === "/buzon" || pathname.startsWith("/peluche/")) {
    return { delay: 18_000, chance: 0.42 };
  }
  if (pathname === "/casa" || pathname === "/taller" || pathname === "/perfil") {
    return { delay: 90_000, chance: 0.12 };
  }
  return null;
}

export function SupportNudge() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const channels = useQuery(api.channels.list);

  useEffect(() => {
    const mode = getMode(pathname);
    if (!mode || !channels?.length) return;
    const settings = mode;
    const currentChannels = channels;

    let timer: number | undefined;
    function schedule() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (document.hidden || document.querySelector("[aria-modal=\"true\"]")) return;
        let lastShown = 0;
        try { lastShown = Number(localStorage.getItem(STORAGE_KEY) ?? 0); } catch { /* Continue without local storage. */ }
        if (Date.now() - lastShown < COOLDOWN_MS || Math.random() > settings.chance) return;

        const available = currentChannels.filter((channel) => !channel.paused);
        if (!available.length) return;
        const channel = available[Math.floor(Math.random() * available.length)];
        try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* The cooldown is still best effort. */ }
        toast.info(`¿Necesitas hablar con alguien?`, {
          id: "support-nudge",
          description: `${channel.name} · ${channel.contact} · ${channel.cost} · ${channel.hours}`,
          duration: 7_000,
          action: {
            label: "Ver apoyo",
            onClick: () => navigate("/apoyo"),
          },
        });
      }, settings.delay);
    }
    schedule();
    return () => window.clearTimeout(timer);
  }, [channels, navigate, pathname]);

  return null;
}
