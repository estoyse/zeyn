import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { authClient } from "@/features/auth/lib/auth-client";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.data) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        <ForgotPasswordForm
          key="forgot"
          onBack={() => navigate({ to: "/auth/login" })}
        />
      </AnimatePresence>
    </AuthLayout>
  );
}