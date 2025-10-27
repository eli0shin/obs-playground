import "./otel.js";
import express from "express";
import { errorHandler } from "./error-middleware.js";
import healthRoutes from "./routes/health.js";
import pricingRoutes from "./routes/pricing.js";
import nutritionRoutes from "./routes/nutrition.js";
import inventoryRoutes from "./routes/inventory.js";
import shoppingListRoutes from "./routes/shopping-list.js";
import mealPlanRoutes from "./routes/meal-plan.js";
import batchNutritionRoutes from "./routes/batch-nutrition.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

// Register routes
app.use(healthRoutes);
app.use(pricingRoutes);
app.use(nutritionRoutes);
app.use(inventoryRoutes);
app.use(shoppingListRoutes);
app.use(mealPlanRoutes);
app.use(batchNutritionRoutes);

// Error handling middleware - must be last
app.use(errorHandler);

app.listen(PORT);
