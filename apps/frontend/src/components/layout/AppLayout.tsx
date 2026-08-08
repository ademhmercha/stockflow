import { Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";

export function AppLayout() {
  const suspendedMessage = useAuthStore((s) => s.suspendedMessage);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Détecté globalement dès qu'un appel API échoue avec le code
  // ENTREPRISE_SUSPENDUE (voir api-client.ts) : on remplace toute
  // l'application par cet écran, sidebar comprise, plutôt que de laisser
  // l'utilisateur naviguer vers des pages qui échoueront de toute façon.
  if (suspendedMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <ShieldAlert className="mb-2 h-10 w-10 text-destructive" />
            <CardTitle>Compte suspendu</CardTitle>
            <CardDescription>{suspendedMessage}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={clearSession}>
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
