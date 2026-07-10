import { z } from "zod";

export const userSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters"),

  email: z
    .email("Invalid email address"),

  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{7,15}$/, "Invalid phone number"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  role: z
    .enum(["BUYER","SELLER"])
    .default("BUYER"),
});
