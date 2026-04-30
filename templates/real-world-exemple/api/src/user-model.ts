import { drizzleSchema } from "@repo/database";

export const PUBLIC_USER_FIELDS_DRIZZLE = {
  id: drizzleSchema.users.id,
  name: drizzleSchema.users.name,
  bio: drizzleSchema.users.bio,
  image: drizzleSchema.users.image,
};

export const PUBLIC_USER_FIELDS_BOOLEAN = {
  id: true as const,
  name: true as const,
  bio: true as const,
  image: true as const,
};
