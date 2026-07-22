import { Router, type Request, type Response } from "express";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import {
  graphqlRequest,
  AllRecipesForAggregationDocument,
} from "@obs-playground/graphql-client";
import { z } from "zod";
import { ingredientPrices } from "../data";
import { logger } from "../otel";

const router = Router();

const normalizedTokenSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.toLowerCase());

const mealPlanGenerateSchema = z.object({
  customerSegment: normalizedTokenSchema.pipe(
    z.enum([
      "budget_family",
      "vegetarian",
      "fitness_focused",
      "busy_professional",
    ]),
  ),
  fulfillmentRegion: normalizedTokenSchema.pipe(
    z.enum(["northeast", "midwest", "south", "west"]),
  ),
  diet: normalizedTokenSchema.pipe(z.enum(["vegetarian", "omnivore"])),
  allergens: z
    .array(normalizedTokenSchema.pipe(z.enum(["egg", "gluten", "dairy"])))
    .default([]),
  preferences: z
    .array(
      normalizedTokenSchema.pipe(z.enum(["quick", "high_protein", "variety"])),
    )
    .default([]),
  budgetMaxUsd: z.number().positive(),
  servings: z.number().int().positive(),
  mealCount: z.number().int().positive(),
  failureScenario: normalizedTokenSchema
    .pipe(z.enum(["none", "vegetarian_produce_shortage_northeast"]))
    .default("none"),
});

type CandidateRecipe = {
  id: string;
  title: string;
  cost: number;
  calories: number;
  ingredientNames: string[];
  hasInventoryIssue: boolean;
  rejectionReasons: string[];
};

const ingredientTags = new Map<string, { allergens?: string[]; calories: number }>([
  ["1", { allergens: ["egg"], calories: 70 }],
  ["2", { allergens: ["gluten"], calories: 455 }],
  ["3", { allergens: ["dairy"], calories: 150 }],
  ["4", { calories: 774 }],
  ["5", { allergens: ["dairy"], calories: 102 }],
  ["6", { calories: 748 }],
  ["7", { calories: 206 }],
  ["8", { calories: 22 }],
  ["9", { calories: 44 }],
  ["10", { calories: 4 }],
]);

function getSessionId(req: Request) {
  const header = req.header("x-app-session-id");
  return header && header.trim().length > 0 ? header : "unknown";
}

function csv(values: string[]) {
  return values.length > 0 ? values.join(",") : "none";
}

function hasInjectedInventoryIssue(input: z.infer<typeof mealPlanGenerateSchema>) {
  return (
    input.failureScenario === "vegetarian_produce_shortage_northeast" &&
    input.diet === "vegetarian" &&
    input.fulfillmentRegion === "northeast"
  );
}

router.get("/meal-plan/estimate", async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const requestStart = Date.now();
  const { recipeIds } = req.query;

  if (!recipeIds || typeof recipeIds !== "string") {
    logger.warn("Meal plan missing recipeIds query parameter", {
      "meal_plan.query_param_present": Boolean(recipeIds),
      "meal_plan.query_param_type": typeof recipeIds,
    });
    return res
      .status(400)
      .json({ error: "recipeIds query parameter is required" });
  }

  const idsArray = recipeIds.split(",");

  activeSpan?.setAttributes({
    "meal_plan.recipe_ids": recipeIds,
    "meal_plan.recipe_count": idsArray.length,
  });

  const { recipes: allRecipes } = await graphqlRequest(
    AllRecipesForAggregationDocument,
  );
  const selectedRecipes = allRecipes.filter((recipe) =>
    idsArray.includes(recipe.id),
  );
  const recipeCosts = selectedRecipes.map((recipe) => ({
    recipeId: recipe.id,
    title: recipe.title,
    cost: recipe.ingredients.reduce(
      (sum, { ingredient, quantity }) =>
        sum + (ingredientPrices[ingredient.id] ?? 0) * quantity,
      0,
    ),
  }));
  const totalWeeklyCost = recipeCosts.reduce(
    (sum, recipe) => sum + recipe.cost,
    0,
  );
  const averageMealCost =
    recipeCosts.length > 0 ? totalWeeklyCost / recipeCosts.length : 0;

  activeSpan?.setAttributes({
    "meal_plan.recipe_titles": recipeCosts
      .map((recipe) => recipe.title)
      .join(","),
    "meal_plan.total_weekly_cost": totalWeeklyCost,
    "meal_plan.average_meal_cost": averageMealCost,
    "meal_plan.meal_count": recipeCosts.length,
  });

  logger.info("Meal plan estimate generated", {
    "meal_plan.total_weekly_cost": totalWeeklyCost,
    "meal_plan.average_meal_cost": averageMealCost,
    "meal_plan.meal_count": recipeCosts.length,
    "meal_plan.duration_ms": Date.now() - requestStart,
  });

  return res.json({
    recipes: recipeCosts,
    totalWeeklyCost,
    averageMealCost,
    mealCount: recipeCosts.length,
  });
});

