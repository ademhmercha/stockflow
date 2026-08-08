/**
 * Backfill ponctuel : les entreprises/utilisateurs créés avant l'ajout des
 * champs statut/plan/isPlatformOwner ne les possèdent pas en base — les
 * defaults Mongoose ne s'appliquent qu'à la création, jamais rétroactivement
 * aux documents déjà stockés. À exécuter une seule fois après migration.
 */
import mongoose from "mongoose";
import { env } from "../config/env";
import { Entreprise } from "../models/Entreprise";
import { User } from "../models/User";

async function main() {
  await mongoose.connect(env.MONGO_URI);

  const entreprises = await Entreprise.updateMany(
    { statut: { $exists: false } },
    { $set: { statut: "actif", plan: "gratuit" } }
  );
  console.log(`✅ ${entreprises.modifiedCount} entreprise(s) mise(s) à jour (statut/plan).`);

  const users = await User.updateMany(
    { isPlatformOwner: { $exists: false } },
    { $set: { isPlatformOwner: false } }
  );
  console.log(`✅ ${users.modifiedCount} utilisateur(s) mis à jour (isPlatformOwner).`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Échec du backfill :", err);
  process.exit(1);
});
