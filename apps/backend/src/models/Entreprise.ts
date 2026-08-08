import { Schema, model, Types, InferSchemaType } from "mongoose";

export const STATUTS_ENTREPRISE = ["actif", "essai", "suspendu"] as const;
export type StatutEntreprise = (typeof STATUTS_ENTREPRISE)[number];

export const PLANS_ENTREPRISE = ["gratuit", "basique", "pro"] as const;
export type PlanEntreprise = (typeof PLANS_ENTREPRISE)[number];

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
    // Cycle de vie côté plateforme : une entreprise "suspendue" perd l'accès à
    // toute l'API (voir middleware checkEntrepriseActive), sans que ses
    // données soient supprimées — réversible par le platform owner.
    statut: { type: String, enum: STATUTS_ENTREPRISE, default: "actif" },
    // Affiché dans le panneau d'administration plateforme. Pas encore relié à
    // une vraie facturation (Stripe) ni à des limites fonctionnelles par plan
    // — c'est une donnée descriptive pour l'instant, pas un système de gating.
    plan: { type: String, enum: PLANS_ENTREPRISE, default: "gratuit" },
  },
  { timestamps: true }
);

export type EntrepriseDoc = InferSchemaType<typeof entrepriseSchema> & { _id: Types.ObjectId };
export const Entreprise = model("Entreprise", entrepriseSchema);
