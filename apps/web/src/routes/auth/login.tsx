import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { authClient } from "@/features/auth/lib/auth-client";

type LoginSearch = {
  redirectTo?: string;
  error?: string;
};

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      redirectTo: search.redirectTo as string | undefined,
      error: search.error as string | undefined,
    };
  },
  component: AuthPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.data) {
      throw redirect({ to: "/" });
    }
  },
});

function AuthPage() {
  const search = Route.useSearch();
  const returnTo = search.redirectTo || "/";
  const { t } = useTranslation();

  useEffect(() => {
    if (search.error) {
      toast.error(t("auth:toast.googleError"));
    }
  }, [search.error, t]);

  return (
    <AuthLayout>
      <AuthForm returnTo={returnTo} />
    </AuthLayout>
  );
}