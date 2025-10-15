// licorera-flow-manager/src/contexts/LicenseContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";

interface LicenseContextType {
  isActive: boolean;
  code: string | null;
  expiresAt: string | null;
  daysLeft: number | null;
  activateLicense: (code: string) => Promise<void>;
  resetLicense: () => Promise<void>;
  fetchStatus: () => Promise<{ active: boolean; license: any }>;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/license/status");
      if (!res.ok) {
        setIsActive(false);
        setCode(null);
        setExpiresAt(null);
        setDaysLeft(null);
        return { active: false, license: null };
      }
      const j = await res.json();
      setIsActive(Boolean(j.active));
      setCode(j.license?.code ?? null);
      setExpiresAt(j.license?.expires_at ?? null);
      setDaysLeft(j.license?.days_left ?? null);
      return { active: Boolean(j.active), license: j.license ?? null };
    } catch (e) {
      setIsActive(false);
      setCode(null);
      setExpiresAt(null);
      setDaysLeft(null);
      return { active: false, license: null };
    }
  };

  useEffect(() => {
    // cargar estado inicial y refrescar cada 10 segundos
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const activateLicense = async (licenseCode: string) => {
    const res = await fetch("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: licenseCode }),
    });

    if (!res.ok) {
      let j: any = null;
      try { j = await res.json(); } catch (e) {}
      const msg = j?.detail ?? j?.message ?? "Error al activar licencia";
      throw new Error(msg);
    }

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
    <LicenseContext.Provider value={{ isActive, code, expiresAt, daysLeft, activateLicense, resetLicense, fetchStatus }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) throw new Error("useLicense debe usarse dentro de LicenseProvider");
  return context;
};
