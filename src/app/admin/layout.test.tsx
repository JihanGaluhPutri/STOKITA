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
  AdminNav: () => <nav aria-label="Navigasi admin" />,
}));

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import type { SessionProfile } from "@/types/auth";
import AdminLayout from "./layout";

const redirectMock = vi.mocked(redirect);
const requireRoleMock = vi.mocked(requireRole);

const adminProfile: SessionProfile = {
  id: "u1",
  nama: "Budi Santoso",
  username: "budi",
  role: "admin",
  homePath: "/admin",
};

describe("AdminLayout", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    requireRoleMock.mockReset();
  });

  it("merender shell admin dengan header, nav, dan children bila role cocok", async () => {
    requireRoleMock.mockResolvedValue({ ok: true, data: adminProfile });

    render(
      await AdminLayout({ children: <p>Konten admin</p> }),
    );

    expect(requireRoleMock).toHaveBeenCalledWith("admin");
    expect(screen.getByRole("banner")).toHaveTextContent("Budi Santoso");
    expect(screen.getByRole("banner")).toHaveTextContent("Admin");
    expect(
      screen.getByRole("navigation", { name: "Navigasi admin" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Konten admin")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("mengalihkan ke login bila sesi tidak valid (AU001)", async () => {
    requireRoleMock.mockResolvedValue({
      ok: false,
      error: { code: "AU001", message: "Sesi Anda tidak valid. Silakan login kembali." },
    });

    render(
      await AdminLayout({ children: <p>Konten admin</p> }),
    );

    expect(redirectMock).toHaveBeenCalledWith("/login?next=/admin");
    // redirect berhenti di produksi; di test tanpa throw, tampilan penolakan ikut tampil.
    expect(screen.getByRole("heading", { name: "Akses ditolak" })).toBeInTheDocument();
  });

  it("menampilkan akses ditolak saat role bukan admin", async () => {
    requireRoleMock.mockResolvedValue({
      ok: false,
      error: { code: "PAGE_ACCESS", message: "Anda tidak memiliki akses ke halaman ini." },
    });

    render(
      await AdminLayout({ children: <p>Konten admin</p> }),
    );

    expect(redirectMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Anda tidak memiliki akses ke halaman ini.",
    );
    expect(screen.queryByText("Konten admin")).toBeNull();
  });
});
