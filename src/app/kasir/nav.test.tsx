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

const route = vi.hoisted(() => ({ pathname: "/kasir" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
}));

import { KasirNav } from "./nav";

describe("KasirNav", () => {
  it("menampilkan seluruh menu kasir", () => {
    route.pathname = "/kasir";
    render(<KasirNav />);

    expect(
      screen.getByRole("navigation", { name: "Navigasi kasir" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual([
      "/kasir",
      "/kasir/penjualan",
      "/kasir/penjualan/riwayat",
    ]);
  });

  it("menandai Beranda aktif hanya untuk persis /kasir", () => {
    route.pathname = "/kasir";
    render(<KasirNav />);

    const beranda = screen.getByRole("link", { name: "Beranda" });
    expect(beranda).toHaveClass("tab-active");
    expect(beranda).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Penjualan" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("menandai Penjualan aktif hanya untuk path persisnya", () => {
    route.pathname = "/kasir/penjualan";
    render(<KasirNav />);

    const penjualan = screen.getByRole("link", { name: "Penjualan" });
    expect(penjualan).toHaveClass("tab-active");
    expect(penjualan).toHaveAttribute("aria-current", "page");

    expect(
      screen.getByRole("link", { name: "Beranda" }),
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("link", { name: "Riwayat" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("menandai Riwayat aktif di bawah /kasir/penjualan/riwayat", () => {
    route.pathname = "/kasir/penjualan/riwayat/s1";
    render(<KasirNav />);

    const riwayat = screen.getByRole("link", { name: "Riwayat" });
    expect(riwayat).toHaveClass("tab-active");
    expect(riwayat).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Penjualan" }),
    ).not.toHaveAttribute("aria-current");
  });
});
