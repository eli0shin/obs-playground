import graphqlPlugin from "@graphql-eslint/eslint-plugin";
import rootConfig from "../../eslint.config.mjs";

export default [
  ...rootConfig,
  {
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
  {
    files: ["src/operations/**/*.graphql"],
    languageOptions: {
      parser: graphqlPlugin.parser,
      parserOptions: {
        graphQLConfig: {
          schema: "../../apps/graphql-server/src/schema/schema.graphql",
          documents: ["src/operations/**/*.graphql"],
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
    files: ["src/operations/testing-invalid.graphql"],
    rules: {
      "@graphql-eslint/no-unused-variables": "off",
    },
  },
  {
    ignores: ["src/generated/**"],
  },
];
