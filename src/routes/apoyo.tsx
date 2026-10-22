import { SupportQuestions } from "../components/SupportQuestions";
import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { Check, Copy, ExternalLink, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { SUPPORT_CHANNELS } from "../../config/support";
import { api } from "../../convex/_generated/api";
import { Brand } from "../components/Brand";
import { useSession } from "../lib/session";

function prettyPhone(phone: string) {
  if (phone === "018000931089") return "01 8000 931 089";
  return phone;
}

function prettyWhatsapp(whatsapp: string) {
  const national = whatsapp.slice(-10);
  return national.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
}

function reviewedDate(date: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function ChannelCard({ id }: { id: string }) {
  const {token} = useSession();
  const channels = useQuery(api.channels.list);
  const channel = (channels ?? SUPPORT_CHANNELS.map(item => ({...item, paused:false}))).find((item) => item.id === id)!;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState(false);
  const report = useMutation(api.places.reportChannel);
  if (channels === undefined) return <article className="card p-5"><p role="status" className="text-sm text-ink/65">Cargando contacto…</p></article>;
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${channel.name}: ${prettyPhone(channel.phone)}${channel.whatsapp ? `. WhatsApp ${prettyWhatsapp(channel.whatsapp)}` : ""}. ${channel.methods}. ${channel.cost}. ${channel.hours}.`,
      );
      setCopied(true);
      setError("");
    } catch {
      setError("No se pudo copiar. Intenta de nuevo.");
    }
  }
  async function reportIssue() {
    setBusy(true);
    setError("");
    try {
      await report({ channelId: channel.id, reason: "contact", token: token ?? undefined });
      setReported(true);
    } catch {
      setError("No se guardó el reporte. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="card space-y-4 bg-paper p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label">
            {id === "local" ? "Villavicencio" : "Colombia"}
          </p>
          <h2 className="mt-1 text-2xl">{channel.name}</h2>
        </div>
        <Phone className="h-6 w-6 shrink-0" aria-hidden="true" />
      </div>
      <p className="text-sm text-ink/75">
        {id === "local"
          ? "Orientación por llamada o WhatsApp."
          : "Escucha y orientación profesional por llamada."}
      </p>
      <p className="font-display text-3xl font-extrabold">{prettyPhone(channel.phone)}</p>
      {channel.whatsapp && (
        <p className="-mt-3 text-sm font-semibold text-ink/70">
          WhatsApp: {prettyWhatsapp(channel.whatsapp)}
        </p>
      )}
      <p className="text-sm font-semibold">
        {channel.cost} · {channel.hours}
      </p>
      {channel.paused ? <p role="status" className="rounded-xl bg-sand p-3 text-sm">Este contacto está en revisión. Puedes consultar las otras opciones de apoyo.</p> : <div className="flex flex-wrap gap-2">
        {channel.whatsapp && (
          <a
            href={`https://wa.me/${channel.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ink flex-1"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        )}
        <a
          href={`tel:${channel.phone}`}
          className={`btn ${channel.whatsapp ? "btn-ghost" : "btn-ink"} flex-1`}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Llamar
        </a>
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={copy}
          disabled={channel.paused}
          className="inline-flex min-h-11 items-center gap-2 text-xs font-bold"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copiado" : "Compartir contacto"}
        </button>
        <button
          type="button"
          onClick={reportIssue}
          disabled={busy || reported}
          className="min-h-11 text-xs text-ink/65 underline"
        >
          {reported
            ? "Reporte enviado"
            : busy
              ? "Enviando…"
              : "¿El contacto no funciona?"}
        </button>
      </div>
      <div className="space-y-2 border-t border-ink/10 pt-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink/65">
          <ShieldCheck className="h-4 w-4 shrink-0 text-lagoon" aria-hidden="true" />
          Dato cotejado · {reviewedDate(channel.checkedAt)}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
          <a href={channel.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-2">
            {id === "local" ? "Alcaldía · contacto" : "Ministerio · línea 106"}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          {"hoursSourceUrl" in channel && channel.hoursSourceUrl && (
            <a href={channel.hoursSourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1 underline underline-offset-2">
              Ministerio · horario
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
      <p role="status" className="text-xs text-ink/70">
        {error ||
          (reported
            ? "Gracias. Revisaremos el contacto."
            : copied
              ? "Contacto copiado."
              : "")}
      </p>
    </article>
  );
}

export function SupportContent() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/75">
        Escucha y orientación humana. Tú decides si contactas.
      </p>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        {SUPPORT_CHANNELS.map((channel) => (
          <ChannelCard key={channel.id} id={channel.id} />
        ))}
      </div>
      <SupportQuestions />
      <p className="text-xs text-ink/65">
        Mano a Mano es independiente y no brinda atención profesional.
      </p>
    </div>
  );
}

export default function Apoyo({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  return (
    <div
      className={
        standalone
          ? "mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6"
          : "space-y-5"
      }
    >
      {standalone && (
        <div className="flex items-center justify-between gap-3">
          <Link to="/" aria-label="Mano a Mano, ir al inicio"><Brand /></Link>
        </div>
      )}
      <h1 className="text-4xl">Opciones de apoyo</h1>
      <SupportContent />
    </div>
  );
}
