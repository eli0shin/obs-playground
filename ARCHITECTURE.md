# Recipe & Meal Planning Platform - Architecture

## Overview
OpenTelemetry playground demonstrating various service call patterns and telemetry scenarios through a recipe and meal planning application.

## Service Architecture

### GraphQL Server (Port 4000)
**Domain**: Recipe catalog + orchestrates data from Express when needed

#### Schema Entities
- **Recipe**: `id, title, description, prepTime, cookTime, difficulty, servings`
- **Ingredient**: `id, name, category, unit`
- **RecipeIngredient**: `recipeId, ingredientId, quantity`
- **Category**: `id, name`
- **RecipeWithCost**: Extends Recipe with `totalCost, ingredientCosts` (calls Express)
- **RecipeWithNutrition**: Extends Recipe with `calories, protein, fat, carbs` (calls Express)

#### Queries
- `recipe(id)` - Simple recipe lookup
- `recipeWithCost(id)` - **GraphQL → Express** (gets pricing data)
- `recipeWithNutrition(id)` - **GraphQL → Express** (gets nutrition data)
- `recipes(filter)` - Browse/filter recipes
- `searchRecipes(query)` - Full-text search
- `categories` - List all categories

#### Mutations
- `createRecipe(input)` - Add new recipe
- `updateRecipe(id, input)` - Update existing recipe
- `deleteRecipe(id)` - Remove recipe

---

### Express API (Port 3001)
**Domain**: Pricing, nutrition, inventory, shopping list generation

#### Simple Data Endpoints (Express only)
- `GET /ingredients/:id/price` - Get ingredient price per unit
- `GET /ingredients/prices` - Get all ingredient prices (batch)
- `POST /ingredients/prices` - Update ingredient prices
- `GET /nutrition/ingredient/:id` - Get nutrition data per 100g
- `GET /inventory/stock/:ingredientId` - Check ingredient stock levels

#### Orchestration Endpoints (Express → GraphQL)
- `POST /shopping-list/generate` - **Express → GraphQL**
  - Body: `{ recipeIds: [1, 2, 3], servings: { "1": 4, "2": 2 } }`
  - Gets recipe ingredients from GraphQL, adds pricing and stock info

- `GET /meal-plan/estimate` - **Express → GraphQL**
  - Query: `?recipeIds=1,2,3,4,5,6,7`
  - Gets recipes from GraphQL, calculates weekly meal cost

- `POST /batch/nutrition` - **Express → GraphQL**
  - Body: `{ recipeIds: [1, 2, 3] }`
  - Gets recipes from GraphQL, enriches with nutrition data

---

### Next.js App (Port 3000)
**Domain**: UI, orchestration, server-side rendering

#### Pages by Call Chain Pattern

**Single Service (Next → GraphQL)**:
- `/` - Home with recipe browse
- `/recipes/[id]` - Basic recipe detail
- `/categories/[slug]` - Recipes in category

**Next → GraphQL → Express**:
- `/recipes/[id]/with-cost` - Recipe with per-ingredient pricing
- `/recipes/[id]/nutrition` - Recipe with nutrition breakdown
- `/recipes/compare?ids=1,2,3` - Compare multiple recipes with costs

**Next → Express → GraphQL**:
- `/shopping-list` - Generate aggregated shopping list from selected recipes
- `/meal-planner` - Plan weekly meals with cost estimation
- `/batch-nutrition` - Nutritional analysis across multiple recipes

**Complex (Parallel Fetches)**:
- `/recipes/[id]/full` - Complete recipe view with parallel calls to GraphQL and Express

---

## Call Chain Examples

### Flow 1: Next → GraphQL → Express
```
User visits /recipes/123/with-cost
→ Next.js SSR calls GraphQL query { recipeWithCost(id: 123) }
  → GraphQL resolver fetches recipe from DB
  → GraphQL resolver calls Express GET /ingredients/prices?ids=1,2,3
    → Express returns pricing data
  → GraphQL merges recipe + pricing
→ Next.js renders page with costs
```

### Flow 2: Next → Express → GraphQL
```
User submits /shopping-list form with recipeIds: [1, 2, 3]
→ Next.js calls Express POST /shopping-list/generate
  → Express calls GraphQL query { recipes(ids: [1,2,3]) { ingredients } }
    → GraphQL returns all recipe ingredients
  → Express aggregates quantities
  → Express adds pricing and stock data
  → Express returns formatted shopping list
→ Next.js displays shopping list
```

### Flow 3: Complex Chain (Next → Express → GraphQL → Express)
```
User visits /batch-nutrition with recipeIds: [1, 2, 3]
→ Next.js calls Express POST /batch/nutrition
  → Express calls GraphQL query { recipes(ids: [1,2,3]) { ingredients } }
    → GraphQL returns recipes
  → For each ingredient, Express calls GET /nutrition/ingredient/:id
  → Express aggregates nutrition per recipe
  → Express returns enriched data
→ Next.js renders nutrition comparison
```

---

## Telemetry Scenarios

This architecture demonstrates:

1. **Service-to-service tracing**: GraphQL → Express and Express → GraphQL calls
2. **Distributed context propagation**: Trace IDs flowing through all services
3. **N+1 query detection**: Resolver calling Express per ingredient vs batching
4. **Orchestration patterns**: Client-side vs server-side orchestration
5. **Error propagation**: Service failures cascading through call chains
6. **Performance analysis**: Sequential chains vs parallel fetches
7. **Service dependencies**: Visualize which services depend on which
8. **Latency impact**: How downstream service latency affects upstream response times

---

## Technology Stack

- **Next.js**: React framework with SSR
- **Apollo Server**: GraphQL server
- **Express**: REST API server
- **OpenTelemetry**: Distributed tracing and observability
- **In-memory stores**: No database required for playground

---

## Development Commands

```bash
# Start all services
npm run dev:all

# Start individual services
npm run dev:next    # Port 3000
npm run dev:express # Port 3001
npm run dev:graphql # Port 4000
```
