import { useState, type FormEvent } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { errorMessage } from "../lib/errors";

export function AliasEditor({
  token,
  alias,
}: {
  token: string;
  alias: string;
}) {
  const update = useAction(api.players.updateAlias);
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? alias;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await update({ token, alias: value });
      setStatus("Apodo guardado.");
    } catch (caught) {
      setError(errorMessage(caught, "No pudimos guardar tu apodo."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="card space-y-3 p-5">
      <label htmlFor="edit-alias" className="label">
        Tu apodo
      </label>
      <input
        id="edit-alias"
        className="field"
        maxLength={24}
        value={value}
        onChange={(event) => setDraft(event.target.value)}
        disabled={busy}
        autoComplete="off"
        aria-describedby="edit-alias-help"
      />
      <p id="edit-alias-help" className="text-xs text-ink/70">
        Sin nombre completo ni datos personales. Lo revisamos antes de
        guardarlo.
      </p>
      <button
        type="submit"
        disabled={busy || value.trim().length < 3 || value.trim() === alias}
        className="btn btn-ink w-full"
      >
        {busy ? "Revisando…" : "Guardar apodo"}
      </button>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="text-sm">
          {status}
        </p>
      )}
    </form>
  );
}
