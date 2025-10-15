import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Role = "admin" | "cashier";
export type Shift = "Mañana" | "Tarde" | "Noche" | null;

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
  shift: Shift;
};

type SessionCtx = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<SessionUser>;
  switchUser: (id: string) => SessionUser | undefined;
  quickLogin: (id: string) => Promise<SessionUser>;
  logout: () => void;
  usersList: SessionUser[];
};

const SessionContext = createContext<SessionCtx | null>(null);

const STORAGE_KEY = "session.currentUserId";

const USERS: Record<string, { password: string; user: SessionUser }> = {
  ADMIN: {
    password: "ADMIN0001",
    user: { id: "ADMIN", name: "Administrador", role: "admin", shift: "Mañana" },
  },
  TURNO1: {
    password: "TURNO12025",
    user: { id: "TURNO1", name: "Cajero Turno 1", role: "cashier", shift: "Mañana" },
  },
  TURNO2: {
    password: "TURNO22025",
    user: { id: "TURNO2", name: "Cajero Turno 2", role: "cashier", shift: "Tarde" },
  },
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  // 🔹 Cargar sesión al iniciar
  useEffect(() => {
    try {
      const id = localStorage.getItem(STORAGE_KEY);
      if (id && USERS[id]?.user) {
        setUser(USERS[id].user);
      }
    } catch {
      // ignorar errores de almacenamiento
    }
  }, []);

  // 🔹 Iniciar sesión
  async function login(username: string, password: string): Promise<SessionUser> {
    const key = (username || "").trim().toUpperCase();
    const item = USERS[key];
    if (!item || item.password !== password) {
      throw new Error("Usuario o contraseña incorrectos");
    }

    localStorage.setItem(STORAGE_KEY, item.user.id);
    setUser(item.user);

    // Esperar un breve instante para asegurar sincronización con el contexto
    await new Promise((resolve) => setTimeout(resolve, 50));

    return item.user;
  }

  // 🔹 Cambiar usuario (modo rápido)
  function switchUser(id: string): SessionUser | undefined {
    const key = (id || "").trim().toUpperCase();
    const item = USERS[key];
    if (!item) return;
    localStorage.setItem(STORAGE_KEY, item.user.id);
    setUser(item.user);
    return item.user;
  }

  // 🔹 Ingreso directo por ID
  async function quickLogin(id: string): Promise<SessionUser> {
    const key = (id || "").trim().toUpperCase();
    const item = USERS[key];
    if (!item) throw new Error("Usuario no encontrado");

    localStorage.setItem(STORAGE_KEY, item.user.id);
    setUser(item.user);

    await new Promise((resolve) => setTimeout(resolve, 50));

    return item.user;
  }

  // 🔹 Cerrar sesión
  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const usersList = useMemo(() => Object.values(USERS).map((x) => x.user), []);

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
