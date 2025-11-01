import { Router, Request, Response } from "express";
import { trace } from "@opentelemetry/api";
import { ingredientPrices } from "../data.js";

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
    const allPrices = Object.values(ingredientPrices);
    activeSpan?.setAttributes({
      "batch.ingredient_count": allPrices.length,
      "batch.prices": allPrices,
      "batch.price_range_min": Math.min(...allPrices),
      "batch.price_range_max": Math.max(...allPrices),
    });
    return res.json(ingredientPrices);
  }

  // Return specific prices
  const idArray = (ids as string).split(",");
  const prices: Record<string, number> = {};
  const priceValues: number[] = [];

  idArray.forEach((id) => {
    if (ingredientPrices[id] !== undefined) {
      prices[id] = ingredientPrices[id];
      priceValues.push(ingredientPrices[id]);
    }
  });

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
  const updates = req.body as Record<string, number>;
  const updateValues = Object.values(updates);

  Object.entries(updates).forEach(([id, price]) => {
    ingredientPrices[id] = price;
  });

  activeSpan?.setAttributes({
    "pricing.updated_count": Object.keys(updates).length,
    "pricing.updated_ids": Object.keys(updates).join(","),
  });

  if (updateValues.length > 0) {
    activeSpan?.setAttributes({
      "pricing.price_range_min": Math.min(...updateValues),
      "pricing.price_range_max": Math.max(...updateValues),
      "pricing.price_range_avg":
        updateValues.reduce((a, b) => a + b, 0) / updateValues.length,
    });
  }

  res.json({ success: true, updated: Object.keys(updates) });
});

export default router;
