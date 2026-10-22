import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { ArrowLeft, ClipboardList, FlaskConical, MessageSquare, ShieldCheck, Users, X } from "lucide-react";
import { toast } from "sonner";
import type { FunctionReturnType } from "convex/server";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { companionById } from "../../config/catalog";
import { OWNER_EMAIL, LIVE_HOLD_MS } from "../../config/operations";
import { SUPPORT_CHANNELS } from "../../config/support";
import { useToken } from "../lib/session";
import { errorMessage } from "../lib/errors";
import { Modal } from "../components/Modal";
import { NoteCard } from "../components/NoteCard";
import { PlushArt } from "../components/PlushArt";
import { Brand } from "../components/Brand";

type Access = NonNullable<FunctionReturnType<typeof api.admin.access>>;
type Review = { title: string; description: string; label: string; submit: (reason: string) => Promise<unknown> };
const date = (value: number | null | undefined) => value ? new Date(value).toLocaleString("es-CO", {dateStyle:"short",timeStyle:"short"}) : "Sin registro";
const noteState = (note: { moderationStatus?: string; hidden: boolean }) => note.moderationStatus ?? (note.hidden ? "pending" : "published");
const states: Record<string,string> = { pending:"En revisión", published:"Publicada", removed:"Retirada", resolved:"Resuelto", dismissed:"Descartado" };

function ReviewDialog({ review, close }: { review: Review; close: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true); setError("");
    try { await review.submit(reason); toast.success("Cambio guardado en el historial"); close(); }
    catch(e) { setError(errorMessage(e,"No se pudo guardar el cambio.")); }
    finally { setBusy(false); }
  }
  return <Modal labelledBy="admin-confirm-title" onClose={busy ? undefined : close} className="w-full max-w-md rounded-3xl border-2 border-ink bg-paper p-5 shadow-[6px_6px_0_var(--color-ink)]">
    <header className="flex items-center justify-between gap-3"><h2 id="admin-confirm-title" className="text-2xl">{review.title}</h2><button type="button" aria-label="Cerrar revisión" className="btn btn-ghost h-11 w-11 p-0" disabled={busy} onClick={close}><X className="h-5 w-5" /></button></header>
    <p className="mt-3 text-sm text-ink/75">{review.description}</p>
    <label className="label mt-5 block" htmlFor="admin-reason">Motivo de la decisión</label>
    <textarea id="admin-reason" className="field mt-2" rows={3} maxLength={300} value={reason} onChange={e=>setReason(e.target.value)} disabled={busy} placeholder="Explica brevemente qué revisaste." />
    {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-2"><button className="btn btn-ghost flex-1" type="button" onClick={close} disabled={busy}>Cancelar</button><button className="btn btn-ink flex-1" type="button" onClick={submit} disabled={busy || reason.trim().length<3}>{busy ? "Guardando…" : review.label}</button></div>
  </Modal>;
}
function More({ status, loadMore }: { status: string; loadMore: (n:number)=>void }) {
  return status === "Exhausted" ? null : <button type="button" className="btn btn-ghost w-full" disabled={status !== "CanLoadMore"} onClick={()=>loadMore(25)}>{status === "CanLoadMore" ? "Cargar más" : "Cargando…"}</button>;
}
function Empty({children}:{children:ReactNode}) { return <p className="rounded-2xl border-2 border-dashed border-ink/20 p-6 text-center text-sm text-ink/65">{children}</p>; }

