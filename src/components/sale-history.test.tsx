/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import type { SalesHistoryItem } from "@/types/history";
import { SaleHistoryView } from "./sale-history";

const items: SalesHistoryItem[] = [
  {
    id: "s1",
    noTransaksi: "TRX-001",
    tanggal: "2026-01-15T10:30:00+07:00",
    total: 47500,
    metodeBayar: "TUNAI",
    kasirNama: "Budi Santoso",
  },
  {
    id: "s2",
    noTransaksi: "TRX-002",
    tanggal: "2026-01-16T09:00:00+07:00",
    total: 120000,
    metodeBayar: "NON_TUNAI",
    kasirNama: "Siti Aminah",
  },
];

const baseProps = {
  items,
  action: "/admin/penjualan/riwayat",
  showKasir: true,
  filterAwal: "2026-01-01",
  filterAkhir: "2026-01-31",
};

describe("SaleHistoryView", () => {
  it("menampilkan form filter tanggal dengan nilai awal", () => {
    render(<SaleHistoryView {...baseProps} />);

    const form = document.querySelector("form.filter-form") as HTMLFormElement;
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/admin/penjualan/riwayat");

    expect(screen.getByLabelText("Tanggal awal")).toHaveValue("2026-01-01");
    expect(screen.getByLabelText("Tanggal akhir")).toHaveValue("2026-01-31");
    expect(
      screen.getByRole("button", { name: "Terapkan filter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Semua tanggal" }),
    ).toHaveAttribute("href", "/admin/penjualan/riwayat");
  });

  it("menampilkan transaksi dalam tabel beserta tautan rinciannya", () => {
    render(<SaleHistoryView {...baseProps} />);

    const table = screen.getByRole("table");
    expect(
      within(table).getAllByRole("columnheader").map((th) => th.textContent),
    ).toEqual([
      "No. transaksi",
      "Tanggal",
      "Kasir",
      "Total",
      "Metode",
      "Rincian",
    ]);

    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);

    expect(rows[0]).toHaveTextContent("TRX-001");
    expect(rows[0]).toHaveTextContent(/15 Jan 2026/);
    expect(rows[0]).toHaveTextContent("Budi Santoso");
    expect(rows[0]).toHaveTextContent(/47[.,]500/);
    expect(rows[0]).toHaveTextContent("Tunai");
    expect(
      within(rows[0]).getByRole("link", { name: "Lihat" }),
    ).toHaveAttribute("href", "/admin/penjualan/riwayat/s1");

    expect(rows[1]).toHaveTextContent("TRX-002");
    expect(rows[1]).toHaveTextContent("Siti Aminah");
    expect(rows[1]).toHaveTextContent(/120[.,]000/);
    expect(rows[1]).toHaveTextContent("Non-tunai");
    expect(
      within(rows[1]).getByRole("link", { name: "Lihat" }),
    ).toHaveAttribute("href", "/admin/penjualan/riwayat/s2");
  });

  it("menyembunyikan kolom kasir bila showKasir false", () => {
    render(<SaleHistoryView {...baseProps} showKasir={false} />);

    const table = screen.getByRole("table");
    expect(
      within(table).queryByRole("columnheader", { name: "Kasir" }),
    ).toBeNull();
    expect(screen.queryByText("Budi Santoso")).toBeNull();
    expect(screen.queryByText("Siti Aminah")).toBeNull();
    expect(screen.getByText("TRX-001")).toBeInTheDocument();
  });

  it("menampilkan pesan error alih-alih tabel", () => {
    render(<SaleHistoryView {...baseProps} error="Gagal memuat riwayat." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Gagal memuat riwayat.");
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("TRX-001")).toBeNull();
  });

  it("menampilkan empty state bila tidak ada transaksi", () => {
    render(<SaleHistoryView {...baseProps} items={[]} />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Tidak ada transaksi.");
    expect(
      screen.getByText("Belum ada penjualan pada rentang tanggal yang dipilih."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
