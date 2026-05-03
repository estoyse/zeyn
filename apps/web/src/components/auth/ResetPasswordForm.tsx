import { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import {
  Field,
  FieldLabel,
} from "@shaxsiy-oyin/ui/components/field";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

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
      onSubmit: z.object({
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
      }),
    },
  });

  const handleSubmit = form.handleSubmit;

  const handleReset = async () => {
    const password = form.getFieldValue("password");
    const confirmPassword = form.getFieldValue("confirmPassword");

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await authClient.resetPassword({
        newPassword: password,
        token: token as string,
      });
      toast.success("Password reset successfully");
      navigate({ to: "/auth/login" });
    } catch (error) {
      toast.error("Failed to reset password. The link may be invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <Field>
            <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                id={field.name}
                type="password"
                placeholder="••••••••"
                className="pl-11"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                required
              />
            </div>
            {field.state.meta.errors.map(error => (
              <p key={error?.message} className="text-sm text-destructive">
                {error?.message}
              </p>
            ))}
          </Field>
        )}
      </form.Field>

      <form.Field name="confirmPassword">
        {field => (
          <Field>
            <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                id={field.name}
                type="password"
                placeholder="••••••••"
                className="pl-11"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                required
              />
            </div>
            {field.state.meta.errors.map(error => (
              <p key={error?.message} className="text-sm text-destructive">
                {error?.message}
              </p>
            ))}
          </Field>
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
                handleSubmit();
                handleReset();
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