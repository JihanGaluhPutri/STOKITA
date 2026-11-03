import { expect, type Page } from "@playwright/test";

import { akunUji } from "./env";

/** Format rupiah yang sama dengan aplikasi (src/lib/business/format.ts). */
export function rp(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Login lewat UI — menguji alur login yang sesungguhnya. */
export async function loginSebagai(page: Page, role: "admin" | "kasir"): Promise<void> {
  const akun = akunUji(role);
  await page.goto("/login");
  await page.locator("#username").fill(akun.username);
  await page.locator("#password").fill(akun.password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL((url) => url.pathname === `/${role}`);
}

/** Baris tabel daftar barang yang berisi kode tertentu. */
export function barisBarang(page: Page, kode: string) {
  return page.getByRole("row").filter({ hasText: kode });
}

/** Banner sukses (role=status) yang berisi teks tertentu. */
export function bannerSukses(page: Page, teks: string) {
  return page.getByRole("status").filter({ hasText: teks });
}

/** Dialog konfirmasi yang sedang terbuka. */
export function dialogKonfirmasi(page: Page) {
  return page.getByRole("dialog");
}

/**
 * Menormalkan teks rupiah agar bebas dari spasi (NBSP U+00A0 yang dipakai
 * Intl `id-ID` antara "Rp" dan angka) — memudahkan pembandingan asersi.
 */
export function normRupiah(teks: string): string {
  return teks.replace(/[\s\u00a0\u202f]+/g, "");
}

/** Menunggu URL pathname menjadi path tertentu dengan pesan yang jelas. */
export async function tungguPathname(page: Page, path: string): Promise<void> {
  await expect
    .poll(() => new URL(page.url()).pathname, {
      timeout: 20_000,
      message: `pathname diharapkan "${path}", tetapi halaman berada di "${page.url()}"`,
    })
    .toBe(path);
}
