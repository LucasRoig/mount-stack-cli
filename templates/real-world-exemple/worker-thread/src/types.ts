import type Tinypool from "tinypool";

type Awaitable<T> = T | PromiseLike<T>;

export type WebWorkerHandler<TInput, TOutput, TMessage = WorkerMessage<TInput>> = {
  workerApi: {
    acceptMessage: (message: TMessage) => boolean;
    handleMessage: (message: TMessage) => Awaitable<TOutput>;
  };
  start: (tinypool: Tinypool, input: TInput) => Awaitable<TOutput>;
};

export type WorkerMessage<T> = {
  type: string;
  payload: T;
};
