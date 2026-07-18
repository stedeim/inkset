import { z } from "zod";

// Tier is duplicated as a literal union here (rather than importing the Prisma
// enum) so these schemas can run in the browser without pulling in the client.
export const tierSchema = z.enum(["TIER_1", "TIER_2", "TIER_3"]);

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(12, "Use at least 12 characters")
    .max(200, "That password is too long"),
  tier: tierSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
