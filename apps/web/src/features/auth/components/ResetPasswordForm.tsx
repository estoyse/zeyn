import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import { Field } from "@shaxsiy-oyin/ui/components/field";
import { authClient } from "@/features/auth/lib/auth-client";
import { toast } from "sonner";
import { AuthField } from "./AuthField";
import { passwordSchema } from "@/features/auth/lib/authSchemas";

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/reset-password" });
  const token = search.token;
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: z
        .object({
          password: passwordSchema,
          confirmPassword: z.string(),
        })
        .refine(d => d.password === d.confirmPassword, {
          message: "Passwords do not match",
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
        toast.success("Password reset successfully");
        navigate({ to: "/auth/login" });
      } catch (error) {
        toast.error(
          "Failed to reset password. The link may be invalid or expired."
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Invalid Link</h2>
        <p className="text-muted-foreground text-sm">
          This password reset link is invalid or has expired.
        </p>
        <Button onClick={() => navigate({ to: "/auth/forgot-password" })}>
          Request New Link
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
        <h2 className="text-xl font-semibold">Reset your password</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your new password below.
        </p>
      </div>

      <form.Field name="password">
        {field => (
          <AuthField
            field={field}
            label="New Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
          />
        )}
      </form.Field>

      <form.Field name="confirmPassword">
        {field => (
          <AuthField
            field={field}
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
          />
        )}
      </form.Field>

      <form.Subscribe selector={state => state.canSubmit}>
        {() => (
          <Field>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              onClick={e => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </Field>
        )}
      </form.Subscribe>
    </motion.div>
  );
}
