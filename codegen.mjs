/** @type {import('@graphql-codegen/cli').CodegenConfig} */
const config = {
  schema: "./apps/graphql-server/src/schema/schema.graphql",
  documents: ["./packages/graphql-client/src/operations/**/*.graphql"],
  skipDocumentsValidation: {
    ignoreRules: ["NoUnusedVariables"],
  },
  generates: {
    "./apps/graphql-server/src/generated/resolvers-types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useTypeImports: true,
        useIndexSignature: true,
        importExtension: ".js",
        mapperTypeSuffix: "Model",
        mappers: {
          Recipe: "../types/index.js#Recipe",
          Ingredient: "../types/index.js#Ingredient",
          Category: "../types/index.js#Category",
        },
      },
    },
    "./packages/graphql-client/src/generated/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
      config: {
        useTypeImports: true,
        skipTypename: true,
      },
    },
  },
};

export default config;
