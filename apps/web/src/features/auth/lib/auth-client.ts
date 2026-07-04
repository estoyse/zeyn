import { env } from "@zeyn/env/web";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  plugins: [
    inferAdditionalFields({
      user: {
        username: { type: "string", required: false },
        locale: { type: "string", required: false },
      },
    }),
  ],
});
