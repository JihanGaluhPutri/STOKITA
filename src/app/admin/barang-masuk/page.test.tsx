/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";

// next/link butuh router Next.js; di unit test cukup dirender sebagai <a>.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

import BarangMasukPage from "./page";
import BarangMasukLoading from "./loading";

function signedInAdmin() {
  getFake().signedInAs({
    id: "admin-1",
    nama: "Admin",
    username: "admin",
    role: "admin",
  });
}

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

describe("BarangMasukPage", () => {
  it("menampilkan formulir barang masuk dengan daftar barang aktif", async () => {
    signedInAdmin();
    getFake().table("products", {
      data: [productRow(), productRow({ id: "p-2", kode: "BRG-002", nama: "Teh", stok: 4 })],
      error: null,
    });

    render(await BarangMasukPage());

    expect(
      screen.getByRole("heading", { name: "Barang masuk" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Riwayat barang masuk" }),
    ).toHaveAttribute("href", "/admin/barang-masuk/riwayat");
    expect(screen.getByRole("combobox", { name: "Barang" })).toBeInTheDocument();
    expect(screen.getByText("BRG-001 — Kopi Susu (stok 10)")).toBeInTheDocument();
    expect(screen.getByText("BRG-002 — Teh (stok 4)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Catat barang masuk" }),
    ).toBeInTheDocument();
  });

  it("menampilkan empty state saat belum ada barang aktif", async () => {
    signedInAdmin();
    getFake().table("products", { data: [], error: null });

    render(await BarangMasukPage());

    expect(screen.getByText("Belum ada barang aktif.")).toBeInTheDocument();
    expect(
      screen.getByText("Tambahkan barang terlebih dahulu sebelum mencatat barang masuk."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("menampilkan pesan error saat daftar barang gagal dimuat", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getFake().table("products", {
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    render(await BarangMasukPage());

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGES.ACCESS);
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});

describe("BarangMasukLoading", () => {
  it("menampilkan status memuat formulir barang masuk", () => {
    render(<BarangMasukLoading />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Barang masuk");
    expect(status).toHaveTextContent("Memuat formulir barang masuk…");
  });
});
