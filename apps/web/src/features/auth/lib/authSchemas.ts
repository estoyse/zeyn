import z from "zod";

// Single source of truth for auth validation rules, shared across all forms.
export const emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");
export const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least 1 number");
export const nameSchema = z.string().min(2, "Name must be at least 2 characters");
