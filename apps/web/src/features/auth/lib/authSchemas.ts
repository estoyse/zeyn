import type { TFunction } from "i18next";
import z from "zod";

// Single source of truth for auth validation rules, shared across all forms.
export function createAuthSchemas(t: TFunction) {
  const emailSchema = z.string().email(t("auth:validation.invalidEmail"));
  const passwordSchema = z
    .string()
    .min(8, t("auth:validation.passwordMinLength"));
  const newPasswordSchema = z
    .string()
    .min(8, t("auth:validation.passwordMinLength"))
    .regex(/[0-9]/, t("auth:validation.passwordNeedsNumber"));
  const nameSchema = z.string().min(2, t("auth:validation.nameMinLength"));

  return { emailSchema, passwordSchema, newPasswordSchema, nameSchema };
}
