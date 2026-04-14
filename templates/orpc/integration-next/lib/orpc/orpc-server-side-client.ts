import "server-only";
import { createRouterClient } from "@orpc/server";
import { appRouter } from "@repo/api";
import { createSafeClient } from "@orpc/client";
import { getORPCContext } from "./orpc-context";

export async function getServerSideORPCClient() {
  const context = await getORPCContext();
  const client = createRouterClient(appRouter, {
    context,
  });
  return createSafeClient(client);
}
