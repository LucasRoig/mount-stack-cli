import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth/auth";

export const GET = (req: Request) => {
  return toNextJsHandler(getAuth()).GET(req);
}

export const POST = (req: Request) => {
  return toNextJsHandler(getAuth()).POST(req);
}
