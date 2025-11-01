import { GraphQLError } from "graphql";
import { trace } from "@opentelemetry/api";

export const ErrorQuery = {
  errorQuery: () => {
    throw new Error("Regular error thrown from a resolver", {
      cause: new Error("Just testing"),
    });
  },

  slowQuery: async (_: unknown, { delayMs = 10000 }: { delayMs?: number }) => {
    const activeSpan = trace.getActiveSpan();

    activeSpan?.setAttributes({
      "slow.intentional": true,
      "slow.type": "slow_query",
      "slow.query": "slowQuery",
      "slow.delay_ms": delayMs,
    });

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    activeSpan?.setAttributes({
      "slow.completed": true,
    });

    return `Query completed after ${delayMs}ms delay`;
  },

  notFoundRecipe: () => {
    const activeSpan = trace.getActiveSpan();

    activeSpan?.setAttributes({
      "error.intentional": true,
      "error.type": "not_found",
      "error.query": "notFoundRecipe",
      "recipe.found": false,
    });

    return null;
  },
};

export const ErrorMutation = {
  errorMutation: () => {
    throw new GraphQLError("Intentional test error from mutation", {
      extensions: {
        code: "MUTATION_ERROR",
        intentional: true,
      },
      originalError: new Error("Its just a test"),
    });
  },

  validationErrorMutation: () => {
    throw new GraphQLError("Validation failed", {
      extensions: {
        code: "BAD_USER_INPUT",
        intentional: true,
        validationErrors: [
          {
            field: "recipe.title",
            message: "Title must be at least 10 characters",
          },
          {
            field: "recipe.prepTime",
            message: "Prep time must be positive",
          },
          {
            field: "ingredients",
            message: "At least 2 ingredients required",
          },
        ],
      },
    });
  },
};
