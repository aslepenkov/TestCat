import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8", // or 'istanbul'
      reporter: ["text", "json", "html"],
      include: ["src/agent-service/agent/**", "src/backend-service/**"],
    },
  },
});
