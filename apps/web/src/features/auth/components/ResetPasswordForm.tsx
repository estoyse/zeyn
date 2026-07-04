import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@zeyn/ui/components/button";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import z from "zod";
import { Field } from "@zeyn/ui/components/field";
import { authClient } from "@/features/auth/lib/auth-client";
import { toast } from "sonner";
import { AuthField } from "./AuthField";
import { createAuthSchemas } from "@/features/auth/lib/authSchemas";

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/reset-password" });
  const token = search.token;
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { newPasswordSchema } = createAuthSchemas(t);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: z
        .object({
          password: newPasswordSchema,
          confirmPassword: z.string(),
        })
        .refine(d => d.password === d.confirmPassword, {
          message: t("auth:validation.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    },
    // Runs only after validation passes, so mismatched passwords are blocked.
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        await authClient.resetPassword({
          newPassword: value.password,
          token: token as string,
        });
        toast.success(t("auth:toast.resetPasswordSuccess"));
        navigate({ to: "/auth/login" });
      } catch (error) {
        toast.error(t("auth:toast.resetPasswordError"));
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-heading text-xl font-semibold uppercase tracking-wider">
          {t("auth:resetPassword.invalidLinkTitle")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("auth:resetPassword.invalidLinkDescription")}
        </p>
        <Button
          variant="brand"
          onClick={() => navigate({ to: "/auth/forgot-password" })}
        >
          {t("auth:resetPassword.requestNewLinkButton")}
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h2 className="font-heading text-xl font-semibold uppercase tracking-wider">
          {t("auth:resetPassword.title")}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t("auth:resetPassword.description")}
        </p>
      </div>

      <form.Field name="password">
        {field => (
          <AuthField
            field={field}
            label={t("auth:field.newPasswordLabel")}
            type="password"
            placeholder={t("auth:field.passwordPlaceholder")}
            icon={Lock}
          />
        )}
      </form.Field>

      <form.Field name="confirmPassword">
        {field => (
          <AuthField
            field={field}
            label={t("auth:field.confirmPasswordLabel")}
            type="password"
            placeholder={t("auth:field.passwordPlaceholder")}
            icon={Lock}
          />
        )}
      </form.Field>

      <form.Subscribe selector={state => state.canSubmit}>
        {() => (
          <Field>
            <Button
              type="submit"
              variant="brand"
              className="w-full"
              disabled={isLoading}
              onClick={e => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              {isLoading
                ? t("auth:resetPassword.resettingButton")
                : t("auth:resetPassword.submitButton")}
            </Button>
          </Field>
        )}
      </form.Subscribe>
    </motion.div>
  );
}
