import { prisma } from "../shared/prisma";

export const authRepository = {
  findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email } })
};
