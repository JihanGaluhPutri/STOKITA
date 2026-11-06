/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

const route = vi.hoisted(() => ({ pathname: "/admin" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
}));

import { AdminNav } from "./nav";

describe("AdminNav", () => {
  it("menampilkan seluruh menu admin", () => {
    route.pathname = "/admin";
    render(<AdminNav />);

    const nav = screen.getByRole("navigation", { name: "Navigasi admin" });
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/admin",
      "/admin/barang",
      "/admin/barang-masuk",
      "/admin/stok",
      "/admin/penjualan/riwayat",
    ]);
    expect(nav).toBeInTheDocument();
  });

  it("menandai Beranda aktif hanya untuk persis /admin", () => {
    route.pathname = "/admin";
    render(<AdminNav />);

    const beranda = screen.getByRole("link", { name: "Beranda" });
    expect(beranda).toHaveClass("tab-active");
    expect(beranda).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Barang" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("menandai menu sesuai awalan path saat di sub-halaman", () => {
    route.pathname = "/admin/barang/tambah";
    render(<AdminNav />);

    const barang = screen.getByRole("link", { name: "Barang" });
    expect(barang).toHaveClass("tab-active");
    expect(barang).toHaveAttribute("aria-current", "page");

    const beranda = screen.getByRole("link", { name: "Beranda" });
    expect(beranda).toHaveClass("tab");
    expect(beranda).not.toHaveClass("tab-active");
    expect(beranda).not.toHaveAttribute("aria-current");

    expect(
      screen.getByRole("link", { name: "Stok" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("menganggap /adminx bukan bagian menu Beranda yang persis", () => {
    route.pathname = "/adminx";
    render(<AdminNav />);

    expect(
      screen.getByRole("link", { name: "Beranda" }),
    ).not.toHaveAttribute("aria-current");
  });
});
