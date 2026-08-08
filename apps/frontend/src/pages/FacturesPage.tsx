import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, FileDown, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api-client";
import { Client, Facture, PaginatedResponse, Pagination, Produit, StatutFacture } from "@/types";
import { formatDate, formatMontant } from "@/lib/utils";

const PAGE_SIZE = 20;
// Limite haute utilisée pour peupler les listes déroulantes (client/produit) du
// formulaire de création : au-delà, il faudrait un select avec recherche
// côté serveur plutôt que de tout charger d'un coup.
const DROPDOWN_LIMIT = 100;

interface LigneBrouillon {
  produitId: string;
  quantite: number;
}

const STATUT_VARIANT: Record<StatutFacture, "secondary" | "warning" | "success"> = {
  brouillon: "secondary",
  envoyee: "warning",
  payee: "success",
};

// Le timbre fiscal affiché ici est indicatif ; le montant définitif appliqué
// est calculé côté serveur à partir de TIMBRE_FISCAL_MONTANT.
const TIMBRE_FISCAL_INDICATIF = 1;

export function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [clientId, setClientId] = useState("");
  const [lignes, setLignes] = useState<LigneBrouillon[]>([]);

  async function chargerFactures(pageCible = page) {
    setLoading(true);
    const result = await api.get<PaginatedResponse<Facture>>(
      `/factures?page=${pageCible}&limit=${PAGE_SIZE}`
    );
    setFactures(result.data);
    setPagination(result.pagination);
    setPage(pageCible);
    setLoading(false);
  }

  async function chargerListesDeroulantes() {
    const [c, p] = await Promise.all([
      api.get<PaginatedResponse<Client>>(`/clients?page=1&limit=${DROPDOWN_LIMIT}`),
      api.get<PaginatedResponse<Produit>>(`/produits?page=1&limit=${DROPDOWN_LIMIT}`),
    ]);
    setClients(c.data);
    setProduits(p.data);
  }

  useEffect(() => {
    chargerFactures(1);
    chargerListesDeroulantes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ouvrirCreation() {
    setClientId("");
    setLignes([{ produitId: "", quantite: 1 }]);
    setDialogOpen(true);
  }

  function ajouterLigne() {
    setLignes([...lignes, { produitId: "", quantite: 1 }]);
  }

  function retirerLigne(index: number) {
    setLignes(lignes.filter((_, i) => i !== index));
  }

  function majLigne(index: number, patch: Partial<LigneBrouillon>) {
    setLignes(lignes.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  const apercu = useMemo(() => {
    let montantHT = 0;
    let montantTVA = 0;

    for (const ligne of lignes) {
      const produit = produits.find((p) => p._id === ligne.produitId);
      if (!produit) continue;
      const totalLigneHT = produit.prixVente * ligne.quantite;
      montantHT += totalLigneHT;
      montantTVA += totalLigneHT * (produit.tauxTVA / 100);
    }

    const montantTTC = montantHT + montantTVA + TIMBRE_FISCAL_INDICATIF;
    return { montantHT, montantTVA, montantTTC };
  }, [lignes, produits]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const lignesValides = lignes.filter((l) => l.produitId && l.quantite > 0);
    if (lignesValides.length === 0) return;

    await api.post("/factures", { clientId, lignes: lignesValides });
    setDialogOpen(false);
    await chargerFactures(1); // les nouvelles factures apparaissent en premier (tri par date desc)
  }

  async function telechargerPdf(facture: Facture) {
    const blob = await api.get<Blob>(`/factures/${facture._id}/pdf`);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  async function changerStatut(factureId: string, statut: StatutFacture) {
    setFactures((prev) => prev.map((f) => (f._id === factureId ? { ...f, statut } : f)));
    await api.put(`/factures/${factureId}/statut`, { statut }).catch(() => chargerFactures());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Factures</h1>
        <Button onClick={ouvrirCreation}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total TTC</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : factures.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <EmptyState
                  icon={Receipt}
                  title="Aucune facture"
                  description="Crée ta première facture à partir d'un client et de produits existants."
                  action={
                    <Button size="sm" onClick={ouvrirCreation}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nouvelle facture
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          ) : (
            factures.map((f) => (
              <TableRow key={f._id}>
                <TableCell className="font-medium">{f.numero}</TableCell>
                <TableCell>{typeof f.clientId === "object" ? f.clientId.nom : f.clientId}</TableCell>
                <TableCell>{formatDate(f.dateEmission)}</TableCell>
                <TableCell>{formatMontant(f.montantTTC)}</TableCell>
                <TableCell>
                  <Select value={f.statut} onValueChange={(v) => changerStatut(f._id, v as StatutFacture)}>
                    <SelectTrigger className="h-8 w-36 border-none bg-transparent p-0 shadow-none focus:ring-0">
                      <Badge variant={STATUT_VARIANT[f.statut]} className="cursor-pointer">
                        {f.statut}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brouillon">brouillon</SelectItem>
                      <SelectItem value="envoyee">envoyée</SelectItem>
                      <SelectItem value="payee">payée</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => telechargerPdf(f)}>
                    <FileDown className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination && <PaginationControls pagination={pagination} onPageChange={chargerFactures} />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle facture</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lignes</Label>
                <Button type="button" variant="outline" size="sm" onClick={ajouterLigne}>
                  <Plus className="mr-1 h-3 w-3" />
                  Ajouter une ligne
                </Button>
              </div>

              {lignes.map((ligne, index) => {
                const produit = produits.find((p) => p._id === ligne.produitId);
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Select value={ligne.produitId} onValueChange={(v) => majLigne(index, { produitId: v })}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {produits.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.nom} — {formatMontant(p.prixVente)} (TVA {p.tauxTVA}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      className="w-24"
                      value={ligne.quantite}
                      onChange={(e) => majLigne(index, { quantite: Number(e.target.value) })}
                    />
                    <span className="w-28 text-right text-sm text-muted-foreground">
                      {produit ? formatMontant(produit.prixVente * ligne.quantite) : "—"}
                    </span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => retirerLigne(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="ml-auto w-64 space-y-1 rounded-md border border-border p-4 text-sm">
              <div className="flex justify-between">
                <span>Total HT</span>
                <span>{formatMontant(apercu.montantHT)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total TVA</span>
                <span>{formatMontant(apercu.montantTVA)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Timbre fiscal (indicatif)</span>
                <span>{formatMontant(TIMBRE_FISCAL_INDICATIF)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-semibold">
                <span>Total TTC</span>
                <span>{formatMontant(apercu.montantTTC)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={!clientId}>
                Créer la facture
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
