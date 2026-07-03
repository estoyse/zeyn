import { expo } from "@better-auth/expo";
import { createDb } from "@zeyn/db";
import * as schema from "@zeyn/db/schema/auth";
import { env } from "@zeyn/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword, verifyPassword } from "./password";
import { parseOrigins } from "./origins";
import {
  generateUniqueUsername,
  isUsernameTaken,
  validateUsername,
} from "./username";

type Db = ReturnType<typeof createDb>;

async function resolveSignupUsername(
  db: Db,
  name: string,
  submitted: unknown
): Promise<string> {
  if (typeof submitted === "string" && submitted.trim()) {
    const result = validateUsername(submitted);
    if (result.ok && !(await isUsernameTaken(db, result.value))) {
      return result.value;
    }
  }
  return generateUniqueUsername(db, name);
}

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    user: {
      additionalFields: {
        username: { type: "string", required: false, input: true },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (userData) => {
            const username = await resolveSignupUsername(
              db,
              userData.name,
              (userData as { username?: unknown }).username
            );
            return { data: { ...userData, username } };
          },
        },
      },
    },
    trustedOrigins: [
      ...parseOrigins(env.CORS_ORIGIN),
      "zeyn://",
      ...(env.NODE_ENV === "development"
        ? ["exp://", "exp://**", "exp://192.168.*.*:*/**", "http://localhost:8081", "http://localhost:3001"]
        : []),
    ],
emailAndPassword: {
      enabled: true,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 7, // 1 week
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        secure: env.NODE_ENV === "production",
        httpOnly: true,
      },
      crossSubDomainCookies: {
        enabled: false,
      },
    },
    plugins: [expo()],
  });
}
