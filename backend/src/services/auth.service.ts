import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginInput } from "../dtos/auth.dto";
import { authRepository } from "../repositories/auth.repository";
import { HttpError } from "../shared/http-error";
import { getJwtSecret } from "../shared/jwt-secret";

export const authService = {
  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || !user.active || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError("E-mail ou senha inválidos.", 401);
    }

    const token = jwt.sign({ role: user.role }, getJwtSecret(), {
      subject: user.id,
      expiresIn: "8h"
    });
    return {
      token,
      user: { id: user.id, email: user.email, role: user.role }
    };
  }
};
