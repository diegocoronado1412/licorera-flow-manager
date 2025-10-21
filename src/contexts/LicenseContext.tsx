// licorera-flow-manager/src/contexts/LicenseContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/hooks/api";

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
      console.log("🔍 Intentando obtener estado de licencia...");
      const { data: j } = await api.get("/api/license/status");
      
      console.log("✅ Estado de licencia recibido:", j);
      setIsActive(Boolean(j.active));
      setCode(j.license?.code ?? null);
      setExpiresAt(j.license?.expires_at ?? null);
      setDaysLeft(j.license?.days_left ?? null);
      return { active: Boolean(j.active), license: j.license ?? null };
    } catch (e: any) {
      console.error("❌ Error obteniendo estado de licencia:", e.message);
      console.error("   Detalles:", e.response?.data || e);
      setIsActive(false);
      setCode(null);
      setExpiresAt(null);
      setDaysLeft(null);
      return { active: false, license: null };
    }
  };

  useEffect(() => {
    console.log("🚀 LicenseProvider montado - iniciando verificación");
    fetchStatus();
    const interval = setInterval(() => {
      console.log("🔄 Refrescando estado de licencia...");
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const activateLicense = async (licenseCode: string) => {
    try {
      console.log("🔑 Activando licencia:", licenseCode);
      const { data } = await api.post("/api/license/activate", { code: licenseCode });
      console.log("✅ Licencia activada:", data);
      await fetchStatus();
    } catch (e: any) {
      console.error("❌ Error activando licencia:", e.message);
      const msg = e?.response?.data?.detail ?? e?.response?.data?.message ?? "Error al activar licencia";
      throw new Error(msg);
    }
  };

  const resetLicense = async () => {
    try {
      console.log("🔄 Reseteando licencia...");
      const { data } = await api.post("/api/license/reset");
      console.log("✅ Licencia reseteada:", data);
      await fetchStatus();
    } catch (e: any) {
      console.error("❌ Error reseteando licencia:", e.message);
      const msg = e?.response?.data?.detail ?? "Error al resetear licencia";
      throw new Error(msg);
    }
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