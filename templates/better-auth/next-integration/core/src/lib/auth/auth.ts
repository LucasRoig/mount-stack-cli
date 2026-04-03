import "server-only";

import { customSession } from "better-auth/plugins";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { getEnv } from "@/env/env";
import { singleton } from "@repo/ts-utils";

function createBaseAuthConfig() {
  return {
    session: {
      disableSessionRefresh: true,
      expiresIn: getEnv().server.BETTER_AUTH_SESSION_DURATION_IN_SECONDS,
    },
    onAPIError: {
      errorURL: "/auth-error",
    },
    user: {
      additionalFields: {
        role: {
          type: ["ADMIN", "USER"],
          required: true,
          defaultValue: "USER",
          input: false,
        }
      }
    },
    plugins: [],
  } satisfies BetterAuthOptions;
}


export function getAuth() {
  return singleton("betterAuth", () => {
    const baseAuthConfig = createBaseAuthConfig();
    return betterAuth({
      ...baseAuthConfig,
      plugins: [
        ...(baseAuthConfig.plugins ?? []),
        // biome-ignore lint/suspicious/useAwait: customSession() might do some async initialization in the future, so we want to be able to await it if needed without changing the function signature.
        customSession(async ({ user, session }, _ctx) => {
          return {
            user, // You can add additional properties to the session here if needed
            session,
          }
        }, baseAuthConfig)
      ]
    });
  })
};

export type Auth = ReturnType<typeof getAuth>;
