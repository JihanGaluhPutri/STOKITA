/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SaleDetail } from "@/types/history";
import { SaleDetailView } from "./sale-detail-view";

const saleTunai: SaleDetail = {
  id: "sale-1",
  noTransaksi: "TRX-2026-0001",
  tanggal: "2026-01-15T10:30:00+07:00",
  total: 47500,
  metodeBayar: "TUNAI",
  bayar: 50000,
  kembalian: 2500,
  kasirNama: "Budi Santoso",
  items: [
    {
      productKode: "BRG-001",
      productNama: "Kopi Instan",
      qty: 2,
      hargaSatuan: 15000,
      subtotal: 30000,
    },
    {
      productKode: "BRG-002",
      productNama: "Gula Pasir",
      qty: 1,
      hargaSatuan: 17500,
      subtotal: 17500,
    },
  ],
};

describe("SaleDetailView", () => {
  it("menampilkan rincian transaksi utama", () => {
    render(<SaleDetailView sale={saleTunai} />);

    expect(screen.getByText("TRX-2026-0001")).toBeInTheDocument();
    expect(screen.getByText(/15 Jan 2026/)).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Tunai")).toBeInTheDocument();
    expect(screen.getByText(/50[.,]000/)).toBeInTheDocument();
    expect(screen.getByText(/2[.,]500/)).toBeInTheDocument();
    expect(screen.getByText(/47[.,]500/)).toHaveClass("strong");
  });

  it("menampilkan metode non-tunai", () => {
    render(
      <SaleDetailView sale={{ ...saleTunai, metodeBayar: "NON_TUNAI" }} />,
    );

    expect(screen.getByText("Non-tunai")).toBeInTheDocument();
    expect(screen.queryByText("Tunai")).toBeNull();
  });

  it("menampilkan tabel item dengan kode, nama, qty, harga, dan subtotal", () => {
    render(<SaleDetailView sale={saleTunai} />);

    const table = screen.getByRole("table");
    expect(
      within(table).getAllByRole("columnheader").map((th) => th.textContent),
    ).toEqual(["Kode", "Barang", "Qty", "Harga satuan", "Subtotal"]);

    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);

    expect(rows[0]).toHaveTextContent("BRG-001");
    expect(rows[0]).toHaveTextContent("Kopi Instan");
    expect(rows[0]).toHaveTextContent("2");
    expect(rows[0]).toHaveTextContent(/15[.,]000/);
    expect(rows[0]).toHaveTextContent(/30[.,]000/);

    expect(rows[1]).toHaveTextContent("BRG-002");
    expect(rows[1]).toHaveTextContent("Gula Pasir");
    expect(rows[1]).toHaveTextContent(/17[.,]500/);
  });

  it("menampilkan daftar item kosong tanpa baris data", () => {
    render(<SaleDetailView sale={{ ...saleTunai, items: [] }} />);

    const table = screen.getByRole("table");
    expect(within(table).queryAllByRole("row")).toHaveLength(1);
    expect(screen.getByText("TRX-2026-0001")).toBeInTheDocument();
  });
});
