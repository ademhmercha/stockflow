import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { DashboardStats } from "@/types";
import { formatMontant } from "@/lib/utils";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardStats>("/dashboard/stats")
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Chargement du tableau de bord...</p>;
  }

  if (!stats) {
    return <p className="text-destructive">Impossible de charger les statistiques.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chiffre d'affaires du mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatMontant(stats.chiffreAffairesMois)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Factures ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.nombreFacturesMois}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Produits en alerte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.stockCritique.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top produits (quantité vendue, ce mois)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {stats.topProduits.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune vente enregistrée ce mois-ci.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProduits} layout="vertical" margin={{ left: 24 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="nom" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="quantiteVendue" fill="hsl(222 47% 25%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertes de stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.stockCritique.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun produit sous le seuil d'alerte.</p>
            ) : (
              stats.stockCritique.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="font-medium">{p.nom}</p>
                    <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>
                  </div>
                  <Badge variant={p.stockActuel === 0 ? "destructive" : "warning"}>
                    {p.stockActuel} / seuil {p.seuilAlerte}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
