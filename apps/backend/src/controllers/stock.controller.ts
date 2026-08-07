import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Produit } from "../models/Produit";
import { MouvementStock } from "../models/MouvementStock";
import { CreateMouvementInput } from "../validators/mouvement.validator";

export const creerMouvement = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateMouvementInput;

  // Note : pas de transaction multi-documents ici pour rester compatible avec une
  // instance MongoDB standalone (dev local via docker-compose sans replica set).
  // La mise à jour atomique du stock via un opérateur Mongo ($inc + garde sur
  // stockActuel) évite malgré tout les quantités négatives en cas de sorties concurrentes.
  const produit = await Produit.findOne({
    _id: input.produitId,
    entrepriseId: req.user!.entrepriseId,
  });
  if (!produit) throw ApiError.notFound("Produit introuvable");

  const delta = input.type === "entree" ? input.quantite : -input.quantite;

  const filtre: Record<string, unknown> = {
    _id: input.produitId,
    entrepriseId: req.user!.entrepriseId,
  };
  if (input.type === "sortie") {
    filtre.stockActuel = { $gte: input.quantite };
  }

  const produitMisAJour = await Produit.findOneAndUpdate(
    filtre,
    { $inc: { stockActuel: delta } },
    { new: true }
  );

  if (!produitMisAJour) {
    throw ApiError.badRequest(
      `Stock insuffisant : ${produit.stockActuel} unité(s) disponible(s)`
    );
  }

  const mouvement = await MouvementStock.create({
    produitId: produit._id,
    type: input.type,
    quantite: input.quantite,
    motif: input.motif ?? "",
    userId: req.user!.userId,
    entrepriseId: req.user!.entrepriseId,
  });

  res.status(201).json(mouvement);
});

export const listMouvements = asyncHandler(async (req: Request, res: Response) => {
  const mouvements = await MouvementStock.find({ entrepriseId: req.user!.entrepriseId })
    .populate("produitId", "nom sku")
    .populate("userId", "email nom")
    .sort({ date: -1 })
    .limit(200);
  res.json(mouvements);
});

export const alertesStock = asyncHandler(async (req: Request, res: Response) => {
  const produits = await Produit.find({
    entrepriseId: req.user!.entrepriseId,
    actif: true,
    $expr: { $lte: ["$stockActuel", "$seuilAlerte"] },
  }).sort({ stockActuel: 1 });
  res.json(produits);
});