function Overview({token}:{token:string}) {
  const data = useQuery(api.admin.overview,{token});
  if (!data) return <p role="status">Cargando actividad…</p>;
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Personas",data.people],["Notas",data.notes],["Notas por revisar",data.pendingNotes],["Contactos reportados",data.pendingChannels]].map(([label,value])=><article key={label} className="card bg-paper p-4"><p className="text-xs font-bold text-ink/65">{label}</p><p className="mt-2 font-display text-4xl">{value}</p></article>)}</div>
    <section className="card space-y-3 bg-mist p-5"><h2 className="text-2xl">{data.demo ? "Ensayo del pitch" : "Operación real"}</h2><p className="text-sm leading-relaxed">{data.demo ? "Datos ficticios separados: libretas decoradas, dos visitas en el buzón y peluches que avanzan automáticamente cada 18 segundos. Las notas se moderan con el mismo flujo del producto." : "Solo participantes reales. Cada visita permite hasta 48 horas para responder. Si nadie está disponible, el envío espera hasta 48 horas; no inventamos personas ni mensajes."}</p><p className="text-sm">{data.banned} cuentas suspendidas · Tiempo máximo por visita: {data.holdMs===LIVE_HOLD_MS ? "48 horas" : "3 minutos"}.</p></section>
    {data.bounded && <p className="text-xs text-ink/65">Los contadores resumen hasta 2.000 registros recientes. Las listas tienen paginación.</p>}
    <section className="card space-y-3 p-5"><h2 className="text-xl">Qué revisar</h2><p className="text-sm leading-relaxed">Las notas reportadas se ocultan mientras las revisas. Puedes publicarlas, mantenerlas en revisión o retirarlas. Los reportes de contacto se resuelven al comprobar la fuente; reportar no cambia automáticamente un teléfono.</p><p className="text-sm text-ink/70">Cada decisión guarda quién la tomó, cuándo y por qué. No es un panel clínico: no registra diagnósticos ni conversaciones del asistente.</p></section>
  </div>;
}

function Notes({token,review}:{token:string;review:(r:Review)=>void}) {
  const [status,setStatus] = useState<"all"|"pending"|"published"|"removed">("pending");
  const {results,status:pageStatus,loadMore} = usePaginatedQuery(api.admin.notes,{token,status},{initialNumItems:20});
  const moderate = useMutation(api.admin.moderateNote);
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl">Moderación de notas</h2><label className="flex items-center gap-2 text-sm font-bold">Mostrar<select className="field w-auto" value={status} onChange={e=>setStatus(e.target.value as typeof status)}>{["pending","published","removed","all"].map(value=><option key={value} value={value}>{states[value]??"Todas"}</option>)}</select></label></div>
    {pageStatus!=="LoadingFirstPage" && !results.length && <Empty>No hay notas en esta vista.</Empty>}
    <div className="grid gap-4 lg:grid-cols-2">{results.map(note=><article key={note._id} className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold"><span>{states[noteState(note)]} {note.isDemo ? "· Ficticia" : ""}</span><span>{note.reports} reporte(s)</span></div>
      <NoteCard body={note.body} alias={note.author.alias} coverId={note.cover} themeId={note.theme} effectId={note.effect} />
      <p className="text-xs text-ink/65">{date(note.createdAt)}{note.moderationReason ? ` · ${note.moderationReason}` : ""}</p>
      <div className="flex flex-wrap gap-2">{(["published","pending","removed"] as const).map(target=><button type="button" className={`btn ${target==="published" ? "btn-ink" : "btn-ghost"} min-h-10 px-3 text-xs`} key={target} disabled={noteState(note)===target} onClick={()=>review({title:target==="published" ? "Publicar nota" : target==="pending" ? "Poner en revisión" : "Retirar nota",description:target==="published" ? "Volverá a ser visible en su libreta. Comprueba datos personales y contenido antes de aprobar." : "La nota dejará de verse en la libreta. El registro queda disponible para el equipo.",label:"Guardar decisión",submit:reason=>moderate({token,noteId:note._id,status:target,reason})})}>{target==="published" ? "Publicar" : target==="pending" ? "Revisar" : "Retirar"}</button>)}</div>
    </article>)}</div><More status={pageStatus} loadMore={loadMore}/></div>;
}

