/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getProductById, notFound } = vi.hoisted(() => ({
  getProductById: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/services/product.service", () => ({
  getProductById,
}));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/app/admin/barang/actions", () => ({
  createProductAction: vi.fn(),
  updateProductAction: vi.fn(),
}));

import EditBarangPage from "./[id]/edit/page";

function makeParams(id: string) {
  return Promise.resolve({ id });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EditBarangPage", () => {
  it("memanggil service sesuai id params dan merender form edit", async () => {
    getProductById.mockResolvedValue({
      ok: true,
      data: {
        id: "p-9",
        kode: "BRG-009",
        nama: "Teh Manis",
        hargaBeli: 3000,
        hargaJual: 5000,
        stok: 7,
        stokMin: 2,
        aktif: true,
        createdAt: "2026-11-01T00:00:00Z",
      },
    });

    const el = await EditBarangPage({ params: makeParams("p-9") });
    render(el);

    expect(getProductById).toHaveBeenCalledWith("p-9");
    expect(screen.getByRole("heading", { name: "Edit barang" })).toBeInTheDocument();
    expect(screen.getByText(/BRG-009 — Teh Manis/)).toBeInTheDocument();
    // defaultValues terisi dari data produk
    expect(screen.getByDisplayValue("BRG-009")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Teh Manis")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5000")).toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("melempar notFound bila produk tidak ada", async () => {
    getProductById.mockResolvedValue({ ok: false, error: {} });

    await expect(EditBarangPage({ params: makeParams("hilang") })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalled();
  });
});
