import { logger } from "./otel";
import express from "express";
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
import errorRoutes from "./routes/error";
import slowRoutes from "./routes/slow";

const app = express();
const PORT = +(process.env.PORT ?? 3001);
const HOST = "0.0.0.0";

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
app.use(errorRoutes);
app.use(slowRoutes);

// Error handling middleware - must be last
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  logger.info("Express server listening", { port: PORT });
});
