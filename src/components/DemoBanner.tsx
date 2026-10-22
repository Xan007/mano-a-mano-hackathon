import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { FlaskConical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { useSession } from "../lib/session";
import { errorMessage } from "../lib/errors";

export function DemoBanner() {
  const {token}=useSession();
  const me=useQuery(api.auth.me,token ? {token} : "skip");
  const change=useMutation(api.admin.setDemo);
  const [busy,setBusy]=useState(false);
  if(!me?.isDemo || !token)return null;
  async function leave(){setBusy(true);try{await change({token:token!,enabled:false});}catch(e){toast.error(errorMessage(e,"No pudimos cambiar de entorno."));}finally{setBusy(false);}}
  return <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-mango px-3 py-1 text-xs font-bold"><Link to="/admin" className="inline-flex min-h-8 items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5"/>Demo · Datos ficticios</Link><button type="button" onClick={leave} disabled={busy} className="min-h-8 underline">{busy ? "Cambiando…" : "Volver a producción"}</button></div>;
}
