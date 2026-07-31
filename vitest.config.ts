import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    alias: {
      "@james-andsons/interfaces": path.resolve(
        __dirname,
        "./packages/interfaces/src",
      ),
      "@james-andsons/media": path.resolve(__dirname, "./packages/media/src"),
      "@james-andsons/razorpay": path.resolve(
        __dirname,
        "./packages/razorpay/src",
      ),
      "@james-andsons/shiprocket": path.resolve(
        __dirname,
        "./packages/shiprocket/src",
      ),
      "@james-andsons/config": path.resolve(__dirname, "./packages/config/src"),
      "@james-andsons/db": path.resolve(__dirname, "./packages/db/src"),
      "@james-andsons/zoho": path.resolve(__dirname, "./packages/zoho/src"),
    },
  },
});
