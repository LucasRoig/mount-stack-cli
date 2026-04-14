import z from "zod";

export const UpdateMyProfileSchema = z.object({
  username: z.string().min(3).max(16),
  pictureUrl: z.url().optional(),
  bio: z.string().max(500).optional(),
});
