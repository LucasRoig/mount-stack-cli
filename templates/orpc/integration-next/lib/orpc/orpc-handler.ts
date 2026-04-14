import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { appRouter, errorClientInterceptor } from "@repo/api";
import "server-only";
import { getORPCContext } from "./orpc-context";

function createOrpcHandler() {
  return new RPCHandler(appRouter, {
    clientInterceptors: [onError(errorClientInterceptor)],
  });
}

let orpcHandler = createOrpcHandler();

export const createOrpcHandleRequest = (prefix: `/${string}`) => async (request: Request) => {
  const context = await getORPCContext();
  if (process.env.NODE_ENV === "development") {
    orpcHandler = createOrpcHandler(); //In development, we recreate the handler on each request to get the latest version of the code without having to restart the server
  }
  const { response } = await orpcHandler.handle(request, {
    prefix,
    context,
  });
  return response ?? new Response("Not found", { status: 404 });
};
