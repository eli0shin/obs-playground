import { Router, Request, Response } from "express";
import { trace } from "@opentelemetry/api";
import { ingredientNutrition } from "../data.js";

const router = Router();

router.get("/nutrition/ingredient/:id", (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const { id } = req.params;
  const nutrition = ingredientNutrition[id];

  activeSpan?.setAttributes({
    "ingredient.id": id,
    "ingredient.found": nutrition !== undefined,
  });

  if (nutrition) {
    activeSpan?.setAttributes({
      "nutrition.calories": nutrition.calories,
      "nutrition.protein": nutrition.protein,
      "nutrition.fat": nutrition.fat,
      "nutrition.carbs": nutrition.carbs,
      "nutrition.total_macros":
        nutrition.protein + nutrition.fat + nutrition.carbs,
    });
  }

  if (!nutrition) {
    return res.status(404).json({ error: "Ingredient nutrition not found" });
  }

  res.json(nutrition);
});

export default router;
