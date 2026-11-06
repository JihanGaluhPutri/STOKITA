/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/app/admin/barang-masuk/actions", () => ({
  stockInAction: vi.fn(),
}));

import { stockInAction } from "@/app/admin/barang-masuk/actions";
import type { Product } from "@/types/product";

import { StockInForm } from "./stock-in-form";

const actionMock = vi.mocked(stockInAction);

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
    stok: 4,
    stokMin: 3,
    aktif: true,
    createdAt: "2026-11-01T00:00:00Z",
  },
];

beforeEach(() => {
  actionMock.mockReset();
});

describe("StockInForm", () => {
  it("menampilkan pilihan barang beserta stok saat ini", () => {
    render(<StockInForm products={PRODUCTS} />);

    const select = screen.getByRole("combobox", { name: "Barang" });
    expect(screen.getByText("Pilih barang…")).toBeInTheDocument();
    expect(
      screen.getByText("BRG-001 — Kopi Susu (stok 10)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("BRG-002 — Teh (stok 4)"),
    ).toBeInTheDocument();
    expect(select).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Catat barang masuk" }),
    ).toBeEnabled();
  });

  it("menahan pencatatan saat barang belum dipilih", async () => {
    render(<StockInForm products={PRODUCTS} />);

    // qty juga masih kosong — form tidak valid.
    await userEvent.click(
      screen.getByRole("button", { name: "Catat barang masuk" }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(actionMock).not.toHaveBeenCalled();
  });

  it("membuka dialog konfirmasi berisi ringkasan qty dan stok", async () => {
    render(<StockInForm products={PRODUCTS} />);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Barang" }), "p-1");
    await userEvent.type(screen.getByLabelText("Jumlah masuk"), "5");
    await userEvent.type(screen.getByLabelText("Referensi (opsional)"), "Nota #9");
    await userEvent.click(
      screen.getByRole("button", { name: "Catat barang masuk" }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Catat barang masuk?");
    expect(dialog).toHaveTextContent(
      "“BRG-001 — Kopi Susu” akan bertambah 5 unit. Stok: 10 → 15.",
    );
    expect(actionMock).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole("button", { name: "Batal" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mengirim data form ke action dan menampilkan ringkasan sukses", async () => {
    actionMock.mockResolvedValue({
      success: { qty: 5, stokSebelum: 10, stokSesudah: 15 },
    });
    render(<StockInForm products={PRODUCTS} />);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Barang" }), "p-1");
    await userEvent.type(screen.getByLabelText("Jumlah masuk"), "5");
    await userEvent.type(screen.getByLabelText("Referensi (opsional)"), "Nota #9");
    await userEvent.type(screen.getByLabelText("Catatan (opsional)"), "Dari supplier");
    await userEvent.click(
      screen.getByRole("button", { name: "Catat barang masuk" }),
    );
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Catat barang masuk",
      }),
    );

    expect(actionMock).toHaveBeenCalledTimes(1);
    const formData = actionMock.mock.calls[0][1];
    expect(formData.get("productId")).toBe("p-1");
    expect(formData.get("qty")).toBe("5");
    expect(formData.get("referensi")).toBe("Nota #9");
    expect(formData.get("catatan")).toBe("Dari supplier");

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(
      "Barang masuk tercatat (qty 5). Stok: 10 → 15.",
    );
    expect(
      screen.getByRole("link", { name: "Lihat riwayat" }),
    ).toHaveAttribute("href", "/admin/barang-masuk/riwayat");
    expect(
      screen.getByRole("link", { name: "Catat lagi" }),
    ).toHaveAttribute("href", "/admin/barang-masuk");
    expect(screen.getByRole("combobox", { name: "Barang" })).toBeDisabled();
    expect(screen.getByLabelText("Jumlah masuk")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Catat barang masuk" }),
    ).toBeDisabled();
  });

  it("menampilkan pesan error saat pencatatan ditolak", async () => {
    actionMock.mockResolvedValue({
      error: "Barang tidak ditemukan atau sudah tidak aktif.",
    });
    render(<StockInForm products={PRODUCTS} />);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Barang" }), "p-2");
    await userEvent.type(screen.getByLabelText("Jumlah masuk"), "3");
    await userEvent.click(
      screen.getByRole("button", { name: "Catat barang masuk" }),
    );
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Catat barang masuk",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Barang tidak ditemukan atau sudah tidak aktif.",
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("combobox", { name: "Barang" })).toBeEnabled();
  });
});
