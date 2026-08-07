import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/features/auth/lib/auth-client";

type VerifySearch = {
  returnTo?: string;
  error?: string;
};

function safePath(value: string | undefined): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export const Route = createFileRoute("/auth/verify")({
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    returnTo: typeof search.returnTo === "string" ? search.returnTo : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const returnTo = safePath(search.returnTo);
    if (!search.error) {
      const session = await authClient.getSession();
      if (session.data) {
        throw redirect({ href: returnTo ?? "/" });
      }
    }
    throw redirect({
      to: "/auth/login",
      search: { redirectTo: returnTo, error: search.error },
    });
  },
  component: () => null,
});
