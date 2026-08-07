import { Schema, model, Types, InferSchemaType } from "mongoose";

const produitSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    categorie: { type: String, trim: true, default: "Général" },
    prixAchat: { type: Number, required: true, min: 0 },
    prixVente: { type: Number, required: true, min: 0 },
    // Taux de TVA tunisien applicable au produit : 19% (taux normal), 13% ou 7% (taux réduits).
    tauxTVA: { type: Number, enum: [19, 13, 7, 0], required: true, default: 19 },
    stockActuel: { type: Number, required: true, default: 0, min: 0 },
    seuilAlerte: { type: Number, required: true, default: 5, min: 0 },
    entrepriseId: {
      type: Schema.Types.ObjectId,
      ref: "Entreprise",
      required: true,
      index: true,
    },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Un SKU doit être unique au sein d'une même entreprise (mais pas globalement,
// car deux PME clientes de StockFlow peuvent utiliser le même SKU).
produitSchema.index({ sku: 1, entrepriseId: 1 }, { unique: true });
produitSchema.index({ nom: "text" });

export type ProduitDoc = InferSchemaType<typeof produitSchema> & { _id: Types.ObjectId };
export const Produit = model("Produit", produitSchema);
