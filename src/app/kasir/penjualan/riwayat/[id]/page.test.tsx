/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";

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

// notFound() harus melempar agar alur "404" bisa diuji tanpa router Next.
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: () => {},
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/kasir/penjualan/riwayat",
}));

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

import KasirSaleDetailPage from "@/app/kasir/penjualan/riwayat/[id]/page";

function signedInKasir() {
  getFake().signedInAs({
    id: "kasir-1",
    nama: "Budi",
    username: "budi",
    role: "kasir",
  });
}

function saleRow(over: Record<string, unknown> = {}) {
  return {
    id: "s-1",
    no_transaksi: "TRX-0001",
    tanggal: "2026-11-01T10:00:00Z",
    total: 30000,
    metode_bayar: "NON_TUNAI",
    bayar: 30000,
    kembalian: 0,
    kasir_id: "kasir-1",
    profiles: { nama: "Budi" },
    sale_items: [
      {
        qty: 2,
        harga_satuan: 15000,
        subtotal: 30000,
        products: { kode: "BRG-001", nama: "Kopi Susu" },
      },
    ],
    ...over,
  };
}

function page(id = "s-1") {
  return KasirSaleDetailPage({ params: Promise.resolve({ id }) });
}

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("KasirSaleDetailPage", () => {
  it("menampilkan rincian transaksi milik kasir sendiri", async () => {
    signedInKasir();
    getFake().table("sales", { data: saleRow(), error: null });

    render(await page());

    expect(
      screen.getByRole("heading", { name: "Rincian transaksi" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Kembali ke riwayat" }),
    ).toHaveAttribute("href", "/kasir/penjualan/riwayat");

    expect(screen.getByText("TRX-0001")).toBeInTheDocument();
    expect(screen.getByText("Non-tunai")).toBeInTheDocument();
    expect(screen.getByText("Uang dibayar").nextElementSibling).toHaveTextContent(
      /Rp\s*30\.000/,
    );
    expect(screen.getByText("Kembalian").nextElementSibling).toHaveTextContent(
      /Rp\s*0/,
    );
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent(
      /Rp\s*30\.000/,
    );

    const row = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(within(row).getByText("BRG-001")).toBeInTheDocument();
    expect(within(row).getByText("Kopi Susu")).toBeInTheDocument();

    // Kasir hanya membuka miliknya sendiri: eq kasir_id ikut diterapkan.
    const eqCalls = getFake().findCalls("sales.eq");
    expect(eqCalls).toHaveLength(2);
    expect(eqCalls[0].args).toEqual(["id", "s-1"]);
    expect(eqCalls[1].args).toEqual(["kasir_id", "kasir-1"]);
  });

  it("melempar notFound saat transaksi bukan miliknya atau tidak ada", async () => {
    signedInKasir();
    getFake().table("sales", { data: null, error: null });

    await expect(page("milik-orang")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("menampilkan pesan error saat sesi tidak valid", async () => {
    // Tanpa sesi: requireUser di service menolak dengan AU001.
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(await page());

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGES.AU001);
    expect(screen.queryByText("Rincian transaksi")).toBeNull();
  });
});
