import { parseInteger } from "@/lib/business/quantity";
import type { Result, ServiceError } from "@/types/result";

export type ProductFormInput = Record<string, unknown>;

export type ValidatedProductInput = {
  kode: string;
  nama: string;
  hargaBeli: number;
  hargaJual: number;
  stokAwal: number;
  stokMin: number;
};

function fail(code: string, message: string, field: string): { ok: false; error: ServiceError } {
  return { ok: false, error: { code, message, field } };
}

function checkNonNegative(
  value: unknown,
  label: string,
  field: string,
): Result<number> {
  const parsed = parseInteger(value);
  if (parsed === null) {
    return fail(
      "INVALID_INTEGER",
      `${label} harus berupa bilangan bulat tidak negatif.`,
      field,
    );
  }
  if (parsed < 0) {
    return fail("NEGATIVE", `${label} tidak boleh negatif.`, field);
  }
  return { ok: true, data: parsed };
}

/**
 * Validasi input barang di server (PB-BRG-02, PB-BRG-03).
 * Stok tidak divalidasi di sini karena tidak boleh diubah melalui form edit;
 * stok awal hanya berlaku saat menambah barang baru.
 */
export function validateProductInput(input: ProductFormInput): Result<ValidatedProductInput> {
  const kode = typeof input.kode === "string" ? input.kode.trim() : "";
  if (kode === "") {
    return fail("REQUIRED", "Kode barang wajib diisi.", "kode");
  }

  const nama = typeof input.nama === "string" ? input.nama.trim() : "";
  if (nama === "") {
    return fail("REQUIRED", "Nama barang wajib diisi.", "nama");
  }

  const hargaBeli = checkNonNegative(input.hargaBeli, "Harga beli", "hargaBeli");
  if (!hargaBeli.ok) return hargaBeli;

  const hargaJual = checkNonNegative(input.hargaJual, "Harga jual", "hargaJual");
  if (!hargaJual.ok) return hargaJual;

  const stokAwal = checkNonNegative(input.stokAwal, "Stok awal", "stokAwal");
  if (!stokAwal.ok) return stokAwal;

  const stokMin = checkNonNegative(input.stokMin, "Stok minimum", "stokMin");
  if (!stokMin.ok) return stokMin;

  return {
    ok: true,
    data: {
      kode,
      nama,
      hargaBeli: hargaBeli.data,
      hargaJual: hargaJual.data,
      stokAwal: stokAwal.data,
      stokMin: stokMin.data,
    },
  };
}

export type ValidatedProductUpdateInput = {
  kode: string;
  nama: string;
  hargaBeli: number;
  hargaJual: number;
};

/**
 * Validasi form edit (PB-BRG-03): hanya atribut yang boleh diubah.
 * Stok dan stok minimum tidak menerima perubahan melalui form edit.
 */
export function validateProductUpdateInput(
  input: ProductFormInput,
): Result<ValidatedProductUpdateInput> {
  const kode = typeof input.kode === "string" ? input.kode.trim() : "";
  if (kode === "") {
    return fail("REQUIRED", "Kode barang wajib diisi.", "kode");
  }

  const nama = typeof input.nama === "string" ? input.nama.trim() : "";
  if (nama === "") {
    return fail("REQUIRED", "Nama barang wajib diisi.", "nama");
  }

  const hargaBeli = checkNonNegative(input.hargaBeli, "Harga beli", "hargaBeli");
  if (!hargaBeli.ok) return hargaBeli;

  const hargaJual = checkNonNegative(input.hargaJual, "Harga jual", "hargaJual");
  if (!hargaJual.ok) return hargaJual;

  return {
    ok: true,
    data: {
      kode,
      nama,
      hargaBeli: hargaBeli.data,
      hargaJual: hargaJual.data,
    },
  };
}
