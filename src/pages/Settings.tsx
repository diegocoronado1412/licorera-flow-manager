// src/pages/Settings.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { AppSettings } from "@/hooks/api";
import { useSettings } from "@/contexts/SettingsContext";

export default function Settings() {
  const { settings, save } = useSettings();
  const [model, setModel] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  // Carga inicial desde el provider
  useEffect(() => {
    if (settings) setModel({ ...settings });
  }, [settings]);

  if (!model) return <div className="p-6">Cargando…</div>;

  async function persist(partial: Partial<AppSettings>) {
    setSaving(true);
    try {
      await save(partial);
      toast.success("Configuración guardada");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Configuración</h1>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="business">Negocio</TabsTrigger>
          <TabsTrigger value="taxes">Impuestos</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="pos">Punto de Venta</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
        </TabsList>

        {/* Negocio */}
        <TabsContent value="business">
          <Card>
            <CardHeader><CardTitle>Datos del negocio</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={model.business.name}
                  onChange={(e) =>
                    setModel((s) => s && ({ ...s, business: { ...s.business, name: e.target.value } }))
                  }
                />
              </div>
              <div>
                <Label>NIT</Label>
                <Input
                  value={model.business.nit || ""}
                  onChange={(e) =>
                    setModel((s) => s && ({ ...s, business: { ...s.business, nit: e.target.value } }))
                  }
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={model.business.phone || ""}
                  onChange={(e) =>
                    setModel((s) => s && ({ ...s, business: { ...s.business, phone: e.target.value } }))
                  }
                />
              </div>
              <div>
                <Label>Dirección</Label>
                <Input
                  value={model.business.address || ""}
                  onChange={(e) =>
                    setModel((s) => s && ({ ...s, business: { ...s.business, address: e.target.value } }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>Encabezado de recibo</Label>
                <Input
                  value={model.business.receipt_header}
                  onChange={(e) =>
                    setModel((s) => s && ({ ...s, business: { ...s.business, receipt_header: e.target.value } }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>Pie de recibo</Label>
                <Input
                  value={model.business.receipt_footer}
                  onChange={(e) =>
                    setModel((s) => s && ({ ...s, business: { ...s.business, receipt_footer: e.target.value } }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Button disabled={saving} onClick={() => persist({ business: model.business })}>
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impuestos */}
        <TabsContent value="taxes">
          <Card>
            <CardHeader><CardTitle>Impuestos y precios</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>% IVA</Label>
                <Input
                  type="number"
                  value={model.taxes.vat_percent}
                  onChange={(e) =>
                    setModel((s) => s && ({ ...s, taxes: { ...s.taxes, vat_percent: +e.target.value } }))
                  }
                />
              </div>
              <div>
                <Label>Precios incluyen IVA</Label>
                <div className="mt-2">
                  <Switch
                    checked={model.taxes.prices_include_vat}
                    onCheckedChange={(v) =>
                      setModel((s) => s && ({ ...s, taxes: { ...s.taxes, prices_include_vat: v } }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Redondeo</Label>
                <Select
                  value={String(model.taxes.round_to)}
                  onValueChange={(v) =>
                    setModel((s) => s && ({ ...s, taxes: { ...s.taxes, round_to: Number(v) as 0 | 50 | 100 } }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">$0</SelectItem>
                    <SelectItem value="50">$50</SelectItem>
                    <SelectItem value="100">$100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Button disabled={saving} onClick={() => persist({ taxes: model.taxes })}>
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventario */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader><CardTitle>Inventario</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Umbral stock bajo</Label>
                <Input
                  type="number"
                  value={model.inventory.low_stock_threshold}
                  onChange={(e) =>
                    setModel((s) => s && ({ ...s, inventory: { ...s.inventory, low_stock_threshold: +e.target.value } }))
                  }
                />
              </div>
              <div>
                <Label>Permitir stock negativo</Label>
                <div className="mt-2">
                  <Switch
                    checked={model.inventory.allow_negative_stock}
                    onCheckedChange={(v) =>
                      setModel((s) => s && ({ ...s, inventory: { ...s.inventory, allow_negative_stock: v } }))
                    }
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <Button disabled={saving} onClick={() => persist({ inventory: model.inventory })}>
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POS */}
        <TabsContent value="pos">
          <Card>
            <CardHeader><CardTitle>Punto de Venta</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Métodos de pago (coma)</Label>
                <Input
                  value={model.pos.payment_methods.join(", ")}
                  onChange={(e) =>
                    setModel((s) =>
                      s && ({
                        ...s,
                        pos: {
                          ...s.pos,
                          payment_methods: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
                        },
                      })
                    )
                  }
                />
              </div>
              <div>
                <Label>% descuento máx.</Label>
                <Input
                  type="number"
                  value={model.pos.max_discount_pct}
                  onChange={(e) =>
                    setModel((s) => s && ({ ...s, pos: { ...s.pos, max_discount_pct: +e.target.value } }))
                  }
                />
              </div>
              <div>
                <Label>PIN para descuento</Label>
                <div className="mt-2">
                  <Switch
                    checked={model.pos.require_discount_pin}
                    onCheckedChange={(v) => setModel((s) => s && ({ ...s, pos: { ...s.pos, require_discount_pin: v } }))}
                  />
                </div>
              </div>
              <div>
                <Label>Ancho impresora (caracteres)</Label>
                <Input
                  type="number"
                  value={model.pos.printer_width}
                  onChange={(e) =>
                    setModel((s) => s && ({ ...s, pos: { ...s.pos, printer_width: +e.target.value } }))
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Button disabled={saving} onClick={() => persist({ pos: model.pos })}>
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader><CardTitle>Alertas</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Alertar stock bajo</Label>
                <div className="mt-2">
                  <Switch
                    checked={model.alerts.stock_low}
                    onCheckedChange={(v) => setModel((s) => s && ({ ...s, alerts: { ...s.alerts, stock_low: v } }))}
                  />
                </div>
              </div>
              <div>
                <Label>Resumen diario por correo</Label>
                <div className="mt-2">
                  <Switch
                    checked={model.alerts.daily_summary}
                    onCheckedChange={(v) =>
                      setModel((s) => s && ({ ...s, alerts: { ...s.alerts, daily_summary: v } }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Email de resumen</Label>
                <Input
                  value={model.alerts.summary_email || ""}
                  onChange={(e) =>
                    setModel((s) => s && ({ ...s, alerts: { ...s.alerts, summary_email: e.target.value } }))
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Button disabled={saving} onClick={() => persist({ alerts: model.alerts })}>
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apariencia */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader><CardTitle>Apariencia</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Tema</Label>
                <Select
                  value={model.appearance.theme}
                  onValueChange={(v) =>
                    setModel((s) => s && ({ ...s, appearance: { ...s.appearance, theme: v as "dark" | "light" } }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="light">Claro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Densidad</Label>
                <Select
                  value={model.appearance.density}
                  onValueChange={(v) =>
                    setModel((s) =>
                      s && ({ ...s, appearance: { ...s.appearance, density: v as "comfortable" | "compact" } })
                    )
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comfortable">Cómoda</SelectItem>
                    <SelectItem value="compact">Compacta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Button disabled={saving} onClick={() => persist({ appearance: model.appearance })}>
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
