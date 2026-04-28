import { createLogger } from "@obs-playground/otel";

export const logger = createLogger(
  process.env.CUSTOM_SERVER ? "nextjs-custom-server" : "nextjs-app",
);
