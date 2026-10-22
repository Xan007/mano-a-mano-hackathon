import { useEffect } from "react";
import { useSession as useGoogleSession } from "@clerk/react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../lib/session";

// Email/permissions come from Clerk on the server, never a submitted email field.
export function StaffIdentity() {
  const { token } = useSession();
  const { session } = useGoogleSession();
  const me = useQuery(api.auth.me, token ? { token } : "skip");
  const refresh = useAction(api.credentials.refreshIdentity);
  useEffect(() => {
    if (!token || !session || !me?.hasGoogle || me.bannedAt) return;
    let running = false;
    const check = async () => {
      if (running) return;
      running = true;
      try { const credential = await session.getToken(); if (credential) await refresh({ token, credential }); }
      catch { /* Keep ordinary access usable if the identity provider is offline. */ }
      finally { running = false; }
    };
    if (!me.identityVerifiedAt || Date.now() - me.identityVerifiedAt > 5 * 60_000) void check();
    const timer = window.setInterval(() => { void check(); }, 5 * 60_000);
    return () => window.clearInterval(timer);
  }, [token, session, refresh, me?.hasGoogle, me?.bannedAt, me?.identityVerifiedAt]);
  return null;
}
