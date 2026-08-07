import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { env } from "../config/env";
import { AuthPayload } from "../types/express";

const SALT_ROUNDS = 10;

// @types/jsonwebtoken type ses durées ("15m", "7d"...) via un type littéral
// généré par `ms`, incompatible avec le `string` générique renvoyé par notre
// schéma zod : ces valeurs restent des durées valides pour `ms` à l'exécution,
// d'où le cast explicite plutôt qu'un changement de schéma de validation.
const accessTokenOptions: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] };
const refreshTokenOptions: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] };

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, accessTokenOptions);
}

export function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshTokenOptions);
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthPayload;
}

export function hashValue(value: string): Promise<string> {
  return bcrypt.hash(value, SALT_ROUNDS);
}

export function compareValue(value: string, hash: string): Promise<boolean> {
  return bcrypt.compare(value, hash);
}
