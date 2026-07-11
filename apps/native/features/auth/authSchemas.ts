import z from "zod";

type Translate = (key: string, options?: { defaultValue?: string }) => string;

export function createAuthSchemas(t: Translate) {
  const emailSchema = z
    .string()
    .trim()
    .min(1, t("validation.emailRequired", { defaultValue: "Email is required" }))
    .email(t("validation.invalidEmail"));

  const passwordSchema = z
    .string()
    .min(1, t("validation.passwordRequired", { defaultValue: "Password is required" }))
    .min(8, t("validation.passwordMinLength"));

  const newPasswordSchema = passwordSchema.regex(
    /[0-9]/,
    t("validation.passwordNeedsNumber"),
  );

  const nameSchema = z
    .string()
    .trim()
    .min(1, t("validation.nameRequired", { defaultValue: "Name is required" }))
    .min(2, t("validation.nameMinLength"));

  return { emailSchema, passwordSchema, newPasswordSchema, nameSchema };
}

export function createLoginSchema(t: Translate) {
  const { emailSchema, passwordSchema } = createAuthSchemas(t);
  return z.object({
    email: emailSchema,
    password: passwordSchema,
  });
}

export function createRegisterSchema(t: Translate) {
  const { emailSchema, newPasswordSchema, nameSchema } = createAuthSchemas(t);
  return z.object({
    name: nameSchema,
    email: emailSchema,
    password: newPasswordSchema,
  });
}

export function createForgotPasswordSchema(t: Translate) {
  const { emailSchema } = createAuthSchemas(t);
  return z.object({
    email: emailSchema,
  });
}

export function createResetPasswordSchema(t: Translate) {
  const { newPasswordSchema } = createAuthSchemas(t);
  return z
    .object({
      password: newPasswordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordMismatch"),
      path: ["confirmPassword"],
    });
}
