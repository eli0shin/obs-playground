import type { Resolvers } from "../generated/resolvers-types.js";
import { Query } from "./queries.js";
import { Mutation } from "./mutations.js";
import { ErrorQuery, ErrorMutation } from "./errors.js";

export const resolvers = {
  Query: {
    ...Query,
    ...ErrorQuery,
  },
  Mutation: {
    ...Mutation,
    ...ErrorMutation,
  },
} satisfies Resolvers;
