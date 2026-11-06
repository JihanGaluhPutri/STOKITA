/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Product } from "@/types/product";

import { ProductSearch } from "./product-search";

const PRODUCTS: Product[] = [
  {
    id: "p-1",
    kode: "BRG-001",
    nama: "Kopi Susu",
    hargaBeli: 10000,
    hargaJual: 15000,
    stok: 10,
    stokMin: 2,
    aktif: true,
    createdAt: "2026-11-01T00:00:00Z",
  },
  {
    id: "p-2",
    kode: "BRG-002",
    nama: "Teh Manis",
    hargaBeli: 5000,
    hargaJual: 7000,
    stok: 4,
    stokMin: 5,
    aktif: true,
    createdAt: "2026-11-01T00:00:00Z",
  },
  {
    id: "p-3",
    kode: "BRG-003",
    nama: "Gula",
    hargaBeli: 2000,
    hargaJual: 3000,
    stok: 0,
    stokMin: 1,
    aktif: true,
    createdAt: "2026-11-01T00:00:00Z",
  },
];

function renderSearch(over: Partial<Parameters<typeof ProductSearch>[0]> = {}) {
  const onAdd = vi.fn();
  render(
    <ProductSearch products={PRODUCTS} onAdd={onAdd} disabled={false} {...over} />,
  );
  return { onAdd };
}

describe("ProductSearch", () => {
  it("menampilkan seluruh barang beserta harga, stok, dan status menipis", () => {
    renderSearch();

    const items = screen.getByRole("list").querySelectorAll("li");
    expect(items).toHaveLength(3);
    expect(screen.getByText("BRG-001")).toBeInTheDocument();
    expect(screen.getByText(/Kopi Susu/)).toBeInTheDocument();
    expect(screen.getByText(/Rp\s*15\.000/)).toBeInTheDocument();
    expect(screen.getByText(/stok 4\s·\sMenipis/)).toBeInTheDocument();
    const tombolTambah = screen.getAllByRole("button", { name: "Tambah" });
    expect(tombolTambah).toHaveLength(2); // barang p-1 & p-2
    for (const tombol of tombolTambah) {
      expect(tombol).toBeEnabled();
    }
  });

  it("memanggil onAdd dengan data barang saat tombol Tambah diklik", async () => {
    const { onAdd } = renderSearch();

    const tombol = screen.getAllByRole("button", { name: "Tambah" })[0];
    await userEvent.click(tombol);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0]).toMatchObject({
      id: "p-1",
      kode: "BRG-001",
      nama: "Kopi Susu",
      hargaJual: 15000,
      stok: 10,
    });
  });

  it("memfilter daftar berdasarkan kata kunci kode atau nama", async () => {
    renderSearch();

    const input = screen.getByLabelText("Cari barang");
    await userEvent.type(input, "teh");

    const items = screen.getByRole("list").querySelectorAll("li");
    expect(items).toHaveLength(1);
    expect(screen.getByText("BRG-002")).toBeInTheDocument();
    expect(screen.queryByText("BRG-001")).toBeNull();

    // Kata kunci pada kode juga dikenali.
    await userEvent.clear(input);
    await userEvent.type(input, "BRG-001");
    expect(screen.getByText("BRG-001")).toBeInTheDocument();
  });

  it("menampilkan empty state saat kata kunci tidak cocok", async () => {
    renderSearch();

    await userEvent.type(screen.getByLabelText("Cari barang"), "tidak-ada");

    expect(screen.getByText("Tidak ada barang yang cocok.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("menonaktifkan tombol barang habis", () => {
    renderSearch();

    const habis = screen.getByRole("button", { name: "Stok habis" });
    expect(habis).toBeDisabled();
  });

  it("menonaktifkan semua tombol saat komponen disabled", () => {
    renderSearch({ disabled: true });

    for (const tombol of screen.getAllByRole("button")) {
      expect(tombol).toBeDisabled();
    }
  });
});
