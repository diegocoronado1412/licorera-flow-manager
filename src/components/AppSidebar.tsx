import { 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Clock, 
  Settings,
  LogOut
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/logo-licorera.jpg";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Punto de Venta", url: "/pos", icon: ShoppingCart },
  { title: "Inventario", url: "/inventory", icon: Package },
  { title: "Usuarios", url: "/users", icon: Users },
  { title: "Reportes", url: "/reports", icon: BarChart3 },
  { title: "Turnos", url: "/shifts", icon: Clock },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { toast } = useToast();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };

  return (
    <Sidebar className={`${!open ? "w-16" : "w-64"} transition-all duration-300`}>
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
              <img 
                src={logoImage} 
                alt="LA LICORERA" 
                className="w-full h-full object-cover"
              />
            </div>
            {open && (
              <div className="animate-premium-fade">
                <h2 className="text-lg font-bold text-primary">LA LICORERA</h2>
                <p className="text-xs text-muted-foreground">Drink Ice</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground px-4 py-2">
            {open && "Navegación Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => `
                        flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200
                        ${isActive 
                          ? "bg-primary/20 text-primary shadow-premium border border-primary/30" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }
                        ${!open ? "justify-center" : ""}
                      `}
                    >
                      <item.icon className={`h-5 w-5 ${isActive(item.url) && "animate-neon-pulse"}`} />
                      {open && (
                        <span className="animate-premium-fade">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground px-4 py-2">
            {open && "Sistema"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) => `
                      flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? "bg-primary/20 text-primary shadow-premium border border-primary/30" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                      ${!open ? "justify-center" : ""}
                    `}
                  >
                    <Settings className="h-5 w-5" />
                    {open && <span className="animate-premium-fade">Configuración</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="space-y-2">
          {open && (
            <div className="text-xs text-muted-foreground animate-premium-fade">
              <p className="font-medium text-primary">Usuario: Administrador</p>
              <p>Turno: Mañana</p>
            </div>
          )}
          <Button
            variant="outline"
            size={!open ? "icon" : "sm"}
            onClick={handleLogout}
            className="w-full hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            {open && <span className="ml-2">Cerrar Sesión</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}