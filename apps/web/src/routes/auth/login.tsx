import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authClient } from "@/lib/auth-client";

type LoginSearch = {
  redirectTo?: string;
};

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      redirectTo: search.redirectTo as string | undefined,
    };
  },
  component: AuthPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.data) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function AuthPage() {
  const search = Route.useSearch();
  const returnTo = search.redirectTo || "/dashboard";
  return (
    <AuthLayout>
      <AuthForm returnTo={returnTo} />
    </AuthLayout>
  );
}