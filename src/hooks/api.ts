import axios from "axios";

export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE || window.location.origin;
export const ADMIN_KEY =
  (import.meta as any).env?.VITE_ADMIN_KEY || "CambiaEstaClave";

export const api = axios.create({ baseURL: API_BASE });

/* -------- Productos -------- */
export type Product = {
  id: number;
  name: string;
  price?: number;
  cost_per_unit?: number;
  stock: number;
};

export async function fetchProducts(q?: string) {
  const { data } = await api.get<Product[]>("/products", { params: { q } });
  return data;
}

export async function createProduct(data: {
  name: string; price: number; cost_per_unit: number; stock: number;
}) {
  const { data: res } = await api.post<Product>("/products", data, {
    headers: { "X-API-Key": ADMIN_KEY },
  });
  return res;
}

export async function updateProduct(
  product_id: number,
  patch: { name?: string; price?: number; cost_per_unit?: number }
) {
  const { data } = await api.put<Product>(`/products/${product_id}`, patch, {
    headers: { "X-API-Key": ADMIN_KEY },
  });
  return data;
}

export async function deleteProduct(product_id: number) {
  const { data } = await api.delete(`/products/${product_id}`, {
    headers: { "X-API-Key": ADMIN_KEY },
  });
  return data as { ok: boolean };
}

export async function adjustStock(product_id: number, qty: number, note?: string) {
  const { data } = await api.post(
    "/inventory/adjust", { product_id, qty, note },
    { headers: { "X-API-Key": ADMIN_KEY } }
  );
  return data as { ok: boolean; new_stock: number };
}

/* -------- Ventas / Stats -------- */
export async function createSale(payload: {
  items: Array<{ product_id: number; qty: number }>;
  discount_pct?: number;
  discount_abs?: number;
  apply_tax?: boolean;
  cash?: number;
}) {
  const { data } = await api.post("/sales", payload);
  return data as { ok: boolean; sale_id: number; total: number };
}

export type DashboardStats = {
  today: { total: number; count: number };
  yesterday: { total: number; count: number };
  this_month: { total: number; count: number };
  last_month: { total: number; count: number };
  products_count: number;
  low_stock: Array<{ id: number; name: string; stock: number }>;
  top_products: Array<{ product_id: number; name: string; qty: number; revenue: number }>;
};
export async function fetchDashboardStats() {
  const { data } = await api.get<DashboardStats>("/stats/dashboard");
  return data;
}

/* -------- Settings -------- */
export type AppSettings = {
  business: { name: string; phone?: string | null; address?: string | null; nit?: string | null; receipt_header: string; receipt_footer: string; };
  taxes: { vat_percent: number; prices_include_vat: boolean; round_to: 0|50|100 };
  inventory: { low_stock_threshold: number; allow_negative_stock: boolean; default_cost_method: "unit" };
  pos: { payment_methods: string[]; max_discount_pct: number; require_discount_pin: boolean; printer_width: number; favorites: number[] };
  alerts: { stock_low: boolean; daily_summary: boolean; summary_email?: string | null };
  appearance: { theme: "dark"|"light"; density: "comfortable"|"compact" };
};
export type AppSettingsUpdate = Partial<AppSettings>;

export async function fetchSettings() {
  const { data } = await api.get<AppSettings>("/settings");
  return data;
}
export async function updateSettings(patch: AppSettingsUpdate) {
  const { data } = await api.put<AppSettings>("/settings", patch, {
    headers: { "X-API-Key": ADMIN_KEY },
  });
  return data;
}
