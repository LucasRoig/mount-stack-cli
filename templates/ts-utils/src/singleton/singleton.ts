export function singleton<TValue>(name: string, producer: () => TValue): TValue {
  const yolo = globalThis as unknown as {
    __singletons: {
      [name]: TValue | undefined;
    };
  };
  yolo.__singletons ??= {};
  yolo.__singletons[name] ??= producer();
  return yolo.__singletons[name];
}
