import axios from "axios";
const baseURL = import.meta.env.VITE_API_BASE || window.location.origin;
export const api = axios.create({ baseURL });

export type Product = { id:number; name:string; price?:number; cost_per_unit?:number; stock:number };

export async function fetchProducts(q?: string) {
  const { data } = await api.get<Product[]>("/products", { params: { q } });
  return data;
}

export async function adjustStock(product_id:number, qty:number, note?:string) {
  const { data } = await api.post(
    "/inventory/adjust",
    { product_id, qty, note },
    { headers: { "X-API-Key": import.meta.env.VITE_ADMIN_KEY } }
  );
  return data;
}

export async function createSale(items: Array<{ product_id:number; qty:number }>) {
  const { data } = await api.post("/sales", { items });
  return data;
}
