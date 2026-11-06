import { describe, expect, it } from "vitest";

import { fail, ok, type Result, type ServiceError } from "@/types/result";

describe("ok", () => {
  it("membungkus data dalam sukses berflag ok:true", () => {
    const result = ok({ id: "p-1", nama: "Kopi" });

    expect(result).toEqual({ ok: true, data: { id: "p-1", nama: "Kopi" } });
    expect(result.ok).toBe(true);
  });

  it("mempertahankan data apapun apa adanya", () => {
    expect(ok(42)).toEqual({ ok: true, data: 42 });
    expect(ok("kosong")).toEqual({ ok: true, data: "kosong" });
    expect(ok(null)).toEqual({ ok: true, data: null });
  });
});

describe("fail", () => {
  it("membungkus ServiceError dalam kegagalan berflag ok:false", () => {
    const error: ServiceError = {
      code: "AU001",
      message: "Sesi Anda tidak valid.",
    };

    expect(fail(error)).toEqual({
      ok: false,
      error: { code: "AU001", message: "Sesi Anda tidak valid." },
    });
  });

  it("mempertahankan field opsional bila disertakan", () => {
    const result = fail({
      code: "INVALID_INPUT",
      message: "Data tidak valid.",
      field: "kode",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("kode");
  });

  it("tidak menambahkan key field saat error tanpa field", () => {
    const result = fail({ code: "GENERIC", message: "Terjadi kesalahan." });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).not.toHaveProperty("field");
  });

  it("membedakan sukses dan gagal pada penelusuran result", () => {
    const berhasil: Result<string> = ok("ya");
    const gagal: Result<string> = fail({ code: "X", message: "tidak" });

    const pesan = (r: Result<string>) =>
      r.ok ? `data:${r.data}` : `error:${r.error.code}`;

    expect(pesan(berhasil)).toBe("data:ya");
    expect(pesan(gagal)).toBe("error:X");
  });
});
