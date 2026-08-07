import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { Facture } from "../models/Facture";
import { Produit } from "../models/Produit";

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const entrepriseId = new mongoose.Types.ObjectId(req.user!.entrepriseId);

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const [caMoisAgg, topProduitsAgg, stockCritique] = await Promise.all([
    Facture.aggregate([
      {
        $match: {
          entrepriseId,
          dateEmission: { $gte: debutMois },
          statut: { $in: ["envoyee", "payee"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$montantTTC" }, nombreFactures: { $sum: 1 } } },
    ]),
    Facture.aggregate([
      { $match: { entrepriseId, dateEmission: { $gte: debutMois } } },
      { $unwind: "$lignes" },
      {
        $group: {
          _id: "$lignes.produitId",
          nom: { $first: "$lignes.nomProduit" },
          quantiteVendue: { $sum: "$lignes.quantite" },
        },
      },
      { $sort: { quantiteVendue: -1 } },
      { $limit: 5 },
    ]),
    Produit.find({
      entrepriseId,
      actif: true,
      $expr: { $lte: ["$stockActuel", "$seuilAlerte"] },
    })
      .select("nom sku stockActuel seuilAlerte")
      .limit(10),
  ]);

  res.json({
    chiffreAffairesMois: caMoisAgg[0]?.total ?? 0,
    nombreFacturesMois: caMoisAgg[0]?.nombreFactures ?? 0,
    topProduits: topProduitsAgg,
    stockCritique,
  });
});
