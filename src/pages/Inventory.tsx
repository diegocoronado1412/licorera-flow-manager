import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: number;
  name: string;
  category: string;
  initialCount: number;
  entries: number;
  finalCount: number;
  sold: number;
  costPerUnit: number;
  totalCost: number;
  salePrice: number;
  totalSales: number;
  profit: number;
}

const inventoryData: Product[] = [
  {
    id: 1,
    name: "GASEOSA COCACOLA PERSONAL",
    category: "Bebidas",
    initialCount: 0,
    entries: 36,
    finalCount: 11,
    sold: 25,
    costPerUnit: 2500,
    totalCost: 62500,
    salePrice: 5000,
    totalSales: 125000,
    profit: 62500
  },
  {
    id: 2,
    name: "HIT PERSONAL",
    category: "Bebidas",
    initialCount: 4,
    entries: 0,
    finalCount: 0,
    sold: 4,
    costPerUnit: 2333,
    totalCost: 9333,
    salePrice: 5000,
    totalSales: 20000,
    profit: 10667
  },
  {
    id: 3,
    name: "GASEOSA 1.5 BRETAÑA",
    category: "Bebidas",
    initialCount: 0,
    entries: 2,
    finalCount: 0,
    sold: 2,
    costPerUnit: 0,
    totalCost: 0,
    salePrice: 12000,
    totalSales: 24000,
    profit: 24000
  },
  {
    id: 4,
    name: "SMIRNF ROJA",
    category: "Licores",
    initialCount: 6,
    entries: 0,
    finalCount: 3,
    sold: 3,
    costPerUnit: 7129,
    totalCost: 21387,
    salePrice: 13000,
    totalSales: 39000,
    profit: 17613
  },
  {
    id: 5,
    name: "BUDWEISER LATA",
    category: "Cervezas",
    initialCount: 24,
    entries: 96,
    finalCount: 78,
    sold: 42,
    costPerUnit: 2333,
    totalCost: 97986,
    salePrice: 4500,
    totalSales: 189000,
    profit: 91014
  },
  {
    id: 6,
    name: "JP LATA ROSADA",
    category: "Cervezas",
    initialCount: 3,
    entries: 11,
    finalCount: 14,
    sold: 0,
    costPerUnit: 9040,
    totalCost: 0,
    salePrice: 14000,
    totalSales: 0,
    profit: 0
  },
  {
    id: 7,
    name: "CORONA",
    category: "Cervezas",
    initialCount: 0,
    entries: 48,
    finalCount: 42,
    sold: 6,
    costPerUnit: 3833,
    totalCost: 23000,
    salePrice: 9000,
    totalSales: 54000,
    profit: 31000
  },
  {
    id: 8,
    name: "STELLA BOTELLA",
    category: "Cervezas",
    initialCount: 8,
    entries: 24,
    finalCount: 21,
    sold: 11,
    costPerUnit: 3333,
    totalCost: 36667,
    salePrice: 9000,
    totalSales: 99000,
    profit: 62333
  },
  {
    id: 9,
    name: "SMIRNOF VERDE",
    category: "Licores",
    initialCount: 3,
    entries: 24,
    finalCount: 12,
    sold: 15,
    costPerUnit: 7129,
    totalCost: 106935,
    salePrice: 13000,
    totalSales: 195000,
    profit: 88065
  },
  {
    id: 10,
    name: "NEGRA BOTELLA",
    category: "Cervezas",
    initialCount: 560,
    entries: 900,
    finalCount: 493,
    sold: 967,
    costPerUnit: 2400,
    totalCost: 2320800,
    salePrice: 3500,
    totalSales: 3384500,
    profit: 1063700
  },
  {
    id: 11,
    name: "LIGHT BOTELLA",
    category: "Cervezas",
    initialCount: 153,
    entries: 0,
    finalCount: 9,
    sold: 144,
    costPerUnit: 2400,
    totalCost: 345600,
    salePrice: 4000,
    totalSales: 576000,
    profit: 230400
  },
  {
    id: 12,
    name: "PILSEN BOTELLA",
    category: "Cervezas",
    initialCount: 94,
    entries: 150,
    finalCount: 26,
    sold: 218,
    costPerUnit: 2566,
    totalCost: 559388,
    salePrice: 4000,
    totalSales: 872000,
    profit: 312612
  },
  {
    id: 13,
    name: "CORONITA",
    category: "Cervezas",
    initialCount: 344,
    entries: 492,
    finalCount: 63,
    sold: 773,
    costPerUnit: 2750,
    totalCost: 2125750,
    salePrice: 6000,
    totalSales: 4638000,
    profit: 2512250
  },
  {
    id: 14,
    name: "COSTEÑITA",
    category: "Cervezas",
    initialCount: 1377,
    entries: 1710,
    finalCount: 751,
    sold: 2336,
    costPerUnit: 1894,
    totalCost: 4424384,
    salePrice: 3500,
    totalSales: 8176000,
    profit: 3751616
  },
  {
    id: 15,
    name: "POKER BOTELLA",
    category: "Cervezas",
    initialCount: 543,
    entries: 450,
    finalCount: 294,
    sold: 699,
    costPerUnit: 2400,
    totalCost: 1677600,
    salePrice: 4000,
    totalSales: 2796000,
    profit: 1118400
  },
  {
    id: 16,
    name: "CLUB COLOMBIA BOTELLA",
    category: "Cervezas",
    initialCount: 91,
    entries: 150,
    finalCount: 105,
    sold: 136,
    costPerUnit: 3033,
    totalCost: 412488,
    salePrice: 5000,
    totalSales: 680000,
    profit: 267512
  },
  {
    id: 17,
    name: "375 VERDE",
    category: "Licores",
    initialCount: 4,
    entries: 60,
    finalCount: 37,
    sold: 27,
    costPerUnit: 20122,
    totalCost: 543294,
    salePrice: 50000,
    totalSales: 1350000,
    profit: 806706
  },
  {
    id: 18,
    name: "750 VERDE",
    category: "Licores",
    initialCount: 4,
    entries: 40,
    finalCount: 15,
    sold: 29,
    costPerUnit: 38668,
    totalCost: 1121372,
    salePrice: 80000,
    totalSales: 2320000,
    profit: 1198628
  },
  {
    id: 19,
    name: "LITRO VERDE",
    category: "Licores",
    initialCount: 33,
    entries: 60,
    finalCount: 19,
    sold: 74,
    costPerUnit: 49982,
    totalCost: 3698668,
    salePrice: 115000,
    totalSales: 8510000,
    profit: 4811332
  },
  {
    id: 20,
    name: "MEDELLIN 8A 750",
    category: "Licores",
    initialCount: 1,
    entries: 0,
    finalCount: 0,
    sold: 1,
    costPerUnit: 67060,
    totalCost: 67060,
    salePrice: 115000,
    totalSales: 115000,
    profit: 47940
  },
  {
    id: 21,
    name: "OLD PAR 750",
    category: "Whisky",
    initialCount: 0,
    entries: 3,
    finalCount: 1,
    sold: 2,
    costPerUnit: 124053,
    totalCost: 248106,
    salePrice: 274000,
    totalSales: 548000,
    profit: 299894
  },
  {
    id: 22,
    name: "OLD PAR 500",
    category: "Whisky",
    initialCount: 0,
    entries: 2,
    finalCount: 0,
    sold: 2,
    costPerUnit: 88125,
    totalCost: 176250,
    salePrice: 139000,
    totalSales: 278000,
    profit: 101750
  },
  {
    id: 23,
    name: "GARRAFON VERDE",
    category: "Licores",
    initialCount: 0,
    entries: 18,
    finalCount: 2,
    sold: 16,
    costPerUnit: 82360,
    totalCost: 1317760,
    salePrice: 175000,
    totalSales: 2800000,
    profit: 1482240
  },
  {
    id: 24,
    name: "1800 REPOSADO",
    category: "Tequila",
    initialCount: 0,
    entries: 1,
    finalCount: 0,
    sold: 1,
    costPerUnit: 204090,
    totalCost: 204090,
    salePrice: 324000,
    totalSales: 324000,
    profit: 119910
  },
  {
    id: 25,
    name: "ASPIRINA",
    category: "Medicamentos",
    initialCount: 4,
    entries: 50,
    finalCount: 46,
    sold: 8,
    costPerUnit: 1500,
    totalCost: 12000,
    salePrice: 3000,
    totalSales: 24000,
    profit: 12000
  },
  {
    id: 26,
    name: "BON FIEST",
    category: "Snacks",
    initialCount: 0,
    entries: 32,
    finalCount: 8,
    sold: 24,
    costPerUnit: 3700,
    totalCost: 88800,
    salePrice: 5000,
    totalSales: 120000,
    profit: 31200
  },
  {
    id: 27,
    name: "PAPAS",
    category: "Snacks",
    initialCount: 14,
    entries: 0,
    finalCount: 3,
    sold: 11,
    costPerUnit: 5932,
    totalCost: 65252,
    salePrice: 10000,
    totalSales: 110000,
    profit: 44748
  },
  {
    id: 28,
    name: "DETODITOS",
    category: "Snacks",
    initialCount: 11,
    entries: 0,
    finalCount: 0,
    sold: 11,
    costPerUnit: 6779,
    totalCost: 74569,
    salePrice: 10000,
    totalSales: 110000,
    profit: 35431
  },
  {
    id: 29,
    name: "CHOCLITOS",
    category: "Snacks",
    initialCount: 3,
    entries: 0,
    finalCount: 1,
    sold: 2,
    costPerUnit: 6200,
    totalCost: 12400,
    salePrice: 10000,
    totalSales: 20000,
    profit: 7600
  },
  {
    id: 30,
    name: "BOLIQUESO",
    category: "Snacks",
    initialCount: 4,
    entries: 0,
    finalCount: 4,
    sold: 0,
    costPerUnit: 5508,
    totalCost: 0,
    salePrice: 10000,
    totalSales: 0,
    profit: 0
  }
];

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const categories = ["Todos", ...Array.from(new Set(inventoryData.map(item => item.category)))];
  
  const filteredData = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const totalInventoryValue = inventoryData.reduce((sum, item) => sum + item.totalCost, 0);
  const totalSalesValue = inventoryData.reduce((sum, item) => sum + item.totalSales, 0);
  const totalProfitValue = inventoryData.reduce((sum, item) => sum + item.profit, 0);
  const totalProductsSold = inventoryData.reduce((sum, item) => sum + item.sold, 0);

  const getStockLevel = (finalCount: number, sold: number) => {
    if (finalCount === 0) return "stock-out";
    if (finalCount <= 5) return "stock-low";
    if (finalCount <= 20) return "stock-medium";
    return "stock-high";
  };

  const getStockBadge = (finalCount: number, sold: number) => {
    const level = getStockLevel(finalCount, sold);
    switch (level) {
      case "stock-out":
        return <Badge variant="destructive" className="text-xs">Agotado</Badge>;
      case "stock-low":
        return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 text-xs">Bajo</Badge>;
      case "stock-medium":
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">Medio</Badge>;
      default:
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">Alto</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Gestión de Inventario
          </h2>
          <p className="text-muted-foreground">
            Control completo del inventario de LA LICORERA Drink Ice
          </p>
        </div>
      </div>

      {/* Summary Cards */}
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
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatCurrency(totalSalesValue)}</div>
            <p className="text-xs text-muted-foreground">Ingresos por ventas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{formatCurrency(totalProfitValue)}</div>
            <p className="text-xs text-muted-foreground">Ganancia neta</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalProductsSold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unidades totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Inventario</CardTitle>
          <CardDescription>
            Busca y filtra productos por categoría
          </CardDescription>
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
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario Detallado</CardTitle>
          <CardDescription>
            Mostrando {filteredData.length} de {inventoryData.length} productos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-semibold">Producto</TableHead>
                  <TableHead className="font-semibold">Categoría</TableHead>
                  <TableHead className="font-semibold text-center">Stock Actual</TableHead>
                  <TableHead className="font-semibold text-center">Estado</TableHead>
                  <TableHead className="font-semibold text-center">Vendidos</TableHead>
                  <TableHead className="font-semibold text-right">Costo Unit.</TableHead>
                  <TableHead className="font-semibold text-right">Precio Venta</TableHead>
                  <TableHead className="font-semibold text-right">Total Ventas</TableHead>
                  <TableHead className="font-semibold text-right">Utilidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium max-w-[200px]">
                      <div className="truncate" title={product.name}>
                        {product.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {product.finalCount}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStockBadge(product.finalCount, product.sold)}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {product.sold}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(product.costPerUnit)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(product.salePrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(product.totalSales)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={product.profit > 0 ? "text-green-600" : product.profit < 0 ? "text-red-600" : ""}>
                        {formatCurrency(product.profit)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}