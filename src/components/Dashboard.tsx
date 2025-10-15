import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  Clock,
  BarChart3,
  Eye,
} from "lucide-react";
import { fetchDashboardStats, type DashboardStats } from "@/hooks/api";
import { useSession } from "@/contexts/SessionContext";

const currency = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { user } = useSession();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDashboardStats();
        setStats(data);
      } catch {
        // Error silenciado para evitar bloqueos visuales
      }
    })();
  }, []);

  const salesIncrease = useMemo(() => {
    if (!stats) return 0;
    const y = stats.yesterday.total || 1;
    return ((stats.today.total - y) / y) * 100;
  }, [stats]);

  const monthlyIncrease = useMemo(() => {
    if (!stats) return 0;
    const lm = stats.last_month.total || 1;
    return ((stats.this_month.total - lm) / lm) * 100;
  }, [stats]);

  const topProducts = stats?.top_products ?? [];
  const maxSold = Math.max(1, ...topProducts.map((p) => p.qty));

  const roleLabel =
    user?.role === "admin"
      ? "Administrador General"
      : `Trabajador / Turno ${user?.shift ?? "N/A"}`;

  return (
    <div className="flex-1 space-y-6 p-6 animate-premium-fade">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            INICIO
          </h1>
          <p className="text-muted-foreground">
            SISTEMA DE GESTIÓN LICORERA 
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-accent/20 text-accent border-accent/30">
            <Clock className="w-3 h-3 mr-1" />
            {roleLabel}
          </Badge>
          {user?.role === "admin" && (
            <Button
              variant="outline"
              onClick={() => navigate("/reports")}
              className="hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Reportes
            </Button>
          )}
        </div>
      </div>

      {/* Tarjetas principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="premium-card hover:shadow-neon transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {currency(stats?.today.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span
                className={`inline-flex items-center ${
                  salesIncrease >= 0 ? "text-accent" : "text-destructive"
                }`}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {salesIncrease.toFixed(1)}% vs ayer
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card hover:shadow-neon transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {currency(stats?.this_month.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center text-accent">
                <TrendingUp className="w-3 h-3 mr-1" />
                {monthlyIncrease.toFixed(1)}% vs mes anterior
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card hover:shadow-neon transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos Activos
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.products_count ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center text-destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {(stats?.low_stock?.length ?? 0)} con stock bajo
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card hover:shadow-neon transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transacciones Hoy
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.today.count ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats ? `${stats.yesterday.count} ayer` : "\u00A0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas y top productos */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alertas de Inventario
            </CardTitle>
            <CardDescription>
              Productos con stock bajo que requieren reposición
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(stats?.low_stock ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {item.stock}
                  </p>
                </div>
                <Badge variant="destructive" className="animate-pulse">
                  Crítico
                </Badge>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full mt-4 hover:bg-primary/10 hover:text-primary"
              onClick={() => navigate("/inventory")}
            >
              Ver Todo el Inventario
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Productos Más Vendidos
            </CardTitle>
            <CardDescription>
              Rendimiento de productos (últimos 30 días)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay ventas suficientes
                </p>
              ) : (
                topProducts.map((product) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-foreground">
                          {product.name}
                        </p>
                        <span className="text-sm font-bold text-primary">
                          {currency(product.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                          {product.qty} unidades vendidas
                        </p>
                        <Progress
                          value={(product.qty / maxSold) * 100}
                          className="flex-1 h-2"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Funciones frecuentemente utilizadas para gestión diaria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              className="h-20 flex-col gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
              onClick={() => navigate("/pos")}
            >
              <ShoppingCart className="h-6 w-6" />
              <span>Nueva Venta</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col gap-2 hover:bg-accent/20 hover:text-accent hover:border-accent/30"
              onClick={() => navigate("/inventory")}
            >
              <Package className="h-6 w-6" />
              <span>Actualizar Stock</span>
            </Button>

            {user?.role === "admin" && (
              <>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:bg-accent/20 hover:text-accent hover:border-accent/30"
                  onClick={() => navigate("/users")}
                >
                  <Users className="h-6 w-6" />
                  <span>Gestionar Personal</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:bg-accent/20 hover:text-accent hover:border-accent/30"
                  onClick={() => navigate("/reports")}
                >
                  <BarChart3 className="h-6 w-6" />
                  <span>Ver Reportes</span>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
