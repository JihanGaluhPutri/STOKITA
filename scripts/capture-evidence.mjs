#!/usr/bin/env node
/**
 * scripts/capture-evidence.mjs — menghasilkan lampiran GAMBAR (screenshot)
 * untuk dokumentasi BDD Stokita.
 *
 * Prasyarat:
 *   1. Dev server berjalan:  npm run dev   (http://localhost:3000)
 *   2. .env.local terisi (Supabase + akun uji)
 *   3. Browser terpasang:    npx playwright install chromium
 *
 * Pemakaian:  node scripts/capture-evidence.mjs
 * Output:     docs/images/*.png  (dibersihkan tiap kali dijalankan)
 *
 * Data uji (kode E2E-GAMBAR) dibuat di awal dan dihapus kembali di akhir.
 */
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

try {
  process.loadEnvFile(resolve(process.cwd(), ".env.local"));
} catch {
  console.warn("!.env.local tidak ditemukan — env diambil dari shell.");
}

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const OUT = resolve(process.cwd(), "docs", "images");
const KODE = "E2E-GAMBAR";
const NAMA = "Barang Contoh Dokumentasi";

const admin = {
  username: process.env.E2E_ADMIN_USERNAME ?? "admin",
  password: process.env.STOKITA_ADMIN_PASSWORD,
};
const kasir = {
  username: process.env.E2E_KASIR_USERNAME ?? "kasir1",
  password: process.env.STOKITA_KASIR1_PASSWORD,
};

if (!admin.password || !kasir.password) {
  throw new Error("STOKITA_ADMIN_PASSWORD / STOKITA_KASIR1_PASSWORD belum terisi.");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/** Membersihkan data uji (produk, penjualan, dan mutasinya). */
async function bersihkan() {
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("kode", KODE);
  for (const product of products ?? []) {
    const { data: items } = await supabase
      .from("sale_items")
      .select("sale_id")
      .eq("product_id", product.id);
    for (const item of items ?? []) {
      await supabase.from("sales").delete().eq("id", item.sale_id);
    }
    await supabase.from("stock_movements").delete().eq("product_id", product.id);
    await supabase.from("products").delete().eq("id", product.id);
  }
}

async function login(page, akun) {
  await page.goto(`${BASE}/login`);
  await page.locator("#username").fill(akun.username);
  await page.locator("#password").fill(akun.password);
  await page.getByRole("button", { name: "Masuk" }).click();
}

async function main() {
  // 1. Siapkan data uji (mulai dari kondisi bersih agar selalu INSERT).
  await bersihkan();
  const { error } = await supabase.from("products").insert({
    kode: KODE,
    nama: NAMA,
    harga_beli: 12000,
    harga_jual: 15000,
    stok: 50,
    stok_min: 5,
    aktif: true,
  });
  if (error) throw new Error(`Gagal menyiapkan data uji: ${error.message}`);

  // 2. Bersihkan folder gambar lama, lalu ambil screenshot baru.
  mkdirSync(OUT, { recursive: true });
  for (const file of readdirSync(OUT)) {
    if (file.endsWith(".png")) rmSync(resolve(OUT, file));
  }

  const browser = await chromium.launch();
  const shot = async (page, nama, target) => {
    const path = resolve(OUT, `${nama}.png`);
    if (target) await target.screenshot({ path });
    else await page.screenshot({ path, fullPage: false });
    console.log(`✓ docs/images/${nama}.png`);
  };

  try {
    // ---- Konteks admin ----
    const adminCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "id-ID",
      timezoneId: "Asia/Jakarta",
    });
    const a = await adminCtx.newPage();

    await a.goto(`${BASE}/login`);
    await shot(a, "01-halaman-login");

    await login(a, admin);
    await a.waitForURL((url) => url.pathname === "/admin");
    await shot(a, "02-dashboard-admin");

    await a.goto(`${BASE}/admin/barang`);
    await a.waitForLoadState("networkidle");
    await shot(a, "03-daftar-barang");

    await a.goto(`${BASE}/admin/barang/tambah`);
    await a.waitForLoadState("networkidle");
    await shot(a, "04-form-tambah-barang");

    await a.goto(`${BASE}/admin/barang-masuk`);
    await a.waitForLoadState("networkidle");
    const { data: produk } = await supabase
      .from("products")
      .select("id")
      .eq("kode", KODE)
      .single();
    await a.locator("#productId").selectOption(produk.id);
    await a.locator("#qty").fill("10");
    await a.locator("#referensi").fill("Nota beli #123");
    await shot(a, "05-form-barang-masuk");

    await a.goto(`${BASE}/admin/stok`);
    await a.waitForLoadState("networkidle");
    await shot(a, "06-monitoring-stok");

    // Akses silang role: admin membuka halaman kasir.
    await a.goto(`${BASE}/kasir`);
    await a.waitForLoadState("networkidle");
    await shot(a, "07-akses-ditolak-admin");

    await adminCtx.close();

    // ---- Konteks kasir ----
    const kasirCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "id-ID",
      timezoneId: "Asia/Jakarta",
    });
    const k = await kasirCtx.newPage();

    await login(k, kasir);
    await k.waitForURL((url) => url.pathname === "/kasir");
    await k.goto(`${BASE}/kasir/penjualan`);
    await k.waitForLoadState("networkidle");
    await k.locator("#cari-barang").fill(KODE);
    await k.locator(".pos-item").filter({ hasText: KODE }).first()
      .getByRole("button", { name: "Tambah" }).click();
    await k.locator("#metodeBayar").selectOption("TUNAI");
    await k.locator("#bayar").fill("100000");
    await shot(k, "08-pos-keranjang-pembayaran");

    await k.getByRole("button", { name: "Bayar & selesaikan" }).click();
    await k.getByRole("dialog").waitFor();
    await shot(k, "09-dialog-konfirmasi-transaksi");

    await k.getByRole("dialog").getByRole("button", { name: "Bayar & selesaikan" }).click();
    await k.getByTestId("struk").waitFor();
    await shot(k, "10-struk-transaksi");

    await k.goto(`${BASE}/kasir/penjualan/riwayat`);
    await k.waitForLoadState("networkidle");
    await shot(k, "11-riwayat-penjualan-kasir");

    await kasirCtx.close();
  } finally {
    await browser.close();
    // 3. Kembalikan database ke kondisi semula.
    await bersihkan();
    console.log("✓ data uji dibersihkan dari database");
  }
}

main().catch((error) => {
  console.error("Gagal:", error);
  process.exitCode = 1;
});