function UserDetail({token,id,review,close}:{token:string;id:Id<"players">;review:(r:Review)=>void;close:()=>void}) {
  const data = useQuery(api.admin.userDetail,{token,playerId:id});
  const ban = useMutation(api.admin.banUser);
  const moderate = useMutation(api.admin.moderateNote);
  if (!data) return <p role="status">Cargando perfil…</p>;
  const {player} = data;
  return <section className="space-y-5"><button type="button" className="btn btn-ghost" onClick={close}><ArrowLeft className="h-4 w-4"/>Volver a usuarios</button>
    <div className="card flex flex-wrap items-center gap-4 bg-mist p-5"><PlushArt imagePath={companionById(player.companion)?.imagePath} alt="" size="md"/><div className="min-w-0 flex-1"><h2 className="break-words text-2xl">{player.alias}</h2><p className="mt-1 break-all text-sm">{player.email??"Sin correo vinculado"}</p><p className="mt-2 text-xs">{player.isDemo ? "Perfil ficticio" : "Participante real"} · {player.bannedAt ? "Suspendido" : "Activo"}</p></div><button type="button" className="btn btn-ink" onClick={()=>review({title:player.bannedAt ? "Restablecer cuenta" : "Suspender cuenta",description:player.bannedAt ? "La persona podrá volver a acceder y participar." : "Se bloquearán el acceso y las acciones de esta cuenta, también en sesiones ya abiertas. No se borran sus datos ni se ocultan notas automáticamente.",label:player.bannedAt ? "Restablecer" : "Suspender",submit:reason=>ban({token,playerId:id,banned:!player.bannedAt,reason})})}>{player.bannedAt ? "Restablecer cuenta" : "Suspender cuenta"}</button></div>
    <div className="grid gap-3 text-sm sm:grid-cols-2"><p>Creada: {date(player.createdAt)}</p><p>Última actividad: {date(player.lastSeenAt)}</p><p>Acceso: {[player.hasGoogle&&"Google",player.hasPassword&&"contraseña"].filter(Boolean).join(" y ")||"Invitado"}</p><p>Primer recorrido: {date(player.firstJourneyAt)}</p>{player.banReason&&<p className="sm:col-span-2">Motivo de suspensión: {player.banReason}</p>}</div>
    <h3 className="text-xl">Sus peluches · {data.plushes.length}</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{data.plushes.map(item=><article key={item._id} className="card space-y-2 p-3 text-center"><PlushArt imagePath={item.catalog?.imagePath} alt="" size="sm" className="mx-auto"/><p className="text-sm font-bold">{item.catalog?.species}</p><p className="text-xs">{item.status==="traveling" ? "De viaje" : item.status==="returned" ? "Regresó" : "En casa"} · {item.hopCount}/{item.hopsTarget}</p></article>)}</div>
    <h3 className="text-xl">Notas que ha escrito · {data.notes.length}</h3><div className="grid gap-4 lg:grid-cols-2">{data.notes.map(note=><div key={note._id} className="space-y-2"><NoteCard body={note.body} alias={player.alias} coverId={note.cover} effectId={note.effect} themeId={note.theme}/><div className="flex items-center justify-between gap-2 text-xs"><span>{states[noteState(note)]}</span><button className="btn btn-ghost min-h-10 px-3 text-xs" type="button" onClick={()=>review({title:"Poner en revisión",description:"Se ocultará mientras el equipo evalúa el contenido.",label:"Poner en revisión",submit:reason=>moderate({token,noteId:note._id,status:"pending",reason})})}>Revisar nota</button></div></div>)}</div>{data.truncated&&<p className="text-xs">Mostrando las primeras 100 notas y 100 peluches de este perfil.</p>}
  </section>;
}
function UsersPanel({token,review}:{token:string;review:(r:Review)=>void}) {
  const {results,status,loadMore}=usePaginatedQuery(api.admin.users,{token},{initialNumItems:25});
  const [selected,setSelected]=useState<Id<"players">|null>(null);
  const [search,setSearch]=useState("");
  if(selected)return <UserDetail token={token} id={selected} review={review} close={()=>setSelected(null)}/>;
  const shown=results.filter(p=>`${p.alias} ${p.email??""}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-4"><h2 className="text-2xl">Usuarios</h2><input className="field" aria-label="Buscar entre usuarios cargados" placeholder="Buscar entre usuarios cargados…" value={search} onChange={e=>setSearch(e.target.value)}/><div className="space-y-2">{shown.map(p=><button key={p._id} type="button" className="tile flex w-full items-center gap-3 bg-paper p-3 text-left" onClick={()=>setSelected(p._id)}><PlushArt imagePath={companionById(p.companion)?.imagePath} alt="" size="sm" className="h-11 w-11"/><span className="min-w-0 flex-1"><span className="block truncate font-bold">{p.alias}</span><span className="block truncate text-xs text-ink/65">{p.email??"Sin correo vinculado"}</span></span><span className="text-xs font-bold">{p.bannedAt ? "Suspendido" : p.isDemo ? "Ficticio" : "Activo"}</span></button>)}</div>{!shown.length&&status!=="LoadingFirstPage"&&<Empty>No hay usuarios en esta lista.</Empty>}<More status={status} loadMore={loadMore}/></div>;
}

function ChannelEditor({token,channel}:{token:string;channel:FunctionReturnType<typeof api.channels.list>[number]}) {
  const save = useMutation(api.admin.updateChannel);
  const [today]=useState(()=>new Date().toISOString().slice(0,10));
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function submit(e:React.FormEvent<HTMLFormElement>) {e.preventDefault();const data=new FormData(e.currentTarget);const value=(key:string)=>String(data.get(key)??"").trim();setBusy(true);setError("");try{await save({token,channelId:channel.id,phone:value("phone"),whatsapp:value("whatsapp"),hours:value("hours"),cost:value("cost"),paused:data.has("paused"),sourceUrl:value("sourceUrl"),verifiedAt:value("verifiedAt"),reason:value("reason")});toast.success("Contacto actualizado");}catch(e){setError(errorMessage(e,"No se guardó el contacto."));}finally{setBusy(false);}}
  return <details className="card p-4"><summary className="cursor-pointer font-bold">Editar {channel.name}{channel.paused ? " · En revisión" : ""}</summary><form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
    <label className="label">Teléfono<input className="field mt-1" name="phone" defaultValue={channel.phone} maxLength={15} required/></label><label className="label">WhatsApp · opcional<input className="field mt-1" name="whatsapp" defaultValue={channel.whatsapp??""} maxLength={15}/></label>
    <label className="label">Horario<input className="field mt-1" name="hours" defaultValue={channel.hours} maxLength={120} required/></label><label className="label">Costo<input className="field mt-1" name="cost" defaultValue={channel.cost} maxLength={80} required/></label>
    <label className="label sm:col-span-2">Fuente verificada<input className="field mt-1" type="url" name="sourceUrl" defaultValue={channel.sourceUrl} maxLength={1000} placeholder="https://…" required/></label><label className="label">Fecha de verificación<input className="field mt-1" type="date" name="verifiedAt" defaultValue={today} required/></label>
    <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="paused" defaultChecked={channel.paused}/>Pausar botones de contacto</label>
    <label className="label sm:col-span-2">Motivo<input className="field mt-1" name="reason" minLength={3} maxLength={300} required/></label>
    {error&&<p role="alert" className="text-sm sm:col-span-2">{error}</p>}<button className="btn btn-ink sm:col-span-2" disabled={busy} type="submit">{busy ? "Guardando…" : "Guardar contacto"}</button></form></details>;
}
function Channels({token,demo,owner,review}:{token:string;demo:boolean;owner:boolean;review:(r:Review)=>void}) {
  const {results,status,loadMore}=usePaginatedQuery(api.admin.channelReports,{token},{initialNumItems:20});
  const channels=useQuery(api.channels.list);
  const resolve=useMutation(api.admin.resolveChannelReport);
  return <div className="space-y-5"><h2 className="text-2xl">Contactos y reportes</h2><p className="text-sm text-ink/70">Aquí llegan los avisos de «¿El contacto no funciona?». Comprueba la fuente oficial antes de resolver. No uses las líneas para llamadas de prueba.</p>
    {!demo&&owner&&channels?.map(c=><ChannelEditor key={c.id} token={token} channel={c}/>)}
    {results.map(r=><article className="card space-y-3 p-4" key={r._id}><div className="flex flex-wrap justify-between gap-2"><h3 className="text-xl">{SUPPORT_CHANNELS.find(c=>c.id===r.channelId)?.name}</h3><span className="chip bg-mist">{states[r.status]}</span></div><p className="text-sm">{r.reason==="contact" ? "El contacto no funciona" : r.reason==="hours" ? "Revisar horario" : "Revisar información"} · {date(r.createdAt)}{r.synthetic ? " · Caso ficticio" : ""}</p>{r.resolution&&<p className="text-sm text-ink/65">{r.resolution}</p>}{r.status==="pending"&&<div className="flex flex-wrap gap-2">{(["resolved","dismissed"] as const).map(target=><button className="btn btn-ghost" key={target} type="button" onClick={()=>review({title:target==="resolved" ? "Resolver reporte" : "Descartar reporte",description:"Registra lo comprobado y la fuente consultada. Esta decisión no cambia el contacto por sí sola.",label:"Guardar resolución",submit:reason=>resolve({token,reportId:r._id,status:target,reason})})}>{target==="resolved" ? "Resolver" : "Descartar"}</button>)}</div>}</article>)}{!results.length&&status!=="LoadingFirstPage"&&<Empty>No hay reportes de contacto.</Empty>}<More status={status} loadMore={loadMore}/></div>;
}

function Team({token,review}:{token:string;review:(r:Review)=>void}) {
  const rows=useQuery(api.admin.team,{token});
  const save=useMutation(api.admin.setModerator);
  const [email,setEmail]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  async function add(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{await save({token,email,active:true});setEmail("");toast.success("Permiso de moderación guardado");}catch(e){setError(errorMessage(e,"No se pudo añadir al equipo."));}finally{setBusy(false);}}
  return <div className="space-y-4"><h2 className="text-2xl">Tu equipo de moderación</h2><p className="text-sm text-ink/70">Añade su correo. Al entrar con ese mismo correo verificado de Google tendrá acceso al panel. No se envía un correo automático. Puede revisar notas, gestionar reportes y suspender participantes; solo tú administras permisos y demo.</p><div className="card flex items-center gap-3 bg-mist p-4"><ShieldCheck className="h-6 w-6 shrink-0"/><div className="min-w-0"><p className="text-xs font-bold">Administración principal</p><p className="break-all text-sm">{OWNER_EMAIL}</p></div></div><form className="card space-y-3 p-4" onSubmit={add}><label className="label" htmlFor="moderator-email">Correo del moderador</label><input id="moderator-email" className="field" type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254} placeholder="persona@gmail.com"/>{error&&<p role="alert" className="text-sm">{error}</p>}<button type="submit" className="btn btn-ink w-full" disabled={busy}>{busy ? "Guardando…" : "Añadir moderador"}</button></form>
    {rows?.map(row=><div className="card flex flex-wrap items-center justify-between gap-3 p-4" key={row._id}><div className="min-w-0"><p className="break-all text-sm font-bold">{row.email}</p><p className="text-xs text-ink/65">{row.active ? "Moderador activo" : "Permiso retirado"}</p></div><button type="button" className="btn btn-ghost min-h-10 text-xs" onClick={()=>review({title:row.active ? "Retirar permiso" : "Restablecer permiso",description:row.active ? "Perderá acceso al panel inmediatamente, también en sesiones abiertas. Su cuenta del juego se conserva." : "Recuperará el acceso al panel con su cuenta verificada.",label:row.active ? "Retirar permiso" : "Restablecer",submit:()=>save({token,email:row.email,active:!row.active})})}>{row.active ? "Retirar permiso" : "Restablecer"}</button></div>)}
  </div>;
}
function Activity({token}:{token:string}) {
  const {results,status,loadMore}=usePaginatedQuery(api.admin.activity,{token},{initialNumItems:25});
  return <div className="space-y-3"><h2 className="text-2xl">Historial de decisiones</h2>{results.map(row=><article className="card space-y-2 p-4" key={row._id}><div className="flex flex-wrap justify-between gap-2 text-xs font-bold"><span>{row.action}{row.demo ? " · Demo" : ""}</span><span>{date(row.createdAt)}</span></div><p className="text-sm">{row.reason}</p><p className="break-all text-xs text-ink/65">{row.actorEmail} · {row.target}</p></article>)}{!results.length&&status!=="LoadingFirstPage"&&<Empty>Las decisiones del equipo aparecerán aquí.</Empty>}<More status={status} loadMore={loadMore}/></div>;
}

function Workspace({token,access}:{token:string;access:Access}) {
  const [tab,setTab]=useState("Resumen");
  const [review,setReview]=useState<Review|null>(null);
  const [busy,setBusy]=useState(false);
  const setDemo=useMutation(api.admin.setDemo);
  const resetDemo=useMutation(api.admin.resetDemo);
  const tabs=["Resumen","Notas","Usuarios","Contactos",...(access.role==="admin" ? ["Equipo"] : []),"Historial"];
  const panels:Record<string,ReactNode>={Resumen:<Overview token={token}/>,Notas:<Notes token={token} review={setReview}/>,Usuarios:<UsersPanel token={token} review={setReview}/>,Contactos:<Channels token={token} demo={access.demo} owner={access.role==="admin"} review={setReview}/>,Equipo:access.role==="admin" ? <Team token={token} review={setReview}/> : null,Historial:<Activity token={token}/>};
  async function toggleDemo(){setBusy(true);try{await setDemo({token,enabled:!access.demo});toast.success(access.demo ? "Volviste a producción" : "Demo lista para tu pitch");}catch(e){toast.error(errorMessage(e,"No se pudo cambiar de entorno."));}finally{setBusy(false);}}
  return <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 pb-12 sm:px-6"><header className="flex flex-wrap items-center justify-between gap-3"><Brand compact/><Link to="/casa" className="btn btn-ghost"><ArrowLeft className="h-4 w-4"/>Volver al juego</Link></header><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="label">Cuidado de la comunidad</p><h1 className="mt-2 text-3xl sm:text-4xl">Panel de administración</h1><p className="mt-2 break-all text-xs text-ink/65">{access.email} · {access.role==="admin" ? "Administración" : "Moderación"}</p></div>{access.role==="admin"&&<button type="button" role="switch" aria-checked={access.demo} aria-label="Modo demo" className={`btn ${access.demo ? "btn-ink" : "btn-ghost"}`} disabled={busy} onClick={toggleDemo}><FlaskConical className="h-4 w-4"/>{busy ? "Cambiando…" : access.demo ? "Demo activada" : "Activar demo"}</button>}</div>
    <p className={`rounded-xl border-2 border-ink px-4 py-3 text-sm font-bold ${access.demo ? "bg-mango" : "bg-mist"}`}>{access.demo ? "DEMO · Datos ficticios. Tu cuenta real y los demás participantes siguen separados." : "PRODUCCIÓN · Participantes reales, sin NPC y con 48 horas por visita."}</p>
    {access.demo && access.role==="admin" && <div className="flex flex-wrap items-center gap-3"><Link to="/casa" className="btn btn-ink">Mostrar la demo</Link><button className="btn btn-ghost" type="button" onClick={()=>setReview({title:"Preparar el pitch de nuevo",description:"Reinicia únicamente tus datos ficticios: vuelven las libretas decoradas, dos visitas al buzón y tres peluches en viaje. Tu recorrido real se conserva.",label:"Reiniciar presentación",submit:()=>resetDemo({token})})}>Reiniciar presentación</button></div>}
    <nav className="flex flex-wrap gap-2" aria-label="Administración">{tabs.map(label=><button key={label} type="button" className={`btn min-h-10 px-3 text-sm ${tab===label ? "btn-ink" : "btn-ghost"}`} aria-pressed={tab===label} onClick={()=>setTab(label)}>{label==="Notas"&&<MessageSquare className="h-4 w-4"/>}{label==="Usuarios"&&<Users className="h-4 w-4"/>}{label==="Historial"&&<ClipboardList className="h-4 w-4"/>}{label}</button>)}</nav>
    {panels[tab]}
    {review&&<ReviewDialog review={review} close={()=>setReview(null)}/>}
  </div>;
}

export default function Admin() {
  const token=useToken();
  const access=useQuery(api.admin.access,{token});
  if(access===undefined)return <p role="status" className="p-6">Comprobando acceso…</p>;
  if(!access)return <div className="mx-auto max-w-md space-y-4 p-6"><ShieldCheck className="h-10 w-10"/><h1 className="text-3xl">Acceso del equipo</h1><p className="text-sm">Este panel requiere una cuenta de Google verificada con permiso de administración o moderación.</p><Link className="btn btn-ink" to="/perfil">Ir a mi cuenta</Link></div>;
  return <Workspace key={String(access.demo)} token={token} access={access}/>;
}
