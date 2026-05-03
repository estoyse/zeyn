import { useState } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
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

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Invalid email address"),
      }),
    },
  });

  const handleSubmit = form.handleSubmit;

  const handleResetRequest = async () => {
    const email = form.getFieldValue("email");
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      setIsSubmitted(true);
    } catch (error) {
      toast.error("Failed to send reset email. Please try again.");
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="mx-auto mb-4 flex size-12 items-center justify-center bg-green-100 rounded-full">
          <Mail className="size-6 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-muted-foreground text-sm">
          We sent a password reset link to your email address.
        </p>
        <Button variant="outline" onClick={onBack} className="w-full mt-4">
          Back to login
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
        <h2 className="text-xl font-semibold">Forgot password?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form.Field name="email">
        {field => (
          <Field>
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                id={field.name}
                type="email"
                placeholder="sizning@email.com"
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
              onClick={e => {
                e.preventDefault();
                handleSubmit();
                handleResetRequest();
              }}
            >
              Send Reset Link
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
          Back to login
        </button>
      </div>
    </motion.div>
  );
}