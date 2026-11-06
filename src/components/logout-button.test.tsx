/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Server action "use server" diganti mock agar sesi tidak benar-benar diakhiri.
vi.mock("@/app/actions/auth.actions", () => ({ logout: vi.fn() }));

import { logout } from "@/app/actions/auth.actions";
import { LogoutButton } from "./logout-button";

const logoutMock = vi.mocked(logout);

describe("LogoutButton", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    logoutMock.mockResolvedValue(null);
  });

  it("menampilkan tombol Keluar tanpa dialog sebelum ditekan", () => {
    render(<LogoutButton />);

    expect(screen.getByRole("button", { name: "Keluar" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("membuka dialog konfirmasi setelah tombol Keluar ditekan", async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Keluar" }));

    expect(
      screen.getByRole("heading", { name: "Keluar dari Stokita?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Keluar dari Stokita?" }),
    ).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText(/Sesi Anda akan berakhir/)).toBeInTheDocument();
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("tombol Batal menutup dialog tanpa mengirim form", async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Keluar" }));
    await user.click(screen.getByRole("button", { name: "Batal" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("konfirmasi mengirim form logout ke server action", async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Keluar" }));
    await user.click(screen.getByRole("button", { name: "Ya, keluar" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    const [prevState, formData] = logoutMock.mock.calls[0];
    expect(prevState).toBeNull();
    expect(formData).toBeInstanceOf(FormData);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("menampilkan pesan error bila server action gagal", async () => {
    logoutMock.mockResolvedValue({ error: "Logout gagal. Silakan coba lagi." });
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Keluar" }));
    await user.click(screen.getByRole("button", { name: "Ya, keluar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Logout gagal. Silakan coba lagi.",
    );
  });
});
