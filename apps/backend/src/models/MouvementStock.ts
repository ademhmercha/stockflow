import { Schema, model, Types, InferSchemaType } from "mongoose";

export const TYPES_MOUVEMENT = ["entree", "sortie"] as const;
export type TypeMouvement = (typeof TYPES_MOUVEMENT)[number];

const mouvementStockSchema = new Schema(
  {
    produitId: {
      type: Schema.Types.ObjectId,
      ref: "Produit",
      required: true,
      index: true,
    },
    type: { type: String, enum: TYPES_MOUVEMENT, required: true },
    quantite: { type: Number, required: true, min: 1 },
    motif: { type: String, trim: true, default: "" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    entrepriseId: {
      type: Schema.Types.ObjectId,
      ref: "Entreprise",
      required: true,
      index: true,
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

mouvementStockSchema.index({ entrepriseId: 1, date: -1 });

export type MouvementStockDoc = InferSchemaType<typeof mouvementStockSchema> & {
  _id: Types.ObjectId;
};
export const MouvementStock = model("MouvementStock", mouvementStockSchema);
