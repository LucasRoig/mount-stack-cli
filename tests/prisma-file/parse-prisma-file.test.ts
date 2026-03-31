import { expect, test } from "vitest";
import { PrismaSchemaFile } from "../../src/helpers/prisma-helper";

const schema = `
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id Int @id @default(autoincrement())
  name String

  @@map("users")
}

model Post {
  id Int @id @default(autoincrement())
  title String
  content String

  @@map("posts")
}

enum Role {
  USER
  ADMIN
}
`;

test("it parses a schema correctly", () => {
  const schemaFile = PrismaSchemaFile.fromString(schema);
  expect(schemaFile.schema).toBeDefined();
  expect(schemaFile.schema.length).toBe(5);
  expect(schemaFile.schema[0]).toEqual({
    kind: "datasource",
    name: "db",
    content: 'provider = "postgresql"',
  });
  expect(schemaFile.schema[1]).toEqual({
    kind: "generator",
    name: "client",
    content: 'provider = "prisma-client-js"',
  });
  expect(schemaFile.schema[2]).toEqual({
    kind: "model",
    name: "User",
    content: [
      {
        kind: "field",
        content: "id Int @id @default(autoincrement())",
      },
      {
        kind: "field",
        content: "name String",
      },
      {
        kind: "modelAttribute",
        content: '@@map("users")',
      },
    ],
  });
  expect(schemaFile.schema[3]).toEqual({
    kind: "model",
    name: "Post",
    content: [
      {
        kind: "field",
        content: "id Int @id @default(autoincrement())",
      },
      {
        kind: "field",
        content: "title String",
      },
      {
        kind: "field",
        content: "content String",
      },
      {
        kind: "modelAttribute",
        content: '@@map("posts")',
      },
    ],
  });
  expect(schemaFile.schema[4]).toEqual({
    kind: "enum",
    name: "Role",
    content: "USER \n ADMIN",
  });
});

test("it stringifies a schema correctly", () => {
  const schemaFile = PrismaSchemaFile.fromString(schema);
  const stringified = schemaFile.toString();
  expect(stringified.trim()).toBe(schema.trim());
});
