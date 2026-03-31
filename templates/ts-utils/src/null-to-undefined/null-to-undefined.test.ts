import { expect, test } from "vitest";
import { nullToUndefined } from "./null-to-undefined";

test("nullToUndefined on scalar", () => {
  expect(nullToUndefined(1)).toBe(1);
  expect(nullToUndefined(null)).toBe(undefined);
  expect(nullToUndefined(undefined)).toBe(undefined);
});

test("nullToUndefined on object", () => {
  expect(nullToUndefined({ a: 1, b: null, c: undefined })).toEqual({ a: 1, b: undefined, c: undefined });
});

test("nullToUndefined on array", () => {
  expect(nullToUndefined([1, null, undefined])).toEqual([1, undefined, undefined]);
  expect(
    nullToUndefined([
      { a: 1, b: null, c: undefined },
      { a: 1, b: null, c: undefined },
    ]),
  ).toEqual([
    { a: 1, b: undefined, c: undefined },
    { a: 1, b: undefined, c: undefined },
  ]);
});

test("nullToUndefined on nested object", () => {
  const obj = {
    a: "asd",
    b: 1,
    c: null,
    d: undefined,
    e: {
      a: "asd",
      b: null,
      c: undefined,
      d: {
        a: "asd",
        b: null,
        c: undefined,
        d: [
          null,
          undefined,
          {
            a: "asd",
            b: null,
            c: undefined,
          },
        ],
      },
    },
    f: [
      null,
      undefined,
      {
        a: "asd",
        b: null,
        c: undefined,
        d: {
          a: "asd",
          b: null,
          c: undefined,
        },
        e: [
          null,
          undefined,
          {
            a: "asd",
            b: null,
            c: undefined,
          },
        ],
      },
    ],
  };
  const expected = {
    a: "asd",
    b: 1,
    c: undefined,
    d: undefined,
    e: {
      a: "asd",
      b: undefined,
      c: undefined,
      d: {
        a: "asd",
        b: undefined,
        c: undefined,
        d: [
          undefined,
          undefined,
          {
            a: "asd",
            b: undefined,
            c: undefined,
          },
        ],
      },
    },
    f: [
      undefined,
      undefined,
      {
        a: "asd",
        b: undefined,
        c: undefined,
        d: {
          a: "asd",
          b: undefined,
          c: undefined,
        },
        e: [
          undefined,
          undefined,
          {
            a: "asd",
            b: undefined,
            c: undefined,
          },
        ],
      },
    ],
  };
  expect(nullToUndefined(obj)).toEqual(expected);
});
