import { createFileRoute, redirect } from "@tanstack/react-router";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authClient } from "@/lib/auth-client";

type ResetPasswordSearch = {
  token?: string;
};

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => {
    return {
      token: search.token as string | undefined,
    };
  },
  component: ResetPasswordPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.data) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}