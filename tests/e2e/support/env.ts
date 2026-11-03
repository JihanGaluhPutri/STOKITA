import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Memuat variabel dari .env.local (bila ada) tanpa menimpa env yang sudah
 * tersedia di shell. Dipanggil dari playwright.config.ts sebelum test berjalan.
 */
export function loadTestEnv(): void {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;

  const content = readFileSync(file, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variabel env "${name}" tidak ditemukan. Salin .env.example menjadi .env.local lalu isi nilainya.`,
    );
  }
  return value;
}

export type AkunUji = { username: string; password: string };

/**
 * Akun uji dibaca dari environment — password tidak pernah ditulis di file
 * feature maupun step definition (dokumen BDD aman dibagikan).
 */
export function akunUji(role: "admin" | "kasir"): AkunUji {
  if (role === "admin") {
    return {
      username: process.env.E2E_ADMIN_USERNAME ?? "admin",
      password: requireEnv("STOKITA_ADMIN_PASSWORD"),
    };
  }
  return {
    username: process.env.E2E_KASIR_USERNAME ?? "kasir1",
    password: requireEnv("STOKITA_KASIR1_PASSWORD"),
  };
}
