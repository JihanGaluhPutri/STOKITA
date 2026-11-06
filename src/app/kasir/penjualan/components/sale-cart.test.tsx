/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { MESSAGES } from "@/lib/business/messages";
import { formatRupiah } from "@/lib/business/format";

import { SaleCart, type CartItem } from "./sale-cart";

const ITEMS: CartItem[] = [
  {
    productId: "p-1",
    kode: "BRG-001",
    nama: "Kopi Susu",
    hargaJual: 15000,
    stokTersedia: 10,
    qty: 2,
  },
  {
    productId: "p-2",
    kode: "BRG-002",
    nama: "Teh",
    hargaJual: 7000,
    stokTersedia: 5,
    qty: 1,
  },
];

/** Harness menahan keranjang agar perubahan qty/hapus terlihat di DOM. */
function Harness({ initial }: { initial: CartItem[] }) {
  const [items, setItems] = useState(initial);
  return (
    <SaleCart
      items={items}
      onQtyChange={(productId, qty) =>
        setItems((current) =>
          current.map((item) =>
            item.productId === productId ? { ...item, qty } : item,
          ),
        )
      }
      onRemove={(productId) =>
        setItems((current) =>
          current.filter((item) => item.productId !== productId),
        )
      }
    />
  );
}

function totalValue() {
  return screen.getByText("Total").nextElementSibling?.textContent ?? "";
}

describe("SaleCart", () => {
  it("menampilkan empty state saat keranjang kosong", () => {
    render(<Harness initial={[]} />);

    expect(screen.getByText("Keranjang masih kosong.")).toBeInTheDocument();
    expect(
      screen.getByText("Tambahkan barang dari daftar pencarian."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Qty/)).toBeNull();
  });

  it("menampilkan item, subtotal, dan total keranjang", () => {
    render(<Harness initial={ITEMS} />);

    expect(screen.getByText("BRG-001")).toBeInTheDocument();
    expect(screen.getByText("BRG-002")).toBeInTheDocument();

    const subtotalPertama = screen.getByText(/× 2 =/);
    expect(subtotalPertama.textContent).toContain(formatRupiah(30000));

    // 15000 × 2 + 7000 × 1
    expect(totalValue()).toBe(formatRupiah(37000));
  });

  it("memperbarui qty item dan total saat diubah", () => {
    render(<Harness initial={ITEMS} />);

    fireEvent.change(screen.getByLabelText("Qty Kopi Susu"), {
      target: { value: "3" },
    });

    expect(screen.getByLabelText("Qty Kopi Susu")).toHaveValue(3);
    // 15000 × 3 + 7000
    expect(totalValue()).toBe(formatRupiah(52000));
  });

  it("menghapus item dari keranjang", async () => {
    render(<Harness initial={ITEMS} />);

    await userEvent.click(
      screen.getAllByRole("button", { name: "Hapus" })[0],
    );

    expect(screen.queryByText("BRG-001")).toBeNull();
    expect(screen.getByText("BRG-002")).toBeInTheDocument();
    expect(totalValue()).toBe(formatRupiah(7000));
  });

  it("menampilkan error qty tidak valid dan total menjadi strip", () => {
    render(<Harness initial={ITEMS} />);

    fireEvent.change(screen.getByLabelText("Qty Kopi Susu"), {
      target: { value: "0" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGES.CT002);
    expect(totalValue()).toBe("—");
  });

  it("menampilkan error saat qty melebihi stok tersedia", () => {
    render(<Harness initial={ITEMS} />);

    fireEvent.change(screen.getByLabelText("Qty Kopi Susu"), {
      target: { value: "99" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Qty melebihi stok tersedia (10).",
    );
  });
});
