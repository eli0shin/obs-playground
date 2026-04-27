import { logger } from "./otel";
import express from "express";
import cors from "cors";
import { runMigrations } from "./db/migrate";
import { seedIfEmpty } from "./db/seed";
import { errorHandler } from "./error-middleware";
import { requestLogger } from "./request-logger";
import { responseInstrumentation } from "./response-instrumentation";
import healthRoutes from "./routes/health";
import pricingRoutes from "./routes/pricing";
import nutritionRoutes from "./routes/nutrition";
import inventoryRoutes from "./routes/inventory";
import shoppingListRoutes from "./routes/shopping-list";
import mealPlanRoutes from "./routes/meal-plan";
import batchNutritionRoutes from "./routes/batch-nutrition";
import recipesRoutes from "./routes/recipes";
import errorRoutes from "./routes/error";
import slowRoutes from "./routes/slow";

try {
  runMigrations();
  seedIfEmpty();
} catch (err) {
  logger.error("Migration failed", { err });
  process.exit(1);
}

const app = express();
const PORT = +(process.env.PORT ?? 3001);
const HOST = "0.0.0.0";

app.use(
  cors({
    allowedHeaders: [
      "Content-Type",
      "baggage",
      "traceparent",
      "tracestate",
      "x-datadog-trace-id",
      "x-datadog-parent-id",
      "x-datadog-origin",
      "x-datadog-sampling-priority",
      "x-datadog-tags",
    ],
  }),
);
app.use(express.json());
app.use(requestLogger);
app.use(responseInstrumentation);

// Register routes
app.use(healthRoutes);
app.use(pricingRoutes);
app.use(nutritionRoutes);
app.use(inventoryRoutes);
app.use(shoppingListRoutes);
app.use(mealPlanRoutes);
app.use(batchNutritionRoutes);
app.use(recipesRoutes);
app.use(errorRoutes);
app.use(slowRoutes);

// Error handling middleware - must be last
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  logger.info("Express server listening", { port: PORT });
});