router.post("/meal-plan/generate", async (req: Request, res: Response) => {
  const activeSpan = trace.getActiveSpan();
  const requestStart = Date.now();
  const parsed = mealPlanGenerateSchema.safeParse(req.body);

  if (!parsed.success) {
    activeSpan?.recordException(parsed.error);
    activeSpan?.setStatus({ code: SpanStatusCode.ERROR, message: "Invalid meal plan constraints" });
    return res.status(400).json({ error: parsed.error.issues });
  }

  const input = parsed.data;
  const sessionId = getSessionId(req);
  const userId = req.header("x-app-user-id") ?? `user-${sessionId}`;

  activeSpan?.setAttributes({
    "app.session.id": sessionId,
    "app.user.id": userId,
    "app.customer.segment": input.customerSegment,
    "app.fulfillment.region": input.fulfillmentRegion,
    "app.constraint.diet": input.diet,
    "app.constraint.allergens": csv(input.allergens),
    "app.constraint.preferences": csv(input.preferences),
    "app.constraint.budget.max_usd": input.budgetMaxUsd,
    "app.constraint.servings": input.servings,
    "app.constraint.meal_count": input.mealCount,
    "app.demo.failure_scenario": input.failureScenario,
  });

  const { recipes: allRecipes } = await graphqlRequest(AllRecipesForAggregationDocument);
  const injectedInventoryIssue = hasInjectedInventoryIssue(input);

  const candidates: CandidateRecipe[] = allRecipes.map((recipe) => {
    const ingredientNames = recipe.ingredients.map(({ ingredient }) => ingredient.name);
    const ingredientIds = recipe.ingredients.map(({ ingredient }) => ingredient.id);
    const cost = recipe.ingredients.reduce(
      (sum, { ingredient, quantity }) => sum + (ingredientPrices[ingredient.id] ?? 0) * quantity,
      0,
    );
    const calories = recipe.ingredients.reduce(
      (sum, { ingredient, quantity }) =>
        sum + (ingredientTags.get(ingredient.id)?.calories ?? 0) * quantity,
      0,
    );
    const rejectionReasons: string[] = [];

    if (input.diet === "vegetarian" && ingredientIds.includes("6")) {
      rejectionReasons.push("diet_conflict");
    }

    const ingredientAllergens = ingredientIds.flatMap(
      (id) => ingredientTags.get(id)?.allergens ?? [],
    );
    if (
      input.allergens.some(
        (allergen) => allergen.length > 0 && ingredientAllergens.includes(allergen),
      )
    ) {
      rejectionReasons.push("allergen_conflict");
    }

    const hasInventoryIssue =
      injectedInventoryIssue && !ingredientIds.includes("6");

    if (hasInventoryIssue) {
      rejectionReasons.push("inventory_unavailable");
    }

    return {
      id: recipe.id,
      title: recipe.title,
      cost,
      calories,
      ingredientNames,
      hasInventoryIssue,
      rejectionReasons,
    };
  });

  const viableBeforeBudget = candidates.filter((candidate) => candidate.rejectionReasons.length === 0);
  const selectedRecipes: CandidateRecipe[] = [];
  let estimatedCostUsd = 0;
  let budgetBlockedCount = 0;

  for (const candidate of viableBeforeBudget.sort((a, b) => a.cost - b.cost)) {
    if (selectedRecipes.length >= input.mealCount) break;
    if (estimatedCostUsd + candidate.cost <= input.budgetMaxUsd) {
      selectedRecipes.push(candidate);
      estimatedCostUsd += candidate.cost;
    } else {
      budgetBlockedCount += 1;
    }
  }

  const outcome = selectedRecipes.length >= input.mealCount ? "success" : "no_plan";
  const failureReason =
    outcome === "success"
      ? "none"
      : candidates.some((candidate) => candidate.rejectionReasons.includes("inventory_unavailable"))
        ? "inventory_unavailable"
        : budgetBlockedCount > 0
          ? "budget_exceeded"
          : candidates.some((candidate) => candidate.rejectionReasons.includes("allergen_conflict"))
            ? "allergen_conflict"
            : "no_valid_recipe_combination";
  const estimatedCalories = selectedRecipes.reduce((sum, recipe) => sum + recipe.calories, 0);
  const rejectedRecipeCount = candidates.length - selectedRecipes.length;

  activeSpan?.setAttributes({
    "app.planning.outcome": outcome,
    "app.planning.failure.reason": failureReason,
    "app.planning.candidate_recipe_count": candidates.length,
    "app.planning.viable_recipe_count": viableBeforeBudget.length,
    "app.meal_plan.recipe_count": selectedRecipes.length,
    "app.meal_plan.estimated_cost_usd": estimatedCostUsd,
    "app.meal_plan.estimated_calories": estimatedCalories,
    "app.meal_plan.rejected_recipe_count": rejectedRecipeCount,
    "app.meal_plan.inventory_substitution_count": 0,
    "app.duration_ms": Date.now() - requestStart,
  });

  logger.info("Meal plan generation completed", {
    "app.session.id": sessionId,
    "app.customer.segment": input.customerSegment,
    "app.fulfillment.region": input.fulfillmentRegion,
    "app.planning.outcome": outcome,
    "app.planning.failure.reason": failureReason,
    "app.meal_plan.recipe_count": selectedRecipes.length,
    "app.meal_plan.estimated_cost_usd": estimatedCostUsd,
  });

  res.status(outcome === "success" ? 200 : 422).json({
    outcome,
    failureReason,
    constraints: input,
    plan: {
      recipes: selectedRecipes.map((recipe) => ({
        recipeId: recipe.id,
        title: recipe.title,
        cost: recipe.cost,
        calories: recipe.calories,
        ingredientNames: recipe.ingredientNames,
      })),
      recipeCount: selectedRecipes.length,
      estimatedCostUsd,
      estimatedCalories,
    },
    diagnostics: {
      candidateRecipeCount: candidates.length,
      viableRecipeCount: viableBeforeBudget.length,
      rejectedRecipeCount,
    },
  });
});

export default router;
