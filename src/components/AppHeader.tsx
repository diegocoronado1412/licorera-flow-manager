import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, User, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useSession } from "@/contexts/SessionContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";

export function AppHeader() {
  const { settings } = useSettings();
  const { items, unread, markAllRead } = useNotifications();
  const { user, usersList, login, logout } = useSession();
  const navigate = useNavigate();

  const [authOpen, setAuthOpen] = React.useState(false);
  const [authUsername, setAuthUsername] = React.useState("");
  const [authPassword, setAuthPassword] = React.useState("");
  const [authBusy, setAuthBusy] = React.useState(false);

  function openAuthForUser(targetId: string) {
    setAuthUsername(targetId.toUpperCase());
    setAuthPassword("");
    setAuthOpen(true);
  }

  async function submitAuth(e?: React.FormEvent) {
    e?.preventDefault();
    if (!authUsername || !authPassword) return;
    setAuthBusy(true);

    try {
      const success = await login(authUsername, authPassword);
      if (success) {
        toast.success(`Sesión iniciada como ${authUsername}`);
        setAuthOpen(false);

        // 🔹 Esperar para permitir que el contexto se actualice
        await new Promise((r) => setTimeout(r, 250));

        // 🔹 Redirigir con reemplazo del historial
        navigate("/app", { replace: true });
      } else {
        toast.error("No se pudo iniciar sesión.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Credenciales inválidas");
    } finally {
      setAuthBusy(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">

        {/* Sección izquierda */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors" />
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
              <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></div>
              Sistema Activo
            </Badge>
          </div>
        </div>

        {/* Centro */}
        <div className="hidden lg:flex flex-col items-center gap-0.5 text-center">
          <span className="text-sm font-semibold tracking-wide uppercase">
            {settings?.business.name ?? "LA LICORERA"}
          </span>
          {user && (
            <span className="text-xs text-muted-foreground">
              {user.role === "admin"
                ? `Administrador — ${user.name}`
                : `Cajero (${user.shift}) — ${user.name}`}
            </span>
          )}
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-2">
          {/* Notificaciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-accent/20">
                <Bell className="h-5 w-5" />
                {unread && (
                  <span className="absolute -top-0.5 -right-0.5 inline-block w-2 h-2 rounded-full bg-destructive" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {items.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No hay notificaciones
                </div>
              ) : (
                <>
                  {items.map((n) => (
                    <div key={n.id} className="px-3 py-2 flex gap-3 items-start">
                      {n.level === "success" && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />}
                      {n.level === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                      {n.level === "info" && <Info className="h-4 w-4 text-blue-500 mt-0.5" />}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{n.title}</div>
                        {n.description && (
                          <div className="text-xs text-muted-foreground truncate">{n.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-3 pb-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={markAllRead}>
                      Marcar como leídas
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/20">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{user?.name ?? "Sin sesión"}</div>
                  {user && (
                    <div className="text-xs text-muted-foreground capitalize">
                      {user.role === "admin"
                        ? "Rol: Administrador"
                        : `Rol: Cajero · Turno: ${user.shift}`}
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Cambio de usuario */}
              <DropdownMenuGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Cambiar de usuario</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {usersList.map((u) => (
                        <DropdownMenuItem
                          key={u.id}
                          onClick={() => {
                            if (!user || u.id === user.id) return;
                            openAuthForUser(u.id);
                          }}
                        >
                          {u.name}
                          {user?.id === u.id && (
                            <span className="ml-auto text-xs text-muted-foreground">(actual)</span>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  toast.success("Sesión cerrada correctamente");
                  navigate("/login", { replace: true });
                }}
              >
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Diálogo de autenticación */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={submitAuth}>
            <DialogHeader>
              <DialogTitle>Autenticación requerida</DialogTitle>
              <DialogDescription>
                Ingresa las credenciales del usuario seleccionado para continuar.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Usuario</Label>
                <Input
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="ADMIN / TURNO1 / TURNO2"
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="********"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAuthOpen(false)}
                disabled={authBusy}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={authBusy || !authUsername || !authPassword}>
                {authBusy ? "Verificando…" : "Acceder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
