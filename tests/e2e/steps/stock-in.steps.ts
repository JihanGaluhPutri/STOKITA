import { expect } from "@playwright/test";

import { Then, When } from "../fixtures";
import { apiAdmin } from "../support/api";
import { barisBarang, dialogKonfirmasi } from "../support/ui";

When(
  "saya catat barang masuk {int} unit untuk barang berkode {string}",
  async ({ page }, qty: number, kode: string) => {
    const supabase = apiAdmin();
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("kode", kode)
      .single();
    if (!product) throw new Error(`Barang ${kode} tidak ditemukan untuk uji.`);

    await page.goto("/admin/barang-masuk");
    await page.locator("#productId").selectOption(product.id as string);
    await page.locator("#qty").fill(String(qty));
    await page.locator("#referensi").fill(`Uji BDD ${kode}`);
    await page.getByRole("button", { name: "Catat barang masuk" }).click();
    await dialogKonfirmasi(page)
      .getByRole("button", { name: "Catat barang masuk" })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "Barang masuk tercatat" }),
    ).toBeVisible();
  },
);

When("saya buka riwayat barang masuk", async ({ page }) => {
  await page.goto("/admin/barang-masuk/riwayat");
});

Then(
  "riwayat barang masuk memuat barang berkode {string} sejumlah {int}",
  async ({ page }, kode: string, qty: number) => {
    const row = page.getByRole("row").filter({ hasText: kode }).first();
    await expect(row).toBeVisible();
    await expect(row.getByText(String(qty), { exact: true })).toBeVisible();
  },
);

Then(
  "barang berkode {string} terdaftar di monitoring stok",
  async ({ page }, kode: string) => {
    await expect(barisBarang(page, kode)).toBeVisible();
  },
);

Then(
  "barang berkode {string} tidak terdaftar di monitoring stok",
  async ({ page }, kode: string) => {
    await expect(barisBarang(page, kode)).toHaveCount(0);
  },
);
