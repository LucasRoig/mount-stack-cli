import { createRouterClient } from "@orpc/server";
import { appRouter } from "@repo/api";
import "server-only";
import { createSafeClient } from "@orpc/client";
import { getORPCContext } from "./orpc-context";

const client = createRouterClient(appRouter, {
  context: getORPCContext(),
});

export const orpcServerSideClient = createSafeClient(client);
