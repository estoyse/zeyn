import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { authClient } from "./auth-client";

export const sessionQueryKey = ["session"] as const;

export const sessionQueryOptions = queryOptions({
  queryKey: sessionQueryKey,
  queryFn: async () => {
    const result = await authClient.getSession();
    return result.data ?? null;
  },
  staleTime: 60_000,
  retry: false,
});

export type AdminSession = NonNullable<
  Awaited<ReturnType<typeof authClient.getSession>>["data"]
>;

export async function refreshSession(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: sessionQueryKey });
  return queryClient.fetchQuery(sessionQueryOptions);
}
