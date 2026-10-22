import { lazy, Suspense, useState, type FormEvent } from "react";
import { useAction } from "convex/react";
import { KeyRound, ShieldCheck, X } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../lib/session";
import { Modal } from "./Modal";
import { errorMessage } from "../lib/errors";
import { GooglePending } from "./GooglePending";
const GoogleAccess = lazy(() => import("./GoogleAccess"));

type Mode = "login" | "register";
export function AccountAccess({ initialAlias = "", saved = false, loginName, label = "Guardar mi cuenta · opcional" }: { initialAlias?: string; saved?: boolean; loginName?: string | null; label?: string }) {
  const [open, setOpen] = useState(false);
  return <>
    {saved ? <p className="flex items-center gap-2 text-xs font-semibold text-ink/75"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Cuenta guardada{loginName ? ` · Entra con ${loginName}` : " con Google"}</p> : <button type="button" className="btn btn-ink w-full" onClick={()=>setOpen(true)}><KeyRound className="h-4 w-4" aria-hidden="true" />{label}</button>}
    {open && <AccountModal initialMode="register" initialAlias={initialAlias} onClose={()=>setOpen(false)} />}
  </>;
}

export function AccountModal({ initialMode = "login", initialAlias = "", onClose }: { initialMode?: Mode; initialAlias?: string; onClose: ()=>void }) {
  const { token, start } = useSession();
  const [mode, setMode] = useState(initialMode);
  const [withPassword, setWithPassword] = useState(false);
  const [username, setUsername] = useState(initialAlias);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const signUp = useAction(api.credentials.signUp);
  const signIn = useAction(api.credentials.signIn);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError("");
    try {
      const result = mode === "register" ? await signUp({ username, password, guestToken: token ?? undefined }) : await signIn({ username, password });
      start(result.token);onClose();
    } catch (caught) { setError(errorMessage(caught, "No pudimos guardar el acceso. Intenta de nuevo.")); }
    finally { setBusy(false); }
  }
  return <Modal labelledBy="account-title" onClose={busy ? undefined : onClose} className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-ink bg-paper p-5 text-ink shadow-[6px_6px_0_var(--color-ink)]">
    <header className="mb-4 flex items-center justify-between gap-3"><h2 id="account-title" className="text-2xl">{mode === "login" ? "Volver a mi cuenta" : "Guarda tu recorrido"}</h2><button type="button" aria-label="Cerrar acceso" className="btn btn-ghost h-11 w-11 p-0" onClick={onClose} disabled={busy}><X className="h-5 w-5" /></button></header>
    <p className="mb-4 text-sm text-ink/70">{mode === "register" ? "Para volver desde otro celular sin perder tus peluches." : "Tu mascota, tus peluches y tus notas te esperan."}</p>
    {!withPassword ? <div className="space-y-3">
      <Suspense fallback={<GooglePending />}><GoogleAccess linkCurrent={mode === "register"} /></Suspense>
      <button type="button" onClick={()=>setWithPassword(true)} className="btn btn-ink w-full"><KeyRound className="h-4 w-4" aria-hidden="true" />Usar apodo y contraseña</button>
    </div> : <>
    <button type="button" disabled={busy} onClick={()=>{setWithPassword(false);setError("");}} className="mb-4 min-h-11 text-sm font-bold underline">Elegir otra forma de acceso</button>
    <form noValidate onSubmit={submit} className="space-y-3">
      <div><label className="label" htmlFor="account-name">Apodo para entrar</label><input id="account-name" className="field mt-1" autoComplete="username" maxLength={24} minLength={3} required value={username} onChange={e=>setUsername(e.target.value)} disabled={busy} /></div>
      <div><label className="label" htmlFor="account-password">Contraseña</label><input id="account-password" className="field mt-1" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 10 : undefined} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy} />{mode === "register" && <p className="mt-1 text-xs text-ink/65">Al menos 10 caracteres. Guárdala: sin correo no podemos restablecerla.</p>}</div>
      {error && <p role="alert" className="rounded-xl bg-blush p-3 text-sm">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-ink w-full">{busy ? "Un momento…" : mode === "login" ? "Entrar a mi cuenta" : "Guardar cuenta"}</button>
    </form>
    </>}
    <button type="button" className="mt-3 min-h-11 w-full text-sm font-bold underline" disabled={busy} onClick={()=>{setMode(mode === "login" ? "register" : "login");setError("");setPassword("");}}>{mode === "login" ? "Crear una cuenta" : "Ya tengo una cuenta"}</button>
  </Modal>;
}
