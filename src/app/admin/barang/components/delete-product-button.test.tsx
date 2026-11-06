/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/admin/barang",
  redirect: () => {},
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/app/admin/barang/actions", () => ({
  deleteProductAction: vi.fn(),
}));

import { deleteProductAction } from "@/app/admin/barang/actions";

import { DeleteProductButton } from "./delete-product-button";

const actionMock = vi.mocked(deleteProductAction);

async function konfirmasiHapus() {
  await userEvent.click(screen.getByRole("button", { name: "Hapus" }));
  await userEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Hapus barang",
    }),
  );
}

beforeEach(() => {
  pushMock.mockReset();
  actionMock.mockReset();
  window.history.replaceState(null, "", "/");
});

describe("DeleteProductButton", () => {
  it("menampilkan dialog permanen dengan catatan riwayat sebelum menghapus", async () => {
    render(
      <DeleteProductButton productId="p-1" kode="BRG-001" nama="Kopi Susu" />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Hapus" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", {
        name: "Hapus barang secara permanen?",
      }),
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent(
      "Barang “Kopi Susu” (BRG-001) akan dihapus dari daftar barang.",
    );
    expect(dialog).toHaveTextContent(/tidak dapat dihapus permanen/);

    await userEvent.click(within(dialog).getByRole("button", { name: "Batal" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(actionMock).not.toHaveBeenCalled();
  });

  it("memanggil action terikat lalu redirect dengan banner deleted", async () => {
    actionMock.mockResolvedValue({ done: "deleted" });
    window.history.replaceState(null, "", "/admin/barang?page=2");

    render(
      <DeleteProductButton productId="p-1" kode="BRG-001" nama="Kopi Susu" />,
    );

    await konfirmasiHapus();

    expect(actionMock).toHaveBeenCalledWith(
      "p-1",
      null,
      expect.any(FormData),
    );
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith(
        "/admin/barang?page=2&ok=deleted",
      ),
    );
  });

  it("menambahkan saran menonaktifkan saat ditolak riwayat (23503)", async () => {
    actionMock.mockResolvedValue({
      error: "Barang memiliki riwayat dan tidak dapat dihapus permanen.",
      errorCode: "23503",
    });

    render(
      <DeleteProductButton productId="p-1" kode="BRG-001" nama="Kopi Susu" />,
    );
    await konfirmasiHapus();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Barang memiliki riwayat dan tidak dapat dihapus permanen.",
    );
    expect(alert).toHaveTextContent(
      "Nonaktifkan barang sebagai gantinya agar riwayat tetap tersimpan.",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("menampilkan error biasa tanpa saran menonaktifkan", async () => {
    actionMock.mockResolvedValue({
      error: "Sesi Anda tidak valid. Silakan login kembali.",
      errorCode: "AU001",
    });

    render(
      <DeleteProductButton productId="p-1" kode="BRG-001" nama="Kopi Susu" />,
    );
    await konfirmasiHapus();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Sesi Anda tidak valid. Silakan login kembali.");
    expect(alert).not.toHaveTextContent("Nonaktifkan barang sebagai gantinya");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
