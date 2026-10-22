import { MessageCircle, Phone } from "lucide-react";
import { cn } from "../lib/utils";

export type ServicePlace = {
  _id: string;
  slug?: string;
  name: string;
  kind: string;
  whatItIs: string;
  cost?: string | null;
  howToContact: string;
  hours?: string | null;
  whatHappens?: string | null;
  source: string;
  sourceDate: string;
};

function whatsappLink(contact: string): string | null {
  const digits = contact.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.startsWith("57") ? digits : `57${digits}`}`;
}

export function ServiceCard({
  place,
  className,
}: {
  place: ServicePlace;
  className?: string;
}) {
  const isWhatsApp = place.kind === "linea_whatsapp";
  const link = isWhatsApp ? whatsappLink(place.howToContact) : null;
  const Icon = isWhatsApp ? MessageCircle : Phone;

  return (
    <article className={cn("card-tight overflow-hidden", className)}>
      <div className="flex items-start gap-3 border-b-2 border-ink bg-mist p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-[#fffdf7]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold leading-tight">{place.name}</h3>
          <p className="mt-0.5 text-sm text-ink/75">{place.whatItIs}</p>
        </div>
      </div>

      <dl className="grid gap-2 p-4 text-sm sm:grid-cols-2">
        {place.cost && (
          <div>
            <dt className="label">Costo</dt>
            <dd className="font-semibold">{place.cost}</dd>
          </div>
        )}
        <div>
          <dt className="label">Contacto</dt>
          <dd className="font-semibold">{place.howToContact}</dd>
        </div>
        {place.hours && (
          <div>
            <dt className="label">Horario</dt>
            <dd className="font-semibold">{place.hours}</dd>
          </div>
        )}
        {place.whatHappens && (
          <div className="sm:col-span-2">
            <dt className="label">Qué pasa cuando escribes</dt>
            <dd>{place.whatHappens}</dd>
          </div>
        )}
      </dl>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-ink/15 px-4 py-3">
        <p className="text-[11px] font-medium text-ink/60">
          Fuente: {place.source} · {place.sourceDate}
        </p>
        {link && (
          <a href={link} target="_blank" rel="noreferrer" className="btn btn-ghost px-3 py-1.5 text-xs">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Abrir WhatsApp
          </a>
        )}
      </footer>
    </article>
  );
}
