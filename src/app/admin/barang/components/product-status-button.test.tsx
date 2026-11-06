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
  setProductStatusAction: vi.fn(),
}));

import { setProductStatusAction } from "@/app/admin/barang/actions";

import { ProductStatusButton } from "./product-status-button";

const actionMock = vi.mocked(setProductStatusAction);

beforeEach(() => {
  pushMock.mockReset();
  actionMock.mockReset();
  window.history.replaceState(null, "", "/");
});

describe("ProductStatusButton", () => {
  it("menyesuaikan label dan dialog dengan status aktif barang", async () => {
    render(
      <ProductStatusButton
        productId="p-1"
        aktif
        kode="BRG-001"
        nama="Kopi Susu"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Nonaktifkan" }),
    );

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Nonaktifkan barang?" }),
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent(
      "Barang “Kopi Susu” (BRG-001) akan dinonaktifkan dan tidak muncul di pencarian penjualan.",
    );

    await userEvent.click(within(dialog).getByRole("button", { name: "Batal" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(actionMock).not.toHaveBeenCalled();
  });

  it("menampilkan label Aktifkan untuk barang nonaktif", () => {
    render(
      <ProductStatusButton
        productId="p-4"
        aktif={false}
        kode="BRG-004"
        nama="Susu"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Aktifkan" }),
    ).toBeInTheDocument();
  });

  it("memanggil action terikat lalu redirect dengan banner ok", async () => {
    actionMock.mockResolvedValue({ done: "deactivated" });
    window.history.replaceState(null, "", "/admin/barang?q=kopi");

    render(
      <ProductStatusButton
        productId="p-1"
        aktif
        kode="BRG-001"
        nama="Kopi Susu"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Nonaktifkan" }),
    );
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Nonaktifkan",
      }),
    );

    expect(actionMock).toHaveBeenCalledWith(
      "p-1",
      false,
      null,
      expect.any(FormData),
    );
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith(
        "/admin/barang?q=kopi&ok=deactivated",
      ),
    );
  });

  it("menampilkan pesan error saat action gagal", async () => {
    actionMock.mockResolvedValue({
      error: "Barang tidak ditemukan.",
      errorCode: "PRODUCT_NOT_FOUND",
    });

    render(
      <ProductStatusButton
        productId="p-9"
        aktif={false}
        kode="BRG-009"
        nama="Teh"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Aktifkan" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Aktifkan",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Barang tidak ditemukan.",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("menampilkan label Memproses… selama action berjalan", async () => {
    let selesai!: (state: Awaited<ReturnType<typeof actionMock>>) => void;
    actionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          selesai = resolve;
        }),
    );

    render(
      <ProductStatusButton
        productId="p-1"
        aktif
        kode="BRG-001"
        nama="Kopi Susu"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Nonaktifkan" }),
    );
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Nonaktifkan",
      }),
    );

    expect(
      await screen.findByRole("button", { name: "Memproses…" }),
    ).toBeDisabled();

    selesai(null);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Nonaktifkan" }),
      ).toBeEnabled(),
    );
  });
});
