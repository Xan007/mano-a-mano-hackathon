import { useEffect, useRef, useState, type ReactNode } from "react";
import { ClerkLoaded, ClerkLoading, ClerkFailed, useClerk, useSession as useClerkSession } from "@clerk/react";
import { useAction, useMutation } from "convex/react";
import { useLocation, useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import { useSession } from "../lib/session";
import { errorMessage } from "../lib/errors";
import { completeGoogleSignUp } from "../lib/googleFlow";
import { Brand } from "./Brand";
import { PlushArt } from "./PlushArt";
import { GooglePending } from "./GooglePending";

function GoogleReady({ children }: { children: ReactNode }) {
  return <>
    <ClerkLoading><GooglePending /></ClerkLoading>
    <ClerkFailed><p role="alert" className="text-sm">Google no está disponible ahora. Puedes usar apodo y contraseña.</p></ClerkFailed>
    <ClerkLoaded>{children}</ClerkLoaded>
  </>;
}
function ExistingGoogle({ onUse, onKeep }: { onUse: ()=>void; onKeep: ()=>void }) {
  return <div className="space-y-3 rounded-xl border-2 border-ink/20 bg-mist p-3"><p className="text-sm">Google ya tiene otro recorrido guardado. ¿Quieres abrirlo? Los dos recorridos no se combinan.</p><button type="button" className="btn btn-ink w-full" onClick={onUse}>Abrir mi cuenta de Google</button><button type="button" className="btn btn-ghost w-full" onClick={onKeep}>Conservar mi recorrido actual</button></div>;
}
function GoogleButton({ linkCurrent }: { linkCurrent: boolean }) {
  const clerk = useClerk();
  const { session } = useClerkSession();
  const { token, start } = useSession();
  const login = useAction(api.credentials.google);
  const revoke = useMutation(api.auth.signOut);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function connect() {
    setBusy(true);setError("");
    try {
      if (session) {
        const credential = await session.getToken();
        if (!credential) throw Error("Vuelve a intentar con Google.");
        const result = await login({ credential, guestToken: linkCurrent ? token ?? undefined : undefined });
        if (linkCurrent && token && !result.linked) {setPendingToken(result.token);return;}
        start(result.token);window.location.assign(linkCurrent ? window.location.pathname : "/casa");return;
      }
      sessionStorage.setItem("manoamano.google-link", linkCurrent ? "1" : "0");
      sessionStorage.setItem("manoamano.google-return", linkCurrent ? window.location.pathname : "/casa");
      if (!clerk.client) throw Error("Google todavía se está preparando.");
      await clerk.client.signIn.authenticateWithRedirect({ strategy: "oauth_google", redirectUrl: "/cuenta/google", redirectUrlComplete: "/cuenta/google?step=finish" });
    } catch(caught) { setError(errorMessage(caught, "No pudimos abrir Google. Puedes intentarlo de nuevo.")); }
    finally { setBusy(false); }
  }
  if (pendingToken) return <ExistingGoogle onUse={()=>{start(pendingToken);window.location.assign("/casa");}} onKeep={()=>{void revoke({token:pendingToken});setPendingToken(null);}} />;
  return <><button type="button" onClick={connect} disabled={busy} className="btn btn-ghost w-full"><svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h6a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-2 3.2-4.8 3.2-8.2Z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.6l-3.6-2.8a6.8 6.8 0 0 1-10-3.6H2.1v2.9A11.2 11.2 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.8 14a6.6 6.6 0 0 1 0-4V7.1H2.1a11.3 11.3 0 0 0 0 9.8L5.8 14Z"/><path fill="#EA4335" d="M12 5.3c1.8 0 3.3.6 4.5 1.8l3.3-3.2A11 11 0 0 0 2.1 7.1L5.8 10A6.6 6.6 0 0 1 12 5.3Z"/></svg>{busy ? "Conectando…" : "Continuar con Google"}</button>{error && <p role="alert" className="mt-2 text-sm text-ink/75">{error}</p>}<div id="clerk-captcha" /></>;
}
export default function GoogleAccess({ linkCurrent }: { linkCurrent: boolean }) { return <GoogleReady><GoogleButton linkCurrent={linkCurrent} /></GoogleReady>; }

function FinishGoogle() {
  const { session, isLoaded } = useClerkSession();
  const { token, start } = useSession();
  const login = useAction(api.credentials.google);
  const revoke = useMutation(api.auth.signOut);
  const [pendingToken,setPendingToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const request = useRef<Promise<{token: string; linked: boolean}> | null>(null);
  const processed = useRef(false);
  const [intent] = useState(()=>({ link: sessionStorage.getItem("manoamano.google-link") === "1", returnPath: sessionStorage.getItem("manoamano.google-return") }));
  const [error,setError] = useState("");
  const [retry,setRetry] = useState(0);
  useEffect(()=>{
    if (!isLoaded || !session || processed.current) return;
    let cancelled = false;
    request.current ??= (async()=>{
      const credential = await session.getToken();
      if (!credential) throw Error("Vuelve a entrar con Google.");
      return await login({ credential, guestToken: intent.link ? token ?? undefined : undefined });
    })();
    void request.current.then(result=>{
      if (cancelled || processed.current) return;
      processed.current = true;
      if (intent.link && token && !result.linked) {setPendingToken(result.token);return;}
      sessionStorage.removeItem("manoamano.google-link");sessionStorage.removeItem("manoamano.google-return");
      start(result.token);
      navigate(intent.returnPath && ["/perfil","/casa","/"].includes(intent.returnPath) ? intent.returnPath : "/casa", { replace: true });
    }).catch(caught=>{
      if (!cancelled) setError(errorMessage(caught,"No pudimos terminar el acceso con Google."));
    });
    return ()=>{cancelled = true;};
  },[session,isLoaded,login,start,navigate,token,retry,intent]);
  if (pendingToken) return <div className="mx-auto max-w-md px-5 py-12"><ExistingGoogle onUse={()=>{start(pendingToken);sessionStorage.removeItem("manoamano.google-link");navigate("/casa",{replace:true});}} onKeep={()=>{void revoke({token:pendingToken});sessionStorage.removeItem("manoamano.google-link");navigate("/perfil",{replace:true});}} /></div>;
  return <div className="mx-auto max-w-md space-y-4 px-5 py-12"><h1 className="text-3xl">Volviendo a tu recorrido</h1>{error ? <><p role="alert" className="text-sm">{error}</p><button type="button" className="btn btn-ink" onClick={()=>{request.current=null;processed.current=false;setError("");setRetry(x=>x+1);}}>Reintentar</button></> : <p role="status">Guardando tu acceso…</p>}{isLoaded && !session && <p>No se completó el acceso con Google.</p>}<a href="/" className="btn btn-ghost">Ir al inicio</a></div>;
}
export function GoogleReturn() {
  const { search } = useLocation();
  const step = new URLSearchParams(search).get("step");
  return <div className="mx-auto max-w-md space-y-5 px-4 py-6 sm:py-10">
    <Brand />
    <section className="card space-y-5 p-5 sm:p-7">
      <PlushArt imagePath="/plush/chiguiro.webp" alt="" size="md" className="mx-auto" />
      <GoogleReady>{step === "finish" ? <FinishGoogle /> : step === "extra" ? <CompleteGoogle /> : step === "retry" ? <GoogleRetry /> : <GoogleCallback />}</GoogleReady>
    </section>
  </div>;
}

function GoogleRetry() {
  return <div className="space-y-4"><h1 className="text-2xl">Volvamos a intentarlo</h1><p className="text-sm text-ink/75">El acceso con Google no se completó. Tu recorrido sigue aquí.</p><GoogleButton linkCurrent={sessionStorage.getItem("manoamano.google-link") === "1"} /><a href="/" className="btn btn-ghost w-full">Volver a la app</a></div>;
}

function CompleteGoogle() {
  const clerk = useClerk();
  const navigate = useNavigate();
  const request = useRef<Promise<unknown> | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    request.current ??= (async () => {
      if (!clerk.client) throw Error("Vuelve a intentar el acceso con Google.");
      if (clerk.session) return;
      const sessionId = await completeGoogleSignUp(clerk.client.signUp);
      await clerk.setActive({ session: sessionId });
    })();
    void request.current.then(() => {
      if (!cancelled) navigate("/cuenta/google?step=finish", { replace: true });
    }).catch(caught => {
      if (!cancelled) setError(errorMessage(caught, "No pudimos terminar el acceso con Google."));
    });
    return () => { cancelled = true; };
  }, [clerk, navigate, retry]);
  return <div className="space-y-4"><h1 className="text-2xl">Preparando tu cuenta</h1>{error ? <><p role="alert" className="text-sm text-ink/75">{error}</p><button type="button" className="btn btn-ink w-full" onClick={() => { request.current = null; setError(""); setRetry(value => value + 1); }}>Reintentar</button><a href="/" className="btn btn-ghost w-full">Volver a la app</a></> : <p role="status" className="text-sm">Un momento. Volvemos a tus peluches…</p>}</div>;
}

