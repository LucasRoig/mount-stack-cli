# @repo/rbac — Authorization Package

This package provides role-based authorization using [CASL](https://casl.js.org/) with first-class support for Drizzle ORM database-level filtering.

## Overview

It defines **who can do what** in your application through a dual-ability system:

- **App ability** — runtime permission checks using CASL's `PureAbility` with lambda condition matchers (e.g. "can this user update this object?").
- **Database ability** — translates the same permission rules into Drizzle ORM `SQL` conditions so you can enforce authorization directly in your database queries.

## Structure

| File | Purpose |
|---|---|
| `src/define-ability.ts` | Main entry point. Defines roles (`user`, `admin`) and their permissions, returns both app and database abilities. |
| `src/subjects.ts` | Declares the CASL subjects (resource types) derived from your Drizzle schema tables. |
| `src/core/database-ability.ts` | `DatabaseAbilityBuilder` / `DatabaseAbility` — a CASL-like builder that collects permission rules as Drizzle `SQL` fragments. |
| `src/core/forbidden-error.ts` | `ForbiddenError` helper that wraps an ability and provides a `throwUnlessCan()` guard. |

## Usage

### Checking permissions at runtime

```ts
import { ForbiddenError } from "@repo/rbac";
import { defineAbilityFor } from "@repo/rbac";

const { appAbility, databaseAbility } = defineAbilityFor({
  type: "admin", // role
  id: "user-123",
});
// Throws if the user is not allowed
ForbiddenError.from(appAbility).throwUnlessCan("update", userSubject);

// Or check manually
if (appAbility.can("read", "User")) {
  // …
}
```

### Filtering database queries

Use `databaseAbility.getQueryFor()` to get a Drizzle `SQL` condition you can pass to `.where()`:

```ts
const { appAbility, databaseAbility } = defineAbilityFor({
  type: "admin", // role
  id: "user-123",
});
const condition = databaseAbility.getQueryFor("read", "User");

const users = await db
  .select()
  .from(usersTable)
  .where(condition);
```

## Adding a new subject

1. Add a new type alias in `src/subjects.ts` using `MakeSubject` and your Drizzle table.
2. Add it to the `Subjects` union type.

## Adding new roles and actions

You can add roles and actions in `src/define-ability.ts`

## Defining permissions

By default noting is allowed.

Define the corresponding permissions in the `rolePermissions` map in `src/define-ability.ts` for both the app ability (`can(…)`) and the database ability (`dbAbilityBuilder.can(…)`).

Defining a permission multiple times (calling can multiple times with the same subject action and role) creates or statements not and statements.
