import { expo } from "@better-auth/expo";
import { createDb } from "@zeyn/db";
import * as schema from "@zeyn/db/schema/auth";
import { env } from "@zeyn/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword, verifyPassword } from "./password";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    trustedOrigins: [
      env.CORS_ORIGIN.replace(/\/+$/, ""),
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
