import { CountArticlesHandler } from "./handlers/count-articles";
import { CountArticlesByTagHandler } from "./handlers/count-articles-by-tag";
import { HelloWorldHandler } from "./handlers/hello-from-web-worker";
import type { WebWorkerHandler, WorkerMessage } from "./types";

// biome-ignore lint/suspicious/noExplicitAny: WorkerMessage can be of any type depending on the handler
const handlers: WebWorkerHandler<any, any>[] = [HelloWorldHandler, CountArticlesHandler, CountArticlesByTagHandler];

// biome-ignore lint/suspicious/noExplicitAny: WorkerMessage can be of any type depending on the handler
export default async function handleWorkerMessage(message: WorkerMessage<any>) {
  console.log("Worker received message:", message);
  for (const handler of handlers) {
    if (handler.workerApi.acceptMessage(message)) {
      return await handler.workerApi.handleMessage(message);
    }
  }
}
