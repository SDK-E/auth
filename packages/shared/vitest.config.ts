import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/**/*.test.ts", "src/constants.ts"],
      thresholds: {
        lines: 90,
        functions: 85,
        branches: 80,
        statements: 90,
      },
    },
  },
});
