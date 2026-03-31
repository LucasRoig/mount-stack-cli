import type { Prettify } from "../prettify/prettify";

export type NullToUndefined<T> = T extends Date
  ? T
  : T extends object
  ? {
    [P in keyof T]: NullToUndefined<T[P]>;
  }
  : null extends T
  ? Exclude<T, null> | undefined
  : T;

export function nullToUndefined<T>(obj: T): Prettify<NullToUndefined<T>> {
  if (obj === null) {
    return undefined as unknown as Prettify<NullToUndefined<T>>;
  } else if (Array.isArray(obj)) {
    return obj.map((o) => nullToUndefined(o)) as unknown as Prettify<NullToUndefined<T>>;
  } else if (typeof obj === "object") {
    if (obj instanceof Date) {
      return obj as Prettify<NullToUndefined<T>>;
    } else {
      return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, nullToUndefined(value)])) as Prettify<
        NullToUndefined<T>
      >;
    }
  } else {
    return obj as Prettify<NullToUndefined<T>>;
  }
}
