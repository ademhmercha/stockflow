import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Client } from "../models/Client";
import { CreateClientInput, UpdateClientInput } from "../validators/client.validator";
import { PaginationQuery } from "../validators/pagination.validator";
import { paginateFind } from "../utils/paginate";

export const listClients = asyncHandler(async (req: Request, res: Response) => {
  const pagination = req.query as unknown as PaginationQuery;
  const result = await paginateFind(
    Client,
    { entrepriseId: req.user!.entrepriseId },
    pagination,
    (query) => query.sort({ nom: 1 })
  );
  res.json(result);
});

export const getClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await Client.findOne({ _id: req.params.id, entrepriseId: req.user!.entrepriseId });
  if (!client) throw ApiError.notFound("Client introuvable");
  res.json(client);
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateClientInput;
  const client = await Client.create({ ...input, entrepriseId: req.user!.entrepriseId });
  res.status(201).json(client);
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateClientInput;
  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, entrepriseId: req.user!.entrepriseId },
    { $set: input },
    { new: true, runValidators: true }
  );
  if (!client) throw ApiError.notFound("Client introuvable");
  res.json(client);
});
