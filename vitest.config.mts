import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Package "server-only" sengaja melempar error di luar React Server
      // Components; unit test menggantinya dengan stub kosong.
      "server-only": fileURLToPath(
        new URL("./src/test-utils/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Catatan: test komponen React (.tsx) men-set environment sendiri lewat
    // docblock `@vitest-environment jsdom` di baris pertama filenya.
    setupFiles: ["./src/test-utils/setup.ts"],
    coverage: {
      provider: "v8",
      // laporan untuk SonarQube (lcov) + ringkasan teks untuk manusia
      reporter: ["text", "lcov", "json-summary"],
      // Hitung SELURUH source (bukan hanya file yang punya test) agar angka
      // coverage jujur dan bisa dipakai Quality Gate SonarQube (>= 80%).
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test-utils/**",
        "**/*.d.ts",
      ],
    },
  },
});
