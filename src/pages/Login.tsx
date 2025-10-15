// licorera-flow-manager/src/pages/Login.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "@/assets/logo-licorera.jpg";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "@/contexts/SessionContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useLicense } from "@/contexts/LicenseContext";

export default function Login() {
  const { login } = useSession();
  const { settings } = useSettings();
  const { isActive, code, expiresAt, daysLeft, activateLicense } = useLicense();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // --- Licencia ---
  const [licenseVisible, setLicenseVisible] = useState(false);
  const [licenseCode, setLicenseCode] = useState("");
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [dynamicDaysLeft, setDynamicDaysLeft] = useState<number | null>(daysLeft);

  // Actualiza días restantes en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive && expiresAt) {
        const expires = new Date(expiresAt);
        const now = new Date();
        const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDynamicDaysLeft(diff >= 0 ? diff : 0);
      }
    }, 60000); // cada 60 segundos

    return () => clearInterval(interval);
  }, [isActive, expiresAt]);

  // Formatear fecha a DD/MM/YYYY
  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  };

  async function handleActivateLicense() {
    if (!licenseCode.trim()) return toast.error("Ingrese un código de licencia");
    setLicenseLoading(true);
    try {
      await activateLicense(licenseCode.trim().toUpperCase());
      toast.success("Licencia activada correctamente");
      setLicenseCode("");
    } catch (err: any) {
      toast.error(err?.message || "Error al activar licencia");
    } finally {
      setLicenseLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isActive) {
      return toast.error("No puedes iniciar sesión: la licencia está inactiva o vencida");
    }

    setBusy(true);
    try {
      await login(username, password);
      toast.success("Bienvenido");
      navigate("/app", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "No se pudo iniciar sesión");
    } finally {
      setBusy(false);
    }
  }

  const bubbles = [
    { top: "8%", left: "10%", size: 120, ampX: "18vw", dur: "24s", delay: "-2s" },
    { top: "20%", left: "78%", size: 90, ampX: "15vw", dur: "28s", delay: "-8s" },
    { top: "66%", left: "7%", size: 100, ampX: "16vw", dur: "26s", delay: "-11s" },
  ];

  return (
    <div className="fixed inset-0 grid place-items-center bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />
        {bubbles.map((b, i) => (
          <img
            key={i}
            src={logoImage}
            alt="bubble"
            className="absolute rounded-full shadow-2xl bubble-move"
            style={{
              top: b.top,
              left: b.left,
              width: `${b.size}px`,
              height: `${b.size}px`,
              ["--amp-x" as any]: b.ampX,
              ["--dur" as any]: b.dur,
              ["--delay" as any]: b.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="relative z-10 w-[min(92vw,440px)] px-2 space-y-4">
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

              <p className="text-[11px] text-muted-foreground mt-2 text-center">Inicia sesión</p>
            </form>

            {/* --- Licencia --- */}
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLicenseVisible(v => !v)}
              >
                {licenseVisible ? "Ocultar licencia" : "Ver licencia"}
              </Button>

              {licenseVisible && (
                <div className="mt-2 p-3 border rounded bg-background/80 space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Estado: {isActive ? "✅ Activa" : "🔒 Inactiva"}
                  </div>
                  {isActive && (
                    <div className="text-xs text-muted-foreground">
                      Tipo: {code ?? "-"} <br />
                      Expira: {expiresAt ? formatDate(expiresAt) : "—"} <br />
                      Días restantes: {dynamicDaysLeft ?? "—"}
                    </div>
                  )}
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Código de licencia"
                      value={licenseCode}
                      onChange={e => setLicenseCode(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={handleActivateLicense}
                      disabled={licenseLoading}
                    >
                      Activar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
