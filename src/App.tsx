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
import { SessionProvider, useSession } from "@/contexts/SessionContext";
import { LicenseProvider, useLicense } from "@/contexts/LicenseContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isActive } = useLicense();
  const { user } = useSession(); // opcional para decisiones UI role-based

  // Si la licencia no está activa, sólo mostramos la activación
  if (!isActive) {
    return (
      <Routes>
        <Route path="*" element={<Activation />} />
      </Routes>
    );
  }

  // Si la licencia está activa, dejamos /login público y hacemos la app en /app
  return (
    <Routes>
      {/* Ruta pública de login */}
      <Route path="/login" element={<Login />} />

      {/* Si el usuario visita / (root) redirigimos a /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Layout principal protegido */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <AppHeader />
              <Routes>
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/inventory"
                  element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/pos"
                  element={
                    <ProtectedRoute>
                      <POS />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/users"
                  element={
                    <ProtectedRoute>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/reports"
                  element={
                    <ProtectedRoute>
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        }
      />
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
