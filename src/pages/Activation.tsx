import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLicense } from "@/contexts/LicenseContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Activation() {
  const { activateLicense, isActive } = useLicense();
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  async function handleActivate() {
    if (isActive) {
      toast.error("Ya hay una licencia activa.");
      return;
    }

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      toast.error("Ingrese un código");
      return;
    }

    try {
      await activateLicense(normalizedCode);
      toast.success("Licencia activada correctamente");
      // Ir al login para que el usuario inicie sesión después de activar
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Error al activar licencia");
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Card className="w-[380px] text-center">
        <CardHeader>
          <CardTitle>Activar Licencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Ingrese código de activación"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button onClick={handleActivate} className="w-full">
            Activar
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Ingrese su código de licencia para activar el sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
