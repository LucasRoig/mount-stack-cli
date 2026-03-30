import { createOrpcHandleRequest } from "@/lib/orpc/orpc-handler";

const handleRequest = createOrpcHandleRequest("/rpc");

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
