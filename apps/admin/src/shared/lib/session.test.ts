import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, queryOptions } from "@tanstack/react-query";

const getSession = vi.fn();

vi.mock("./auth-client", () => ({
  authClient: { getSession: () => getSession() },
}));

const { refreshSession, sessionQueryKey, sessionQueryOptions } = await import(
  "./session"
);

function freshClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

const SESSION = { user: { id: "u_1", email: "a@b.c", role: "admin" } };

beforeEach(() => {
  getSession.mockReset();
});

describe("session cache across a sign-in", () => {
  it("ensureQueryData alone returns the stale null, which stranded the user on /login", async () => {
    const queryClient = freshClient();

    getSession.mockResolvedValueOnce({ data: null });
    const beforeLogin = await queryClient.ensureQueryData(sessionQueryOptions);
    expect(beforeLogin).toBeNull();

    getSession.mockResolvedValueOnce({ data: SESSION });
    await queryClient.invalidateQueries({ queryKey: sessionQueryKey });

    const afterLogin = await queryClient.ensureQueryData(sessionQueryOptions);
    expect(afterLogin).toBeNull();
  });

  it("refreshSession makes the next guard read see the real session", async () => {
    const queryClient = freshClient();

    getSession.mockResolvedValueOnce({ data: null });
    expect(await queryClient.ensureQueryData(sessionQueryOptions)).toBeNull();

    getSession.mockResolvedValueOnce({ data: SESSION });
    await refreshSession(queryClient);

    const afterLogin = await queryClient.ensureQueryData(sessionQueryOptions);
    expect(afterLogin).toEqual(SESSION);
  });

  it("refreshSession clears the session on sign-out so /login stops bouncing back", async () => {
    const queryClient = freshClient();

    getSession.mockResolvedValueOnce({ data: SESSION });
    expect(await queryClient.ensureQueryData(sessionQueryOptions)).toEqual(
      SESSION
    );

    getSession.mockResolvedValueOnce({ data: null });
    await refreshSession(queryClient);

    expect(await queryClient.ensureQueryData(sessionQueryOptions)).toBeNull();
  });

  it("refetches even though staleTime has not elapsed", async () => {
    const queryClient = freshClient();

    getSession.mockResolvedValueOnce({ data: null });
    await queryClient.ensureQueryData(sessionQueryOptions);
    expect(getSession).toHaveBeenCalledTimes(1);

    getSession.mockResolvedValueOnce({ data: SESSION });
    await refreshSession(queryClient);
    expect(getSession).toHaveBeenCalledTimes(2);
  });
});

describe("sessionQueryOptions", () => {
  it("is a stable key shared by the guards", () => {
    expect(sessionQueryOptions.queryKey).toBe(sessionQueryKey);
    expect(queryOptions(sessionQueryOptions).queryKey).toEqual(["session"]);
  });
});
