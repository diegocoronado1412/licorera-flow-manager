import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import {
  fetchStaff, createStaff, updateStaff, deleteStaff, updateStaffPassword,
  fetchShifts, clockIn, clockOut, fetchPayments, createPayment,
  deleteShift, deletePayment,
  type Staff, type StaffShift, type StaffPayment
} from "@/hooks/api";
import { Plus, Pencil, Trash2, Clock, Banknote, Shield, X } from "lucide-react";

// ---- Helpers COP ----
const fmtCOP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const fmtInt = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

function formatCOPInput(s: string): string {
  const digits = (s || "").replace(/\D/g, "");
  return digits ? fmtInt.format(Number(digits)) : "";
}
function parseCOP(s: string): number {
  const digits = (s || "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

type PayType = "hourly" | "fixed";
type ShiftOpt = "none" | "Mañana" | "Tarde" | "Noche";

export default function UsersPage() {
  const [tab, setTab] = useState("users");

  // Staff
  const [rows, setRows] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const workers = useMemo(() => rows.filter(r => r.role !== "admin"), [rows]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return workers;
    return workers.filter(r =>
      r.username.toLowerCase().includes(s) ||
      r.name.toLowerCase().includes(s) ||
      r.role.toLowerCase().includes(s)
    );
  }, [workers, q]);

  async function load() {
    setLoading(true);
    try { setRows(await fetchStaff()); }
    catch { toast.error("No se pudo cargar usuarios"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  // Create/Edit
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState<{
    username: string; name: string; role: string; shift: ShiftOpt;
    password: string; active: boolean; pay_type: PayType; pay_rate_str: string;
  }>({ username:"", name:"", role:"cashier", shift:"none", password:"", active:true, pay_type:"hourly", pay_rate_str:"" });

  function onNew() {
    setEditing(null);
    setForm({ username:"", name:"", role:"cashier", shift:"none", password:"", active:true, pay_type:"hourly", pay_rate_str:"" });
    setOpenEdit(true);
  }
  function onEdit(r: Staff) {
    setEditing(r);
    setForm({
      username: r.username,
      name: r.name,
      role: r.role === "admin" ? "cashier" : r.role,
      shift: ((r.shift as any) ?? "none") as ShiftOpt,
      password: "",
      active: !!r.active,
      pay_type: (r.pay_type as PayType) ?? "hourly",
      pay_rate_str: r.pay_rate ? fmtInt.format(Number(r.pay_rate)) : "",
    });
    setOpenEdit(true);
  }
  async function onSave() {
    try {
      if (!form.username || !form.name) return toast.error("Usuario y nombre son obligatorios");
      const payload = {
        username: form.username.trim(),
        name: form.name.trim(),
        role: form.role,
        shift: form.shift === "none" ? null : form.shift,
        active: form.active,
        pay_type: form.pay_type,
        pay_rate: parseCOP(form.pay_rate_str),
      };
      if (editing) {
        await updateStaff(editing.id, payload as any);
        if (form.password) await updateStaffPassword(editing.id, form.password);
        toast.success("Usuario actualizado");
      } else {
        await createStaff(payload as any);
        toast.success("Usuario creado");
      }
      setOpenEdit(false);
      await load();
    } catch (e:any) {
      toast.error(e?.response?.data?.detail || "Error guardando usuario");
    }
  }

  // Delete staff
  const [toDelete, setToDelete] = useState<Staff | null>(null);
  async function doDelete() {
    if (!toDelete) return;
    try { await deleteStaff(toDelete.id); toast.success("Usuario eliminado"); setToDelete(null); await load(); }
    catch (e:any) { toast.error(e?.response?.data?.detail || "No se pudo eliminar"); }
  }

  // ---- Asistencia & Pagos selección (controlado) ----
  const [selectedId, setSelectedId] = useState<string>(""); // "" = nada
  const selectedNum = selectedId ? Number(selectedId) : null;

  // ---- Asistencia ----
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  async function loadShifts(id: number) {
    try { setShifts(await fetchShifts(id)); } catch {}
  }
  useEffect(() => { if (selectedNum != null) loadShifts(selectedNum); }, [selectedNum]);

  async function doClockIn() {
    if (selectedNum == null) return;
    try { await clockIn(selectedNum); toast.success("Entrada registrada"); await loadShifts(selectedNum); }
    catch (e:any) { toast.error(e?.response?.data?.detail || "No se pudo marcar entrada"); }
  }
  async function doClockOut() {
    if (selectedNum == null) return;
    try { await clockOut(selectedNum); toast.success("Salida registrada"); await loadShifts(selectedNum); }
    catch (e:any) { toast.error(e?.response?.data?.detail || "No se pudo marcar salida"); }
  }
  async function onDeleteShift(id: number) {
    try { await deleteShift(id); toast.success("Asistencia eliminada"); if (selectedNum != null) await loadShifts(selectedNum); }
    catch { toast.error("No se pudo eliminar la asistencia"); }
  }

  // ---- Pagos ----
  const [payments, setPayments] = useState<StaffPayment[]>([]);
  async function loadPayments(id: number) {
    try { setPayments(await fetchPayments({ staff_id: id })); } catch {}
  }
  useEffect(() => { if (selectedNum != null) loadPayments(selectedNum); }, [selectedNum]);

  const [payAmountStr, setPayAmountStr] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("efectivo");
  const [payNotes, setPayNotes] = useState<string>("");

  async function doPay() {
    if (selectedNum == null) return;
    const amount = parseCOP(payAmountStr);
    if (!amount) return toast.error("Monto inválido");
    try {
      await createPayment({ staff_id: selectedNum, amount, method: payMethod, notes: payNotes || undefined });
      toast.success("Pago registrado");
      setPayAmountStr(""); setPayNotes("");
      await loadPayments(selectedNum);
    } catch { toast.error("No se pudo registrar el pago"); }
  }
  async function onDeletePayment(id: number) {
    try { await deletePayment(id); toast.success("Pago eliminado"); if (selectedNum != null) await loadPayments(selectedNum); }
    catch { toast.error("No se pudo eliminar el pago"); }
  }

  const rolePill = (role: string) => {
    const base = "px-2 py-1 rounded-full text-xs";
    if (role === "cashier") return <span className={`${base} bg-emerald-500/15 text-emerald-400`}>cashier</span>;
    if (role === "waiter")  return <span className={`${base} bg-sky-500/15 text-sky-400`}>waiter</span>;
    return <span className={`${base} bg-zinc-500/15 text-zinc-300`}>{role}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios &amp; Equipo</h1>
        <div className="flex gap-2">
          <Button onClick={onNew}><Plus className="w-4 h-4 mr-1" /> Nuevo usuario</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="users"><Shield className="w-4 h-4 mr-1" />Usuarios</TabsTrigger>
          <TabsTrigger value="attendance"><Clock className="w-4 h-4 mr-1" />Asistencia</TabsTrigger>
          <TabsTrigger value="payments"><Banknote className="w-4 h-4 mr-1" />Pagos</TabsTrigger>
        </TabsList>

        {/* Usuarios */}
        <TabsContent value="users">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent rounded-t-lg">
              <CardTitle>Gestión de usuarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input placeholder="Buscar usuario/nombre/rol..." value={q} onChange={(e)=>setQ(e.target.value)} />
              </div>

              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0">
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead className="text-right">Pago</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7}>Cargando…</TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={7}>Sin resultados</TableCell></TableRow>
                    ) : filtered.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono">{r.username}</TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{rolePill(r.role)}</TableCell>
                        <TableCell>{r.shift || "-"}</TableCell>
                        <TableCell className="text-right font-mono">
                          {r.pay_type === "hourly"
                            ? `${fmtCOP.format(Number(r.pay_rate || 0))} /h`
                            : `${fmtCOP.format(Number(r.pay_rate || 0))} fijo`}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.active ? <Badge className="bg-green-600 hover:bg-green-700">Activo</Badge>
                                    : <Badge variant="destructive">Inactivo</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-2">
                            <Button size="sm" variant="outline" onClick={()=>onEdit(r)}><Pencil className="w-4 h-4" /></Button>
                            <Button size="sm" variant="destructive" onClick={()=>setToDelete(r)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Asistencia */}
        <TabsContent value="attendance">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent rounded-t-lg">
              <CardTitle>Asistencia del personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label>Usuario</Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      {workers.map(r => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name} ({r.username})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button disabled={!selectedId} onClick={doClockIn}>Marcar entrada</Button>
                  <Button disabled={!selectedId} variant="secondary" onClick={doClockOut}>Marcar salida</Button>
                </div>
              </div>

              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0">
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Salida</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedId ? (
                      <TableRow><TableCell colSpan={5}>Selecciona un usuario</TableCell></TableRow>
                    ) : shifts.length === 0 ? (
                      <TableRow><TableCell colSpan={5}>Sin registros</TableCell></TableRow>
                    ) : shifts.map((sh, i) => {
                      const inD  = new Date(sh.clock_in);
                      const outD = sh.clock_out ? new Date(sh.clock_out) : null;
                      const hours = outD ? Math.max(0, (outD.getTime() - inD.getTime()) / 3600000) : 0;
                      return (
                        <TableRow key={sh.id}>
                          <TableCell>{i+1}</TableCell>
                          <TableCell className="font-mono text-xs">{inD.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs">{outD ? outD.toLocaleString() : "-"}</TableCell>
                          <TableCell className="font-mono">{outD ? hours.toFixed(2) : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={()=>onDeleteShift(sh.id)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagos */}
        <TabsContent value="payments">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent rounded-t-lg">
              <CardTitle>Pagos a empleados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <Label>Usuario</Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      {workers.map(r => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name} ({r.username})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Monto</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={payAmountStr}
                    onChange={(e)=>setPayAmountStr(formatCOPInput(e.target.value))}
                    placeholder="500.000"
                  />
                </div>
                <div>
                  <Label>Método</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="nequi">Nequi</SelectItem>
                      <SelectItem value="daviplata">Daviplata</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-4">
                  <Label>Notas</Label>
                  <Input value={payNotes} onChange={(e)=>setPayNotes(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="sm:col-span-4">
                  <Button disabled={!selectedId} onClick={doPay}>Registrar pago</Button>
                </div>
              </div>

              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0">
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedId ? (
                      <TableRow><TableCell colSpan={6}>Selecciona un usuario</TableCell></TableRow>
                    ) : payments.length === 0 ? (
                      <TableRow><TableCell colSpan={6}>Sin pagos registrados</TableCell></TableRow>
                    ) : payments.map((p, i) => (
                      <TableRow key={p.id}>
                        <TableCell>{i+1}</TableCell>
                        <TableCell className="font-mono text-xs">{new Date(p.paid_at).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline">{p.method}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{fmtCOP.format(Number(p.amount))}</TableCell>
                        <TableCell>{p.notes || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={()=>onDeletePayment(p.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Crear/Editar */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            <DialogDescription>Define datos generales, turno y pago del empleado.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-3 items-center gap-2">
              <Label className="text-right">Usuario</Label>
              <Input className="col-span-2" value={form.username} onChange={(e)=>setForm(f=>({ ...f, username:e.target.value }))} placeholder="TURNO3" />
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label className="text-right">Nombre</Label>
              <Input className="col-span-2" value={form.name} onChange={(e)=>setForm(f=>({ ...f, name:e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label className="text-right">Rol</Label>
              <div className="col-span-2">
                <Select value={form.role} onValueChange={(v)=>setForm(f=>({ ...f, role:v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cajero</SelectItem>
                    <SelectItem value="waiter">Mesero</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label className="text-right">Turno</Label>
              <div className="col-span-2">
                <Select value={form.shift} onValueChange={(v)=>setForm(f=>({ ...f, shift: v as ShiftOpt }))}>
                  <SelectTrigger><SelectValue placeholder="Sin turno fijo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin turno</SelectItem>
                    <SelectItem value="Mañana">Mañana</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="Noche">Noche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label className="text-right">Tipo pago</Label>
              <div className="col-span-2">
                <Select value={form.pay_type} onValueChange={(v)=>setForm(f=>({ ...f, pay_type: v as PayType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Por hora</SelectItem>
                    <SelectItem value="fixed">Fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label className="text-right">{form.pay_type === "hourly" ? "Tarifa $/h" : "Monto fijo"}</Label>
              <Input
                className="col-span-2"
                type="text"
                inputMode="numeric"
                value={form.pay_rate_str}
                onChange={(e)=>setForm(f=>({ ...f, pay_rate_str: formatCOPInput(e.target.value) }))}
                placeholder="10.000"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label className="text-right">Contraseña</Label>
              <Input className="col-span-2" type="password" value={form.password} onChange={(e)=>setForm(f=>({ ...f, password:e.target.value }))} placeholder={editing ? "Dejar en blanco para no cambiar" : ""} />
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <Label className="text-right">Estado</Label>
              <div className="col-span-2">
                <Select value={String(form.active)} onValueChange={(v)=>setForm(f=>({ ...f, active: v === "true" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenEdit(false)}>Cancelar</Button>
            <Button onClick={onSave}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete staff */}
      <AlertDialog open={!!toDelete} onOpenChange={(v)=>!v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar a <strong>{toDelete?.name}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel onClick={()=>setToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
