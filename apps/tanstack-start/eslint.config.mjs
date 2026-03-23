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
    ignores: [".output/**", "node_modules/**", "src/routeTree.gen.ts"],
  },
];
