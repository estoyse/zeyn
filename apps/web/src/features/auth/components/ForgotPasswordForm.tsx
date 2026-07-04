import { useState } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Button } from "@zeyn/ui/components/button";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import z from "zod";
import { Field } from "@zeyn/ui/components/field";
import { authClient } from "@/features/auth/lib/auth-client";
import { toast } from "sonner";
import { AuthField } from "./AuthField";
import { createAuthSchemas } from "@/features/auth/lib/authSchemas";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { t } = useTranslation();
  const { emailSchema } = createAuthSchemas(t);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: z.object({
        email: emailSchema,
      }),
    },
    onSubmit: async () => {
      setIsLoading(true);
      try {
        await authClient.requestPasswordReset({
          email: form.getFieldValue("email"),
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        setIsSubmitted(true);
      } catch (error) {
        toast.error(t("auth:toast.forgotPasswordError"));
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="mx-auto mb-4 flex size-12 items-center justify-center bg-success/10 text-success">
          <Mail className="size-6" />
        </div>
        <h2 className="font-heading text-xl font-semibold uppercase tracking-wider">
          {t("auth:forgotPassword.successTitle")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("auth:forgotPassword.successDescription")}
        </p>
        <Button variant="outline" onClick={onBack} className="w-full mt-4">
          {t("auth:forgotPassword.backToLoginButton")}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h2 className="font-heading text-xl font-semibold uppercase tracking-wider">
          {t("auth:forgotPassword.title")}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t("auth:forgotPassword.description")}
        </p>
      </div>

      <form.Field name="email">
        {field => (
          <AuthField
            field={field}
            label={t("auth:field.emailLabel")}
            type="email"
            placeholder={t("auth:field.emailPlaceholder")}
            icon={Mail}
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
                ? t("auth:forgotPassword.sendingButton")
                : t("auth:forgotPassword.submitButton")}
            </Button>
          </Field>
        )}
      </form.Subscribe>

      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          {t("auth:forgotPassword.backToLoginButton")}
        </button>
      </div>
    </motion.div>
  );
}