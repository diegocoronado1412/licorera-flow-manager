import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User, RefreshCw } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors" />
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
              <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></div>
              Sistema Activo
            </Badge>
          </div>
        </div>

        {/* Center Section - Quick Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hover:bg-accent/20">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive hover:bg-destructive">
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">Administrador</p>
              <p className="text-xs text-muted-foreground">Turno Mañana</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/20">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}