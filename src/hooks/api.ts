// LICORERA/licorera-flow-manager/src/hooks/api.ts
import axios, { AxiosError } from "axios";

/**
 * Normaliza VITE_API_BASE para desarrollo y producción (Tauri)
 */
function normalizeApiBase(raw?: string) {
  // 🔥 CRÍTICO: Detectar si estamos en Tauri
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  
  if (isTauri) {
    // En Tauri SIEMPRE usamos localhost:8000
    console.log("🔧 Tauri detectado - usando http://127.0.0.1:8000");
    return "http://127.0.0.1:8000";
  }

  // En desarrollo web normal
  if (!raw) {
    console.log("🌐 Modo web - usando proxy /api");
    return "/api"; // Usa el proxy de Vite
  }

  // Si hay VITE_API_BASE definido, usarlo
  console.log("📝 Usando VITE_API_BASE:", raw);
  return raw.replace(/\/+$/, "");
}

export const API_BASE = normalizeApiBase((import.meta as any).env?.VITE_API_BASE);
export const ADMIN_KEY = (import.meta as any).env?.VITE_ADMIN_KEY || "CambiaEstaClave";

console.log("✅ API_BASE configurado:", API_BASE);

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Interceptor para debug
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("❌ Response error:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

/**
 * Manejo central de errores Axios
 */
function handleAxiosError(err: unknown, fallbackMessage = "Error desconocido") {
  if (axios.isAxiosError(err)) {
    return new Error(
      (err.response && (err.response as any).data && ((err.response as any).data.detail || (err.response as any).data.message)) ||
      err.message ||
      fallbackMessage
    );
  }
  return new Error(fallbackMessage);
}

/* -------- Productos -------- */
export type Product = {
  id: number;
  name: string;
  price?: number;
  cost_per_unit?: number;
  stock: number;
};

export async function fetchProducts(q?: string) {
  try {
    const { data } = await api.get<Product[]>("/products", { params: { q } });
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error cargando productos");
  }
}

export async function createProduct(data: {
  name: string;
  price: number;
  cost_per_unit: number;
  stock: number;
}) {
  try {
    const { data: res } = await api.post<Product>("/products", data, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return res;
  } catch (err) {
    throw handleAxiosError(err, "Error creando producto");
  }
}

export async function updateProduct(
  product_id: number,
  patch: { name?: string; price?: number; cost_per_unit?: number; stock?: number }
) {
  try {
    const { data } = await api.put<Product>(`/products/${product_id}`, patch, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error actualizando producto");
  }
}

export async function deleteProduct(product_id: number) {
  try {
    const { data } = await api.delete(`/products/${product_id}`, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data as { ok: boolean };
  } catch (err) {
    throw handleAxiosError(err, "Error eliminando producto");
  }
}

export async function adjustStock(product_id: number, qty: number, note?: string) {
  try {
    const { data } = await api.post(
      "/inventory/adjust",
      { product_id, qty, note },
      { headers: { "X-API-Key": ADMIN_KEY } }
    );
    return data as { ok: boolean; new_stock: number };
  } catch (err) {
    throw handleAxiosError(err, "Error ajustando stock");
  }
}

/* -------- Ventas / Stats -------- */
export async function createSale(payload: {
  items: Array<{ product_id: number; qty: number }>;
  discount_pct?: number;
  discount_abs?: number;
  apply_tax?: boolean;
  cash?: number;
}) {
  try {
    const { data } = await api.post("/sales", payload);
    return data as { ok: boolean; sale_id: number; total: number };
  } catch (err) {
    throw handleAxiosError(err, "Error creando venta");
  }
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
  try {
    const { data } = await api.get<DashboardStats>("/stats/dashboard");
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error cargando estadísticas");
  }
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
  try {
    const { data } = await api.get<AppSettings>("/settings");
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error cargando configuración");
  }
}

export async function updateSettings(patch: AppSettingsUpdate) {
  try {
    const { data } = await api.put<AppSettings>("/settings", patch, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error actualizando configuración");
  }
}

/* -------- Staff / Usuarios / Pagos -------- */
export type Staff = {
  id: number;
  username: string;
  name: string;
  role: "admin" | "cashier" | "waiter" | "other";
  shift?: string | null;
  active: boolean;
  pay_type: "hourly" | "fixed";
  pay_rate: number;
};

export type StaffCreate = {
  username: string;
  name: string;
  role?: Staff["role"];
  shift?: string | null;
  password: string;
  active?: boolean;
  pay_type?: Staff["pay_type"];
  pay_rate?: number;
};

export type StaffUpdate = Partial<Omit<Staff, "id">>;

export type StaffShift = {
  id: number;
  staff_id: number;
  clock_in: string;
  clock_out?: string | null;
  notes?: string | null;
};

export type StaffPayment = {
  id: number;
  staff_id: number;
  amount: number;
  method: string;
  period_start?: string | null;
  period_end?: string | null;
  paid_at: string;
  notes?: string | null;
};

export async function fetchStaff() {
  try {
    const { data } = await api.get<Staff[]>("/staff", {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error cargando staff");
  }
}

export async function createStaff(payload: StaffCreate) {
  try {
    const { data } = await api.post<Staff>("/staff", payload, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error creando staff");
  }
}

export async function updateStaff(id: number, patch: StaffUpdate) {
  try {
    const { data } = await api.put<Staff>(`/staff/${id}`, patch, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error actualizando staff");
  }
}

export async function updateStaffPassword(id: number, password: string) {
  try {
    const { data } = await api.put(`/staff/${id}/password`, { password }, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data as { ok: boolean };
  } catch (err) {
    throw handleAxiosError(err, "Error actualizando password de staff");
  }
}

export async function deleteStaff(id: number) {
  try {
    const { data } = await api.delete(`/staff/${id}`, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data as { ok: boolean };
  } catch (err) {
    throw handleAxiosError(err, "Error eliminando staff");
  }
}

export async function clockIn(staff_id: number) {
  try {
    const { data } = await api.post<StaffShift>(`/staff/${staff_id}/clock-in`, {}, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error haciendo clock-in");
  }
}

export async function clockOut(staff_id: number) {
  try {
    const { data } = await api.post<StaffShift>(`/staff/${staff_id}/clock-out`, {}, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error haciendo clock-out");
  }
}

export async function fetchShifts(staff_id: number, params?: { start?: string; end?: string }) {
  try {
    const { data } = await api.get<StaffShift[]>(`/staff/${staff_id}/shifts`, {
      params,
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error cargando turnos");
  }
}

export async function createPayment(p: {
  staff_id: number;
  amount: number;
  method: string;
  period_start?: string;
  period_end?: string;
  notes?: string;
}) {
  try {
    const { data } = await api.post<StaffPayment>("/staff/payments", p, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error creando pago");
  }
}

export async function fetchPayments(params?: { staff_id?: number; start?: string; end?: string }) {
  try {
    const { data } = await api.get<StaffPayment[]>("/staff/payments", {
      params,
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data;
  } catch (err) {
    throw handleAxiosError(err, "Error cargando pagos");
  }
}

export async function deleteShift(shift_id: number) {
  try {
    const { data } = await api.delete(`/staff/shifts/${shift_id}`, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data as { ok: boolean };
  } catch (err) {
    throw handleAxiosError(err, "Error eliminando turno");
  }
}

export async function deletePayment(payment_id: number) {
  try {
    const { data } = await api.delete(`/staff/payments/${payment_id}`, {
      headers: { "X-API-Key": ADMIN_KEY },
    });
    return data as { ok: boolean };
  } catch (err) {
    throw handleAxiosError(err, "Error eliminando pago");
  }
}

/* -------- Reports / Sales API -------- */
export async function fetchSalesReport(opts: {
  start?: string;
  end?: string;
  payment_method?: string | undefined;
  staff_id?: number | undefined;
  q?: string;
  limit?: number;
}) {
  try {
    const params: Record<string, any> = {};
    if (opts.start) params.start = opts.start;
    if (opts.end) params.end = opts.end;
    if (opts.payment_method) params.payment_method = opts.payment_method;
    if (typeof opts.staff_id !== "undefined" && opts.staff_id !== null) params.staff_id = opts.staff_id;
    if (opts.q) params.q = opts.q;
    if (opts.limit) params.limit = opts.limit;

    const { data } = await api.get("/sales", { params });
    return data as { rows: any[] };
  } catch (err) {
    throw handleAxiosError(err, "Error cargando reporte de ventas");
  }
}

export async function fetchSaleDetail(id: number) {
  try {
    const { data } = await api.get(`/sales/${id}`);
    return data as any;
  } catch (err) {
    throw handleAxiosError(err, "Error cargando detalle de venta");
  }
}

export async function exportSalesCSV(opts: { start?: string; end?: string; payment_method?: string | undefined; staff_id?: number | undefined; }) {
  try {
    const params: Record<string, any> = {};
    if (opts.start) params.start = opts.start;
    if (opts.end) params.end = opts.end;
    if (opts.payment_method) params.payment_method = opts.payment_method;
    if (typeof opts.staff_id !== "undefined" && opts.staff_id !== null) params.staff_id = opts.staff_id;

    const res = await api.get("/sales/export", { params, responseType: "blob" });
    return res.data as Blob;
  } catch (err) {
    throw handleAxiosError(err, "Error exportando CSV de ventas");
  }
}