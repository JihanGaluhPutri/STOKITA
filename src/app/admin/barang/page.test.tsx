/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
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

// Tombol aksi di tabel memakai useRouter; redirect/notFound cukup no-op.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/admin/barang",
  redirect: () => {},
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

import BarangPage from "./page";
import BarangLoading from "./loading";

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

function page(searchParams: Record<string, string> = {}) {
  return BarangPage({ searchParams: Promise.resolve(searchParams) });
}

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("BarangPage", () => {
  it("menampilkan tabel barang lengkap dengan badge status dan aksi", async () => {
    getFake().table("products", {
      data: [
        productRow({ stok: 0, stok_min: 2 }), // HABIS
        productRow({ id: "p-2", kode: "BRG-002", nama: "Teh", stok: 2, stok_min: 5 }), // MENIPIS
        productRow({ id: "p-3", kode: "BRG-003", nama: "Gula", stok: 50, stok_min: 5 }), // AMAN
        productRow({ id: "p-4", kode: "BRG-004", nama: "Susu", aktif: false }), // Nonaktif
      ],
      error: null,
    });

    render(await page());

    expect(screen.getByRole("heading", { name: "Barang" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tambah barang" })).toHaveAttribute(
      "href",
      "/admin/barang/tambah",
    );
    expect(screen.getByText(/4 barang ditemukan/)).toBeInTheDocument();

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(4);

    expect(within(rows[0]).getByText("Habis")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Menipis")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Aktif")).toBeInTheDocument();
    expect(within(rows[3]).getByText("Nonaktif")).toBeInTheDocument();
    const sel = within(rows[0]).getAllByRole("cell");
    expect(sel[2]).toHaveTextContent(/Rp\s*10\.000/); // harga beli
    expect(sel[3]).toHaveTextContent(/Rp\s*15\.000/); // harga jual
    expect(sel[4]).toHaveTextContent("0"); // stok
    expect(within(rows[0]).getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/admin/barang/p-1/edit",
    );
    expect(within(rows[0]).getByRole("button", { name: "Nonaktifkan" })).toBeInTheDocument();
    expect(within(rows[3]).getByRole("button", { name: "Aktifkan" })).toBeInTheDocument();
    expect(within(rows[0]).getByRole("button", { name: "Hapus" })).toBeInTheDocument();
  });

  it("menampilkan banner sukses sesuai kode ok dan mengabaikan kode tak dikenal", async () => {
    getFake().table("products", { data: [], error: null });

    const { rerender } = render(await page({ ok: "created" }));
    expect(screen.getByText("Barang berhasil ditambahkan.")).toBeInTheDocument();

    rerender(await page({ ok: "deleted" }));
    expect(screen.getByText("Barang berhasil dihapus.")).toBeInTheDocument();

    rerender(await page({ ok: "ngawur" }));
    expect(screen.queryByText(/berhasil/)).toBeNull();
  });

  it("menampilkan empty state saat belum ada barang", async () => {
    getFake().table("products", { data: [], error: null });

    render(await page());

    expect(screen.getByText("Belum ada barang.")).toBeInTheDocument();
    expect(screen.getByText("Tambahkan barang pertama Anda.")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Cari barang" })).toHaveValue("");
  });

  it("menampilkan empty state khusus pencarian tanpa hasil", async () => {
    const fake = getFake();
    fake.table("products", { data: [], error: null });

    render(await page({ q: "kopi" }));

    expect(screen.getByText("Tidak ada barang yang cocok.")).toBeInTheDocument();
    expect(screen.getByText("Coba kata kunci lain.")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Cari barang" })).toHaveValue("kopi");
    expect(fake.findCalls(/^products\.or$/)).toHaveLength(1);
  });

  it("menampilkan ringkasan hasil pencarian beserta isinya", async () => {
    getFake().table("products", { data: [productRow()], error: null });

    render(await page({ q: "kopi" }));

    expect(screen.getByText(/1 barang ditemukan untuk pencarian/)).toBeInTheDocument();
    expect(screen.getByText("BRG-001")).toBeInTheDocument();
  });

  it("menampilkan pesan error saat daftar barang gagal dimuat", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getFake().table("products", {
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    render(await page());

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGES.ACCESS);
    expect(screen.queryByRole("table")).toBeNull();
  });
});

describe("BarangLoading", () => {
  it("menampilkan status memuat data barang", () => {
    render(<BarangLoading />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Barang");
    expect(status).toHaveTextContent("Memuat data barang…");
  });
});
