import { useCalmMotion as useReducedMotion } from "./lib/motion";
import { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { api } from "../convex/_generated/api";
import { useSession } from "./lib/session";
import { MoodCheckIn } from "./components/MoodCheckIn";
import { AuthScreen } from "./components/AuthScreen";
import { Onboarding } from "./components/Onboarding";
import { Brand } from "./components/Brand";
import { Nav } from "./components/Nav";
import { SupportNudge } from "./components/SupportNudge";
import { loadCasa, loadMapa } from "./lib/tourRoutes";
const GoogleReturn = lazy(() => import("./components/GoogleAccess").then(module => ({ default: module.GoogleReturn })));
const Casa = lazy(loadCasa);
const Mapa = lazy(loadMapa);
import Apoyo from "./routes/apoyo";
import { FirstJourney } from "./components/FirstJourney";
const Buzon = lazy(() => import("./routes/buzon"));
const Enviar = lazy(() => import("./routes/enviar"));
const Coleccion = lazy(() => import("./routes/coleccion"));
const PelucheDetail = lazy(() => import("./routes/peluche.$id"));

const Taller = lazy(() => import("./routes/taller"));
const Perfil = lazy(() => import("./routes/perfil"));
const Admin = lazy(() => import("./routes/admin"));
const QuickTour = lazy(() => import("./components/QuickTour"));

function Splash({ message = "Cargando tu casa…" }: { message?: string }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4"
      >
        <Brand />
        <p className="flex items-center gap-2 text-sm font-semibold text-ink/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {message}
        </p>
      </motion.div>
    </div>
  );
}

function Shell({
  me,
}: {
  me: {
    _id: string;
    quickTourCompletedAt: number | null;
    alias: string | null;
    companion: string;
    tokens: number;
    xp: number;
    keys: number;
  };
}) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Nav
        companion={me.companion}
        alias={me.alias}
        tokens={me.tokens}
        keys={me.keys}
        xp={me.xp}
      />
      <SupportNudge />
      <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(11rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:pb-14 md:pt-6">
        <motion.div
          key={location.pathname}
          data-tour-page={location.pathname}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense
            fallback={
              <p role="status" className="p-5">
                Abriendo tu recorrido…
              </p>
            }
          >
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/casa" replace />} />
              <Route path="/casa" element={<Casa />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route
                path="/calabozos"
                element={<Navigate to="/mapa" replace />}
              />
              <Route path="/taller" element={<Taller />} />
              <Route path="/cadena" element={<Navigate to="/casa" replace />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/caja" element={<Navigate to="/mapa" replace />} />
              <Route path="/apoyo" element={<Apoyo />} />
              <Route path="/buzon" element={<Buzon />} />
              <Route path="/enviar" element={<Enviar />} />
              <Route path="/coleccion" element={<Coleccion />} />
              <Route path="/peluche/:id" element={<PelucheDetail />} />
              <Route path="*" element={<Navigate to="/casa" replace />} />
            </Routes>
          </Suspense>
        </motion.div>
        {location.pathname === "/apoyo" && <div id="support-scroll-end" aria-hidden="true" />}
      </main>
      <Suspense fallback={null}>
        <QuickTour key={me._id} playerId={me._id} completedAt={me.quickTourCompletedAt} companionId={me.companion} />
      </Suspense>
    </div>
  );
}

function PlayerGate({ token }: { token: string }) {
  const MOOD_INTERVAL = 12 * 60 * 60 * 1000;
  const { clear, sessionStartedAt } = useSession();
  const location = useLocation();
  const [moodOpen, setMoodOpen] = useState(false);
  const [handledSession, setHandledSession] = useState<number | null>(null);
  const me = useQuery(api.auth.me, { token });
  const touch = useMutation(api.players.touch);

  useEffect(() => {
    if (me === null) clear();
  }, [me, clear]);

  useEffect(() => {
    if (!sessionStartedAt || !me || me.companion === "" || !me.firstJourneyAt || location.pathname !== "/casa") return;
    if (handledSession === sessionStartedAt) return;
    setHandledSession(sessionStartedAt);
    const key = `manoamano.mood-checkin.${token}`;
    const lastShown = Number(localStorage.getItem(key) ?? 0);
    if (Date.now() - lastShown >= MOOD_INTERVAL) {
      localStorage.setItem(key, String(Date.now()));
      setMoodOpen(true);
    }
  }, [me, location.pathname, sessionStartedAt, handledSession, token]);

  useEffect(() => {
    const ping = () => { if (document.visibilityState === "visible") touch({ token }).catch(() => undefined); };
    ping();
    const timer = window.setInterval(ping, 60_000);
    return () => window.clearInterval(timer);
  }, [touch, token]);

  if (me === undefined) return <Splash />;
  if (me === null) return <Splash message="Cerrando sesión…" />;
  if (me.bannedAt) return <div className="mx-auto max-w-md space-y-4 p-6"><Brand/><h1 className="text-3xl">Cuenta suspendida</h1><p className="text-sm">El equipo de moderación suspendió esta cuenta.</p>{me.banReason&&<p className="rounded-xl bg-sand p-3 text-sm">{me.banReason}</p>}<button type="button" className="btn btn-ghost" onClick={clear}>Salir de mi cuenta</button></div>;
  if (location.pathname === "/admin") return <Suspense fallback={<Splash message="Abriendo administración…"/>}><Admin/></Suspense>;
  const checkIn = moodOpen ? <MoodCheckIn onClose={() => setMoodOpen(false)} /> : null;
  if (location.pathname === "/apoyo" && !me.firstJourneyAt) return <Apoyo standalone />;
  if (me.companion === "") return <Onboarding />;
  if (!me.firstJourneyAt) return <FirstJourney />;
  return <>{checkIn}<Shell me={me} /></>;
}

export default function App() {
  const { token } = useSession();
  const location = useLocation();
  if (location.pathname === "/cuenta/google") return <Suspense fallback={<Splash message="Conectando tu cuenta…" />}><GoogleReturn /></Suspense>;
  if (location.pathname === "/apoyo" && !token) return <Apoyo standalone />;
  if (!token) return <AuthScreen />;
  return <PlayerGate token={token} />;
}
