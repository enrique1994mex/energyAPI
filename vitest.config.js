import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ['./test/helpers/setup.js'],
    coverage: {
      provider: "v8",
      reporter: ["html", "text"],
      include: ["src/**/*.js"],
      exclude: ["src/**/*.test.js"],
    },
  },
});