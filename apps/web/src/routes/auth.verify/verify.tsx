import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/features/auth/lib/auth-client";

type VerifySearch = {
  returnTo?: string;
};

export const Route = createFileRoute("/auth/verify/verify")({
  validateSearch: (search: Record<string, unknown>): VerifySearch => {
    return {
      returnTo: search.returnTo as string | undefined,
    };
  },
  component: VerifyPage,
});

async function VerifyPage() {
  const search = Route.useSearch();
  const returnTo = search.returnTo;

  const session = await authClient.getSession();
  if (session.data) {
    throw redirect({ to: returnTo || "/" });
  }

  throw redirect({ to: "/auth/login", search: { redirectTo: returnTo } });
}
