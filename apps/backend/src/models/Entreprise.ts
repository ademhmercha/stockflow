import { Schema, model, Types, InferSchemaType } from "mongoose";

const entrepriseSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true },
    matriculeFiscal: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    adresse: { type: String, trim: true },
    logo: { type: String }, // URL ou chemin du fichier logo
    // Taux de TVA par défaut appliqué aux nouveaux produits (19%, 13% ou 7% en Tunisie).
    tauxTVAParDefaut: {
      type: Number,
      enum: [19, 13, 7, 0],
      default: 19,
    },
    dernierNumeroFacture: { type: Number, default: 0 }, // utilisé pour l'auto-incrément par entreprise
  },
  { timestamps: true }
);

export type EntrepriseDoc = InferSchemaType<typeof entrepriseSchema> & { _id: Types.ObjectId };
export const Entreprise = model("Entreprise", entrepriseSchema);
