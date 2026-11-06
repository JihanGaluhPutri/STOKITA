/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";
import { formatDateTime } from "@/lib/business/format";

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

import AdminSalesHistoryPage from "./page";
import AdminSalesHistoryLoading from "./loading";

function signedInAdmin() {
  getFake().signedInAs({
    id: "admin-1",
    nama: "Admin",
    username: "admin",
    role: "admin",
  });
}

function saleRow(over: Record<string, unknown> = {}) {
  return {
    id: "s-1",
    no_transaksi: "TRX-0001",
    tanggal: "2026-11-01T10:00:00Z",
    total: 30000,
    metode_bayar: "TUNAI",
    profiles: { nama: "Budi" },
    ...over,
  };
}

function page(searchParams: Record<string, string> = {}) {
  return AdminSalesHistoryPage({
    searchParams: Promise.resolve(searchParams),
  });
}

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("AdminSalesHistoryPage", () => {
  it("menampilkan seluruh transaksi kasir beserta kolom kasir", async () => {
    signedInAdmin();
    getFake().table("sales", {
      data: [
        saleRow(),
        saleRow({
          id: "s-2",
          no_transaksi: "TRX-0002",
          total: 15000,
          metode_bayar: "NON_TUNAI",
          profiles: { nama: "Siti" },
        }),
      ],
      error: null,
    });

    render(await page());

    expect(
      screen.getByRole("heading", { name: "Riwayat penjualan" }),
    ).toBeInTheDocument();

    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: "Kasir" }),
    ).toBeInTheDocument();
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("TRX-0001")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Budi")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Tunai")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Non-tunai")).toBeInTheDocument();
    expect(within(rows[0]).getByRole("cell", { name: /Rp\s*30\.000/ })).toBeInTheDocument();
    expect(within(rows[0]).getByRole("link", { name: "Lihat" })).toHaveAttribute(
      "href",
      "/admin/penjualan/riwayat/s-1",
    );
    // Filter tanggal aktif sebagai form GET.
    expect(screen.getByLabelText("Tanggal awal")).toHaveValue("");
    expect(
      screen.getByRole("link", { name: "Semua tanggal" }),
    ).toHaveAttribute("href", "/admin/penjualan/riwayat");
  });

  it("menampilkan error filter tanggal yang tidak lengkap", async () => {
    signedInAdmin();

    render(await page({ tanggalAwal: "2026-11-01" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      MESSAGES.DATE_FILTER_INCOMPLETE,
    );
    expect(screen.getByLabelText("Tanggal awal")).toHaveValue("2026-11-01");
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("menampilkan empty state saat tidak ada transaksi", async () => {
    signedInAdmin();
    getFake().table("sales", { data: [], error: null });

    render(await page());

    expect(screen.getByText("Tidak ada transaksi.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("menampilkan pesan error saat riwayat gagal dimuat", async () => {
    // Tanpa sesi: requireUser di service menolak dengan AU001.
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(await page());

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGES.AU001);
  });

  it("memformat tanggal transaksi sesuai zona waktu bisnis", async () => {
    signedInAdmin();
    getFake().table("sales", { data: [saleRow()], error: null });

    render(await page());

    const row = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(within(row).getAllByRole("cell")[1].textContent).toBe(
      formatDateTime("2026-11-01T10:00:00Z"),
    );
  });
});

describe("AdminSalesHistoryLoading", () => {
  it("menampilkan status memuat riwayat", () => {
    render(<AdminSalesHistoryLoading />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Riwayat penjualan");
    expect(status).toHaveTextContent("Memuat riwayat…");
  });
});
