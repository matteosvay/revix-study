import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // 'node' par défaut : nos tests sont purement logiques (date, sm2, gamification…).
    // Les tests qui ont besoin du DOM peuvent activer jsdom via l'annotation
    // `// @vitest-environment jsdom` en tête de fichier.
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
