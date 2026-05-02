import { getLogger } from "@logtape/logtape";
import { runCountUsers } from "@repo/worker-thread";
import { procedures } from "../orpc";

const logger = getLogger(["api", "hello-worker-use-case"]);

export const HelloWorkerProcedure = procedures.public.handler(async () => {
  try {
    return await runCountUsers();
  } catch (e) {
    logger.error("{e}", { e });
    throw e;
  }
});
