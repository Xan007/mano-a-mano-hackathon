import { AccountAccess } from "../components/AccountAccess";
import { AliasEditor } from "../components/AliasEditor";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Compass, LogOut, Palette, Shield, Volume2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { companionById } from "../../config/catalog";
import { useSession, useToken } from "../lib/session";
import { PlushArt } from "../components/PlushArt";
import { SoundToggle } from "../components/SoundToggle";

export default function Perfil() {
  const token = useToken();
  const { clear } = useSession();
  const me = useQuery(api.auth.me, { token });
  const signOut = useMutation(api.auth.signOut);
  if (!me) return <p role="status">Cargando tu compañero…</p>;
  const companion = companionById(me.companion);
  async function leave() {
    await signOut({ token }).catch(() => undefined);
    clear();
  }
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <p className="label">Tu espacio</p>
        <h1 className="mt-1 text-4xl">Tu compañero y tus ajustes</h1>
      </header>
      <section className="card flex items-center gap-5 bg-mango p-5">
        <div className="traveler-bob">
          <PlushArt
            imagePath={companion?.imagePath}
            alt={companion?.name ?? "Tu compañero"}
            size="md"
          />
        </div>
        <div>
          <p className="label">Tu apodo</p>
          <h2 className="mt-1 text-2xl">{me.alias}</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Tu {companion?.name} se queda contigo en cada historia.
          </p>
        </div>
      </section>
      <AliasEditor token={token} alias={me.alias ?? ""} />
      <Link to="/casa?guia=1" className="tile flex items-center gap-3 bg-paper p-5">
        <Compass className="h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="flex-1 font-bold">Repetir guía rápida</span>
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </Link>
      <section className="card space-y-3 p-5"><h2 className="text-xl">Tu cuenta</h2><AccountAccess initialAlias={me.alias ?? ""} saved={me.hasPassword || me.hasGoogle} loginName={me.loginName} /></section>
      {(me.staffRole || me.publicDemo) && <Link to="/admin" className="tile flex items-center gap-3 bg-mist p-5"><Shield className="h-6 w-6"/><span className="flex-1 font-bold">{me.staffRole ? "Administración y moderación" : "Ver panel demo"}</span><ArrowRight className="h-5 w-5"/></Link>}
      <Link to="/taller" className="tile flex items-center gap-4 bg-mist p-5">
        <Palette className="h-6 w-6 shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <h2 className="text-xl">Taller de notas</h2>
          <p className="mt-1 text-sm">
            Fondos para expresarte, todos disponibles.
          </p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
      </Link>
      <section className="card space-y-5 p-5">
        <h2 className="text-2xl">Sonido a tu gusto</h2>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-bold">
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              Sonidos
            </p>
            <p className="mt-1 text-sm text-ink/75">Empiezan apagados.</p>
          </div>
          <SoundToggle />
        </div>
      </section>
      <section className="card space-y-4 p-5">
        <h2 className="flex items-center gap-2 text-xl">
          <Shield className="h-5 w-5" aria-hidden="true" />
          Sobre tus notas
        </h2>
        <p className="text-sm leading-relaxed text-ink/80">
          Guardamos un identificador de sesión, tu apodo y el progreso. Puedes
          escribir notas positivas que se revisan con IA antes de viajar. No
          incluyas datos personales ni relatos de salud. El equipo puede revisar
          reportes y retirar contenido. La demostración usa datos ficticios
          separados de los participantes reales.
        </p>
        <p className="text-sm leading-relaxed text-ink/80">
          {me.hasPassword || me.hasGoogle ? "Tu cuenta está guardada. Puedes volver a entrar para recuperar este recorrido." : "Sin guardar una cuenta, el recorrido solo se conserva en este navegador."}
        </p>
        <button type="button" onClick={leave} className="btn btn-ghost w-full">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Salir de mi sesión
        </button>
      </section>
      <Link to="/apoyo" className="btn btn-ink w-full">
        Conocer opciones de apoyo
      </Link>
    </div>
  );
}
