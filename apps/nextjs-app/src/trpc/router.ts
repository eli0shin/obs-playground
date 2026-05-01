import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { tracing } from "@obs-playground/trpc-otel";
import { graphqlRequest } from "@obs-playground/graphql-client";
import {
  DeleteRecipeDocument,
  HomeRecipesAndCategoriesDocument,
} from "@obs-playground/graphql-client/documents";

const t = initTRPC.create();

const publicProcedure = t.procedure.use(tracing({ collectInput: true }));

export const appRouter = t.router({
  home: t.router({
    recipesAndCategories: publicProcedure.query(() => {
      return graphqlRequest(HomeRecipesAndCategoriesDocument);
    }),
  }),
  recipe: t.router({
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { deleteRecipe: success } = await graphqlRequest(
          DeleteRecipeDocument,
          { id: input.id },
        );

        if (!success) {
          throw new Error("Failed to delete recipe");
        }

        return { success };
      }),
  }),
  errors: t.router({
    internal: publicProcedure.mutation(() => {
      const error = new Error("Something went wrong in the trpc mutation");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Intentional 500 from tRPC procedure",
        cause: error,
      });
    }),
    badRequest: publicProcedure.mutation(() => {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Intentional 400 from tRPC procedure",
      });
    }),
    notFound: publicProcedure.mutation(() => {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Intentional 404 from tRPC procedure",
      });
    }),
  }),
});

export type AppRouter = typeof appRouter;
