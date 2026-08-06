import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";

import { adminProcedure, router, t } from "../src/index";
import type { Context } from "../src/context";

type UserRow = { role: string; banned: boolean } | undefined;

function stubDb(row: UserRow) {
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: () => chain,
    get: async () => row,
  };
  return { select: () => chain };
}

function stubContext(options: {
  sessionRole?: string;
  dbRow?: UserRow;
  signedIn?: boolean;
}): Context {
  const { sessionRole = "admin", dbRow, signedIn = true } = options;

  return {
    session: signedIn
      ? {
          session: { id: "sess_1", userId: "u_1" },
          user: { id: "u_1", email: "a@b.c", role: sessionRole },
        }
      : null,
    db: stubDb(dbRow),
    env: {},
    clientIp: null,
    guestTokenLimiter: null,
  } as unknown as Context;
}

const testRouter = router({
  ping: adminProcedure.query(({ ctx }) => ctx.adminId),
});

const createCaller = t.createCallerFactory(testRouter);

async function callPing(ctx: Context) {
  return createCaller(ctx).ping();
}

async function expectTRPCError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toThrow(TRPCError);
  await promise.catch((error: unknown) => {
    expect((error as TRPCError).code).toBe(code);
  });
}

describe("adminProcedure", () => {
  it("rejects an anonymous caller with UNAUTHORIZED", async () => {
    await expectTRPCError(
      callPing(stubContext({ signedIn: false })),
      "UNAUTHORIZED"
    );
  });

  it("rejects a signed-in non-admin with FORBIDDEN", async () => {
    await expectTRPCError(
      callPing(
        stubContext({
          sessionRole: "user",
          dbRow: { role: "user", banned: false },
        })
      ),
      "FORBIDDEN"
    );
  });

  it("rejects a banned admin with FORBIDDEN", async () => {
    await expectTRPCError(
      callPing(stubContext({ dbRow: { role: "admin", banned: true } })),
      "FORBIDDEN"
    );
  });

  it("rejects when the user row is missing", async () => {
    await expectTRPCError(
      callPing(stubContext({ dbRow: undefined })),
      "FORBIDDEN"
    );
  });

  it("trusts the database over a stale session cookie claiming admin", async () => {
    await expectTRPCError(
      callPing(
        stubContext({
          sessionRole: "admin",
          dbRow: { role: "user", banned: false },
        })
      ),
      "FORBIDDEN"
    );
  });

  it("allows a real admin and exposes adminId on the context", async () => {
    const result = await callPing(
      stubContext({ dbRow: { role: "admin", banned: false } })
    );
    expect(result).toBe("u_1");
  });
});
