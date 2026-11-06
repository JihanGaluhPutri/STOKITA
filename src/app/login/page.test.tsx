/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// redirect Next.js melempar NEXT_REDIRECT di produksi; tiru di test.
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/auth/require-user", () => ({ getSessionProfile: vi.fn() }));
vi.mock("@/app/actions/auth.actions", () => ({ login: vi.fn() }));

import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/require-user";
import type { SessionProfile } from "@/types/auth";
import LoginPage, { metadata } from "./page";

const redirectMock = vi.mocked(redirect);
const getSessionProfileMock = vi.mocked(getSessionProfile);

const kasirProfile: SessionProfile = {
  id: "u2",
  nama: "Siti Aminah",
  username: "siti",
  role: "kasir",
  homePath: "/kasir",
};

function renderPage(next?: string) {
  return LoginPage({
    searchParams: Promise.resolve(next === undefined ? {} : { next }),
  });
}

describe("LoginPage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    getSessionProfileMock.mockReset();
    getSessionProfileMock.mockResolvedValue(null);
  });

  it("menampilkan judul dan form login bila belum sesi", async () => {
    render(await renderPage());

    expect(
      screen.getByRole("heading", { name: "Stokita" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Masuk untuk melanjutkan.")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("meneruskan next yang aman ke form login", async () => {
    render(await renderPage("/admin/barang"));

    expect(
      document.querySelector('input[type="hidden"][name="next"]'),
    ).toHaveValue("/admin/barang");
  });

  it("mengabaikan next lintas domain atau protokol", async () => {
    render(await renderPage("//evil.example"));

    expect(
      document.querySelector('input[type="hidden"][name="next"]'),
    ).toHaveValue("");
  });

  it("mengabaikan next absolut http", async () => {
    render(await renderPage("https://evil.example"));

    expect(
      document.querySelector('input[type="hidden"][name="next"]'),
    ).toHaveValue("");
  });

  it("mengalihkan pengguna yang sudah sesi ke beranda role-nya", async () => {
    getSessionProfileMock.mockResolvedValue(kasirProfile);

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/kasir");
  });

  it("menyediakan metadata judul Login", () => {
    expect(metadata.title).toBe("Login");
  });
});
