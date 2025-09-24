import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Eye
} from "lucide-react";

const salesData = {
  today: 1875000,
  yesterday: 1650000,
  thisMonth: 44175500,
  lastMonth: 38500000,
};

const inventoryAlerts = [
  { product: "Cerveza Corona", stock: 6, minStock: 20, status: "low" },
  { product: "Aguardiente 750ml Verde", stock: 15, minStock: 30, status: "low" },
  { product: "Cerveza Costeñita", stock: 751, minStock: 500, status: "ok" },
];

const topProducts = [
  { name: "Cerveza Costeñita", sold: 2336, revenue: 8176000 },
  { name: "Cerveza Coronita", sold: 773, revenue: 4638000 },
  { name: "Aguardiente Litro Verde", sold: 74, revenue: 8510000 },
  { name: "Cerveza Negra", sold: 967, revenue: 3384500 },
];

export function Dashboard() {
  const salesIncrease = ((salesData.today - salesData.yesterday) / salesData.yesterday * 100).toFixed(1);
  const monthlyIncrease = ((salesData.thisMonth - salesData.lastMonth) / salesData.lastMonth * 100).toFixed(1);

  return (
    <div className="flex-1 space-y-6 p-6 animate-premium-fade">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Bienvenido al sistema de gestión de LA LICORERA Drink Ice
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-accent/20 text-accent border-accent/30">
            <Clock className="w-3 h-3 mr-1" />
            Turno Mañana
          </Badge>
          <Button variant="outline" className="hover:bg-primary/10 hover:text-primary hover:border-primary/30">
            <Eye className="w-4 h-4 mr-2" />
            Ver Reportes
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="premium-card hover:shadow-neon transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${salesData.today.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={`inline-flex items-center ${parseFloat(salesIncrease) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {salesIncrease}% vs ayer
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
              ${salesData.thisMonth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center text-accent">
                <TrendingUp className="w-3 h-3 mr-1" />
                {monthlyIncrease}% vs mes anterior
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card hover:shadow-neon transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">156</div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center text-destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                3 con stock bajo
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card hover:shadow-neon transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">247</div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center text-accent">
                <TrendingUp className="w-3 h-3 mr-1" />
                12% más que ayer
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Inventory Alerts */}
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
            {inventoryAlerts.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{item.product}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {item.stock} | Mínimo: {item.minStock}
                  </p>
                </div>
                <Badge 
                  variant={item.stock < item.minStock ? "destructive" : "outline"}
                  className={item.stock < item.minStock ? "animate-pulse" : ""}
                >
                  {item.stock < item.minStock ? "Crítico" : "OK"}
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4 hover:bg-primary/10 hover:text-primary">
              Ver Todo el Inventario
            </Button>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Productos Más Vendidos
            </CardTitle>
            <CardDescription>
              Rendimiento de productos en el período actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border/30">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <span className="text-sm font-bold text-primary">
                        ${product.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground">
                        {product.sold} unidades vendidas
                      </p>
                      <Progress 
                        value={(product.sold / Math.max(...topProducts.map(p => p.sold))) * 100} 
                        className="flex-1 h-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Funciones frecuentemente utilizadas para gestión diaria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button className="h-20 flex-col gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30">
              <ShoppingCart className="h-6 w-6" />
              <span>Nueva Venta</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-accent/20 hover:text-accent hover:border-accent/30">
              <Package className="h-6 w-6" />
              <span>Actualizar Stock</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-accent/20 hover:text-accent hover:border-accent/30">
              <Users className="h-6 w-6" />
              <span>Gestionar Turnos</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-accent/20 hover:text-accent hover:border-accent/30">
              <BarChart3 className="h-6 w-6" />
              <span>Ver Reportes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}