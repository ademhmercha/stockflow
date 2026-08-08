import { useEffect, useState } from "react";
import { Building2, Users, Receipt, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api-client";
import { EntrepriseAdmin, PaginatedResponse, Pagination, PlatformStats, StatutEntreprise } from "@/types";
import { formatDate, formatMontant } from "@/lib/utils";

const PAGE_SIZE = 20;

const STATUT_VARIANT: Record<StatutEntreprise, "success" | "warning" | "destructive"> = {
  actif: "success",
  essai: "warning",
  suspendu: "destructive",
};

const STATUT_LABEL: Record<StatutEntreprise, string> = {
  actif: "Actif",
  essai: "Essai",
  suspendu: "Suspendu",
};

export function AdminPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [entreprises, setEntreprises] = useState<EntrepriseAdmin[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function chargerStats() {
    const data = await api.get<PlatformStats>("/admin/stats");
    setStats(data);
  }

  async function chargerEntreprises(pageCible = page) {
    setLoading(true);
    const result = await api.get<PaginatedResponse<EntrepriseAdmin>>(
      `/admin/entreprises?page=${pageCible}&limit=${PAGE_SIZE}`
    );
    setEntreprises(result.data);
    setPagination(result.pagination);
    setPage(pageCible);
    setLoading(false);
  }

  useEffect(() => {
    chargerStats();
    chargerEntreprises(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changerStatut(entrepriseId: string, statut: StatutEntreprise) {
    setEntreprises((prev) => prev.map((e) => (e._id === entrepriseId ? { ...e, statut } : e)));
    await api
      .put(`/admin/entreprises/${entrepriseId}/statut`, { statut })
      .then(chargerStats)
      .catch(() => chargerEntreprises());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administration de la plateforme</h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble tous tenants confondus — réservée au propriétaire de la plateforme.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entreprises</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats?.totalEntreprises ?? "—"}</p>
            {stats && (
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.entreprisesParStatut.actif} actives · {stats.entreprisesParStatut.essai} en essai ·{" "}
                {stats.entreprisesParStatut.suspendu} suspendues
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats?.totalUtilisateurs ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Factures (plateforme)</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats?.nombreFacturesPlateforme ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CA plateforme</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats ? formatMontant(stats.chiffreAffairesPlateforme) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entreprises inscrites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Matricule fiscal</TableHead>
                <TableHead>Inscrite le</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Factures</TableHead>
                <TableHead>CA généré</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={5} columns={8} />
              ) : entreprises.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      icon={Building2}
                      title="Aucune entreprise inscrite"
                      description="Les entreprises apparaîtront ici dès qu'elles s'inscriront sur StockFlow."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                entreprises.map((e) => (
                  <TableRow key={e._id}>
                    <TableCell className="font-medium">{e.nom}</TableCell>
                    <TableCell className="text-muted-foreground">{e.matriculeFiscal}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(e.createdAt)}</TableCell>
                    <TableCell>{e.nombreUtilisateurs}</TableCell>
                    <TableCell>{e.nombreProduits}</TableCell>
                    <TableCell>{e.nombreFactures}</TableCell>
                    <TableCell>{formatMontant(e.chiffreAffaires)}</TableCell>
                    <TableCell>
                      <Select
                        value={e.statut}
                        onValueChange={(v) => changerStatut(e._id, v as StatutEntreprise)}
                      >
                        <SelectTrigger className="h-8 w-32 border-none bg-transparent p-0 shadow-none focus:ring-0">
                          <Badge variant={STATUT_VARIANT[e.statut]} className="cursor-pointer">
                            {STATUT_LABEL[e.statut]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="actif">Actif</SelectItem>
                          <SelectItem value="essai">Essai</SelectItem>
                          <SelectItem value="suspendu">Suspendu</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {pagination && <PaginationControls pagination={pagination} onPageChange={chargerEntreprises} />}
        </CardContent>
      </Card>
    </div>
  );
}
