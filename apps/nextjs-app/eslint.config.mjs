import forAi from "eslint-for-ai";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  ...forAi.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    files: ["**/otel.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Custom server bridges Express and Next.js request handlers with different type signatures
    files: ["server.ts"],
    rules: {
      "no-console": "off",
      "for-ai/no-bare-wrapper": "off",
    },
  },
  {
    // Next.js instrumentation hook requires dynamic imports
    files: ["**/instrumentation.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    // Meal planner displays repeated recipes across days - index is the only unique identifier
    files: ["**/meal-planner/page.tsx"],
    rules: {
      "react/no-array-index-key": "off",
      "@eslint-react/no-array-index-key": "off",
    },
  },
  {
    ignores: [".next/**", ".next-custom/**", "out/**", "build/**"],
  },
];
