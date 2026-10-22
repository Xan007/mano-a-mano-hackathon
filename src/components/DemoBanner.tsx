import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { FlaskConical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { useSession } from "../lib/session";
import { errorMessage } from "../lib/errors";

export function DemoBanner() {
  const { token } = useSession();
  const me = useQuery(api.auth.me, token ? { token } : "skip");
  const change = useMutation(api.admin.setDemo);
  const [busy, setBusy] = useState(false);

  if (!me || !token) return null;

  async function leave() {
    setBusy(true);
    try {
      await change({ token: token!, enabled: false });
    } catch (error) {
      toast.error(errorMessage(error, "No pudimos cambiar de entorno."));
    } finally {
      setBusy(false);
    }
  }

  if (me.isDemo) {
    return (
      <div className="flex min-h-6 items-center justify-center gap-2 overflow-hidden bg-mango px-2 py-1 text-[11px] font-bold leading-none sm:text-xs">
        <Link to="/admin" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
          <FlaskConical className="h-3 w-3" aria-hidden="true" />
          Demo privada
        </Link>
        <button type="button" onClick={leave} disabled={busy} className="shrink-0 whitespace-nowrap underline">
          {busy ? "Cambiando…" : "Volver a mi cuenta"}
        </button>
      </div>
    );
  }

  if (!me.publicDemo) return null;

  return (
    <div className="flex min-h-6 items-center justify-center gap-1.5 overflow-hidden bg-mango px-2 py-1 text-[11px] font-bold leading-none sm:text-xs">
      <FlaskConical className="h-3 w-3 shrink-0" aria-hidden="true" />
      <Link to="/admin" className="whitespace-nowrap underline underline-offset-2">Demo compartida</Link>
    </div>
  );
}
