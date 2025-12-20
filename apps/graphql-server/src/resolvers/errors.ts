import { GraphQLError } from "graphql";
import { getOperationSpan } from "../utils/otel.js";

export const ErrorQuery = {
  errorQuery: async () => {
    const operationSpan = getOperationSpan();

    operationSpan?.setAttributes({
      "resolver.error_query.executed": true,
      "resolver.error_query.error_type": "intentional_test_error",
    });

    throw new Error("Regular error thrown from a resolver", {
      cause: new Error("Just testing"),
    });
  },

  secondErrorQuery: async () => {
    const operationSpan = getOperationSpan();

    operationSpan?.setAttributes({
      "resolver.second_error_query.executed": true,
      "resolver.second_error_query.error_type": "graphql_error",
      "resolver.second_error_query.error_code": "QUERY_ERROR",
    });

    throw new GraphQLError("GraphQL error thrown from a resolver", {
      extensions: {
        code: "QUERY_ERROR",
        intentional: true,
      },
    });
  },

  slowQuery: async (_: unknown, { delayMs = 10000 }: { delayMs?: number }) => {
    const operationSpan = getOperationSpan();

    operationSpan?.setAttributes({
      "resolver.slow_query.delay_ms": delayMs,
      "resolver.slow_query.delay_category":
        delayMs < 1000 ? "fast" : delayMs < 5000 ? "medium" : "slow",
    });

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return `Query completed after ${delayMs}ms delay`;
  },

  notFoundRecipe: () => {
    return null;
  },
};

export const ErrorMutation = {
  errorMutation: () => {
    const operationSpan = getOperationSpan();

    operationSpan?.setAttributes({
      "resolver.error_mutation.executed": true,
      "resolver.error_mutation.error_type": "graphql_error",
      "resolver.error_mutation.error_code": "MUTATION_ERROR",
    });

    throw new GraphQLError("Intentional test error from mutation", {
      extensions: {
        code: "MUTATION_ERROR",
        intentional: true,
      },
      originalError: new Error("Its just a test"),
    });
  },

  validationErrorMutation: () => {
    const operationSpan = getOperationSpan();

    const validationErrors = [
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
    ];

    operationSpan?.setAttributes({
      "resolver.validation_error_mutation.executed": true,
      "resolver.validation_error_mutation.error_type": "validation_error",
      "resolver.validation_error_mutation.error_code": "BAD_USER_INPUT",
      "resolver.validation_error_mutation.error_count": validationErrors.length,
    });

    throw new GraphQLError("Validation failed", {
      extensions: {
        code: "BAD_USER_INPUT",
        intentional: true,
        validationErrors,
      },
    });
  },
};
