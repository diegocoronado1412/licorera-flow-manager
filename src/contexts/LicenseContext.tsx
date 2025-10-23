// src/contexts/LicenseContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/hooks/api";

interface LicenseContextType {
  isActive: boolean;
  isLoading: boolean; // ← NUEVO
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
  const [isLoading, setIsLoading] = useState(true); // ← NUEVO
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  const fetchStatus = async () => {
    try {
      console.log("🔍 Verificando estado de licencia...");
      setIsLoading(true); // ← NUEVO
      const { data: j } = await api.get("/api/license/status");
      
      console.log("✅ Estado de licencia recibido:", j);
      setIsActive(Boolean(j.active));
      setCode(j.license?.code ?? null);
      setExpiresAt(j.license?.expires_at ?? null);
      setDaysLeft(j.license?.days_left ?? null);
      return { active: Boolean(j.active), license: j.license ?? null };
    } catch (e: any) {
      console.error("❌ Error obteniendo estado de licencia:", e.message);
      setIsActive(false);
      return { active: false, license: null };
    } finally {
      setIsLoading(false); // ← NUEVO
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const activateLicense = async (licenseCode: string) => {
    try {
      console.log("🔑 Activando licencia:", licenseCode);
      const { data } = await api.post("/api/license/activate", { code: licenseCode });
      console.log("✅ Licencia activada:", data);
      await fetchStatus();
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? "Error al activar licencia";
      throw new Error(msg);
    }
  };

  const resetLicense = async () => {
    try {
      const { data } = await api.post("/api/license/reset");
      await fetchStatus();
    } catch (e: any) {
      throw new Error(e?.response?.data?.detail ?? "Error al resetear");
    }
  };

  return (
    <LicenseContext.Provider 
      value={{ 
        isActive, 
        isLoading, // ← NUEVO
        code, 
        expiresAt, 
        daysLeft, 
        activateLicense, 
        resetLicense, 
        fetchStatus 
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) throw new Error("useLicense debe usarse dentro de LicenseProvider");
  return context;
};