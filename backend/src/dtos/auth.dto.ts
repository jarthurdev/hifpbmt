import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  password: z.string().min(1)
}).strict();
export const loginResponseSchema = z.object({
  token: z.string().min(1),
  user: z.object({ id: z.string(), email: z.string().email(), role: z.string() })
});

export type LoginInput = z.infer<typeof loginSchema>;
