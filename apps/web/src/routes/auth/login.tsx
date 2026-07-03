import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { authClient } from "@/features/auth/lib/auth-client";

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
      throw redirect({ to: "/" });
    }
  },
});

function AuthPage() {
  const search = Route.useSearch();
  const returnTo = search.redirectTo || "/";
  return (
    <AuthLayout>
      <AuthForm returnTo={returnTo} />
    </AuthLayout>
  );
}