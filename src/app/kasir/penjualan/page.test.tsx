/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

import PenjualanPage from "./page";
import PenjualanLoading from "./loading";

function productRow(over: Record<string, unknown> = {}) {
  return {
    id: "p-1",
    kode: "BRG-001",
    nama: "Kopi Susu",
    harga_beli: 10000,
    harga_jual: 15000,
    stok: 10,
    stok_min: 2,
    aktif: true,
    created_at: "2026-11-01T00:00:00Z",
    ...over,
  };
}

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("PenjualanPage", () => {
  it("menampilkan terminal penjualan dengan barang aktif", async () => {
    const fake = getFake();
    fake.table("products", {
      data: [productRow(), productRow({ id: "p-2", kode: "BRG-002", nama: "Teh" })],
      error: null,
    });

    render(await PenjualanPage());

    expect(screen.getByRole("heading", { name: "Penjualan" })).toBeInTheDocument();
    expect(screen.getByLabelText("Cari barang")).toBeInTheDocument();
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText("BRG-001")).toBeInTheDocument();
    expect(within(list).getByText(/Kopi Susu/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Keranjang" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bayar & selesaikan" }),
    ).toBeDisabled(); // keranjang masih kosong

    // Hanya barang aktif yang dikirim ke terminal.
    expect(fake.findCalls("products.eq")[0].args).toEqual(["aktif", true]);
  });

  it("menampilkan empty state saat tidak ada barang aktif", async () => {
    getFake().table("products", { data: [], error: null });

    render(await PenjualanPage());

    expect(screen.getByText("Belum ada barang aktif.")).toBeInTheDocument();
    expect(
      screen.getByText("Hubungi admin untuk menambah barang."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Cari barang")).toBeNull();
  });

  it("menampilkan pesan error saat daftar barang gagal dimuat", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getFake().table("products", {
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    render(await PenjualanPage());

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGES.ACCESS);
    expect(screen.queryByLabelText("Cari barang")).toBeNull();
  });
});

describe("PenjualanLoading", () => {
  it("menampilkan status memuat daftar barang", () => {
    render(<PenjualanLoading />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Penjualan");
    expect(status).toHaveTextContent("Memuat daftar barang…");
  });
});
