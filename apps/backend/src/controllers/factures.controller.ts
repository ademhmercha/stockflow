import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Facture } from "../models/Facture";
import { Client } from "../models/Client";
import { Entreprise } from "../models/Entreprise";
import { Produit } from "../models/Produit";
import { CreateFactureInput } from "../validators/facture.validator";
import { calculerTotauxFacture, genererNumeroFacture, LigneCalculable } from "../services/tva.service";
import { genererFacturePdf } from "../services/pdf.service";

export const listFactures = asyncHandler(async (req: Request, res: Response) => {
  const factures = await Facture.find({ entrepriseId: req.user!.entrepriseId })
    .populate("clientId", "nom")
    .sort({ dateEmission: -1 });
  res.json(factures);
});

export const getFacture = asyncHandler(async (req: Request, res: Response) => {
  const facture = await Facture.findOne({
    _id: req.params.id,
    entrepriseId: req.user!.entrepriseId,
  }).populate("clientId");
  if (!facture) throw ApiError.notFound("Facture introuvable");
  res.json(facture);
});

export const createFacture = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateFactureInput;
  const entrepriseId = req.user!.entrepriseId;

  const client = await Client.findOne({ _id: input.clientId, entrepriseId });
  if (!client) throw ApiError.notFound("Client introuvable");

  // On résout chaque ligne à partir du produit en base : prix et taux de TVA
  // sont pris sur le produit sauf si explicitement surchargés dans la requête,
  // puis figés (snapshot) dans la facture pour ne plus bouger si le produit change ensuite.
  const lignesResolues = await Promise.all(
    input.lignes.map(async (ligne) => {
      const produit = await Produit.findOne({ _id: ligne.produitId, entrepriseId });
      if (!produit) throw ApiError.notFound(`Produit introuvable : ${ligne.produitId}`);

      return {
        produitId: produit._id,
        nomProduit: produit.nom,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire ?? produit.prixVente,
        tauxTVA: ligne.tauxTVA ?? produit.tauxTVA,
      };
    })
  );

  const totaux = calculerTotauxFacture(lignesResolues as LigneCalculable[]);

  const entreprise = await Entreprise.findByIdAndUpdate(
    entrepriseId,
    { $inc: { dernierNumeroFacture: 1 } },
    { new: true }
  );
  if (!entreprise) throw ApiError.notFound("Entreprise introuvable");

  const numero = genererNumeroFacture(entreprise.dernierNumeroFacture);

  const facture = await Facture.create({
    numero,
    clientId: client._id,
    lignes: lignesResolues,
    ...totaux,
    statut: "brouillon",
    entrepriseId,
    creePar: req.user!.userId,
  });

  res.status(201).json(facture);
});

export const genererPdfFacture = asyncHandler(async (req: Request, res: Response) => {
  const facture = await Facture.findOne({
    _id: req.params.id,
    entrepriseId: req.user!.entrepriseId,
  });
  if (!facture) throw ApiError.notFound("Facture introuvable");

  const [entreprise, client] = await Promise.all([
    Entreprise.findById(facture.entrepriseId),
    Client.findById(facture.clientId),
  ]);
  if (!entreprise || !client) throw ApiError.notFound("Données liées à la facture introuvables");

  const pdfBuffer = await genererFacturePdf(facture, entreprise, client);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="facture-${facture.numero}.pdf"`);
  res.send(pdfBuffer);
});
