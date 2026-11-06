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

// Service dashboard menyentuh Supabase; cukup dikontrol dari test.
vi.mock("@/services/dashboard.service", () => ({
  getDashboardSummary: vi.fn(),
}));

import { getDashboardSummary } from "@/services/dashboard.service";
import AdminHomePage from "./page";

const getDashboardSummaryMock = vi.mocked(getDashboardSummary);

describe("AdminHomePage", () => {
  beforeEach(() => {
    getDashboardSummaryMock.mockReset();
  });

  it("menampilkan sapaan dan kartu ringkasan dashboard", async () => {
    getDashboardSummaryMock.mockResolvedValue({
      ok: true,
      data: {
        totalPenjualanHariIni: 250000,
        jumlahTransaksiHariIni: 5,
        jumlahMenipis: 3,
        jumlahHabis: 2,
      },
    });

    render(await AdminHomePage());

    expect(
      screen.getByRole("heading", { name: "Selamat datang, Admin" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Gunakan menu di atas/)).toBeInTheDocument();

    expect(screen.getByText("Penjualan hari ini")).toBeInTheDocument();
    expect(screen.getByText(/250[.,]000/)).toBeInTheDocument();
    expect(screen.getByText("5 transaksi")).toBeInTheDocument();

    expect(screen.getByText("Barang menipis")).toBeInTheDocument();
    expect(screen.getByText("termasuk 2 habis")).toBeInTheDocument();

    expect(screen.getByText("Barang habis")).toBeInTheDocument();
    expect(screen.getByText("stok 0")).toBeInTheDocument();
  });

  it("menampilkan kartu tautan pengelolaan ke bagian admin", async () => {
    getDashboardSummaryMock.mockResolvedValue({
      ok: true,
      data: {
        totalPenjualanHariIni: 0,
        jumlahTransaksiHariIni: 0,
        jumlahMenipis: 0,
        jumlahHabis: 0,
      },
    });

    render(await AdminHomePage());

    expect(
      screen.getByRole("link", { name: /Daftar, tambah, edit/ }),
    ).toHaveAttribute("href", "/admin/barang");
    expect(
      screen.getByRole("link", { name: /Catat penerimaan barang/ }),
    ).toHaveAttribute("href", "/admin/barang-masuk");
    expect(
      screen.getByRole("link", { name: /Pantau barang menipis/ }),
    ).toHaveAttribute("href", "/admin/stok");
    expect(
      screen.getByRole("link", { name: /Telusuri transaksi/ }),
    ).toHaveAttribute("href", "/admin/penjualan/riwayat");
  });

  it("menampilkan alert bila ringkasan dashboard gagal dimuat", async () => {
    getDashboardSummaryMock.mockResolvedValue({
      ok: false,
      error: { code: "GENERIC", message: "Koneksi database terputus." },
    });

    render(await AdminHomePage());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ringkasan dashboard gagal dimuat. Koneksi database terputus.",
    );
    expect(screen.queryByText("Penjualan hari ini")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Selamat datang, Admin" }),
    ).toBeInTheDocument();
  });
});
