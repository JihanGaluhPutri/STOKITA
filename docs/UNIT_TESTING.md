# Dokumen Unit Testing — STOKITA

**Framework:** Vitest `5.x` · **Konfigurasi:** `vitest.config.mts` · **Jalur:** `npm test`
**Hasil:** 6 file test · **66 kasus uji · seluruhnya lolos** · typecheck, lint, dan build tetap bersih.

---

## 1. Ringkasan Implementasi

Unit testing diterapkan pada **lapisan logika murni** aplikasi STOKITA — modul TypeScript
yang tidak bergantung pada database maupun browser, sehingga hasilnya deterministik dan
bisa dijalankan ulang kapan pun tanpa infrastruktur tambahan.

| # | File test | Modul yang diuji | Kasus |
| --- | --- | --- | --- |
| 1 | `src/lib/business/payment.test.ts` | `payment.ts` — subtotal, total, kembalian, penyelesaian pembayaran | 19 |
| 2 | `src/lib/business/stock-status.test.ts` | `stock-status.ts` — status stok & label | 7 |
| 3 | `src/lib/business/quantity.test.ts` | `quantity.ts` — parsing & validasi integer | 11 |
| 4 | `src/lib/business/date-range.test.ts` | `date-range.ts` — filter tanggal & zona waktu bisnis | 11 |
| 5 | `src/lib/business/format.test.ts` | `format.ts` — utility format rupiah & waktu | 7 |
| 6 | `src/lib/validation/product.test.ts` | `validation/product.ts` — validasi form barang | 11 |
| | | **Total** | **66** |

**Cakupan parameter pengujian:**

| Parameter | Status | Bukti |
| --- | --- | --- |
| ✅ Function | ✅ | 12+ fungsi ekspor diuji langsung |
| ✅ Method | ✅ | Alur method berantai teruji (mis. `resolvePayment` → `calculateChange` → `calculateSubtotal`) |
| ✅ Business Logic | ✅ | Kembalian, penolakan bayar kurang, status stok, rentang tanggal, overflow |
| ✅ Validation Logic | ✅ | `validatePositiveInteger`, `validateNonNegativeInteger`, `validateProductInput`, `validateProductUpdateInput`, `validateDateRange` |
| ✅ Utility Function | ✅ | `formatRupiah`, `formatNumberRupiah`, `formatDateTime`, `getBusinessDayBounds`, `parseInteger` |

**Cara menjalankan:**

```powershell
npm test                                   # semua 66 kasus
npm test -- payment                        # satu file
npm test -- payment -t "calculateChange"   # satu describe
npm test -- stock-status --reporter=verbose # verbose, tiap kasus tercantum
npm run test:watch                         # mode interaktif (watch)
```

**Batasan cakupan (jujur):** test mencakup lapisan logika murni TypeScript. Penegakan
stok & transaksi penjualan berada di fungsi database PostgreSQL `checkout_sale`
(SECURITY DEFINER, row-locking `FOR UPDATE`, transaksional) — konsistensinya dijaga
database dan diuji lewat pengujian fungsional aplikasi, bukan unit test.

---

## 2. Kasus Uji per File

### 2.1 `payment.test.ts` — 19 kasus (Total Penjualan, Kembalian, Pembayaran)

