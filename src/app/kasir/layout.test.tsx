/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
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

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth/require-role", () => ({ requireRole: vi.fn() }));
// Server action "use server" cukup jadi stub untuk tombol keluar.
vi.mock("@/app/actions/auth.actions", () => ({ logout: vi.fn() }));
// Nav asli memakai usePathname; layout cukup divalidasi memanggilnya.
vi.mock("./nav", () => ({
  KasirNav: () => <nav aria-label="Navigasi kasir" />,
}));

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import type { SessionProfile } from "@/types/auth";
import KasirLayout from "./layout";

const redirectMock = vi.mocked(redirect);
const requireRoleMock = vi.mocked(requireRole);

const kasirProfile: SessionProfile = {
  id: "u2",
  nama: "Siti Aminah",
  username: "siti",
  role: "kasir",
  homePath: "/kasir",
};

describe("KasirLayout", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    requireRoleMock.mockReset();
  });

  it("merender shell kasir dengan header, nav, dan children bila role cocok", async () => {
    requireRoleMock.mockResolvedValue({ ok: true, data: kasirProfile });

    render(
      await KasirLayout({ children: <p>Konten kasir</p> }),
    );

    expect(requireRoleMock).toHaveBeenCalledWith("kasir");
    expect(screen.getByRole("banner")).toHaveTextContent("Siti Aminah");
    expect(screen.getByRole("banner")).toHaveTextContent("Kasir");
    expect(
      screen.getByRole("navigation", { name: "Navigasi kasir" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Konten kasir")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("mengalihkan ke login bila sesi tidak valid (AU001)", async () => {
    requireRoleMock.mockResolvedValue({
      ok: false,
      error: { code: "AU001", message: "Sesi Anda tidak valid. Silakan login kembali." },
    });

    render(
      await KasirLayout({ children: <p>Konten kasir</p> }),
    );

    expect(redirectMock).toHaveBeenCalledWith("/login?next=/kasir");
    expect(screen.getByRole("heading", { name: "Akses ditolak" })).toBeInTheDocument();
  });

  it("menampilkan akses ditolak saat role bukan kasir", async () => {
    requireRoleMock.mockResolvedValue({
      ok: false,
      error: { code: "PAGE_ACCESS", message: "Anda tidak memiliki akses ke halaman ini." },
    });

    render(
      await KasirLayout({ children: <p>Konten kasir</p> }),
    );

    expect(redirectMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Anda tidak memiliki akses ke halaman ini.",
    );
    expect(screen.queryByText("Konten kasir")).toBeNull();
  });
});
