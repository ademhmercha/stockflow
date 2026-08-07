import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/User";
import { Entreprise } from "../models/Entreprise";
import {
  hashValue,
  compareValue,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/token.service";
import { LoginInput, RegisterInput } from "../validators/auth.validator";
import { AuthPayload } from "../types/express";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterInput;

  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw ApiError.conflict("Un utilisateur avec cet email existe déjà");
  }

  // Le premier utilisateur d'une nouvelle entreprise crée l'entreprise en même temps.
  const entreprise = await Entreprise.create({
    nom: input.entreprise.nom,
    matriculeFiscal: input.entreprise.matriculeFiscal,
    adresse: input.entreprise.adresse,
    tauxTVAParDefaut: input.entreprise.tauxTVAParDefaut ?? 19,
  });

  const passwordHash = await hashValue(input.password);
  const user = await User.create({
    email: input.email,
    passwordHash,
    role: input.role,
    nom: input.nom,
    entrepriseId: entreprise._id,
  });

  const payload: AuthPayload = {
    userId: user._id.toString(),
    entrepriseId: entreprise._id.toString(),
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  user.refreshTokenHash = await hashValue(refreshToken);
  await user.save();

  res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, role: user.role, entrepriseId: entreprise._id },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.actif) {
    throw ApiError.unauthorized("Identifiants invalides");
  }

  const valid = await compareValue(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Identifiants invalides");
  }

  const payload: AuthPayload = {
    userId: user._id.toString(),
    entrepriseId: user.entrepriseId.toString(),
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  user.refreshTokenHash = await hashValue(refreshToken);
  await user.save();

  res.json({
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, role: user.role, entrepriseId: user.entrepriseId },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };

  let payload: AuthPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Refresh token invalide ou expiré");
  }

  const user = await User.findById(payload.userId).select("+refreshTokenHash");
  if (!user || !user.refreshTokenHash) {
    throw ApiError.unauthorized("Session invalide, veuillez vous reconnecter");
  }

  const valid = await compareValue(refreshToken, user.refreshTokenHash);
  if (!valid) {
    throw ApiError.unauthorized("Session invalide, veuillez vous reconnecter");
  }

  const newPayload: AuthPayload = {
    userId: user._id.toString(),
    entrepriseId: user.entrepriseId.toString(),
    role: user.role,
  };

  const accessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);
  user.refreshTokenHash = await hashValue(newRefreshToken);
  await user.save();

  res.json({ accessToken, refreshToken: newRefreshToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.userId, { refreshTokenHash: null });
  }
  res.status(204).send();
});
