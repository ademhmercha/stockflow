import { Schema, model, Types, InferSchemaType } from "mongoose";

const clientSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true },
    // Optionnel : un particulier n'a pas de matricule fiscal, une entreprise cliente en a un.
    matriculeFiscal: { type: String, trim: true, uppercase: true, default: null },
    email: { type: String, trim: true, lowercase: true, default: null },
    telephone: { type: String, trim: true, default: null },
    adresse: { type: String, trim: true, default: null },
    entrepriseId: {
      type: Schema.Types.ObjectId,
      ref: "Entreprise",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

clientSchema.index({ nom: "text" });

export type ClientDoc = InferSchemaType<typeof clientSchema> & { _id: Types.ObjectId };
export const Client = model("Client", clientSchema);
