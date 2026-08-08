import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProduitsPage } from "@/pages/ProduitsPage";
import { MouvementsPage } from "@/pages/MouvementsPage";
import { ClientsPage } from "@/pages/ClientsPage";
import { FacturesPage } from "@/pages/FacturesPage";
import { AdminPage } from "@/pages/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/produits"
          element={
            <ProtectedRoute roles={["admin", "vendeur"]}>
              <ProduitsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock/mouvements"
          element={
            <ProtectedRoute roles={["admin", "vendeur"]}>
              <MouvementsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/factures" element={<FacturesPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requirePlatformOwner>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
