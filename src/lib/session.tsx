import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "manoamano.session";

type SessionValue = {
  token: string | null;
  start: (token: string) => void;
  clear: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const start = useCallback((next: string) => {
    localStorage.setItem(STORAGE_KEY, next);
    setToken(next);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("manoamano.onboarding-draft");
    const clerk = (window as Window & { Clerk?: { signOut?: () => Promise<unknown> } }).Clerk;
    void clerk?.signOut?.().catch(() => undefined);
    setToken(null);
  }, []);

  const value = useMemo(() => ({ token, start, clear }), [token, start, clear]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("SessionProvider missing");
  return value;
}

export function useToken(): string {
  const { token } = useSession();
  if (!token) throw new Error("Session missing");
  return token;
}