function GoogleCallback() {
  const clerk = useClerk();
  const navigate = useNavigate();
  const request = useRef<Promise<unknown> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    request.current ??= clerk.handleRedirectCallback({
      signInUrl: "/cuenta/google?step=retry",
      signUpUrl: "/cuenta/google?step=extra",
      continueSignUpUrl: "/cuenta/google?step=extra",
      signInForceRedirectUrl: "/cuenta/google?step=finish",
      signUpForceRedirectUrl: "/cuenta/google?step=finish",
      firstFactorUrl: "/cuenta/google?step=retry",
      secondFactorUrl: "/cuenta/google?step=retry",
      resetPasswordUrl: "/cuenta/google?step=retry",
      verifyEmailAddressUrl: "/cuenta/google?step=retry",
      verifyPhoneNumberUrl: "/cuenta/google?step=retry",
    }, async to => {
      const destination = new URL(to, window.location.origin);
      if (destination.origin !== window.location.origin) throw Error("Unexpected account redirect");
      navigate(`${destination.pathname}${destination.search}${destination.hash}`, { replace: true });
    });
    void request.current.catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [clerk, navigate]);
  return error ? <GoogleRetry /> : <div className="space-y-3"><h1 className="text-2xl">Volviendo a tu recorrido</h1><p role="status" className="text-sm text-ink/75">Comprobando tu acceso con Google…</p><a href="/" className="btn btn-ghost w-full">Volver a la app</a></div>;
}
