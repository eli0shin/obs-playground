import { Query } from "./queries.js";
import { Mutation } from "./mutations.js";
import { Recipe } from "./fields.js";
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
  Recipe,
};
