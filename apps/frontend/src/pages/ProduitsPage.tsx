import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Plus, Upload, Pencil, Package } from "lucide-react";
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
import { PaginatedResponse, Pagination, Produit } from "@/types";
import { formatMontant } from "@/lib/utils";

const PAGE_SIZE = 20;

type ProduitFormState = {
  nom: string;
  sku: string;
  categorie: string;
  prixAchat: string;
  prixVente: string;
  tauxTVA: "19" | "13" | "7" | "0";
  stockActuel: string;
  seuilAlerte: string;
};

const FORM_VIDE: ProduitFormState = {
  nom: "",
  sku: "",
  categorie: "",
  prixAchat: "",
  prixVente: "",
  tauxTVA: "19",
  stockActuel: "0",
  seuilAlerte: "5",
};

export function ProduitsPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Produit | null>(null);
  const [form, setForm] = useState<ProduitFormState>(FORM_VIDE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function chargerProduits(pageCible = page) {
    setLoading(true);
    const result = await api.get<PaginatedResponse<Produit>>(
      `/produits?page=${pageCible}&limit=${PAGE_SIZE}`
    );
    setProduits(result.data);
    setPagination(result.pagination);
    setPage(pageCible);
    setLoading(false);
  }

  useEffect(() => {
    chargerProduits(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ouvrirCreation() {
    setEditing(null);
    setForm(FORM_VIDE);
    setDialogOpen(true);
  }

  function ouvrirEdition(produit: Produit) {
    setEditing(produit);
    setForm({
      nom: produit.nom,
      sku: produit.sku,
      categorie: produit.categorie,
      prixAchat: String(produit.prixAchat),
      prixVente: String(produit.prixVente),
      tauxTVA: String(produit.tauxTVA) as ProduitFormState["tauxTVA"],
      stockActuel: String(produit.stockActuel),
      seuilAlerte: String(produit.seuilAlerte),
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      nom: form.nom,
      sku: form.sku,
      categorie: form.categorie || "Général",
      prixAchat: Number(form.prixAchat),
      prixVente: Number(form.prixVente),
      tauxTVA: Number(form.tauxTVA) as 19 | 13 | 7 | 0,
      stockActuel: Number(form.stockActuel),
      seuilAlerte: Number(form.seuilAlerte),
    };

    if (editing) {
      await api.put(`/produits/${editing._id}`, payload);
    } else {
      await api.post("/produits", payload);
    }

    setDialogOpen(false);
    await chargerProduits();
  }

  // Import CSV basique : colonnes attendues nom,sku,categorie,prixAchat,prixVente,tauxTVA,stockActuel,seuilAlerte
  async function handleImportCsv(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const texte = await file.text();
    const lignes = texte.trim().split(/\r?\n/);
    const [, ...dataLignes] = lignes; // on ignore la ligne d'en-têtes

    for (const ligne of dataLignes) {
      if (!ligne.trim()) continue;
      const [nom, sku, categorie, prixAchat, prixVente, tauxTVA, stockActuel, seuilAlerte] =
        ligne.split(",").map((v) => v.trim());

      await api.post("/produits", {
        nom,
        sku,
        categorie: categorie || "Général",
        prixAchat: Number(prixAchat),
        prixVente: Number(prixVente),
        tauxTVA: Number(tauxTVA),
        stockActuel: Number(stockActuel ?? 0),
        seuilAlerte: Number(seuilAlerte ?? 5),
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    await chargerProduits();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produits</h1>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportCsv}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importer CSV
          </Button>
          <Button onClick={ouvrirCreation}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Prix vente</TableHead>
            <TableHead>TVA</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : produits.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7}>
                <EmptyState
                  icon={Package}
                  title="Aucun produit"
                  description="Ajoute ton premier produit ou importe un catalogue via un fichier CSV."
                  action={
                    <Button size="sm" onClick={ouvrirCreation}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nouveau produit
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          ) : (
            produits.map((p) => (
              <TableRow key={p._id}>
                <TableCell className="font-medium">{p.nom}</TableCell>
                <TableCell>{p.sku}</TableCell>
                <TableCell>{p.categorie}</TableCell>
                <TableCell>{formatMontant(p.prixVente)}</TableCell>
                <TableCell>{p.tauxTVA}%</TableCell>
                <TableCell>
                  <Badge variant={p.stockActuel <= p.seuilAlerte ? "warning" : "secondary"}>
                    {p.stockActuel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => ouvrirEdition(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination && <PaginationControls pagination={pagination} onPageChange={chargerProduits} />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Taux TVA</Label>
                <Select
                  value={form.tauxTVA}
                  onValueChange={(v) => setForm({ ...form, tauxTVA: v as ProduitFormState["tauxTVA"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="19">19% (taux normal)</SelectItem>
                    <SelectItem value="13">13% (taux réduit)</SelectItem>
                    <SelectItem value="7">7% (taux réduit)</SelectItem>
                    <SelectItem value="0">0% (exonéré)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prix d'achat</Label>
                <Input
                  type="number"
                  step="0.001"
                  required
                  value={form.prixAchat}
                  onChange={(e) => setForm({ ...form, prixAchat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prix de vente</Label>
                <Input
                  type="number"
                  step="0.001"
                  required
                  value={form.prixVente}
                  onChange={(e) => setForm({ ...form, prixVente: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock actuel</Label>
                <Input
                  type="number"
                  value={form.stockActuel}
                  onChange={(e) => setForm({ ...form, stockActuel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Seuil d'alerte</Label>
                <Input
                  type="number"
                  value={form.seuilAlerte}
                  onChange={(e) => setForm({ ...form, seuilAlerte: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editing ? "Enregistrer" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