**`calculateSubtotal`** (5 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 1 | menghitung harga × qty | `calculateSubtotal(1000, 3)` → `3000` |
| 2 | mengizinkan harga 0 | barang gratis tetap sah |
| 3 | menolak harga negatif | kode error `CALC` |
| 4 | menolak qty 0 dan negatif | qty tidak positif → `CALC` |
| 5 | menolak input bukan bilangan bulat aman | desimal & overflow → gagal |

**`calculateTotal`** (4 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 6 | menjumlahkan beberapa baris | 2×1000 + 1×500 → `2500` |
| 7 | keranjang kosong | total `0` (bukan error) |
| 8 | gagal lebih dulu pada baris tidak valid | satu baris qty 0 → seluruh total gagal `CALC` |
| 9 | akumulasi melebihi batas aman | overflow penjumlahan → `OVERFLOW` |

**`calculateChange`** (4 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 10 | menghitung kembalian | bayar 10000 − total 7500 → `2500` |
| 11 | bayar pas dengan total | kembalian `0` |
| 12 | menolak bayar kurang | kode `PY003` |
| 13 | menolak bayar negatif/non-bulat/NaN | kode `PY002` |

**`resolvePayment`** (6 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 14 | NON_TUNAI memaksa bayar = total | kembalian selalu `0`, nominal klien diabaikan |
| 15 | TUNAI nominal valid | kembalian dihitung benar |
| 16 | TUNAI tanpa nominal | gagal `PY002` (null & undefined) |
| 17 | TUNAI bayar kurang | gagal `PY003` |
| 18 | metode tidak dikenal (mis. "QRIS") | ditolak `PY001` |
| 19 | total tidak valid (negatif) | ditolak `CALC` |

### 2.2 `stock-status.test.ts` — 7 kasus (Validasi Stok)

**`resolveStockStatus`** (6 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 20 | stok 0 | `HABIS` |
| 21 | stok negatif (data rusak) | tetap `HABIS` |
| 22 | stok = stok minimum | `MENIPIS` |
| 23 | stok < minimum (masih > 0) | `MENIPIS` |
| 24 | stok > minimum | `AMAN` |
| 25 | stok minimum 0 | stok apa pun > 0 → `AMAN` |

**`STOCK_STATUS_LABEL`** (1 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 26 | pemetaan label | `HABIS→Habis`, `MENIPIS→Menipis`, `AMAN→Aman` |

### 2.3 `quantity.test.ts` — 11 kasus (Validasi Jumlah Barang)

**`parseInteger`** (6 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 27 | menerima bilangan bulat | `4`, `-2` |
| 28 | menerima string integer + spasi | `"5"`, `"  7  "`, `"-3"` |
| 29 | menolak desimal | `3.14`, `"5.5"` → `null` |
| 30 | menolak string kosong/teks/campuran | `""`, `"abc"`, `"12a"`, `"1,000"`, `"NaN"`, `"Infinity"` |
| 31 | menolak tipe lain | `null`, `undefined`, `boolean`, objek |
| 32 | menolak di luar batas aman | `"99999999999999999999"` → `null` |

**`validatePositiveInteger`** (3 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 33 | menerima > 0 | `"3"` → `3`, `1` |
| 34 | menolak 0, negatif, tidak valid | kode `INVALID_INTEGER` |
| 35 | pesan kustom | pesan bisa dioverride per pemanggil |

**`validateNonNegativeInteger`** (2 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 36 | menerima 0 dan positif | `0`, `"12"` |
| 37 | menolak negatif/tidak valid | `-1`, `"abc"`, `2.5` → `INVALID_INTEGER` |

### 2.4 `date-range.test.ts` — 11 kasus (Filter Tanggal & Zona Waktu)

**`validateDateRange`** (6 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 38 | `YYYY-MM-DD` = hari penuh WIB | awal `00:00:00+07:00`, akhir `23:59:59.999+07:00` |
| 39 | rentang sehari (awal = akhir) | sah |
| 40 | akhir sebelum awal | ditolak `DATE_RANGE_INVALID` |
| 41 | format tanggal salah | `"2026-13-01"`, `"32/01/2026"`, `"bukan-tanggal"` → `DATE_INVALID` |
| 42 | nilai bukan string/Date | `null`, angka, Date invalid → ditolak |
| 43 | objek `Date` valid | diterima |

**`getBusinessDayBounds`** (5 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 44 | konstanta zona bisnis | `Asia/Jakarta` |
| 45 | pergantian hari mengikuti WIB, bukan UTC | `17:30Z = 00:30 WIB` → hari berganti |
| 46 | sebelum tengah malam WIB | masih dihitung hari yang sama |
| 47 | batas akhir inklusif → eksklusif | `endExclusive` = awal hari berikutnya |
| 48 | akhir bulan | `31 Jan → 1 Feb` |

### 2.5 `format.test.ts` — 7 kasus (Utility Format)

**`formatRupiah`** (3 kasus) · **`formatNumberRupiah`** (2 kasus) · **`formatDateTime`** (2 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 49 | rupiah tanpa desimal | `15000` → `Rp15.000` |
| 50 | nol rupiah | tetap bersimbol `Rp` |
| 51 | pemisah ribuan angka besar | `1234567` → `1.234.567` |
| 52 | versi tanpa simbol | untuk kolom tabel sempit (struk) |
| 53 | ribuan tanpa simbol | tetap `1.234.567` |
| 54 | waktu WIB, bukan UTC | `17:30Z` tampil `00:30` tanggal berikutnya |
| 55 | tanggal input dalam WIB | jam & tanggal tampil sesuai zona bisnis |

### 2.6 `product.test.ts` — 11 kasus (Validasi Form Barang)

**`validateProductInput`** (7 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 56 | input valid | string → number, semua field lolos |
| 57 | trim spasi kode & nama | `"  BRG-002  "` → `"BRG-002"` |
| 58 | kode kosong | `REQUIRED`, field `kode` |
| 59 | nama kosong | `REQUIRED`, field `nama` |
| 60 | angka bukan integer | `INVALID_INTEGER`, field sesuai (`hargaJual`) |
| 61 | angka negatif | `NEGATIVE`, field sesuai (`hargaBeli`) |
| 62 | stok awal 0 | sah (barang boleh dibuat sudah habis) |

**`validateProductUpdateInput`** (4 kasus)

| # | Kasus uji | Yang diverifikasi |
| --- | --- | --- |
| 63 | hanya atribut yang boleh diubah | hasil tanpa `stokAwal`/`stokMin` |
| 64 | nilai stok disisipkan klien diabaikan | `stokAwal: 9999` tidak mempengaruhi hasil |
| 65 | kode/nama kosong | ditolak |
| 66 | harga tidak valid | ditolak |

---

## 3. Konfigurasi

**`vitest.config.mts`**

```ts
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

**`package.json` (bagian scripts & devDependencies)**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^5.0.5"
  }
}
```

---

## 4. Kode Lengkap 6 File Test

### 4.1 `src/lib/business/payment.test.ts`

```ts
import { describe, expect, it } from "vitest";

import {
  calculateChange,
  calculateSubtotal,
  calculateTotal,
  resolvePayment,
} from "@/lib/business/payment";

describe("calculateSubtotal", () => {
  it("menghitung harga × qty", () => {
    const result = calculateSubtotal(1000, 3);
    expect(result).toEqual({ ok: true, data: 3000 });
  });

  it("mengizinkan harga 0 (barang gratis)", () => {
    expect(calculateSubtotal(0, 5)).toEqual({ ok: true, data: 0 });
  });

  it("menolak harga negatif", () => {
    const result = calculateSubtotal(-1000, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CALC");
  });

  it("menolak qty 0 dan negatif", () => {
    for (const qty of [0, -2]) {
      const result = calculateSubtotal(1000, qty);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("CALC");
    }
  });

  it("menolak input bukan bilangan bulat aman", () => {
    expect(calculateSubtotal(1000.5, 1).ok).toBe(false);
    expect(calculateSubtotal(1000, 1.5).ok).toBe(false);
    expect(calculateSubtotal(Number.MAX_SAFE_INTEGER, 2).ok).toBe(false);
  });
});

describe("calculateTotal", () => {
  it("menjumlahkan beberapa baris", () => {
    const result = calculateTotal([
      { hargaSatuan: 1000, qty: 2 },
      { hargaSatuan: 500, qty: 1 },
    ]);
    expect(result).toEqual({ ok: true, data: 2500 });
  });

  it("mengembalikan 0 untuk keranjang kosong", () => {
    expect(calculateTotal([])).toEqual({ ok: true, data: 0 });
  });

  it("gagal lebih dulu pada baris yang tidak valid", () => {
    const result = calculateTotal([
      { hargaSatuan: 1000, qty: 1 },
      { hargaSatuan: 1000, qty: 0 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CALC");
  });

  it("gagal saat akumulasi total melebihi batas bilangan bulat aman", () => {
    const result = calculateTotal([
      { hargaSatuan: Number.MAX_SAFE_INTEGER, qty: 1 },
      { hargaSatuan: 1, qty: 1 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("OVERFLOW");
  });
});

describe("calculateChange", () => {
  it("menghitung kembalian bayar − total", () => {
    expect(calculateChange(10000, 7500)).toEqual({ ok: true, data: 2500 });
  });

  it("mengizinkan bayar pas dengan total (kembalian 0)", () => {
    expect(calculateChange(7500, 7500)).toEqual({ ok: true, data: 0 });
  });

  it("menolak bayar kurang dari total (PY003)", () => {
    const result = calculateChange(5000, 7500);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PY003");
  });

  it("menolak bayar negatif dan bukan bilangan bulat (PY002)", () => {
    for (const bayar of [-1, 1000.5, Number.NaN]) {
      const result = calculateChange(bayar, 1000);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("PY002");
    }
  });
});

describe("resolvePayment", () => {
  it("NON_TUNAI memaksa bayar = total dan kembalian = 0", () => {
    const result = resolvePayment("NON_TUNAI", 7500, 999999);
    expect(result).toEqual({
      ok: true,
      data: { metodeBayar: "NON_TUNAI", bayar: 7500, kembalian: 0 },
    });
  });

  it("TUNAI dengan nominal valid menghitung kembalian", () => {
    const result = resolvePayment("TUNAI", 7500, 10000);
    expect(result).toEqual({
      ok: true,
      data: { metodeBayar: "TUNAI", bayar: 10000, kembalian: 2500 },
    });
  });

  it("TUNAI tanpa nominal gagal (PY002)", () => {
    for (const bayar of [null, undefined]) {
      const result = resolvePayment("TUNAI", 7500, bayar);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("PY002");
    }
  });

  it("TUNAI dengan bayar kurang gagal (PY003)", () => {
    const result = resolvePayment("TUNAI", 7500, 1000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PY003");
  });

  it("metode tidak dikenal ditolak (PY001)", () => {
    const result = resolvePayment("QRIS", 7500, 10000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PY001");
  });

  it("total tidak valid ditolak (CALC)", () => {
    const result = resolvePayment("NON_TUNAI", -1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CALC");
  });
});
```

### 4.2 `src/lib/business/stock-status.test.ts`

```ts
import { describe, expect, it } from "vitest";

import {
  STOCK_STATUS_LABEL,
  resolveStockStatus,
} from "@/lib/business/stock-status";

describe("resolveStockStatus", () => {
  it("stok 0 = HABIS", () => {
    expect(resolveStockStatus(0, 5)).toBe("HABIS");
  });

  it("stok negatif (data rusak) tetap dianggap HABIS", () => {
    expect(resolveStockStatus(-3, 5)).toBe("HABIS");
  });

  it("stok sama dengan stok minimum = MENIPIS", () => {
    expect(resolveStockStatus(3, 3)).toBe("MENIPIS");
  });

  it("stok di bawah stok minimum (masih > 0) = MENIPIS", () => {
    expect(resolveStockStatus(2, 5)).toBe("MENIPIS");
  });

  it("stok di atas stok minimum = AMAN", () => {
    expect(resolveStockStatus(4, 3)).toBe("AMAN");
  });

  it("stok minimum 0: stok apa pun yang > 0 = AMAN", () => {
    expect(resolveStockStatus(1, 0)).toBe("AMAN");
  });
});

describe("STOCK_STATUS_LABEL", () => {
  it("memetakan semua status ke label tampilan", () => {
    expect(STOCK_STATUS_LABEL).toEqual({
      HABIS: "Habis",
      MENIPIS: "Menipis",
      AMAN: "Aman",
    });
  });
});
```

### 4.3 `src/lib/business/quantity.test.ts`

```ts
import { describe, expect, it } from "vitest";

import {
  parseInteger,
  validateNonNegativeInteger,
  validatePositiveInteger,
} from "@/lib/business/quantity";

describe("parseInteger", () => {
  it("menerima bilangan bulat", () => {
    expect(parseInteger(4)).toBe(4);
    expect(parseInteger(-2)).toBe(-2);
  });

  it("menerima string bilangan bulat termasuk spasi di sekelilingnya", () => {
    expect(parseInteger("5")).toBe(5);
    expect(parseInteger("  7  ")).toBe(7);
    expect(parseInteger("-3")).toBe(-3);
  });

  it("menolak desimal", () => {
    expect(parseInteger(3.14)).toBeNull();
    expect(parseInteger("5.5")).toBeNull();
  });

  it("menolak string kosong, teks, dan campuran", () => {
    for (const value of ["", "   ", "abc", "12a", "1,000", "NaN", "Infinity"]) {
      expect(parseInteger(value)).toBeNull();
    }
  });

  it("menolak tipe selain number/string", () => {
    expect(parseInteger(null)).toBeNull();
    expect(parseInteger(undefined)).toBeNull();
    expect(parseInteger(true)).toBeNull();
    expect(parseInteger({})).toBeNull();
  });

  it("menolak bilangan bulat di luar batas aman", () => {
    expect(parseInteger("99999999999999999999")).toBeNull();
  });
});

describe("validatePositiveInteger", () => {
  it("menerima bilangan bulat lebih dari 0", () => {
    expect(validatePositiveInteger("3")).toEqual({ ok: true, data: 3 });
    expect(validatePositiveInteger(1)).toEqual({ ok: true, data: 1 });
  });

  it("menolak 0, negatif, dan input tidak valid", () => {
    for (const value of [0, "0", -1, "abc", 1.5]) {
      const result = validatePositiveInteger(value);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("INVALID_INTEGER");
    }
  });

  it("menggunakan pesan kustom bila diberikan", () => {
    const result = validatePositiveInteger(0, "Qty minimal 1.");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe("Qty minimal 1.");
  });
});

describe("validateNonNegativeInteger", () => {
  it("menerima 0 dan bilangan bulat positif", () => {
    expect(validateNonNegativeInteger(0)).toEqual({ ok: true, data: 0 });
    expect(validateNonNegativeInteger("12")).toEqual({ ok: true, data: 12 });
  });

  it("menolak negatif dan input tidak valid", () => {
    for (const value of [-1, "-1", "abc", 2.5]) {
      const result = validateNonNegativeInteger(value);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("INVALID_INTEGER");
    }
  });
});
```

### 4.4 `src/lib/business/date-range.test.ts`

```ts
import { describe, expect, it } from "vitest";

import {
  BUSINESS_TIMEZONE,
  DATE_INVALID,
  DATE_RANGE_INVALID,
  getBusinessDayBounds,
  validateDateRange,
} from "@/lib/business/date-range";

describe("validateDateRange", () => {
  it("pola YYYY-MM-DD dibaca sebagai hari penuh Asia/Jakarta", () => {
    const result = validateDateRange("2026-01-10", "2026-01-12");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.tanggalAwal.getTime()).toBe(
      Date.parse("2026-01-10T00:00:00+07:00"),
    );
    expect(result.data.tanggalAkhir.getTime()).toBe(
      Date.parse("2026-01-12T23:59:59.999+07:00"),
    );
  });

  it("menerima tanggal awal = tanggal akhir (rentang sehari)", () => {
    const result = validateDateRange("2026-01-10", "2026-01-10");
    expect(result.ok).toBe(true);
  });

  it("menolak tanggal akhir sebelum tanggal awal", () => {
    const result = validateDateRange("2026-01-12", "2026-01-10");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(DATE_RANGE_INVALID);
  });

  it("menolak format tanggal tidak valid", () => {
    for (const [awal, akhir] of [
      ["2026-13-01", "2026-01-12"],
      ["2026-01-10", "32/01/2026"],
      ["", "2026-01-12"],
      ["bukan-tanggal", "2026-01-12"],
    ]) {
      const result = validateDateRange(awal, akhir);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(DATE_INVALID);
    }
  });

  it("menolak nilai selain string tanggal ISO dan Date", () => {
    expect(validateDateRange(null, "2026-01-12").ok).toBe(false);
    expect(validateDateRange("2026-01-10", 20260112).ok).toBe(false);
    expect(validateDateRange(new Date("invalid"), "2026-01-12").ok).toBe(false);
  });

  it("menerima objek Date yang valid", () => {
    const result = validateDateRange(
      new Date("2026-01-10T00:00:00+07:00"),
      new Date("2026-01-12T23:59:59.999+07:00"),
    );
    expect(result.ok).toBe(true);
  });
});

describe("getBusinessDayBounds", () => {
  it("zona waktu bisnis Asia/Jakarta", () => {
    expect(BUSINESS_TIMEZONE).toBe("Asia/Jakarta");
  });

  it("menghitung batas hari sesuai kalender Jakarta, bukan UTC", () => {
    // 17:30Z = 00:30 WIB keesokan hari → hari bisnis berganti.
    const bounds = getBusinessDayBounds(new Date("2026-01-10T17:30:00Z"));
    expect(bounds.startIso).toBe("2026-01-11T00:00:00+07:00");
    expect(bounds.endExclusiveIso).toBe("2026-01-12T00:00:00+07:00");
  });

  it("sebelum tengah malam WIB hari yang sama masih terhitung hari itu", () => {
    // 16:59:59Z = 23:59:59 WIB → masih 10 Januari.
    const bounds = getBusinessDayBounds(new Date("2026-01-10T16:59:59Z"));
    expect(bounds.startIso).toBe("2026-01-10T00:00:00+07:00");
    expect(bounds.endExclusiveIso).toBe("2026-01-11T00:00:00+07:00");
  });

  it("batas akhir hari inklusif menjadi batas eksklusif hari berikutnya", () => {
    const bounds = getBusinessDayBounds(new Date("2026-02-27T12:00:00Z"));
    expect(bounds.startIso).toBe("2026-02-27T00:00:00+07:00");
    expect(bounds.endExclusiveIso).toBe("2026-02-28T00:00:00+07:00");
  });

  it("menangani akhir bulan (awal bulan berikutnya)", () => {
    const bounds = getBusinessDayBounds(new Date("2026-01-31T10:00:00Z"));
    expect(bounds.startIso).toBe("2026-01-31T00:00:00+07:00");
    expect(bounds.endExclusiveIso).toBe("2026-02-01T00:00:00+07:00");
  });
});
```

### 4.5 `src/lib/business/format.test.ts`

```ts
import { describe, expect, it } from "vitest";

import {
  formatDateTime,
  formatNumberRupiah,
  formatRupiah,
} from "@/lib/business/format";

describe("formatRupiah", () => {
  it("memformat rupiah tanpa desimal", () => {
    const formatted = formatRupiah(15000);
    expect(formatted).toContain("15.000");
    expect(formatted.startsWith("Rp")).toBe(true);
  });

  it("nol rupiah tetap tampil dengan simbol", () => {
    const formatted = formatRupiah(0);
    expect(formatted).toContain("0");
    expect(formatted.startsWith("Rp")).toBe(true);
  });

  it("nilai besar mengelompokkan ribuan", () => {
    expect(formatRupiah(1234567)).toContain("1.234.567");
  });
});

describe("formatNumberRupiah", () => {
  it("menghilangkan simbol Rp untuk kolom tabel yang sempit", () => {
    const formatted = formatNumberRupiah(15000);
    expect(formatted).not.toContain("Rp");
    expect(formatted).toContain("15.000");
  });

  it("tetap mengelompokkan ribuan", () => {
    expect(formatNumberRupiah(1234567)).toContain("1.234.567");
  });
});

describe("formatDateTime", () => {
  it("menampilkan waktu Asia/Jakarta, bukan UTC", () => {
    const formatted = formatDateTime("2026-01-10T17:30:00Z");
    expect(formatted).toContain("2026");
    // 17:30Z = 00:30 WIB tanggal berikutnya.
    expect(formatted).toMatch(/00[.:]30/);
    expect(formatted).toContain("11");
  });

  it("menampilkan tanggal sesuai input bila sudah dalam WIB", () => {
    const formatted = formatDateTime("2026-01-10T10:00:00+07:00");
    expect(formatted).toContain("10");
    expect(formatted).toMatch(/10[.:]00/);
  });
});
```

### 4.6 `src/lib/validation/product.test.ts`

```ts
import { describe, expect, it } from "vitest";

import {
  validateProductInput,
  validateProductUpdateInput,
} from "@/lib/validation/product";

const validInput = {
  kode: "BRG-001",
  nama: "Kopi Sachet",
  hargaBeli: "1000",
  hargaJual: "1500",
  stokAwal: "10",
  stokMin: "3",
};

describe("validateProductInput", () => {
  it("menerima input valid dan mengubahnya ke tipe yang benar", () => {
    const result = validateProductInput(validInput);
    expect(result).toEqual({
      ok: true,
      data: {
        kode: "BRG-001",
        nama: "Kopi Sachet",
        hargaBeli: 1000,
        hargaJual: 1500,
        stokAwal: 10,
        stokMin: 3,
      },
    });
  });

  it("memotong spasi di sekeliling kode dan nama", () => {
    const result = validateProductInput({
      ...validInput,
      kode: "  BRG-002  ",
      nama: "  Teh Celup  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.kode).toBe("BRG-002");
      expect(result.data.nama).toBe("Teh Celup");
    }
  });

  it("menolak kode kosong (REQUIRED, field kode)", () => {
    const result = validateProductInput({ ...validInput, kode: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REQUIRED");
      expect(result.error.field).toBe("kode");
    }
  });

  it("menolak nama kosong (REQUIRED, field nama)", () => {
    const result = validateProductInput({ ...validInput, nama: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REQUIRED");
      expect(result.error.field).toBe("nama");
    }
  });

  it("menolak angka bukan bilangan bulat (INVALID_INTEGER, per field)", () => {
    const result = validateProductInput({ ...validInput, hargaJual: "seribu" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_INTEGER");
      expect(result.error.field).toBe("hargaJual");
    }
  });

  it("menolak angka negatif (NEGATIVE, per field)", () => {
    const result = validateProductInput({ ...validInput, hargaBeli: -500 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NEGATIVE");
      expect(result.error.field).toBe("hargaBeli");
    }
  });

  it("stok 0 diperbolehkan (barang bisa saja habis saat dibuat)", () => {
    const result = validateProductInput({ ...validInput, stokAwal: "0" });
    expect(result.ok).toBe(true);
  });
});

describe("validateProductUpdateInput", () => {
  it("hanya mengembalikan atribut yang boleh diubah (tanpa stok)", () => {
    const result = validateProductUpdateInput(validInput);
    expect(result).toEqual({
      ok: true,
      data: {
        kode: "BRG-001",
        nama: "Kopi Sachet",
        hargaBeli: 1000,
        hargaJual: 1500,
      },
    });
    if (result.ok) {
      expect(result.data).not.toHaveProperty("stokAwal");
      expect(result.data).not.toHaveProperty("stokMin");
    }
  });

  it("mengabaikan nilai stok yang disisipkan klien", () => {
    const result = validateProductUpdateInput({
      ...validInput,
      stokAwal: "9999",
      stokMin: "-1",
    });
    expect(result.ok).toBe(true);
  });

  it("menolak kode dan nama kosong", () => {
    expect(validateProductUpdateInput({ ...validInput, kode: " " }).ok).toBe(false);
    expect(validateProductUpdateInput({ ...validInput, nama: "" }).ok).toBe(false);
  });

  it("menolak harga tidak valid", () => {
    expect(validateProductUpdateInput({ ...validInput, hargaJual: -1 }).ok).toBe(false);
  });
});
```

---

## 5. Hasil Pemeriksaan

```
 ✓ src/lib/business/date-range.test.ts (11)
 ✓ src/lib/business/format.test.ts (7)
 ✓ src/lib/business/payment.test.ts (19)
 ✓ src/lib/business/quantity.test.ts (11)
 ✓ src/lib/business/stock-status.test.ts (7)
 ✓ src/lib/validation/product.test.ts (11)

 Test Files  6 passed (6)
      Tests  66 passed (66)
```

Diverifikasi juga: `npm run typecheck` bersih · `npm run lint` bersih · `npm run build` sukses.

**Tautan bukti di GitHub:**

- Pull Request: <https://github.com/JihanGaluhPutri/STOKITA/pull/1>
- Commit implementasi: <https://github.com/JihanGaluhPutri/STOKITA/commit/e7fd856>
