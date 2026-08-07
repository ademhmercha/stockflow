import { env } from "../config/env";

export interface LigneCalculable {
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number; // 19, 13, 7 ou 0
}

export interface TotauxFacture {
  montantHT: number;
  montantTVA: number;
  timbreFiscal: number;
  montantTTC: number;
}

function arrondir(valeur: number): number {
  // Les montants facturés en Tunisie sont arrondis au millime (3 décimales).
  return Math.round(valeur * 1000) / 1000;
}

/**
 * Calcule les totaux d'une facture selon les règles fiscales tunisiennes :
 * chaque ligne peut avoir son propre taux de TVA (19%, 13%, 7% ou 0% selon le
 * produit), la TVA est donc calculée ligne par ligne puis sommée, et le timbre
 * fiscal (montant forfaitaire fixé par la loi de finances, configurable via
 * TIMBRE_FISCAL_MONTANT) s'ajoute une seule fois par facture, hors base de TVA.
 */
export function calculerTotauxFacture(lignes: LigneCalculable[]): TotauxFacture {
  let montantHT = 0;
  let montantTVA = 0;

  for (const ligne of lignes) {
    const totalLigneHT = ligne.quantite * ligne.prixUnitaire;
    montantHT += totalLigneHT;
    montantTVA += totalLigneHT * (ligne.tauxTVA / 100);
  }

  const timbreFiscal = env.TIMBRE_FISCAL_MONTANT;
  const montantTTC = montantHT + montantTVA + timbreFiscal;

  return {
    montantHT: arrondir(montantHT),
    montantTVA: arrondir(montantTVA),
    timbreFiscal: arrondir(timbreFiscal),
    montantTTC: arrondir(montantTTC),
  };
}

/** Génère le prochain numéro de facture lisible pour une entreprise, ex: "F-2026-000042". */
export function genererNumeroFacture(compteur: number, annee = new Date().getFullYear()): string {
  return `F-${annee}-${String(compteur).padStart(6, "0")}`;
}
