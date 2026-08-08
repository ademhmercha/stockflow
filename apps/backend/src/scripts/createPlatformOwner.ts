/**
 * Script de bootstrap pour créer (ou promouvoir) le premier propriétaire de
 * plateforme. Volontairement PAS exposé via une route HTTP : ce privilège ne
 * doit jamais être accordable via l'API publique.
 *
 * Usage : npm run bootstrap:owner -- <email> <mot-de-passe> [nom]
 */
import mongoose from "mongoose";
import { env } from "../config/env";
import { User } from "../models/User";
import { Entreprise } from "../models/Entreprise";
import { hashValue } from "../services/token.service";

const PLATEFORME_MATRICULE = "PLATEFORME-STOCKFLOW";

async function main() {
  const [email, password, nom] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage : npm run bootstrap:owner -- <email> <mot-de-passe> [nom]");
    process.exit(1);
  }

  await mongoose.connect(env.MONGO_URI);

  let user = await User.findOne({ email }).select("+passwordHash");

  if (user) {
    user.isPlatformOwner = true;
    await user.save();
    console.log(`✅ Utilisateur existant "${email}" promu propriétaire de plateforme.`);
  } else {
    // Une entreprise technique dédiée sert de rattachement obligatoire (le
    // schéma User exige un entrepriseId) — elle n'est jamais suspendue et
    // n'apparaît pas dans les données métier des vrais tenants.
    let entreprisePlateforme = await Entreprise.findOne({ matriculeFiscal: PLATEFORME_MATRICULE });
    if (!entreprisePlateforme) {
      entreprisePlateforme = await Entreprise.create({
        nom: "StockFlow (Plateforme)",
        matriculeFiscal: PLATEFORME_MATRICULE,
        statut: "actif",
      });
    }

    const passwordHash = await hashValue(password);
    user = await User.create({
      email,
      passwordHash,
      role: "admin",
      nom: nom ?? "Propriétaire de la plateforme",
      entrepriseId: entreprisePlateforme._id,
      isPlatformOwner: true,
    });
    console.log(`✅ Propriétaire de plateforme créé : ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Échec du bootstrap :", err);
  process.exit(1);
});
