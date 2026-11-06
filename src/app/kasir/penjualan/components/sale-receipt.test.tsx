/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { formatDateTime } from "@/lib/business/format";
import type { CheckoutResult } from "@/types/sale";

import { SaleReceipt } from "./sale-receipt";

const RECEIPT: CheckoutResult = {
  sale_id: "sale-1",
  no_transaksi: "TRX-0009",
  total: 30000,
  metode_bayar: "TUNAI",
  bayar: 50000,
  kembalian: 20000,
  tanggal: "2026-11-01T10:00:00Z",
  items: [
    {
      product_id: "p-1",
      kode: "BRG-001",
      nama: "Kopi Susu",
      qty: 2,
      harga_satuan: 15000,
      subtotal: 30000,
    },
  ],
};

function summaryValue(label: string) {
  return within(screen.getByText(label).parentElement!).getByText(/.+/u, {
    selector: "span:last-child",
  });
}

describe("SaleReceipt", () => {
  it("menampilkan struk lengkap dengan item, total, dan kembalian", () => {
    render(<SaleReceipt receipt={RECEIPT} onNewSale={vi.fn()} />);

    const struk = screen.getByTestId("struk");
    expect(within(struk).getByText("Stokita")).toBeInTheDocument();
    expect(within(struk).getByText("TRX-0009")).toBeInTheDocument();
    // Tanggal mentah (bandingkan langsung agar aman terhadap spasi NBSP).
    expect(
      struk.querySelector(".receipt-no")?.nextElementSibling?.textContent,
    ).toBe(formatDateTime(RECEIPT.tanggal));

    const baris = within(within(struk).getByRole("table")).getAllByRole(
      "row",
    )[1];
    expect(within(baris).getByText("BRG-001")).toBeInTheDocument();
    expect(within(baris).getByText("Kopi Susu")).toBeInTheDocument();
    expect(within(baris).getByText("2")).toBeInTheDocument();
    const sel = within(baris).getAllByRole("cell");
    expect(sel[2]).toHaveTextContent("15.000"); // formatNumberRupiah
    expect(sel[3]).toHaveTextContent("30.000");

    expect(summaryValue("Total")).toHaveTextContent(/Rp\s*30\.000/);
    expect(summaryValue("Metode")).toHaveTextContent("Tunai");
    expect(summaryValue("Dibayar")).toHaveTextContent(/Rp\s*50\.000/);
    expect(summaryValue("Kembalian")).toHaveTextContent(/Rp\s*20\.000/);

    expect(
      screen.getByText("Terima kasih atas kunjungan Anda."),
    ).toBeInTheDocument();
  });

  it("memanggil window.print saat tombol Cetak struk ditekan", async () => {
    const printMock = vi.fn();
    Object.defineProperty(window, "print", {
      value: printMock,
      configurable: true,
      writable: true,
    });
    render(<SaleReceipt receipt={RECEIPT} onNewSale={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Cetak struk" }));

    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it("memanggil onNewSale saat tombol Transaksi baru ditekan", async () => {
    const onNewSale = vi.fn();
    render(<SaleReceipt receipt={RECEIPT} onNewSale={onNewSale} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Transaksi baru" }),
    );

    expect(onNewSale).toHaveBeenCalledTimes(1);
  });
});
