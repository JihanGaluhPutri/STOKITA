// Setup global untuk unit test — matcher tambahan dari testing-library.
import "@testing-library/jest-dom/vitest";

// Vitest berjalan tanpa `globals: true`, sehingga auto-cleanup bawaan
// @testing-library/react tidak terdaftar sendiri — daftarkan di sini.
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
