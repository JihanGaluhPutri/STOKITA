/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ProductFormState } from "@/app/admin/barang/actions";

import { ProductForm } from "./product-form";

type Action = (
  prevState: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;

function makeAction(
  impl?: (prevState: ProductFormState, formData: FormData) => ProductFormState,
) {
  return vi.fn<Action>(async (prevState, formData) =>
    impl ? impl(prevState, formData) : null,
  );
}

async function isiFormValid() {
  await userEvent.type(screen.getByLabelText("Kode barang"), "BRG-001");
  await userEvent.type(screen.getByLabelText("Nama barang"), "Kopi Susu");
  await userEvent.type(screen.getByLabelText("Harga jual (Rp)"), "15000");
}

async function klikSimpanLaluKonfirmasi() {
  await userEvent.click(screen.getByRole("button", { name: /Simpan (barang|perubahan)/ }));
  const dialog = screen.getByRole("dialog");
  await userEvent.click(
    within(dialog).getByRole("button", { name: /Simpan (barang|perubahan)/ }),
  );
}

describe("ProductForm", () => {
  it("mode create menampilkan seluruh field termasuk stok", () => {
    render(<ProductForm action={makeAction()} mode="create" />);

    for (const label of [
      "Kode barang",
      "Nama barang",
      "Harga beli (Rp)",
      "Harga jual (Rp)",
      "Stok awal",
      "Stok minimum",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", { name: "Simpan barang" }),
    ).toBeInTheDocument();
  });

  it("mode edit menyembunyikan field stok dan memakai defaultValues", () => {
    render(
      <ProductForm
        action={makeAction()}
        mode="edit"
        defaultValues={{
          kode: "BRG-009",
          nama: "Teh Celup",
          hargaBeli: "5000",
          hargaJual: "7000",
        }}
      />,
    );

    expect(screen.getByLabelText("Kode barang")).toHaveValue("BRG-009");
    expect(screen.getByLabelText("Nama barang")).toHaveValue("Teh Celup");
    expect(screen.getByLabelText("Harga jual (Rp)")).toHaveValue(7000);
    expect(screen.queryByLabelText("Stok awal")).toBeNull();
    expect(screen.queryByLabelText("Stok minimum")).toBeNull();
    expect(
      screen.getByText(/Stok hanya berubah melalui barang masuk/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Simpan perubahan" }),
    ).toBeInTheDocument();
  });

  it("menahan dialog konfirmasi saat isian wajib masih kosong", async () => {
    const action = makeAction();
    render(<ProductForm action={action} mode="create" />);

    // Harga jual sengaja dibiarkan kosong (required).
    await userEvent.click(screen.getByRole("button", { name: "Simpan barang" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(action).not.toHaveBeenCalled();
  });

  it("membuka dialog konfirmasi berisi ringkasan kode dan nama", async () => {
    render(<ProductForm action={makeAction()} mode="create" />);
    await isiFormValid();

    await userEvent.click(screen.getByRole("button", { name: "Simpan barang" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Simpan barang baru?");
    expect(dialog).toHaveTextContent(
      "Barang “Kopi Susu” dengan kode BRG-001 akan disimpan ke daftar barang.",
    );

    await userEvent.click(within(dialog).getByRole("button", { name: "Batal" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mengirim isi form ke action dan menampilkan pesan error field", async () => {
    const action = makeAction(() => ({
      fieldErrors: { kode: "Kode barang sudah digunakan." },
    }));
    render(<ProductForm action={action} mode="create" />);
    await isiFormValid();

    await klikSimpanLaluKonfirmasi();

    expect(action).toHaveBeenCalledTimes(1);
    const [prevState, formData] = action.mock.calls[0];
    expect(prevState).toBeNull();
    expect(formData.get("kode")).toBe("BRG-001");
    expect(formData.get("nama")).toBe("Kopi Susu");
    expect(formData.get("hargaBeli")).toBe("0");
    expect(formData.get("hargaJual")).toBe("15000");
    expect(formData.get("stokAwal")).toBe("0");
    expect(formData.get("stokMin")).toBe("0");

    expect(
      await screen.findByText("Kode barang sudah digunakan."),
    ).toBeInTheDocument();
  });

  it("menampilkan error global dari action sebagai alert", async () => {
    const action = makeAction(() => ({
      error: "Gagal menyimpan barang. Silakan coba lagi.",
    }));
    render(<ProductForm action={action} mode="create" />);
    await isiFormValid();

    await klikSimpanLaluKonfirmasi();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Gagal menyimpan barang. Silakan coba lagi.",
    );
  });

  it("menampilkan label Menyimpan… selama action berjalan", async () => {
    let selesai!: (state: ProductFormState) => void;
    const action = vi.fn<Action>(
      () =>
        new Promise<ProductFormState>((resolve) => {
          selesai = resolve;
        }),
    );
    render(<ProductForm action={action} mode="create" />);
    await isiFormValid();

    await klikSimpanLaluKonfirmasi();

    const tombol = await screen.findByRole("button", { name: "Menyimpan…" });
    expect(tombol).toBeDisabled();

    selesai(null);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Simpan barang" }),
      ).toBeEnabled(),
    );
  });
});
