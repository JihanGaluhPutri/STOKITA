import { expect } from "@playwright/test";

import { Then, When } from "../fixtures";
import { normRupiah } from "../support/ui";

When("saya membuka halaman penjualan", async ({ page }) => {
  await page.goto("/kasir/penjualan");
});

When(
  "saya cari barang {string} lalu tambahkan ke keranjang",
  async ({ page }, kode: string) => {
    await page.locator("#cari-barang").fill(kode);
    const item = page.locator(".pos-item").filter({ hasText: kode }).first();
    await item.getByRole("button", { name: "Tambah" }).click();
  },
);

When(
  "saya atur qty menjadi {int} untuk barang {string}",
  async ({ page }, qty: number, nama: string) => {
    await page.locator(`input[aria-label="Qty ${nama}"]`).fill(String(qty));
  },
);

When("saya pilih metode pembayaran {string}", async ({ page }, metode: string) => {
  await page.locator("#metodeBayar").selectOption(metode);
});

When("saya isi uang dibayar {int}", async ({ page }, bayar: number) => {
  await page.locator("#bayar").fill(String(bayar));
});

When("saya selesaikan pembayaran", async ({ page }) => {
  await page.getByRole("button", { name: "Bayar & selesaikan" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Bayar & selesaikan" })
    .click();
});

Then("total keranjang menampilkan {string}", async ({ page }, total: string) => {
  const actual = (await page.locator(".cart-total-value").textContent()) ?? "";
  expect(normRupiah(actual)).toBe(normRupiah(total));
});

Then(
  "saya melihat perkiraan kembalian {string}",
  async ({ page }, kembalian: string) => {
    const label = page.getByText("Kembalian:", { exact: false }).first();
    const actual = (await label.textContent()) ?? "";
    expect(normRupiah(actual)).toContain(normRupiah(kembalian));
  },
);

Then(
  "struk transaksi ditampilkan dengan total {string} dan kembalian {string}",
  async ({ page, skenario }, total: string, kembalian: string) => {
    const struk = page.getByTestId("struk");
    await expect(struk).toBeVisible();
    const rows = struk.locator(".receipt-row");
    const barisTotal = await rows.filter({ hasText: "Total" }).first().textContent();
    const barisKembalian = await rows
      .filter({ hasText: "Kembalian" })
      .first()
      .textContent();
    expect(normRupiah(barisTotal ?? "")).toContain(normRupiah(total));
    expect(normRupiah(barisKembalian ?? "")).toContain(normRupiah(kembalian));

    const noTransaksi = (await struk.locator(".receipt-no").textContent())?.trim();
    expect(noTransaksi).toMatch(/^TRX-/);
    skenario.noTransaksi = noTransaksi;
  },
);

Then("server menolak pembayaran dengan pesan {string}", async ({
  page,
}, teks: string) => {
  await expect(page.locator("p.error").filter({ hasText: teks })).toBeVisible();
});

When("saya buka riwayat penjualan", async ({ page }) => {
  await page.goto("/kasir/penjualan/riwayat");
});

Then(
  "riwayat penjualan memuat transaksi dengan total {string}",
  async ({ page, skenario }, total: string) => {
    expect(skenario.noTransaksi).toBeTruthy();
    const row = page
      .getByRole("row")
      .filter({ hasText: skenario.noTransaksi as string })
      .first();
    await expect(row).toBeVisible();
    const isi = (await row.textContent()) ?? "";
    expect(normRupiah(isi)).toContain(normRupiah(total));
  },
);

Then(
  "struk menampilkan rincian barang {string} sebanyak {int}",
  async ({ page, skenario }, nama: string, qty: number) => {
    const struk = page.getByTestId("struk");
    const itemRow = struk.locator("tbody tr").filter({ hasText: nama }).first();
    await expect(itemRow).toBeVisible();
    // Kolom: barang | qty | harga | subtotal — qty dipastikan tepat.
    await expect(itemRow.locator("td").nth(1)).toHaveText(String(qty));
    expect(skenario.noTransaksi).toBeTruthy();
  },
);
