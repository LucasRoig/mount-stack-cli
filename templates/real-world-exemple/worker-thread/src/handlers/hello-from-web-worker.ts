import type { Tinypool } from "tinypool";
import type { WebWorkerHandler } from "../types";

const HELLO_FROM_WEB_WORKER_MESSAGE_TYPE = "HELLO_FROM_WEB_WORKER_MESSAGE";

export const HelloWorldHandler: WebWorkerHandler<undefined, string> = {
  workerApi: {
    acceptMessage: (message) => message.type === HELLO_FROM_WEB_WORKER_MESSAGE_TYPE,
    handleMessage: () => {
      return "hello world from worker";
    },
  },
  start: (tinypool: Tinypool) => {
    return tinypool.run({ type: HELLO_FROM_WEB_WORKER_MESSAGE_TYPE, payload: undefined });
  },
};
