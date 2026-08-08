export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  // Code stable, machine-lisible, pour laisser le frontend distinguer des cas
  // d'erreur spécifiques (ex: compte suspendu) sans faire de matching sur le
  // texte du message, qui n'est qu'un affichage destiné à l'humain.
  public readonly code?: string;

  constructor(statusCode: number, message: string, details?: unknown, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Non authentifié") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Accès refusé", code?: string) {
    return new ApiError(403, message, undefined, code);
  }
  static notFound(message = "Ressource introuvable") {
    return new ApiError(404, message);
  }
  static conflict(message: string) {
    return new ApiError(409, message);
  }
}
