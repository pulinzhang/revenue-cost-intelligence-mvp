import { z } from "zod";

export const createEntrySchema = z.object({
  type: z.string().min(1),
  amount: z.coerce.number(),
  description: z.string().optional().nullable(),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;

