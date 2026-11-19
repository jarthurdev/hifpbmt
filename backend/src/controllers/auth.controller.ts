import { NextFunction, Request, Response } from "express";
import { loginResponseSchema, loginSchema } from "../dtos/auth.dto";
import { authService } from "../services/auth.service";

export const authController = {
  async login(request: Request, response: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(request.body);
      response.json(loginResponseSchema.parse(await authService.login(input)));
    } catch (error) {
      next(error);
    }
  }
};
