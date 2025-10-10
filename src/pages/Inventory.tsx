import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, TrendingUp, DollarSign, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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

import {
  fetchProducts,
  type Product as ApiProduct,
  updateProduct,
  adjustStock,
  createProduct,
  deleteProduct,
} from "../hooks/api";

type Row = {
  id: number;
  name: string;
  category: string;
  finalCount: number;   // stock
  costPerUnit: number;  // cost_per_unit
  salePrice: number;    // price
  totalCost: number;
  totalSales: number;
  profit: number;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(n);

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (/(whisky|old\s*par|something\s*special)/.test(n)) return "Whisky";
  if (/(ron|medellín|aguardiente|bacardí|flor)/.test(n)) return "Licores";
  if (/(cerveza|pilsen|poker|corona|stella|club colombia|budweiser|costeñita)/.test(n)) return "Cervezas";
  if (/(tequila|1800|don julio|mezcal)/.test(n)) return "Tequila";
  if (/(vodka|smirn(o|f)f|absolut)/.test(n)) return "Vodka";
  if (/(gaseosa|coca|bretaña|hit)/.test(n)) return "Bebidas";
  if (/(snack|papas|detoditos|choclitos|boliqueso)/.test(n)) return "Snacks";
  return "General";
}

function toRow(p: ApiProduct): Row {
  const stock = Number(p.stock ?? 0);
  const cost = Number(p.cost_per_unit ?? 0);
  const price = Number(p.price ?? 0);
  return {
    id: p.id,
    name: p.name,
    category: inferCategory(p.name),
    finalCount: stock,
    costPerUnit: cost,
    salePrice: price,
    totalCost: stock * cost,
    totalSales: stock * price,
    profit: stock * (price - cost),
  };
}

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) return <Badge variant="destructive" className="text-xs">Agotado</Badge>;
  if (qty <= 5)  return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 text-xs">Bajo</Badge>;
  if (qty <= 20) return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">Medio</Badge>;
  return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">Alto</Badge>;
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // edición
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({ name: "", price: "", cost: "", stock: "" });

  // creación
  const [openNew, setOpenNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", price: "", cost: "", stock: "" });

  async function load(q?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts(q);
      setRows(data.map(toRow));
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(searchTerm); }, [searchTerm]);

  const categories = useMemo(() => {
    const set = new Set<string>(["Todos"]);
    rows.forEach(r => set.add(r.category));
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const okName = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      const okCat = selectedCategory === "Todos" || r.category === selectedCategory;
      return okName && okCat;
    });
  }, [rows, searchTerm, selectedCategory]);

  const totalInventoryValue = filtered.reduce((s, x) => s + x.totalCost, 0);
  const totalSalesValue     = filtered.reduce((s, x) => s + x.totalSales, 0);
  const totalProfitValue    = filtered.reduce((s, x) => s + x.profit, 0);

  function onEditClick(r: Row) {
    setEditing(r);
    setForm({
      name: r.name,
      price: r.salePrice.toString(),
      cost: r.costPerUnit.toString(),
      stock: r.finalCount.toString(),
    });
    setOpen(true);
  }

  function newFormValue(v: string) {
    return v.trim();
  }
  function numberOrZero(v: string) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
    }

  async function onSave() {
    if (!editing) return;
    try {
      const newName  = newFormValue(form.name);
      const newPrice = numberOrZero(form.price);
      const newCost  = numberOrZero(form.cost);

      await updateProduct(editing.id, {
        name: newName,
        price: newPrice,
        cost_per_unit: newCost,
      });

      const newStock = numberOrZero(form.stock);
      const delta = newStock - editing.finalCount;
      if (delta !== 0) {
        await adjustStock(editing.id, delta, "ajuste desde pantalla Inventario");
      }

      toast.success("Producto actualizado");
      setOpen(false);
      setEditing(null);
      await load(searchTerm);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo actualizar");
    }
  }

  async function onCreate() {
    try {
      const name  = newFormValue(newForm.name);
      const price = numberOrZero(newForm.price);
      const cost  = numberOrZero(newForm.cost);
      const stock = numberOrZero(newForm.stock);

      if (!name) {
        toast.error("El nombre es obligatorio");
        return;
      }
      const p = await createProduct({ name, price, cost_per_unit: cost, stock });

      toast.success(`Producto creado: ${p.name}`);
      setOpenNew(false);
      setNewForm({ name: "", price: "", cost: "", stock: "" });
      await load(searchTerm);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo crear el producto");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteProduct(id);
      toast.success("Producto eliminado");
      await load(searchTerm);
    } catch (e: any) {
      console.error(e);
      // mensajes comunes del backend: 404, 409
      const msg = e?.response?.data?.detail || e?.message || "No se pudo eliminar";
      toast.error(msg);
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Gestión de Inventario
          </h2>
          <p className="text-muted-foreground">Control del inventario de LA LICORERA Drink Ice</p>
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setOpenNew(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Inventario</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">Costo total en inventario</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Potenciales</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatCurrency(totalSalesValue)}</div>
            <p className="text-xs text-muted-foreground">Si vendes todo el stock al precio actual</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Potencial</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{formatCurrency(totalProfitValue)}</div>
            <p className="text-xs text-muted-foreground">Precio - costo sobre el stock</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos (filtrados)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{filtered.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">de {rows.length.toLocaleString()} cargados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Inventario</CardTitle>
          <CardDescription>Busca y filtra productos por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((c) => (
                <Button
                  key={c}
                  variant={selectedCategory === c ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(c)}
                  className="text-xs"
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario Detallado</CardTitle>
          <CardDescription>Mostrando {filtered.length} de {rows.length} productos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-semibold">Producto</TableHead>
                  <TableHead className="font-semibold">Categoría</TableHead>
                  <TableHead className="font-semibold text-center">Stock</TableHead>
                  <TableHead className="font-semibold text-center">Estado</TableHead>
                  <TableHead className="font-semibold text-right">Costo Unit.</TableHead>
                  <TableHead className="font-semibold text-right">Precio</TableHead>
                  <TableHead className="font-semibold text-right">Valor Inv.</TableHead>
                  <TableHead className="font-semibold text-right">Utilidad</TableHead>
                  <TableHead className="font-semibold text-right w-[120px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9}>Cargando…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9}>Sin resultados</TableCell></TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium max-w-[220px]">
                        <div className="truncate" title={p.name}>{p.name}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                      <TableCell className="text-center font-mono">{p.finalCount}</TableCell>
                      <TableCell className="text-center"><StockBadge qty={p.finalCount} /></TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(p.costPerUnit)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(p.salePrice)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatCurrency(p.totalCost)}</TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={p.profit > 0 ? "text-green-600" : p.profit < 0 ? "text-red-600" : ""}>
                          {formatCurrency(p.profit)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => onEditClick(p)}>
                          <Pencil className="w-4 h-4 mr-1" /> Editar
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label="Eliminar"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar “{p.name}”?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción es permanente. Si el producto tiene ventas o ajustes previos,
                                no se permitirá eliminar para preservar el historial.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(p.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Nombre</Label>
              <Input className="col-span-3" value={form.name}
                     onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Precio</Label>
              <Input type="number" className="col-span-3" value={form.price}
                     onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Costo</Label>
              <Input type="number" className="col-span-3" value={form.cost}
                     onChange={(e) => setForm(f => ({ ...f, cost: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Stock</Label>
              <Input type="number" className="col-span-3" value={form.stock}
                     onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))}/>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={onSave}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal nuevo */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Nombre</Label>
              <Input className="col-span-3" value={newForm.name}
                     onChange={(e) => setNewForm(f => ({ ...f, name: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Precio</Label>
              <Input type="number" className="col-span-3" value={newForm.price}
                     onChange={(e) => setNewForm(f => ({ ...f, price: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Costo</Label>
              <Input type="number" className="col-span-3" value={newForm.cost}
                     onChange={(e) => setNewForm(f => ({ ...f, cost: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Stock inicial</Label>
              <Input type="number" className="col-span-3" value={newForm.stock}
                     onChange={(e) => setNewForm(f => ({ ...f, stock: e.target.value }))}/>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={onCreate}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
