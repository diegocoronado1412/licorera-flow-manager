// contexts/LicenseContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";

interface LicenseContextType {
  isActive: boolean;
  expiresAt: string | null;
  activateLicense: (code: string) => Promise<void>;
  resetLicense: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/license/status");
      const j = await res.json();
      setIsActive(Boolean(j.active));
      setExpiresAt(j.license?.expires_at ?? null);
    } catch (e) {
      setIsActive(false);
      setExpiresAt(null);
    }
  };

  useEffect(() => {
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
      const j = await res.json().catch(() => ({ detail: "Error" }));
      throw new Error(j.detail || "Error al activar licencia");
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
    <LicenseContext.Provider value={{ isActive, expiresAt, activateLicense, resetLicense }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) throw new Error("useLicense debe usarse dentro de LicenseProvider");
  return context;
};
