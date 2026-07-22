import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

type MealPlanScenario = {
  name: string;
  customerSegment: string;
  fulfillmentRegion: string;
  diet: string;
  allergens?: string;
  preferences: string;
  budgetMaxUsd: string;
  mealCount: string;
  failureScenario: string;
  expectedOutcome: "success" | "no_plan";
  expectedReason?: RegExp;
  clickRecipe?: boolean;
};

async function openMealPlannerFromHome(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: /Weekly Meal Planner/i }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Generate a Meal Plan" }),
  ).toBeVisible({ timeout: 15000 });
}

async function generateMealPlan(page: Page, scenario: MealPlanScenario) {
  await page.getByLabel("Customer segment").selectOption(scenario.customerSegment);
  await page.getByLabel("Region").selectOption(scenario.fulfillmentRegion);
  await page.getByLabel("Diet").selectOption(scenario.diet);
  await page.getByLabel("Allergens CSV").fill(scenario.allergens ?? "");
  await page.getByLabel("Preferences CSV").fill(scenario.preferences);
  await page.getByLabel("Budget max USD").fill(scenario.budgetMaxUsd);
  await page.getByLabel("Meals").fill(scenario.mealCount);
  await page.getByLabel("Failure scenario").selectOption(scenario.failureScenario);
  await page.getByRole("button", { name: "Generate meal plan" }).click();
  await page.waitForLoadState("networkidle");
}

async function expectOutcome(page: Page, scenario: MealPlanScenario) {
  if (scenario.expectedOutcome === "success") {
    await expect(
      page.getByRole("heading", { level: 2, name: "Meal plan generated" }),
    ).toBeVisible();
    await expect(page.getByText(/recipes/).first()).toBeVisible();

    if (scenario.clickRecipe) {
      const recipeLink = page.locator('a[href^="/recipes/"]').last();
      await expect(recipeLink).toBeVisible();
      await recipeLink.click();
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("link", { name: /Back to/ })).toBeVisible();
    }
    return;
  }

  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Planning could not build a valid meal plan",
    }),
  ).toBeVisible();

  if (scenario.expectedReason) {
    await expect(page.getByText(scenario.expectedReason)).toBeVisible();
  }
}

type MealPlanApiResponse = {
  plan: {
    recipes: { title: string; cost: number; calories: number }[];
  };
  diagnostics: {
    rejectedRecipeCount: number;
  };
};

const expressBaseUrl =
  process.env.EXPRESS_BASE_URL ?? "https://api.obs-playground.localhost";

function assertMealPlanApiResponse(
  value: unknown,
): asserts value is MealPlanApiResponse {
  expect(value).toMatchObject({
    plan: { recipes: expect.any(Array) },
    diagnostics: { rejectedRecipeCount: expect.any(Number) },
  });
}

async function requestMealPlan(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {},
  expectedStatus = 200,
) {
  const response = await request.post(`${expressBaseUrl}/meal-plan/generate`, {
    data: {
      customerSegment: "busy_professional",
      fulfillmentRegion: "west",
      diet: "omnivore",
      allergens: [],
      preferences: ["quick"],
      budgetMaxUsd: 100,
      servings: 4,
      mealCount: 1,
      failureScenario: "none",
      ...overrides,
    },
  });
  expect(response.status()).toBe(expectedStatus);
  const result: unknown = await response.json();
  assertMealPlanApiResponse(result);
  return result;
}

