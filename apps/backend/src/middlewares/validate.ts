import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

type Schemas = Partial<{
  body: AnyZodObject;
  params: AnyZodObject;
  query: AnyZodObject;
}>;

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(ApiError.badRequest("Données invalides", err.flatten().fieldErrors));
      }
      return next(err);
    }
  };
}
