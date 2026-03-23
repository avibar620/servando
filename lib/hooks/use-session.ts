"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT" | "CLIENT";
  locale: string;
  agentStatus?: string | null;
  businessId?: string | null;
}

interface SessionCtx {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export { SessionContext };
export type { User };

/** Standalone hook for pages that don't use the provider */
export function useSessionFetch() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { user, loading, refresh, logout };
}
