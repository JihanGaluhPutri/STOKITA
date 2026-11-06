/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./confirm-dialog";

function setup(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Hapus barang?"
      description="Data yang dihapus tidak dapat dipulihkan."
      confirmLabel="Hapus"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel };
}

describe("ConfirmDialog", () => {
  it("tidak merender apa pun saat tertutup", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Hapus barang?"
        confirmLabel="Hapus"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Hapus barang?" })).toBeNull();
  });

  it("merender dialog terbuka dengan judul, deskripsi, dan detail", () => {
    setup({ details: <strong>BRG-001</strong> });

    const dialog = screen.getByRole("dialog", { name: "Hapus barang?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByText("Data yang dihapus tidak dapat dipulihkan."),
    ).toBeInTheDocument();
    expect(screen.getByText("BRG-001")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Batal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hapus" }),
    ).toBeInTheDocument();
  });

  it("fokus awal jatuh ke tombol Batal", () => {
    setup();

    expect(screen.getByRole("button", { name: "Batal" })).toHaveFocus();
  });

  it("tombol Batal memanggil onCancel tanpa onConfirm", () => {
    const { onConfirm, onCancel } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("tombol konfirmasi memanggil onConfirm", () => {
    const { onConfirm, onCancel } = setup({ danger: true });

    const confirm = screen.getByRole("button", { name: "Hapus" });
    expect(confirm).toHaveClass("button-danger");
    fireEvent.click(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("Escape membatalkan dialog", () => {
    const { onCancel } = setup();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("Escape diabaikan saat sedang memproses (busy)", () => {
    const { onConfirm, onCancel } = setup({ busy: true });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Hapus" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Batal" })).toBeDisabled();
  });

  it("klik backdrop membatalkan, klik isi dialog tidak", () => {
    const { onCancel } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Tutup dialog" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("dialog"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("mengembalikan fokus ke pemicu setelah dialog ditutup", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(
      <>
        <button type="button">Pemicu</button>
        <ConfirmDialog
          open={false}
          title="Hapus barang?"
          confirmLabel="Hapus"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Pemicu" });
    trigger.focus();

    rerender(
      <>
        <button type="button">Pemicu</button>
        <ConfirmDialog
          open
          title="Hapus barang?"
          confirmLabel="Hapus"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </>,
    );
    expect(screen.getByRole("button", { name: "Batal" })).toHaveFocus();

    rerender(
      <>
        <button type="button">Pemicu</button>
        <ConfirmDialog
          open={false}
          title="Hapus barang?"
          confirmLabel="Hapus"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </>,
    );
    expect(trigger).toHaveFocus();
  });
});
