import { Schema, model, Types, InferSchemaType } from "mongoose";

export const ROLES = ["admin", "vendeur", "comptable"] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "vendeur" },
    entrepriseId: {
      type: Schema.Types.ObjectId,
      ref: "Entreprise",
      required: true,
      index: true,
    },
    refreshTokenHash: { type: String, select: false, default: null },
    nom: { type: String, trim: true },
    actif: { type: Boolean, default: true },
    // Distinct des rôles applicatifs (admin/vendeur/comptable), qui sont tous
    // scopés à UNE entreprise. Un platform owner opère au-dessus de toutes les
    // entreprises (support, modération) — ce n'est jamais accordé via l'API
    // publique, uniquement via le script de bootstrap (voir scripts/).
    isPlatformOwner: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1, entrepriseId: 1 });

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export const User = model("User", userSchema);
