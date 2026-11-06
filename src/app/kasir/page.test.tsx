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

import KasirHomePage, { metadata } from "./page";

describe("KasirHomePage", () => {
  it("menampilkan sapaan kasir", () => {
    render(KasirHomePage());

    expect(
      screen.getByRole("heading", { name: "Selamat datang, Kasir" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Gunakan menu di atas untuk melayani/)).toBeInTheDocument();
  });

  it("menyediakan kartu tautan ke halaman penjualan", () => {
    render(KasirHomePage());

    const link = screen.getByRole("link", { name: /Cari barang, susun keranjang/ });
    expect(link).toHaveAttribute("href", "/kasir/penjualan");
    expect(link).toHaveTextContent("Penjualan");
  });

  it("menyediakan metadata judul Kasir", () => {
    expect(metadata.title).toBe("Kasir");
  });
});
