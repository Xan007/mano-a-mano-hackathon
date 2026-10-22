import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAction, useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, Palette, Send } from "lucide-react";
import { toast } from "sonner";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import { PlushArt } from "../components/PlushArt";
import { NoteCard } from "../components/NoteCard";
import { PositiveNotePicker } from "../components/PositiveNotePicker";
import { useToken } from "../lib/session";
import { TravelCancelled, useTravel } from "../lib/travel";
import { errorMessage } from "../lib/errors";
import { NOTE_MAX_CHARS } from "../../config/operations";

type OwnedPlush = FunctionReturnType<typeof api.plush.getMyPlushes>[number];

function WriteAndSend({ item, canChange, onChange }: {
  item: OwnedPlush;
  canChange: boolean;
  onChange: () => void;
}) {
  const token = useToken();
  const travel = useTravel();
  const navigate = useNavigate();
  const send = useAction(api.plush.send);
  const me = useQuery(api.auth.me, { token });
  const styles = useQuery(api.noteStyles.list, { token });
  const draftKey = `manoamano.demo-note.${item._id}`;
  const [note, setNote] = useState(() => (sessionStorage.getItem(draftKey) ?? "").slice(0, NOTE_MAX_CHARS));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (note) sessionStorage.setItem(draftKey, note);
    else sessionStorage.removeItem(draftKey);
  }, [draftKey, note]);

  async function submit() {
    setBusy(true);
    try {
      await travel({
        note,
        imagePath: item.catalog?.imagePath,
        name: item.catalog?.species ?? "Tu peluche",
      }, () => send({ token, plushId: item._id, note }));
      sessionStorage.removeItem(draftKey);
      toast.success("Tu peluche salió de viaje. Síguelo desde Casa.");
      navigate("/casa");
    } catch (caught) {
      if (!(caught instanceof TravelCancelled)) {
        toast.error(errorMessage(caught, "No pudimos enviar el peluche"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b-2 border-ink bg-mist p-4">
        <PlushArt imagePath={item.catalog?.imagePath} alt="" size="sm" className="h-16 w-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="label">Listo para viajar</p>
          <h2 className="mt-1 text-2xl">{item.catalog?.species ?? "Tu peluche"}</h2>
        </div>
        {canChange && <button type="button" disabled={busy} onClick={onChange} className="min-h-11 rounded-xl px-2 text-xs font-bold underline">Cambiar</button>}
      </div>
      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-2">
        <PositiveNotePicker value={note} onChange={setNote} />
        <div className="space-y-3">
          <p className="label">Así viajará tu nota</p>
          <NoteCard
            body={note || "Tus palabras amables viajarán con este peluche."}
            alias={me?.alias ?? "Tú"}
            coverId={styles?.cover}
            effectId={styles?.effect}
          />
          <Link to="/taller" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold underline">
            <Palette className="h-4 w-4" aria-hidden="true" />Decorar mi nota
          </Link>
        </div>
        <button type="button" disabled={busy || !note.trim()} onClick={submit} className="btn btn-guava w-full lg:col-span-2">
          <Send className="h-4 w-4" aria-hidden="true" />
          {busy ? "Preparando el viaje…" : "Revisar y enviar de viaje"}
        </button>
      </div>
    </section>
  );
}

export default function Enviar() {
  const token = useToken();
  const plushes = useQuery(api.plush.getMyPlushes, { token });
  const [params, setParams] = useSearchParams();
  const [choosing, setChoosing] = useState(false);
  const ready = plushes?.filter((item) => item.status === "collection") ?? [];
  const selectedId = params.get("id");
  const selected = ready.find((item) => item._id === selectedId) ??
    (!selectedId && ready.length === 1 && !choosing ? ready[0] : null);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/casa" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />Casa
      </Link>
      <header>
        <h1 className="text-3xl sm:text-4xl">Enviar un peluche</h1>
        <p className="mt-2 text-sm text-ink/75">
          {selected ? "Escribe unas palabras amables. Tu peluche las llevará a otra persona." : "Elige quién llevará tu nota."}
        </p>
      </header>
      {plushes === undefined ? <p role="status">Buscando tus peluches…</p> :
        selected ? <WriteAndSend key={selected._id} item={selected} canChange={ready.length > 1} onChange={() => { setChoosing(true); setParams({}); }} /> :
        ready.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2" aria-label="Peluches listos para enviar">
            {ready.map((item) => (
              <button key={item._id} type="button" onClick={() => { setChoosing(false); setParams({ id: item._id }); }} className="tile flex items-center gap-3 bg-paper p-4 text-left">
                <PlushArt imagePath={item.catalog?.imagePath} alt="" size="sm" className="h-20 w-20 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-bold">{item.catalog?.species ?? "Peluche"}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-lagoon">Enviar de viaje<ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <section className="card space-y-4 bg-mist p-5">
            <h2 className="text-2xl">Vamos por otro compañero de viaje</h2>
            <p className="text-sm">Rescata un peluche en el mapa para enviarlo con una nota.</p>
            <Link to="/mapa" className="btn btn-ink">Rescatar un peluche<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </section>
        )}
    </div>
  );
}
