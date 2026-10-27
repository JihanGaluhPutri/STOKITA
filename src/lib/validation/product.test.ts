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
