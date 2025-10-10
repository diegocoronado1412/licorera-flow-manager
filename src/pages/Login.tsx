import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "@/assets/logo-licorera.jpg";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "@/contexts/SessionContext";
import { useSettings } from "@/contexts/SettingsContext";

export default function Login() {
  const { login, quickLogin } = useSession();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(username, password);
      toast.success("Bienvenido");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "No se pudo iniciar sesión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Fondo con burbuja orbital */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
          <div className="relative w-[65vmin] h-[65vmin]">
            <div className="absolute left-1/2 top-1/2">
              <div className="orbit">
                <img
                  src={logoImage}
                  alt="logo"
                  className="bubble"
                  style={{ transform: "translateX(22vmin)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="relative z-10 w-full max-w-md p-4">
        <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/70 border-border/60">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-xl overflow-hidden shadow-md">
              <img src={logoImage} className="w-full h-full object-cover" alt="logo" />
            </div>
            <CardTitle className="mt-3">
              {settings?.business.name ?? "LA LICORERA"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Accede a tu cuenta</p>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <Label>Usuario</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ADMIN / TURNO1 / TURNO2"
                  autoFocus
                />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
              </div>

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Ingresando…" : "Ingresar"}
              </Button>

              {/* Atajos para pruebas (opcional). Puedes ocultarlos si quieres */}
              <div className="flex gap-2 justify-between mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await quickLogin("admin");
                      toast.success("Sesión: ADMIN");
                      navigate("/", { replace: true });
                    } catch {}
                  }}
                >
                  ADMIN
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await quickLogin("turno1");
                      toast.success("Sesión: TURNO1");
                      navigate("/", { replace: true });
                    } catch {}
                  }}
                >
                  TURNO 1
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await quickLogin("turno2");
                      toast.success("Sesión: TURNO2");
                      navigate("/", { replace: true });
                    } catch {}
                  }}
                >
                  TURNO 2
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground mt-2">
                *Demo: credenciales válidas — ADMIN/ADMIN0001, TURNO1/TURNO12025, TURNO2/TURNO22025
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* CSS para la burbuja/orbita */}
      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .orbit {
          position: relative;
          width: 0;
          height: 0;
          animation: orbit 36s linear infinite;
        }
        .bubble {
          width: 22vmin;
          height: 22vmin;
          border-radius: 9999px;
          object-fit: cover;
          filter: blur(1px) saturate(1.05);
          opacity: .55;
          box-shadow: 0 0 40px rgba(0,0,0,.12), inset 0 0 60px rgba(255,255,255,.07);
          transition: opacity .3s ease;
        }
      `}</style>
    </div>
  );
}
