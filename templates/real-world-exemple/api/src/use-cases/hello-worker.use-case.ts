import { getLogger } from "@logtape/logtape";
import { WorkerService } from "@repo/worker-thread";
import { procedures } from "../orpc";

const logger = getLogger(["api", "hello-worker-use-case"]);

export const HelloWorkerProcedure = procedures.public.handler(async () => {
  try {
    return await WorkerService.countArticlesByTag("some-tag");
  } catch (e) {
    logger.error("{e}", { e });
    throw e;
  }
});
