// LICORERA/licorera-flow-manager/src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Activation from "./pages/Activation"; // Página de activación

import { SettingsProvider } from "@/contexts/SettingsContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { LicenseProvider, useLicense } from "@/contexts/LicenseContext"; // Contexto de licencia
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

// --- Subcomponente que maneja las rutas según la licencia ---
function AppRoutes() {
  const { isActive } = useLicense();

  // 🔒 Si la licencia NO está activa, solo permite la página de activación
  if (!isActive) {
    return (
      <Routes>
        <Route path="*" element={<Activation />} />
      </Routes>
    );
  }

  // ✅ Si la licencia está activa, carga el sistema normalmente
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />

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
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute>
                      <POS />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
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

// --- App principal ---
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LicenseProvider> {/* ⬅️ Envuelve toda la app con la licencia */}
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
