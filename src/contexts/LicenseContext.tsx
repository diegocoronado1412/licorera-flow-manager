// licorera-flow-manager/src/contexts/LicenseContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";

interface LicenseContextType {
  isActive: boolean;
  expiresAt: string | null;
  activateLicense: (code: string) => Promise<void>;
  resetLicense: () => Promise<void>;
  fetchStatus: () => Promise<{ active: boolean; license: any }>;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/license/status");
      if (!res.ok) {
        setIsActive(false);
        setExpiresAt(null);
        return { active: false, license: null };
      }
      const j = await res.json();
      setIsActive(Boolean(j.active));
      setExpiresAt(j.license?.expires_at ?? null);
      return { active: Boolean(j.active), license: j.license ?? null };
    } catch (e) {
      setIsActive(false);
      setExpiresAt(null);
      return { active: false, license: null };
    }
  };

  useEffect(() => {
    // cargar estado inicial y refrescar en background
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // cada 10s
    return () => clearInterval(interval);
  }, []);

  const activateLicense = async (code: string) => {
    const res = await fetch("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      // intenta leer mensaje de error
      let j: any = null;
      try { j = await res.json(); } catch (e) { /* ignore */ }
      const msg = j?.detail ?? j?.message ?? "Error al activar licencia";
      throw new Error(msg);
    }

    // Si todo OK, refrescamos el estado y esperamos a que setState se aplique
    await fetchStatus();
  };

  const resetLicense = async () => {
    const res = await fetch("/api/license/reset", { method: "POST" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({ detail: "Error" }));
      throw new Error(j.detail || "Error al resetear licencia");
    }
    await fetchStatus();
  };

  return (
    <LicenseContext.Provider value={{ isActive, expiresAt, activateLicense, resetLicense, fetchStatus }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) throw new Error("useLicense debe usarse dentro de LicenseProvider");
  return context;
};
