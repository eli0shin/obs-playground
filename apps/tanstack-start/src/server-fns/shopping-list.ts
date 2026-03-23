import { createServerFn } from "@tanstack/react-start";
import { getExpressUrl } from "@obs-playground/env";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { z } from "zod";
import type { ShoppingListResponse } from "../types";

const shoppingListItemSchema = z.object({
  ingredientId: z.string(),
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  pricePerUnit: z.number(),
  totalCost: z.number(),
  inStock: z.boolean(),
});

const shoppingListResponseSchema = z.object({
  items: z.array(shoppingListItemSchema),
  totalCost: z.number(),
  outOfStock: z.array(z.string()),
  recipeCount: z.number(),
});

export const generateShoppingList = createServerFn({ method: "GET" })
  .inputValidator((data: { ids: string; isDefault: boolean }) => data)
  .handler(async ({ data }): Promise<ShoppingListResponse> => {
    const activeSpan = trace.getActiveSpan();
    try {
      const recipeIds = data.ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      activeSpan?.setAttributes({
        "shopping_list.recipe_ids": data.ids,
        "shopping_list.recipe_count": recipeIds.length,
        "shopping_list.using_default_ids": data.isDefault,
      });

      const response = await fetch(
        `${getExpressUrl()}/shopping-list/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeIds }),
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const err = new Error(
          `Failed to generate shopping list: ${response.status}`,
        );
        activeSpan?.recordException(err);
        activeSpan?.setStatus({
          code: SpanStatusCode.ERROR,
          message: err.message,
        });
        throw err;
      }

      const json: unknown = await response.json();
      const result = shoppingListResponseSchema.safeParse(json);
      if (!result.success) {
        const err = new Error("Invalid response format");
        activeSpan?.recordException(err);
        activeSpan?.setStatus({
          code: SpanStatusCode.ERROR,
          message: err.message,
        });
        throw err;
      }

      activeSpan?.setAttributes({
        "shopping_list.total_items": result.data.items.length,
        "shopping_list.total_cost": result.data.totalCost,
        "shopping_list.out_of_stock_count": result.data.outOfStock.length,
        "shopping_list.has_out_of_stock": result.data.outOfStock.length > 0,
      });

      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      activeSpan?.recordException(error);
      activeSpan?.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw err;
    }
  });
