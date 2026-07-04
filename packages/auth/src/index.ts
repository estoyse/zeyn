import { expo } from "@better-auth/expo";
import { createDb } from "@zeyn/db";
import * as schema from "@zeyn/db/schema/auth";
import { env } from "@zeyn/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword, verifyPassword } from "./password";
import { sendEmail } from "./email";
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
          before: async userData => {
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
        ? [
            "exp://",
            "exp://**",
            "exp://192.168.*.*:*/**",
            "http://localhost:8081",
            "http://localhost:3001",
          ]
        : []),
    ],
    emailAndPassword: {
      enabled: true,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
      sendResetPassword: async ({ user, url }) => {
        const parsed = new URL(url);
        const token = parsed.pathname.split("/").pop();
        const callbackUrl = parsed.searchParams.get("callbackURL");
        const resetUrl = callbackUrl ? `${callbackUrl}?token=${token}` : url;

        await sendEmail({
          to: user.email,
          subject: "Reset your Zeyn password",
          text: `Reset your Zeyn password by opening this link: ${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
          html: `
            <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
              <h1 style="font-size: 20px; margin: 0 0 16px;">Reset your password</h1>
              <p style="font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
                We received a request to reset the password for your Zeyn account. Click the button below to choose a new one.
              </p>
              <a href="${resetUrl}" style="display: inline-block; background: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600;">Reset password</a>
              <p style="font-size: 13px; line-height: 1.5; color: #666; margin: 24px 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br />
                <a href="${resetUrl}" style="color: #1e3a8a; word-break: break-all;">${resetUrl}</a>
              </p>
              <p style="font-size: 13px; line-height: 1.5; color: #666; margin: 16px 0 0;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
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
