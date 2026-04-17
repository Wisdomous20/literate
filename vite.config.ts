  import { defineConfig } from "vitest/config";
  import react from "@vitejs/plugin-react";
  import tsconfigPaths from "vite-tsconfig-paths";

  export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["node_modules", ".next", "src/generated/**"],
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "lcov"],
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/**/*.{test,spec}.{ts,tsx}",
          "src/generated/**",
          "src/app/**/layout.tsx",
          "src/app/**/page.tsx",
        ],
      },
    },
  });