/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Server action "use server" diganti mock agar tidak memanggil Supabase.
vi.mock("@/app/actions/auth.actions", () => ({ login: vi.fn() }));

import { login } from "@/app/actions/auth.actions";
import { LoginForm } from "./login-form";

const loginMock = vi.mocked(login);

describe("LoginForm", () => {
  beforeEach(() => {
    loginMock.mockReset();
    loginMock.mockResolvedValue(null);
  });

  it("merender field username, password, dan next tersembunyi", () => {
    render(<LoginForm next="/admin/barang" />);

    const username = screen.getByLabelText("Username");
    expect(username).toHaveAttribute("type", "text");
    expect(username).toBeRequired();

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toBeRequired();

    const nextInput = document.querySelector(
      'input[type="hidden"][name="next"]',
    );
    expect(nextInput).toHaveValue("/admin/barang");
    expect(screen.getByRole("button", { name: "Masuk" })).toBeInTheDocument();
  });

  it("menampilkan dan menyembunyikan password saat tombol mata ditekan", async () => {
    const user = userEvent.setup();
    render(<LoginForm next="" />);

    const password = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Tampilkan password" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(password).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Sembunyikan password" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Sembunyikan password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("mengirim kredensial dan next ke server action saat submit", async () => {
    const user = userEvent.setup();
    render(<LoginForm next="/admin/barang" />);

    await user.type(screen.getByLabelText("Username"), "budi");
    await user.type(screen.getByLabelText("Password"), "rahasia123");
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
    const [prevState, formData] = loginMock.mock.calls[0];
    expect(prevState).toBeNull();
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("username")).toBe("budi");
    expect(formData.get("password")).toBe("rahasia123");
    expect(formData.get("next")).toBe("/admin/barang");
  });

  it("menampilkan pesan error bila login ditolak", async () => {
    loginMock.mockResolvedValue({ error: "Username atau password salah." });
    const user = userEvent.setup();
    render(<LoginForm next="" />);

    await user.type(screen.getByLabelText("Username"), "budi");
    await user.type(screen.getByLabelText("Password"), "salah");
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Username atau password salah.",
    );
  });
});
