// src/App.tsx - VERSIÓN CORREGIDA
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Inventory from "./pages/Inventory";
import POS from "./pages/POS";
import SettingsPage from "./pages/Settings";
import Login from "./pages/Login";
import UsersPage from "./pages/Users";
import ReportsPage from "./pages/ReportsPage";
import Activation from "./pages/Activation";

import { SettingsProvider } from "@/contexts/SettingsContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { LicenseProvider, useLicense } from "@/contexts/LicenseContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isActive, isLoading } = useLicense();

  // 🔥 CRÍTICO: Mostrar loading mientras verificamos
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verificando licencia...</p>
        </div>
      </div>
    );
  }

  // ✅ Si NO está activa, SOLO mostrar activación
  if (!isActive) {
    return (
      <Routes>
        <Route path="*" element={<Activation />} />
      </Routes>
    );
  }

  // ✅ Licencia verificada y activa
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex w-full bg-background">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <AppHeader />
                <Routes>
                  <Route index element={<Index />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="pos" element={<POS />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                </Routes>
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LicenseProvider>
          <SettingsProvider>
            <SidebarProvider defaultOpen={true}>
              <SessionProvider>
                <AppRoutes />
              </SessionProvider>
            </SidebarProvider>
          </SettingsProvider>
        </LicenseProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;