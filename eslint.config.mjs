import forAi from "eslint-for-ai";
import graphqlPlugin from "@graphql-eslint/eslint-plugin";

const graphqlDocuments = [
  "packages/graphql-client/src/operations/**/*.graphql",
];
const graphqlSchema = "./apps/graphql-server/src/schema/schema.graphql";

export default [
  ...forAi.configs.recommended,
  {
    files: ["**/otel.ts", "**/server.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // GraphQL client uses generics which require type assertions for the return type
    files: ["packages/graphql-client/src/**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
  {
    files: graphqlDocuments,
    languageOptions: {
      parser: graphqlPlugin.parser,
      parserOptions: {
        graphQLConfig: {
          schema: graphqlSchema,
          documents: graphqlDocuments,
        },
      },
    },
    plugins: {
      "@graphql-eslint": graphqlPlugin,
    },
    rules: {
      ...graphqlPlugin.configs["flat/operations-recommended"].rules,
      "@graphql-eslint/naming-convention": "off",
      "@graphql-eslint/no-unused-variables": "error",
    },
  },
  {
    files: ["packages/graphql-client/src/operations/testing-invalid.graphql"],
    rules: {
      "@graphql-eslint/no-unused-variables": "off",
    },
  },
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "apps/graphql-server/src/generated/**",
      "packages/graphql-client/src/generated/**",
    ],
  },
];
