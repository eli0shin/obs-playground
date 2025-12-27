import forAi from "eslint-for-ai";

export default [
  ...forAi.configs.recommended,
  {
    files: ["**/otel.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
