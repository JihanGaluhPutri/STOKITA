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

import { AccessDenied } from "./access-denied";
import { EmptyState, ErrorState } from "./data-state";

describe("AccessDenied", () => {
  it("menampilkan pesan penolakan dan tautan kembali", () => {
    render(<AccessDenied message="Hanya admin yang boleh masuk." />);

    expect(screen.getByRole("heading", { name: "Akses ditolak" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Hanya admin yang boleh masuk.",
    );
    expect(screen.getByRole("link", { name: "Kembali" })).toHaveAttribute("href", "/");
  });
});

describe("EmptyState", () => {
  it("merender judul tanpa deskripsi opsional", () => {
    render(<EmptyState title="Belum ada data" />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Belum ada data");
    expect(status.querySelector(".muted")).toBeNull();
  });

  it("merender deskripsi bila disediakan", () => {
    render(<EmptyState title="Kosong" description="Tambahkan barang dulu." />);

    expect(screen.getByText("Tambahkan barang dulu.")).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("menampilkan pesan error sebagai alert", () => {
    render(<ErrorState message="Gagal memuat data." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Gagal memuat data.");
  });
});
