import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Role = "admin" | "cashier";
export type Shift = "Mañana" | "Tarde" | "Noche";

export type SessionUser = {
  id: string;         
  name: string;
  role: Role;
  shift: Shift;
};

type SessionCtx = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  switchUser: (id: string) => void;
  quickLogin: (id: string) => Promise<void>; 
  logout: () => void;
  usersList: SessionUser[];
};

const SessionContext = createContext<SessionCtx | null>(null);

const STORAGE_KEY = "session.currentUserId";

const USERS: Record<
  string,
  { password: string; user: SessionUser }
> = {
  ADMIN:  { password: "ADMIN0001",   user: { id: "ADMIN",  name: "Administrador",  role: "admin",   shift: "Mañana" } },
  TURNO1: { password: "TURNO12025",  user: { id: "TURNO1", name: "Cajero Turno 1", role: "cashier", shift: "Mañana" } },
  TURNO2: { password: "TURNO22025",  user: { id: "TURNO2", name: "Cajero Turno 2", role: "cashier", shift: "Tarde"   } },
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    if (id && USERS[id]?.user) setUser(USERS[id].user);
  }, []);

  async function login(username: string, password: string) {
    const key = (username || "").trim().toUpperCase();
    const item = USERS[key];
    if (!item || item.password !== password) {
      throw new Error("Usuario o contraseña incorrectos");
    }
    setUser(item.user);
    localStorage.setItem(STORAGE_KEY, item.user.id);
  }

  function switchUser(id: string) {
    const key = (id || "").trim().toUpperCase();
    const item = USERS[key];
    if (!item) return;
    setUser(item.user);
    localStorage.setItem(STORAGE_KEY, item.user.id);
  }

  async function quickLogin(id: string) {
    const key = (id || "").trim().toUpperCase();
    const item = USERS[key];
    if (!item) throw new Error("Usuario no encontrado");
    setUser(item.user);
    localStorage.setItem(STORAGE_KEY, item.user.id);
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const usersList = useMemo(() => Object.values(USERS).map(x => x.user), []);
  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, login, switchUser, quickLogin, logout, usersList }),
    [user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
