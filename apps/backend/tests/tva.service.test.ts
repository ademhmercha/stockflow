import { calculerTotauxFacture, genererNumeroFacture } from "../src/services/tva.service";

describe("calculerTotauxFacture", () => {
  it("calcule HT, TVA multi-taux, timbre fiscal et TTC", () => {
    const totaux = calculerTotauxFacture([
      { quantite: 2, prixUnitaire: 100, tauxTVA: 19 }, // 200 HT, 38 TVA
      { quantite: 1, prixUnitaire: 50, tauxTVA: 7 }, // 50 HT, 3.5 TVA
    ]);

    expect(totaux.montantHT).toBe(250);
    expect(totaux.montantTVA).toBe(41.5);
    expect(totaux.timbreFiscal).toBe(1); // TIMBRE_FISCAL_MONTANT par défaut en test
    expect(totaux.montantTTC).toBe(292.5);
  });

  it("gère les produits exonérés de TVA (taux 0%)", () => {
    const totaux = calculerTotauxFacture([{ quantite: 1, prixUnitaire: 100, tauxTVA: 0 }]);

    expect(totaux.montantTVA).toBe(0);
    expect(totaux.montantTTC).toBe(101); // HT + timbre fiscal uniquement
  });
});

describe("genererNumeroFacture", () => {
  it("formate le numéro avec padding sur 6 chiffres", () => {
    expect(genererNumeroFacture(42, 2026)).toBe("F-2026-000042");
  });
});
