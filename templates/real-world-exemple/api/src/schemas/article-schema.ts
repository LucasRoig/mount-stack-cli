import z from "zod";

export const ArticleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(255),
  body: z.string().max(5000),
  tags: z.string().max(255),
});
