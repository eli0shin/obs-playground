import { GraphQLError } from "graphql";

export const ErrorQuery = {
  errorQuery: () => {
    throw new Error("Regular error thrown from a resolver", {
      cause: new Error("Just testing"),
    });
  },

  slowQuery: async (_: unknown, { delayMs = 10000 }: { delayMs?: number }) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return `Query completed after ${delayMs}ms delay`;
  },

  notFoundRecipe: () => {
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
