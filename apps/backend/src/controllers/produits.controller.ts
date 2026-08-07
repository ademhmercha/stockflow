import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Produit } from "../models/Produit";
import { CreateProduitInput, UpdateProduitInput } from "../validators/produit.validator";

export const listProduits = asyncHandler(async (req: Request, res: Response) => {
  const produits = await Produit.find({ entrepriseId: req.user!.entrepriseId, actif: true }).sort({
    nom: 1,
  });
  res.json(produits);
});

export const getProduit = asyncHandler(async (req: Request, res: Response) => {
  const produit = await Produit.findOne({
    _id: req.params.id,
    entrepriseId: req.user!.entrepriseId,
  });
  if (!produit) throw ApiError.notFound("Produit introuvable");
  res.json(produit);
});

export const createProduit = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateProduitInput;

  const existing = await Produit.findOne({
    sku: input.sku.toUpperCase(),
    entrepriseId: req.user!.entrepriseId,
  });
  if (existing) throw ApiError.conflict("Un produit avec ce SKU existe déjà");

  const produit = await Produit.create({
    ...input,
    entrepriseId: req.user!.entrepriseId,
  });
  res.status(201).json(produit);
});

export const updateProduit = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateProduitInput;

  const produit = await Produit.findOneAndUpdate(
    { _id: req.params.id, entrepriseId: req.user!.entrepriseId },
    { $set: input },
    { new: true, runValidators: true }
  );
  if (!produit) throw ApiError.notFound("Produit introuvable");
  res.json(produit);
});

export const deleteProduit = asyncHandler(async (req: Request, res: Response) => {
  // Suppression logique : on désactive plutôt que de supprimer pour préserver
  // l'historique des mouvements de stock et des factures qui référencent ce produit.
  const produit = await Produit.findOneAndUpdate(
    { _id: req.params.id, entrepriseId: req.user!.entrepriseId },
    { $set: { actif: false } },
    { new: true }
  );
  if (!produit) throw ApiError.notFound("Produit introuvable");
  res.status(204).send();
});
