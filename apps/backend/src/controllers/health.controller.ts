import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { isDbConnected } from "../config/db";

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const dbConnected = isDbConnected();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "ok" : "degraded",
    db: dbConnected ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});