const scenarios: MealPlanScenario[] = [
  {
    name: "budget family gets a cheap omnivore plan",
    customerSegment: "budget_family",
    fulfillmentRegion: "midwest",
    diet: "omnivore",
    preferences: "quick",
    budgetMaxUsd: "35",
    mealCount: "3",
    failureScenario: "none",
    expectedOutcome: "success",
    clickRecipe: true,
  },
  {
    name: "vegetarian customer gets a normal plan outside failure region",
    customerSegment: "vegetarian",
    fulfillmentRegion: "west",
    diet: "vegetarian",
    preferences: "quick",
    budgetMaxUsd: "35",
    mealCount: "1",
    failureScenario: "none",
    expectedOutcome: "success",
    clickRecipe: true,
  },
  {
    name: "fitness-focused customer gets a higher-budget plan",
    customerSegment: "fitness_focused",
    fulfillmentRegion: "south",
    diet: "omnivore",
    preferences: "high_protein",
    budgetMaxUsd: "50",
    mealCount: "3",
    failureScenario: "none",
    expectedOutcome: "success",
    clickRecipe: true,
  },
  {
    name: "busy professional gets quick meals in northeast without failure",
    customerSegment: "busy_professional",
    fulfillmentRegion: "northeast",
    diet: "omnivore",
    preferences: "quick",
    budgetMaxUsd: "45",
    mealCount: "2",
    failureScenario: "none",
    expectedOutcome: "success",
    clickRecipe: true,
  },
  {
    name: "allergic vegetarian cannot get a valid plan",
    customerSegment: "vegetarian",
    fulfillmentRegion: "west",
    diet: "vegetarian",
    allergens: "Dairy,GLUTEN",
    preferences: "quick",
    budgetMaxUsd: "40",
    mealCount: "1",
    failureScenario: "none",
    expectedOutcome: "no_plan",
    expectedReason: /allergen_conflict/,
  },
  {
    name: "unrealistic budget causes no plan",
    customerSegment: "budget_family",
    fulfillmentRegion: "midwest",
    diet: "omnivore",
    preferences: "quick",
    budgetMaxUsd: "5",
    mealCount: "4",
    failureScenario: "none",
    expectedOutcome: "no_plan",
    expectedReason: /budget_exceeded/,
  },
  {
    name: "vegetarian customer asks for more meals than available combinations",
    customerSegment: "vegetarian",
    fulfillmentRegion: "west",
    diet: "vegetarian",
    preferences: "variety",
    budgetMaxUsd: "1000000000",
    mealCount: "1000",
    failureScenario: "none",
    expectedOutcome: "no_plan",
    expectedReason: /no_valid_recipe_combination/,
  },
  {
    name: "failure target vegetarian northeast produce shortage",
    customerSegment: "vegetarian",
    fulfillmentRegion: "northeast",
    diet: "vegetarian",
    preferences: "quick",
    budgetMaxUsd: "35",
    mealCount: "3",
    failureScenario: "vegetarian_produce_shortage_northeast",
    expectedOutcome: "no_plan",
    expectedReason: /inventory_unavailable/,
  },
  {
    name: "failure control vegetarian west unaffected",
    customerSegment: "vegetarian",
    fulfillmentRegion: "west",
    diet: "vegetarian",
    preferences: "quick",
    budgetMaxUsd: "35",
    mealCount: "1",
    failureScenario: "vegetarian_produce_shortage_northeast",
    expectedOutcome: "success",
    clickRecipe: true,
  },
  {
    name: "failure control omnivore northeast unaffected",
    customerSegment: "busy_professional",
    fulfillmentRegion: "northeast",
    diet: "omnivore",
    preferences: "quick",
    budgetMaxUsd: "45",
    mealCount: "2",
    failureScenario: "vegetarian_produce_shortage_northeast",
    expectedOutcome: "success",
    clickRecipe: true,
  },
];

test.describe("meal plan customer scenarios", () => {
  test.skip(
    process.env.PLAYWRIGHT_APP === "tanstack",
    "Constraint-based meal planning is only available in the Next.js app",
  );
  for (const scenario of scenarios) {
    test(scenario.name, async ({ page }) => {
      await openMealPlannerFromHome(page);
      await generateMealPlan(page, scenario);
      await expectOutcome(page, scenario);
    });
  }
});

test.describe("meal plan API calculations", () => {
  test("scales recipe cost and calories to requested servings", async ({
    request,
  }) => {
    const fourServingPlan = await requestMealPlan(
      request,
      {
        allergens: ["egg"],
        budgetMaxUsd: 1000000000,
        mealCount: 1000,
        servings: 4,
      },
      422,
    );
    const eightServingPlan = await requestMealPlan(
      request,
      {
        allergens: ["egg"],
        budgetMaxUsd: 1000000000,
        mealCount: 1000,
        servings: 8,
      },
      422,
    );
    const fourServingRecipe = fourServingPlan.plan.recipes.find(
      (recipe) => recipe.title === "Garlic Butter Chicken",
    );
    const eightServingRecipe = eightServingPlan.plan.recipes.find(
      (recipe) => recipe.title === "Garlic Butter Chicken",
    );

    expect(fourServingRecipe).toBeDefined();
    expect(eightServingRecipe).toBeDefined();
    if (!fourServingRecipe || !eightServingRecipe) {
      throw new Error("Expected Garlic Butter Chicken in both meal plans");
    }
    expect(eightServingRecipe.title).toBe(fourServingRecipe.title);
    expect(eightServingRecipe.cost).toBeCloseTo(fourServingRecipe.cost * 2);
    expect(eightServingRecipe.calories).toBeCloseTo(
      fourServingRecipe.calories * 2,
    );
  });

  test("does not count unused viable recipes as rejected", async ({ request }) => {
    const result = await requestMealPlan(request);

    expect(result.diagnostics.rejectedRecipeCount).toBe(0);
  });
});
