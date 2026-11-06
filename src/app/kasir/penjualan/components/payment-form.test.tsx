/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { formatRupiah } from "@/lib/business/format";
import type { PaymentMethod } from "@/types/sale";

import { PaymentForm } from "./payment-form";

/** Harness menahan state metode & bayar seperti pada SaleTerminal. */
function Harness({
  total,
  disabled = false,
}: {
  total: number;
  disabled?: boolean;
}) {
  const [metode, setMetode] = useState<PaymentMethod | "">("");
  const [bayar, setBayar] = useState("");
  return (
    <PaymentForm
      total={total}
      metode={metode}
      bayar={bayar}
      disabled={disabled}
      onMetodeChange={setMetode}
      onBayarChange={setBayar}
    />
  );
}

describe("PaymentForm", () => {
  it("hanya menampilkan pemilih metode sebelum metode dipilih", () => {
    render(<Harness total={15000} />);

    expect(
      screen.getByRole("combobox", { name: "Metode pembayaran" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Uang dibayar (Rp)")).toBeNull();
    expect(screen.queryByText(/Pembayaran non-tunai/)).toBeNull();
  });

  it("menampilkan nominal bayar dan kembalian untuk pembayaran tunai", async () => {
    render(<Harness total={15000} />);

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Metode pembayaran" }),
      "TUNAI",
    );
    await userEvent.type(screen.getByLabelText("Uang dibayar (Rp)"), "20000");

    const kembalian = screen.getByText(/^Kembalian:/);
    expect(kembalian.textContent).toBe(
      "Kembalian: " + formatRupiah(5000),
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("menampilkan error saat uang dibayar kurang dari total", async () => {
    render(<Harness total={15000} />);

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Metode pembayaran" }),
      "TUNAI",
    );
    await userEvent.type(screen.getByLabelText("Uang dibayar (Rp)"), "10000");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Uang dibayar kurang dari total transaksi.",
    );
    expect(screen.queryByText(/^Kembalian:/)).toBeNull();
  });

  it("menampilkan catatan pembayaran non-tunai tanpa input nominal", async () => {
    render(<Harness total={15000} />);

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Metode pembayaran" }),
      "NON_TUNAI",
    );

    const catatan = screen.getByText(/Pembayaran non-tunai/);
    expect(catatan.textContent).toContain(formatRupiah(15000));
    expect(catatan.textContent).toContain("kembalian 0");
    expect(screen.queryByLabelText("Uang dibayar (Rp)")).toBeNull();
  });

  it("menonaktifkan kontrol saat komponen disabled", async () => {
    render(<Harness total={15000} disabled />);

    const select = screen.getByRole("combobox", { name: "Metode pembayaran" });
    expect(select).toBeDisabled();

    await userEvent.selectOptions(select, "TUNAI");
    // nilai tidak berubah karena kontrol dinonaktifkan
    expect(select).toHaveValue("");
  });
});
