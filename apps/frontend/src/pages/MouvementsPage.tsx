import { FormEvent, useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { MouvementStock, Produit } from "@/types";
import { formatDate } from "@/lib/utils";

export function MouvementsPage() {
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [produitId, setProduitId] = useState("");
  const [type, setType] = useState<"entree" | "sortie">("entree");
  const [quantite, setQuantite] = useState("1");
  const [motif, setMotif] = useState("");

  async function chargerDonnees() {
    setLoading(true);
    const [m, p] = await Promise.all([
      api.get<MouvementStock[]>("/stock/mouvements"),
      api.get<Produit[]>("/produits"),
    ]);
    setMouvements(m);
    setProduits(p);
    setLoading(false);
  }

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/stock/mouvements", {
        produitId,
        type,
        quantite: Number(quantite),
        motif,
      });
      setQuantite("1");
      setMotif("");
      await chargerDonnees();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mouvements de stock</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau mouvement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Produit</Label>
              <Select value={produitId} onValueChange={setProduitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un produit" />
                </SelectTrigger>
                <SelectContent>
                  {produits.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.nom} ({p.sku}) — stock: {p.stockActuel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "entree" | "sortie")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entree">Entrée</SelectItem>
                  <SelectItem value="sortie">Sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                min={1}
                required
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label>Motif</Label>
              <Input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex: réception fournisseur" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={!produitId} className="w-full">
                Enregistrer
              </Button>
            </div>
            {error && <p className="text-sm text-destructive sm:col-span-4">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Motif</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5}>Chargement...</TableCell>
            </TableRow>
          ) : (
            mouvements.map((m) => (
              <TableRow key={m._id}>
                <TableCell>{formatDate(m.date)}</TableCell>
                <TableCell>{typeof m.produitId === "object" ? m.produitId.nom : m.produitId}</TableCell>
                <TableCell>
                  <Badge variant={m.type === "entree" ? "success" : "warning"}>
                    {m.type === "entree" ? (
                      <ArrowDown className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowUp className="mr-1 h-3 w-3" />
                    )}
                    {m.type === "entree" ? "Entrée" : "Sortie"}
                  </Badge>
                </TableCell>
                <TableCell>{m.quantite}</TableCell>
                <TableCell className="text-muted-foreground">{m.motif}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
