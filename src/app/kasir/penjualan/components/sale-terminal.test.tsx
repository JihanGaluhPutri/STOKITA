/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/kasir/penjualan/actions", () => ({
  checkoutAction: vi.fn(),
}));

import { checkoutAction } from "@/app/kasir/penjualan/actions";
import { formatRupiah } from "@/lib/business/format";
import type { Product } from "@/types/product";
import type { CheckoutResult } from "@/types/sale";

import { SaleTerminal } from "./sale-terminal";

const actionMock = vi.mocked(checkoutAction);

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
    nama: "Teh",
    hargaBeli: 5000,
    hargaJual: 7000,
    stok: 5,
    stokMin: 3,
    aktif: true,
    createdAt: "2026-11-01T00:00:00Z",
  },
];

const RECEIPT: CheckoutResult = {
  sale_id: "sale-1",
  no_transaksi: "TRX-0009",
  total: 15000,
  metode_bayar: "TUNAI",
  bayar: 15000,
  kembalian: 0,
  tanggal: "2026-11-01T10:00:00Z",
  items: [
    {
      product_id: "p-1",
      kode: "BRG-001",
      nama: "Kopi Susu",
      qty: 1,
      harga_satuan: 15000,
      subtotal: 15000,
    },
  ],
};

function totalValue() {
  return screen.getByText("Total").nextElementSibling?.textContent ?? "";
}

async function tambahPertama() {
  await userEvent.click(screen.getAllByRole("button", { name: "Tambah" })[0]);
}

async function pilihMetode(metode: "TUNAI" | "NON_TUNAI") {
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Metode pembayaran" }),
    metode,
  );
}

async function bayarSekarang() {
  await userEvent.click(
    screen.getByRole("button", { name: "Bayar & selesaikan" }),
  );
  await userEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Bayar & selesaikan",
    }),
  );
}

beforeEach(() => {
  actionMock.mockReset();
});

describe("SaleTerminal", () => {
  it("menambahkan barang ke keranjang dan menghitung total", async () => {
    render(<SaleTerminal products={PRODUCTS} />);

    await tambahPertama();

    expect(screen.getByLabelText("Qty Kopi Susu")).toHaveValue(1);
    // Sekali di daftar pencarian, sekali di keranjang.
    expect(screen.getAllByText("BRG-001")).toHaveLength(2);
    expect(totalValue()).toBe(formatRupiah(15000));

    // Barang yang sama menambah qty, bukan baris baru.
    await tambahPertama();
    expect(screen.getByLabelText("Qty Kopi Susu")).toHaveValue(2);
    expect(totalValue()).toBe(formatRupiah(30000));
    expect(screen.getAllByLabelText("Qty Kopi Susu")).toHaveLength(1);
  });

  it("mengubah qty dan menghapus item dari keranjang", async () => {
    render(<SaleTerminal products={PRODUCTS} />);

    await tambahPertama();
    fireEvent.change(screen.getByLabelText("Qty Kopi Susu"), {
      target: { value: "3" },
    });
    expect(screen.getByLabelText("Qty Kopi Susu")).toHaveValue(3);
    expect(totalValue()).toBe(formatRupiah(45000));

    await userEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(screen.getByText("Keranjang masih kosong.")).toBeInTheDocument();
    // Keranjang kosong — baris total ikut hilang.
    expect(screen.queryByText("Total")).toBeNull();
  });

  it("menonaktifkan tombol bayar sebelum metode pembayaran dipilih", async () => {
    render(<SaleTerminal products={PRODUCTS} />);

    const bayar = screen.getByRole("button", { name: "Bayar & selesaikan" });
    expect(bayar).toBeDisabled();

    await tambahPertama();
    expect(bayar).toBeDisabled(); // metode masih kosong

    await pilihMetode("TUNAI");
    // Nominal tunai otomatis diisi sebesar total.
    expect(bayar).toBeEnabled();
  });

  it("memproses pembayaran tunai dan menampilkan struk", async () => {
    actionMock.mockResolvedValue({ receipt: RECEIPT });
    render(<SaleTerminal products={PRODUCTS} />);

    await tambahPertama();
    await pilihMetode("TUNAI");
    await bayarSekarang();

    expect(actionMock).toHaveBeenCalledTimes(1);
    const formData = actionMock.mock.calls[0][1];
    expect(JSON.parse(String(formData.get("items")))).toEqual([
      { product_id: "p-1", qty: 1 },
    ]);
    expect(formData.get("metodeBayar")).toBe("TUNAI");
    expect(formData.get("bayar")).toBe("15000");

    const struk = await screen.findByTestId("struk");
    expect(within(struk).getByText("TRX-0009")).toBeInTheDocument();

    // Transaksi baru mengembalikan terminal ke sesi kosong.
    await userEvent.click(
      screen.getByRole("button", { name: "Transaksi baru" }),
    );
    expect(screen.getByLabelText("Cari barang")).toBeInTheDocument();
    expect(screen.getByText("Keranjang masih kosong.")).toBeInTheDocument();
  });

  it("memproses pembayaran non-tunai tanpa nominal tunai", async () => {
    actionMock.mockResolvedValue({
      receipt: { ...RECEIPT, metode_bayar: "NON_TUNAI" },
    });
    render(<SaleTerminal products={PRODUCTS} />);

    await tambahPertama();
    await pilihMetode("NON_TUNAI");
    await bayarSekarang();

    const formData = actionMock.mock.calls[0][1];
    expect(formData.get("metodeBayar")).toBe("NON_TUNAI");
    expect(formData.get("bayar")).toBe("");
    expect(await screen.findByTestId("struk")).toBeInTheDocument();
  });

  it("menampilkan pesan error saat checkout ditolak server", async () => {
    actionMock.mockResolvedValue({ error: "Stok barang tidak mencukupi." });
    render(<SaleTerminal products={PRODUCTS} />);

    await tambahPertama();
    await pilihMetode("TUNAI");
    await bayarSekarang();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Stok barang tidak mencukupi.",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Bayar & selesaikan" }),
    ).toBeEnabled(); // bisa dicoba ulang
    expect(screen.queryByTestId("struk")).toBeNull();
  });

  it("menampilkan peringatan saat qty melebihi stok dan menonaktifkan bayar", async () => {
    render(<SaleTerminal products={PRODUCTS} />);

    await tambahPertama();
    fireEvent.change(screen.getByLabelText("Qty Kopi Susu"), {
      target: { value: "99" },
    });

    expect(
      screen.getByText(/Periksa kembali qty di keranjang/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bayar & selesaikan" }),
    ).toBeDisabled();
  });
});
