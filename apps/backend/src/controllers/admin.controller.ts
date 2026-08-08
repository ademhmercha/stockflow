import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Entreprise, STATUTS_ENTREPRISE } from "../models/Entreprise";
import { User } from "../models/User";
import { Produit } from "../models/Produit";
import { Facture } from "../models/Facture";
import { PaginationQuery } from "../validators/pagination.validator";
import { UpdateStatutEntrepriseInput } from "../validators/admin.validator";

// Liste toutes les entreprises de la plateforme (tous tenants confondus —
// c'est le seul endroit du code où on ne filtre PAS par entrepriseId, d'où la
// protection stricte par requirePlatformOwner) avec des compteurs agrégés
// par entreprise (utilisateurs, produits, factures, chiffre d'affaires).
export const listEntreprises = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;

  const [data, totalResult] = await Promise.all([
    Entreprise.aggregate([
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: User.collection.name,
          let: { entId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$entrepriseId", "$$entId"] } } },
            { $count: "count" },
          ],
          as: "usersCount",
        },
      },
      {
        $lookup: {
          from: Produit.collection.name,
          let: { entId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$entrepriseId", "$$entId"] } } },
            { $count: "count" },
          ],
          as: "produitsCount",
        },
      },
      {
        $lookup: {
          from: Facture.collection.name,
          let: { entId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$entrepriseId", "$$entId"] } } },
            { $group: { _id: null, nombre: { $sum: 1 }, ca: { $sum: "$montantTTC" } } },
          ],
          as: "facturesAgg",
        },
      },
      {
        $project: {
          nom: 1,
          matriculeFiscal: 1,
          statut: 1,
          plan: 1,
          createdAt: 1,
          nombreUtilisateurs: { $ifNull: [{ $arrayElemAt: ["$usersCount.count", 0] }, 0] },
          nombreProduits: { $ifNull: [{ $arrayElemAt: ["$produitsCount.count", 0] }, 0] },
          nombreFactures: { $ifNull: [{ $arrayElemAt: ["$facturesAgg.nombre", 0] }, 0] },
          chiffreAffaires: { $ifNull: [{ $arrayElemAt: ["$facturesAgg.ca", 0] }, 0] },
        },
      },
    ]),
    Entreprise.countDocuments({}),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total: totalResult,
      totalPages: Math.max(1, Math.ceil(totalResult / limit)),
    },
  });
});

export const updateStatutEntreprise = asyncHandler(async (req: Request, res: Response) => {
  const { statut } = req.body as UpdateStatutEntrepriseInput;

  const entreprise = await Entreprise.findByIdAndUpdate(
    req.params.id,
    { $set: { statut } },
    { new: true }
  );
  if (!entreprise) throw ApiError.notFound("Entreprise introuvable");

  res.json(entreprise);
});

export const getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
  const [entreprisesParStatutAgg, totalUtilisateurs, caGlobalAgg] = await Promise.all([
    Entreprise.aggregate([{ $group: { _id: "$statut", count: { $sum: 1 } } }]),
    User.countDocuments({}),
    Facture.aggregate([
      { $match: { statut: { $in: ["envoyee", "payee"] } } },
      { $group: { _id: null, total: { $sum: "$montantTTC" }, nombre: { $sum: 1 } } },
    ]),
  ]);

  const entreprisesParStatut = Object.fromEntries(STATUTS_ENTREPRISE.map((s) => [s, 0])) as Record<
    (typeof STATUTS_ENTREPRISE)[number],
    number
  >;
  let totalEntreprises = 0;
  for (const row of entreprisesParStatutAgg) {
    entreprisesParStatut[row._id as keyof typeof entreprisesParStatut] = row.count;
    totalEntreprises += row.count;
  }

  res.json({
    totalEntreprises,
    entreprisesParStatut,
    totalUtilisateurs,
    chiffreAffairesPlateforme: caGlobalAgg[0]?.total ?? 0,
    nombreFacturesPlateforme: caGlobalAgg[0]?.nombre ?? 0,
  });
});
