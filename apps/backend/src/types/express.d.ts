import { Role } from "../models/User";

export interface AuthPayload {
  userId: string;
  entrepriseId: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export {};
