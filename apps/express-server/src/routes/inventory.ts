import { Router, type Request, type Response } from "express";
import { trace } from "@opentelemetry/api";
import { ingredientInventory } from "../data";

const router = Router();

router.get("/inventory/stock/:ingredientId", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { ingredientId } = req.params;

  if (typeof ingredientId !== "string") {
    return res.status(400).json({ error: "Invalid ingredient ID" });
  }

  const inventory = ingredientInventory[ingredientId];

  activeSpan?.setAttributes({
    "inventory.ingredient_id": ingredientId,
  });

  if (inventory) {
    const stockLevel =
      inventory.quantity === 0
        ? "out"
        : inventory.quantity < 10
          ? "low"
          : inventory.quantity < 50
            ? "medium"
            : "high";

    activeSpan?.setAttributes({
      "inventory.in_stock": inventory.inStock,
      "inventory.quantity": inventory.quantity,
      "inventory.stock_level": stockLevel,
    });
  }

  if (!inventory) {
    return res.status(404).json({ error: "Ingredient not found in inventory" });
  }

  res.json(inventory);
});

export default router;
