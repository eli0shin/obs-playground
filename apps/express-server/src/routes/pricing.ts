import { Router, type Request, type Response } from "express";
import { trace } from "@opentelemetry/api";
import { ingredientPrices } from "../data.js";
import { priceUpdateSchema } from "../schemas.js";

const router = Router();

router.get("/ingredients/:id/price", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { id } = req.params;
  const price = ingredientPrices[id];

  activeSpan?.setAttributes({
    "ingredient.id": id,
    "pricing.price": price,
  });

  if (price === undefined) {
    return res.status(404).json({ error: "Ingredient not found" });
  }

  res.json({ ingredientId: id, price });
});

router.get("/ingredients/prices", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { ids } = req.query;

  if (!ids) {
    // Return all prices
    const allPrices = Object.values(ingredientPrices).filter(
      (p): p is number => p !== undefined,
    );
    activeSpan?.setAttributes({
      "batch.ingredient_count": allPrices.length,
      "batch.prices": allPrices,
      "batch.price_range_min": Math.min(...allPrices),
      "batch.price_range_max": Math.max(...allPrices),
    });
    return res.json(ingredientPrices);
  }

  // Return specific prices
  const idsStr = typeof ids === "string" ? ids : "";
  const idArray = idsStr.split(",");
  const priceEntries = idArray
    .map((id) => [id, ingredientPrices[id]] as const)
    .filter((entry): entry is [string, number] => entry[1] !== undefined);
  const prices = Object.fromEntries(priceEntries);
  const priceValues = priceEntries.map(([, price]) => price);

  activeSpan?.setAttributes({
    "batch.ingredient_ids_requested": idArray.length,
    "batch.ingredient_ids_found": Object.keys(prices),
    "batch.ingredient_ids_missing_count":
      idArray.length - Object.keys(prices).length,
  });

  if (priceValues.length > 0) {
    activeSpan?.setAttributes({
      "batch.price_range_min": Math.min(...priceValues),
      "batch.price_range_max": Math.max(...priceValues),
      "batch.price_range_avg":
        priceValues.reduce((a, b) => a + b, 0) / priceValues.length,
    });
  }

  res.json(prices);
});

router.post("/ingredients/prices", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const parsed = priceUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    activeSpan?.recordException(parsed.error);
    return res.status(400).json({ error: parsed.error.issues });
  }

  const updates = parsed.data;
  const updateIds = Object.keys(updates);
  const updateValues = Object.values(updates);

  for (const [id, price] of Object.entries(updates)) {
    ingredientPrices[id] = price;
  }

  activeSpan?.setAttributes({
    "pricing.updated_count": updateIds.length,
    "pricing.updated_ids": updateIds.join(","),
  });

  if (updateValues.length > 0) {
    activeSpan?.setAttributes({
      "pricing.price_range_min": Math.min(...updateValues),
      "pricing.price_range_max": Math.max(...updateValues),
      "pricing.price_range_avg":
        updateValues.reduce((a, b) => a + b, 0) / updateValues.length,
    });
  }

  res.json({ success: true, updated: updateIds });
});

export default router;
