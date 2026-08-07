export type Role = "admin" | "vendeur" | "comptable";

export interface User {
  id: string;
  email: string;
  role: Role;
  entrepriseId: string;
}

export interface Produit {
  _id: string;
  nom: string;
  sku: string;
  categorie: string;
  prixAchat: number;
  prixVente: number;
  tauxTVA: 19 | 13 | 7 | 0;
  stockActuel: number;
  seuilAlerte: number;
  actif: boolean;
}

export interface MouvementStock {
  _id: string;
  produitId: Produit | string;
  type: "entree" | "sortie";
  quantite: number;
  motif: string;
  date: string;
}

export interface Client {
  _id: string;
  nom: string;
  matriculeFiscal?: string | null;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
}

export interface LigneFacture {
  produitId: string;
  nomProduit: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: 19 | 13 | 7 | 0;
}

export type StatutFacture = "brouillon" | "envoyee" | "payee";

export interface Facture {
  _id: string;
  numero: string;
  clientId: Client | string;
  lignes: LigneFacture[];
  montantHT: number;
  montantTVA: number;
  timbreFiscal: number;
  montantTTC: number;
  statut: StatutFacture;
  dateEmission: string;
}

export interface DashboardStats {
  chiffreAffairesMois: number;
  nombreFacturesMois: number;
  topProduits: { _id: string; nom: string; quantiteVendue: number }[];
  stockCritique: Pick<Produit, "_id" | "nom" | "sku" | "stockActuel" | "seuilAlerte">[];
}
