// LICORERA/licorera-flow-manager/src/pages/ReportsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { fetchSalesReport, fetchSaleDetail, exportSalesCSV } from "@/hooks/api";
import { format } from "date-fns";
import { Download, Eye } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [start, setStart] = useState<string>(todayStr);
  const [end, setEnd] = useState<string>(todayStr);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<number | null>(null);
  const [saleDetail, setSaleDetail] = useState<any | null>(null);
  // sentinel "all" to avoid empty string value problems
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [staffId, setStaffId] = useState<number | undefined>(undefined);

  async function load() {
    setLoading(true);
    try {
      const pm = paymentMethod === "all" ? undefined : paymentMethod;
      const data = await fetchSalesReport({
        start,
        end,
        payment_method: pm || undefined,
        staff_id: staffId,
        q,
        limit: 1000,
      });
      setRows(data.rows || []);
    } catch (e: any) {
      console.error("load error:", e);
      toast.error(e?.message || "Error cargando reportes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // initial load

  async function openDetail(id: number) {
    setSelectedSale(id);
    setSaleDetail(null);
    try {
      const d = await fetchSaleDetail(id);
      setSaleDetail(d);
    } catch (e: any) {
      console.error("openDetail error:", e);
      toast.error("No se pudo cargar detalle");
    }
  }

  async function doExport() {
    try {
      const pm = paymentMethod === "all" ? undefined : paymentMethod;
      const blob = await exportSalesCSV({ start, end, payment_method: pm || undefined, staff_id: staffId });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales_${start}_${end}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("export error:", e);
      toast.error("No se pudo exportar");
    }
  }

  const totals = useMemo(() => {
    const total = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
    const count = rows.length;
    return { total, count, avg: count ? total / count : 0 };
  }, [rows]);

  // payment badge helper
  const renderPaymentBadge = (method?: string) => {
    const m = (method || "").toLowerCase();
    const colorClass =
      m === "efectivo" ? "bg-green-700 text-white" :
      m === "transferencia" ? "bg-blue-700 text-white" :
      m === "nequi" ? "bg-pink-600 text-white" :
      m === "daviplata" ? "bg-yellow-500 text-black" :
      "bg-gray-600 text-white";

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
        {method ? method.toUpperCase() : "-"}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes de ventas</h1>
        <div className="flex gap-2">
          <Button onClick={() => { setStart(todayStr); setEnd(todayStr); load(); }}>Hoy</Button>
          <Button onClick={() => {
            const d = new Date();
            const d7 = new Date(Date.now() - 7 * 24 * 3600 * 1000);
            setStart(format(d7, "yyyy-MM-dd"));
            setEnd(format(d, "yyyy-MM-dd"));
            load();
          }}>Últimos 7 días</Button>
          <Button onClick={() => {
            const d = new Date();
            const s = format(new Date(d.getFullYear(), d.getMonth(), 1), "yyyy-MM-dd");
            const e = format(new Date(d.getFullYear(), d.getMonth() + 1, 0), "yyyy-MM-dd");
            setStart(s);
            setEnd(e);
            load();
          }}>Mes</Button>
          <Button variant="secondary" onClick={doExport}><Download className="w-4 h-4 mr-2" /> Exportar CSV</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-4">
          <div>
            <label className="text-xs text-muted-foreground">Desde</label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Hasta</label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Método de pago</label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v || "all")}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="nequi">Nequi</SelectItem>
                <SelectItem value="daviplata">Daviplata</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Buscar id/producto</label>
            <div className="flex gap-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="id o nombre producto..." />
              <Button onClick={load}>Buscar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-muted rounded-md">
          <div className="text-sm text-muted-foreground">Ventas (filtradas)</div>
          <div className="text-xl font-bold">{totals.count}</div>
        </div>
        <div className="p-4 bg-muted rounded-md">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-xl font-bold">{Number(totals.total).toLocaleString()} COP</div>
        </div>
        <div className="p-4 bg-muted rounded-md">
          <div className="text-sm text-muted-foreground">Ticket promedio</div>
          <div className="text-xl font-bold">{Number(totals.avg).toLocaleString()} COP</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventas</CardTitle>
          <div className="text-sm text-muted-foreground">Lista (orden por hora desc)</div>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Cajero</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total (COP)</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7}>Cargando…</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={7}>Sin ventas</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell className="font-mono text-xs">{r.ts ? new Date(r.ts).toLocaleString() : "-"}</TableCell>
                  <TableCell>{r.staff_name ?? "-"}</TableCell>
                  <TableCell className="text-xs">{r.items_count ?? "-"}</TableCell>
                  <TableCell className="text-right font-mono">{Number(r.total).toLocaleString()}</TableCell>
                  <TableCell>{renderPaymentBadge(r.payment_method)}</TableCell>
                  <TableCell>
                    <div className="inline-flex gap-2">
                      <Button size="sm" onClick={() => openDetail(r.id)}><Eye className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedSale} onOpenChange={() => { setSelectedSale(null); setSaleDetail(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de venta #{selectedSale}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {saleDetail ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Hora</div>
                    <div className="font-mono text-sm">{saleDetail.ts ? new Date(saleDetail.ts).toLocaleString() : "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Cajero</div>
                    <div className="text-sm">{saleDetail.staff_name ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Pago</div>
                    <div>{renderPaymentBadge(saleDetail.payment_method)}</div>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th>Producto</th>
                        <th className="text-right">Cant</th>
                        <th className="text-right">Precio</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(saleDetail.items || []).map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="text-sm">{it.product_name ? `${it.product_name}` : `#${it.product_id}`}</td>
                          <td className="text-right font-mono">{it.qty}</td>
                          <td className="text-right font-mono">{Number(it.price).toLocaleString()}</td>
                          <td className="text-right font-mono">{Number(it.line_total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-right space-y-1 mt-3">
                  <div>Subtotal: <strong>{Number(saleDetail.subtotal).toLocaleString()} COP</strong></div>
                  <div>Descuento: <strong>{Number(saleDetail.discount).toLocaleString()} COP</strong></div>
                  <div>IVA: <strong>{Number(saleDetail.tax).toLocaleString()} COP</strong></div>
                  <div>Total: <strong className="text-lg">{Number(saleDetail.total).toLocaleString()} COP</strong></div>
                  {/* removed cash/change display as requested */}
                </div>
              </>
            ) : (
              <div>Cargando…</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedSale(null); setSaleDetail(null); }}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
