import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats } from "@/hooks/api";
import { useSettings } from "@/contexts/SettingsContext";

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  level: "info" | "warning" | "success";
};

const STORAGE_HASH_KEY = "notif.lastHash";

export function useNotifications() {
  const { settings } = useSettings();
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", "notifications"],
    queryFn: fetchDashboardStats,
    refetchInterval: 60_000,
  });

  const items: NotificationItem[] = useMemo(() => {
    if (!stats) return [];

    const list: NotificationItem[] = [];

    // Stock bajo (si está activado en configuración)
    if (settings?.alerts.stock_low && stats.low_stock?.length) {
      const names = stats.low_stock.slice(0, 3).map(s => s.name).join(", ");
      const extra = stats.low_stock.length > 3 ? ` y ${stats.low_stock.length - 3} más` : "";
      list.push({
        id: "low_stock",
        title: `Stock bajo: ${stats.low_stock.length} productos`,
        description: `${names}${extra}`,
        level: "warning",
      });
    }

    // Ventas del día
    if (stats.today?.count && stats.today.count > 0) {
      list.push({
        id: "sales_today",
        title: `Ventas hoy: ${stats.today.count}`,
        description: `Total ${Math.round(stats.today.total).toLocaleString("es-CO", { style: "currency", currency: "COP" })}`,
        level: "success",
      });
    }

    // Top producto
    if (stats.top_products?.length) {
      const top = stats.top_products[0];
      list.push({
        id: "top_product",
        title: `Más vendido (30d): ${top.name}`,
        description: `${top.qty} uds · ${Math.round(top.revenue).toLocaleString("es-CO", { style: "currency", currency: "COP" })}`,
        level: "info",
      });
    }

    return list;
  }, [stats, settings]);

  // Unread basado en hash simple
  const currentHash = useMemo(() => JSON.stringify(items.map(i => i.id + (i.description || ""))), [items]);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    const last = localStorage.getItem(STORAGE_HASH_KEY);
    setUnread(last !== currentHash && items.length > 0);
  }, [currentHash, items.length]);

  const markAllRead = () => {
    localStorage.setItem(STORAGE_HASH_KEY, currentHash);
    setUnread(false);
  };

  return { items, unread, markAllRead };
}
