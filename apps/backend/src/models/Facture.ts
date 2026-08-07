import { Schema, model, Types, InferSchemaType } from "mongoose";

export const STATUTS_FACTURE = ["brouillon", "envoyee", "payee"] as const;
export type StatutFacture = (typeof STATUTS_FACTURE)[number];

const ligneFactureSchema = new Schema(
  {
    produitId: { type: Schema.Types.ObjectId, ref: "Produit", required: true },
    nomProduit: { type: String, required: true }, // snapshot au moment de la facturation
    quantite: { type: Number, required: true, min: 1 },
    prixUnitaire: { type: Number, required: true, min: 0 },
    tauxTVA: { type: Number, enum: [19, 13, 7, 0], required: true },
  },
  { _id: false }
);

const factureSchema = new Schema(
  {
    // Numéro lisible métier, auto-incrémenté par entreprise (ex: "F-2026-000123"),
    // distinct de l'_id Mongo. Généré via Entreprise.dernierNumeroFacture.
    numero: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    lignes: { type: [ligneFactureSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    montantHT: { type: Number, required: true, min: 0 },
    montantTVA: { type: Number, required: true, min: 0 },
    // Timbre fiscal tunisien : taxe forfaitaire par facture (valeur pilotée par
    // TIMBRE_FISCAL_MONTANT car elle évolue au gré des lois de finances).
    timbreFiscal: { type: Number, required: true, min: 0 },
    montantTTC: { type: Number, required: true, min: 0 },
    statut: { type: String, enum: STATUTS_FACTURE, required: true, default: "brouillon" },
    dateEmission: { type: Date, default: Date.now },
    entrepriseId: {
      type: Schema.Types.ObjectId,
      ref: "Entreprise",
      required: true,
      index: true,
    },
    creePar: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

factureSchema.index({ numero: 1, entrepriseId: 1 }, { unique: true });
factureSchema.index({ entrepriseId: 1, dateEmission: -1 });

export type FactureDoc = InferSchemaType<typeof factureSchema> & { _id: Types.ObjectId };
export const Facture = model("Facture", factureSchema);
