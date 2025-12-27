import { z } from "zod";

export const pricesResponseSchema = z.record(z.string(), z.number());

export const nutritionResponseSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
});
