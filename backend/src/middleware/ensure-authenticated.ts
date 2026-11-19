import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../shared/http-error";
import { getJwtSecret } from "../shared/jwt-secret";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

export function ensureAuthenticated(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction
): void {
  const authorization = request.header("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    next(new HttpError("Autenticação obrigatória.", 401));
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload === "string" || typeof payload.sub !== "string" ||
        typeof payload.role !== "string" || payload.role !== "ADMIN") {
      throw new HttpError("Token sem permissões administrativas.", 403);
    }
    request.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError("Token inválido ou expirado.", 401));
  }
}
