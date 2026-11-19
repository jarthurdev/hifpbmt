import { HttpError } from "./http-error";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new HttpError("JWT_SECRET deve estar configurado com pelo menos 32 caracteres.", 500);
  }
  return secret;
}
