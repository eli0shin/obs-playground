import forAi from "eslint-for-ai";

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
    ignores: ["**/dist/**", "**/node_modules/**", "**/.next/**"],
  },
];
