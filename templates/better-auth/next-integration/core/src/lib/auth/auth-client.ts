export type { } from "better-auth/types";

import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { Auth } from "./auth";

export const { signIn, signUp, useSession, signOut, changePassword, $ERROR_CODES } = createAuthClient({
  plugins: [
    customSessionClient<Auth>()
  ],
});
