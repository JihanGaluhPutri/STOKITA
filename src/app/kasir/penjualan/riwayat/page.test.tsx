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

import KasirSalesHistoryPage from "./page";
import KasirSalesHistoryLoading from "./loading";

function signedInKasir() {
  getFake().signedInAs({
    id: "kasir-1",
    nama: "Budi",
    username: "budi",
    role: "kasir",
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
  return KasirSalesHistoryPage({ searchParams: Promise.resolve(searchParams) });
}

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("KasirSalesHistoryPage", () => {
  it("menampilkan transaksi milik kasir sendiri tanpa kolom kasir", async () => {
    signedInKasir();
    getFake().table("sales", {
      data: [saleRow(), saleRow({ id: "s-2", no_transaksi: "TRX-0002" })],
      error: null,
    });

    render(await page());

    expect(
      screen.getByRole("heading", { name: "Riwayat penjualan" }),
    ).toBeInTheDocument();

    const table = screen.getByRole("table");
    expect(
      table.querySelector("th"),
    ).toHaveTextContent("No. transaksi");
    expect(
      within(table).queryByRole("columnheader", { name: "Kasir" }),
    ).toBeNull(); // transaksi sendiri — kolom kasir tidak diperlukan

    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("TRX-0001")).toBeInTheDocument();
    expect(within(rows[0]).getByRole("link", { name: "Lihat" })).toHaveAttribute(
      "href",
      "/kasir/penjualan/riwayat/s-1",
    );
    expect(within(rows[0]).getAllByRole("cell")[1].textContent).toBe(
      formatDateTime("2026-11-01T10:00:00Z"),
    );

    // Filter hanya mengirim transaksi milik kasir yang login.
    const eqCalls = getFake().findCalls("sales.eq");
    expect(eqCalls).toHaveLength(1);
    expect(eqCalls[0].args).toEqual(["kasir_id", "kasir-1"]);

    expect(screen.getByLabelText("Tanggal awal")).toHaveValue("");
    expect(
      screen.getByRole("link", { name: "Semua tanggal" }),
    ).toHaveAttribute("href", "/kasir/penjualan/riwayat");
  });

  it("menampilkan empty state saat tidak ada transaksi", async () => {
    signedInKasir();
    getFake().table("sales", { data: [], error: null });

    render(await page());

    expect(screen.getByText("Tidak ada transaksi.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("menampilkan error filter tanggal yang tidak lengkap", async () => {
    signedInKasir();

    render(await page({ tanggalAkhir: "2026-11-30" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      MESSAGES.DATE_FILTER_INCOMPLETE,
    );
    expect(screen.getByLabelText("Tanggal akhir")).toHaveValue("2026-11-30");
  });

  it("menampilkan pesan error saat sesi tidak valid", async () => {
    // Tanpa sesi: requireUser di service menolak dengan AU001.
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(await page());

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGES.AU001);
  });
});

describe("KasirSalesHistoryLoading", () => {
  it("menampilkan status memuat riwayat", () => {
    render(<KasirSalesHistoryLoading />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Riwayat penjualan");
    expect(status).toHaveTextContent("Memuat riwayat…");
  });
});
