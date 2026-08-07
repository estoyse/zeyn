import { expo } from "@better-auth/expo";
import { createDb } from "@zeyn/db";
import * as schema from "@zeyn/db/schema/auth";
import { env } from "@zeyn/env/server";
import { t, type Locale } from "@zeyn/i18n/server";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
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
        locale: { type: "string", required: false, input: true },
        role: {
          type: "string",
          required: false,
          input: false,
          defaultValue: "user",
        },
        banned: {
          type: "boolean",
          required: false,
          input: false,
          defaultValue: false,
        },
        banReason: { type: "string", required: false, input: false },
        banExpires: { type: "date", required: false, input: false },
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
      session: {
        create: {
          before: async (session, ctx) => {
            if (!ctx) return;
            const found = await ctx.context.internalAdapter.findUserById(
              session.userId
            );
            const banned = (found as { banned?: boolean } | null)?.banned;
            if (!banned) return;

            const banExpires = (found as { banExpires?: Date | null } | null)
              ?.banExpires;
            if (banExpires && new Date(banExpires).getTime() < Date.now()) {
              await ctx.context.internalAdapter.updateUser(session.userId, {
                banned: false,
                banReason: null,
                banExpires: null,
              });
              return;
            }

            throw APIError.from("FORBIDDEN", {
              message: "Your account has been suspended.",
              code: "BANNED_USER",
            });
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
            "http://localhost:3002",
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
        const locale = ((user as { locale?: string }).locale ?? "uz") as Locale;

        const subject = t(locale, "email", "resetPassword.subject");
        const heading = t(locale, "email", "resetPassword.heading");
        const intro = t(locale, "email", "resetPassword.intro");
        const button = t(locale, "email", "resetPassword.button");
        const linkFallback = t(locale, "email", "resetPassword.linkFallback");
        const ignore = t(locale, "email", "resetPassword.ignore");

        await sendEmail({
          to: user.email,
          subject,
          text: `${subject}: ${resetUrl}\n\n${ignore}`,
          html: `
            <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
              <h1 style="font-size: 20px; margin: 0 0 16px;">${heading}</h1>
              <p style="font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
                ${intro}
              </p>
              <a href="${resetUrl}" style="display: inline-block; background: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600;">${button}</a>
              <p style="font-size: 13px; line-height: 1.5; color: #666; margin: 24px 0 0;">
                ${linkFallback}<br />
                <a href="${resetUrl}" style="color: #1e3a8a; word-break: break-all;">${resetUrl}</a>
              </p>
              <p style="font-size: 13px; line-height: 1.5; color: #666; margin: 16px 0 0;">
                ${ignore}
              </p>
            </div>
          `,
        });
      },
    },
    socialProviders: {
      google: {
        enabled: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        clientId: env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
        prompt: "select_account",
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
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
