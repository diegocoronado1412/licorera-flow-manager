import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchSettings, updateSettings, type AppSettings } from "@/hooks/api";

type Ctx = {
  settings: AppSettings | null;
  refresh: () => Promise<void>;
  save: (patch: Partial<AppSettings>) => Promise<void>;
};

const SettingsCtx = createContext<Ctx>({ settings: null, refresh: async () => {}, save: async () => {} });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  async function refresh() {
    const s = await fetchSettings();
    setSettings(s);
    document.title = s.business.name || "Licorera";
    const root = document.documentElement;
    if (s.appearance.theme === "light") root.classList.add("light"); else root.classList.remove("light");
  }

  async function save(patch: Partial<AppSettings>) {
    const s = await updateSettings(patch);
    setSettings(s);
    document.title = s.business.name || "Licorera";
    const root = document.documentElement;
    if (s.appearance.theme === "light") root.classList.add("light"); else root.classList.remove("light");
  }

  useEffect(() => { refresh().catch(() => {}); }, []);

  return <SettingsCtx.Provider value={{ settings, refresh, save }}>{children}</SettingsCtx.Provider>;
}

export function useSettings() { return useContext(SettingsCtx); }
