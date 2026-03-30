import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { appRouter, errorClientInterceptor } from "@repo/api";
import "server-only";
import { getORPCContext } from "./orpc-context";

const orpcHandler = new RPCHandler(appRouter, {
  clientInterceptors: [onError(errorClientInterceptor)],
});

export const createOrpcHandleRequest = (prefix: `/${string}`) => async (request: Request) => {
  const context = await getORPCContext();
  const { response } = await orpcHandler.handle(request, {
    prefix,
    context,
  });
  return response ?? new Response("Not found", { status: 404 });
};
