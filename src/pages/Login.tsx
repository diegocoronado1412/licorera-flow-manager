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
  const { login } = useSession();
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

  // Burbujas (posición, tamaño, amplitud, duración)
  const bubbles = [
    { top: "8%",  left: "10%", size: 120, ampX: "18vw", dur: "24s", delay: "-2s" },
    { top: "20%", left: "78%", size: 90,  ampX: "15vw", dur: "28s", delay: "-8s" },
    { top: "66%", left: "7%",  size: 100, ampX: "16vw", dur: "26s", delay: "-11s" },
    { top: "72%", left: "72%", size: 130, ampX: "20vw", dur: "30s", delay: "-4s" },
    { top: "38%", left: "50%", size: 70,  ampX: "12vw", dur: "22s", delay: "-14s" },
    { top: "14%", left: "52%", size: 65,  ampX: "13vw", dur: "32s", delay: "-6s" },
    { top: "82%", left: "36%", size: 95,  ampX: "14vw", dur: "28s", delay: "-16s" },
    { top: "30%", left: "24%", size: 75,  ampX: "11vw", dur: "25s", delay: "-10s" },
    { top: "54%", left: "85%", size: 80,  ampX: "13vw", dur: "27s", delay: "-18s" },
  ];

  return (
    // FONDO A PANTALLA COMPLETA + CARD CENTRADO
    <div className="fixed inset-0 grid place-items-center bg-background overflow-hidden">
      {/* Fondo con burbujas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />
        {bubbles.map((b, i) => (
          <img
            key={i}
            src={logoImage}
            alt="bubble"
            className="absolute rounded-full shadow-2xl bubble-move"
            style={
              {
                top: b.top,
                left: b.left,
                width: `${b.size}px`,
                height: `${b.size}px`,
                ["--amp-x" as any]: b.ampX,
                ["--dur" as any]: b.dur,
                ["--delay" as any]: b.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Contenido centrado */}
      <div className="relative z-10 w-[min(92vw,440px)] px-2">
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
                  autoComplete="username"
                />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Ingresando…" : "Ingresar"}
              </Button>

              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                Inicia sesión
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* CSS de animación */}
      <style>{`
        @keyframes float-x {
          from { transform: translateX(calc(var(--amp-x) * -1)); }
          to   { transform: translateX(var(--amp-x)); }
        }
        @keyframes float-y {
          from { transform: translateY(-2vh); }
          to   { transform: translateY(2vh); }
        }
        .bubble-move {
          object-fit: cover;
          filter: blur(1px) saturate(1.05);
          opacity: .55;
          box-shadow: 0 0 40px rgba(0,0,0,.12), inset 0 0 60px rgba(255,255,255,.07);
          animation:
            float-x var(--dur) ease-in-out infinite alternate,
            float-y calc(var(--dur) * 0.7) ease-in-out infinite alternate;
          animation-delay: var(--delay);
        }
      `}</style>
    </div>
  );
}
