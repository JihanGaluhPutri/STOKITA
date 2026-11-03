import { expect, type Page } from "@playwright/test";

import { Given, Then, When } from "../fixtures";
import { siapkanBarang } from "../support/api";
import { barisBarang, bannerSukses, dialogKonfirmasi } from "../support/ui";

Given(
  "ada barang berkode {string} bernama {string} dengan harga jual {int} stok {int} stok minimum {int}",
  async (
    { skenario },
    kode: string,
    nama: string,
    hargaJual: number,
    stok: number,
    stokMin: number,
  ) => {
    await siapkanBarang({ kode, nama, hargaJual, stok, stokMin });
    skenario.kode = kode;
    skenario.nama = nama;
  },
);

async function kembaliKeDaftarBarang(page: Page): Promise<void> {
  await page.waitForURL((url) => url.pathname === "/admin/barang");
}

When(
  "saya tambah barang berkode {string} bernama {string} dengan harga beli {int} harga jual {int} stok awal {int} stok minimum {int}",
  async (
    { page, skenario },
    kode: string,
    nama: string,
    hargaBeli: number,
    hargaJual: number,
    stokAwal: number,
    stokMin: number,
  ) => {
    skenario.kode = kode;
    skenario.nama = nama;
    await page.goto("/admin/barang/tambah");
    await page.locator("#kode").fill(kode);
    await page.locator("#nama").fill(nama);
    await page.locator("#hargaBeli").fill(String(hargaBeli));
    await page.locator("#hargaJual").fill(String(hargaJual));
    await page.locator("#stokAwal").fill(String(stokAwal));
    await page.locator("#stokMin").fill(String(stokMin));
    await page.getByRole("button", { name: "Simpan barang" }).click();
    await dialogKonfirmasi(page)
      .getByRole("button", { name: "Simpan barang" })
      .click();
    // Berhasil = redirect ke daftar; gagal (mis. kode duplikat) = tetap di
    // formulir dengan pesan error. Keduanya diselesaikan di langkah Then.
    await Promise.race([
      page.waitForURL((url) => url.pathname === "/admin/barang", {
        timeout: 20_000,
      }),
      page.getByText("sudah digunakan").first().waitFor({ timeout: 20_000 }),
    ]);
  },
);

When(
  "saya ubah nama barang berkode {string} menjadi {string} dengan harga jual {int}",
  async ({ page }, kode: string, nama: string, hargaJual: number) => {
    await page.goto("/admin/barang");
    await barisBarang(page, kode).getByRole("link", { name: "Edit" }).click();
    await page.locator("#nama").fill(nama);
    await page.locator("#hargaJual").fill(String(hargaJual));
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await dialogKonfirmasi(page)
      .getByRole("button", { name: "Simpan perubahan" })
      .click();
    await kembaliKeDaftarBarang(page);
  },
);

When("saya nonaktifkan barang berkode {string}", async ({ page }, kode: string) => {
  await page.goto("/admin/barang");
  await barisBarang(page, kode)
    .getByRole("button", { name: "Nonaktifkan" })
    .click();
  await dialogKonfirmasi(page)
    .getByRole("button", { name: "Nonaktifkan" })
    .click();
  await kembaliKeDaftarBarang(page);
});

When("saya hapus barang berkode {string}", async ({ page }, kode: string) => {
  await page.goto("/admin/barang");
  // Label tombol di baris tabel adalah "Hapus"; "Hapus barang" hanya untuk
  // tombol konfirmasi di dalam dialog.
  await barisBarang(page, kode)
    .getByRole("button", { name: "Hapus", exact: true })
    .click();
  await dialogKonfirmasi(page)
    .getByRole("button", { name: "Hapus barang" })
    .click();
  await kembaliKeDaftarBarang(page);
});

Then("banner sukses menampilkan {string}", async ({ page }, teks: string) => {
  await expect(bannerSukses(page, teks)).toBeVisible();
});

Then(
  "barang berkode {string} muncul di daftar dengan stok {int}",
  async ({ page }, kode: string, stok: number) => {
    const row = barisBarang(page, kode).first();
    await expect(row).toBeVisible();
    await expect(row.getByText(String(stok), { exact: true }).first()).toBeVisible();
  },
);

Then(
  "barang berkode {string} menampilkan status {string}",
  async ({ page }, kode: string, status: string) => {
    await expect(
      barisBarang(page, kode).first().getByText(status, { exact: true }),
    ).toBeVisible();
  },
);

Then("barang berkode {string} tidak lagi ada di daftar", async ({
  page,
}, kode: string) => {
  await expect(barisBarang(page, kode)).toHaveCount(0);
});
