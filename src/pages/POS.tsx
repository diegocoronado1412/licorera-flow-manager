import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { fetchProducts, createSale, type Product } from "@/hooks/api";
import { useSettings } from "@/contexts/SettingsContext";

type CartItem = { product: Product; qty: number };
const currency = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function POS() {
  const { settings } = useSettings();

  // catálogo
  const [all, setAll] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  // paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [discountAbs, setDiscountAbs] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const [cash, setCash] = useState<number>(0);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    setApplyTax(true);
  }, [settings]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setAll(await fetchProducts());
      } catch {
        toast.error("No se pudo cargar el catálogo");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtrado y paginación combinados
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter((p) => p.name.toLowerCase().includes(s));
  }, [all, q]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  function addToCart(p: Product, qty = 1) {
    setCart((prev) => {
      const ix = prev.findIndex((i) => i.product.id === p.id);
      if (ix >= 0) {
        const copy = [...prev];
        copy[ix] = { ...copy[ix], qty: copy[ix].qty + qty };
        return copy;
      }
      return [...prev, { product: p, qty }];
    });
    setQ("");
  }

  const inc = (i: number) =>
    setCart((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, qty: it.qty + 1 } : it))
    );
  const dec = (i: number) =>
    setCart((prev) =>
      prev
        .map((it, idx) =>
          idx === i ? { ...it, qty: Math.max(0, it.qty - 1) } : it
        )
        .filter((it) => it.qty > 0)
    );
  const remove = (i: number) =>
    setCart((prev) => prev.filter((_, idx) => idx !== i));
  function clearCart() {
    setCart([]);
    setDiscountAbs(0);
    setDiscountPct(0);
    setCash(0);
  }

  const subTotal = useMemo(
    () => cart.reduce((s, it) => s + Number(it.product.price || 0) * it.qty, 0),
    [cart]
  );

  useEffect(() => {
    if (discountPct > 0) setDiscountAbs(0);
  }, [discountPct]);
  useEffect(() => {
    if (discountAbs > 0) setDiscountPct(0);
  }, [discountAbs]);

  const maxPct = settings?.pos.max_discount_pct ?? 20;
  const discountValue = Math.min(
    discountAbs > 0
      ? discountAbs
      : Math.round((discountPct / 100) * subTotal),
    subTotal
  );
  const base = Math.max(0, subTotal - discountValue);
  const vatRate = (settings?.taxes.vat_percent ?? 0) / 100;
  const tax = applyTax ? Math.round(base * vatRate) : 0;
  const total = Math.max(0, base + tax);
  const change = Math.max(0, (cash || 0) - total);

  async function reallyPlaceSale() {
    if (!cart.length) {
      toast.warning("El carrito está vacío");
      return;
    }
    if (
      discountPct > maxPct &&
      (settings?.pos.require_discount_pin ?? false)
    ) {
      toast.error(`Descuento % supera el máximo permitido (${maxPct}%).`);
      return;
    }
    const falta = cart.find((it) => (it.product.stock ?? 0) < it.qty);
    if (falta) {
      toast.warning(`Stock insuficiente: ${falta.product.name}`);
      return;
    }

    setPlacing(true);
    try {
      const res = await createSale({
        items: cart.map((it) => ({
          product_id: it.product.id,
          qty: it.qty,
        })),
        discount_pct: discountAbs > 0 ? undefined : discountPct || undefined,
        discount_abs: discountAbs || undefined,
        apply_tax: applyTax,
        cash,
      });
      toast.success(
        `Venta #${res.sale_id} registrada. Total ${currency(res.total)}`
      );
      clearCart();
      setAll(await fetchProducts());
    } catch {
      toast.error("No se pudo registrar la venta");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6 animate-premium-fade">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Punto de Venta</h2>
        <div className="text-sm text-muted-foreground">
          Productos: <strong>{all.length}</strong>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Buscar producto</CardTitle>
          <CardDescription>
            Escribe parte del nombre y agrega al carrito
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre…"
              className="pl-8"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full text-sm text-muted-foreground">
                Cargando catálogo…
              </div>
            ) : paginated.length === 0 ? (
              <div className="col-span-full text-sm text-muted-foreground">
                Sin resultados
              </div>
            ) : (
              paginated.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div className="min-w-0">
                    <div
                      className="font-medium truncate max-w-[280px]"
                      title={p.name}
                    >
                      {p.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {currency(p.price || 0)} · Stock:{" "}
                      <Badge variant="outline">{p.stock ?? 0}</Badge>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => addToCart(p)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* 🔽 NUEVA SECCIÓN DE PAGINACIÓN 🔽 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>

              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>

              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Siguiente
              </Button>
            </div>
          )}
          {/* 🔼 FIN PAGINACIÓN 🔼 */}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Carrito</CardTitle>
            <CardDescription>Productos seleccionados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        Aún no hay productos
                      </TableCell>
                    </TableRow>
                  ) : (
                    cart.map((it, idx) => {
                      const price = Number(it.product.price || 0);
                      return (
                        <TableRow key={it.product.id}>
                          <TableCell className="font-medium">
                            {it.product.name}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {currency(price)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => dec(idx)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-mono">
                                {it.qty}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => inc(idx)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {currency(price * it.qty)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => remove(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {cart.length > 0 && (
              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={clearCart}>
                  Vaciar carrito
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel Totales */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Totales</CardTitle>
            <CardDescription>Descuentos y cobro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-mono">{currency(subTotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  Descuento %
                </label>
                <Input
                  type="number"
                  value={discountPct || ""}
                  onChange={(e) =>
                    setDiscountPct(Math.max(0, Number(e.target.value || 0)))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Descuento $
                </label>
                <Input
                  type="number"
                  value={discountAbs || ""}
                  onChange={(e) =>
                    setDiscountAbs(Math.max(0, Number(e.target.value || 0)))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="tax"
                type="checkbox"
                checked={applyTax}
                onChange={(e) => setApplyTax(e.target.checked)}
              />
              <label htmlFor="tax" className="text-sm">
                Aplicar IVA ({settings?.taxes.vat_percent ?? 0}%)
              </label>
            </div>

            <div className="flex justify-between text-sm">
              <span>IVA</span>
              <span className="font-mono">{currency(tax)}</span>
            </div>

            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="font-mono">{currency(total)}</span>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Efectivo</label>
              <Input
                type="number"
                value={cash || ""}
                onChange={(e) =>
                  setCash(Math.max(0, Number(e.target.value || 0)))
                }
                placeholder="0"
              />
            </div>

            <div className="flex justify-between text-sm">
              <span>Cambio</span>
              <span className="font-mono">{currency(change)}</span>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" disabled={placing || cart.length === 0}>
                  {placing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  Finalizar venta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar venta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se venderán{" "}
                    {cart.reduce((s, i) => s + i.qty, 0)} unidades. Total a cobrar:{" "}
                    <b>{currency(total)}</b>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={reallyPlaceSale}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <p className="text-xs text-muted-foreground">
              *El stock se descuenta automáticamente y la venta queda registrada.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
