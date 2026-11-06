/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";
import { formatDateTime } from "@/lib/business/format";

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

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

import RiwayatBarangMasukPage from "./page";
import RiwayatBarangMasukLoading from "./loading";

function signedInAdmin() {
  getFake().signedInAs({
    id: "admin-1",
    nama: "Admin",
    username: "admin",
    role: "admin",
  });
}

function movementRow(over: Record<string, unknown> = {}) {
  return {
    id: "m-1",
    tanggal: "2026-11-01T08:00:00Z",
    qty: 12,
    referensi: "Nota #9",
    catatan: "Restock",
    products: { kode: "BRG-001", nama: "Kopi Susu" },
    profiles: { nama: "Admin" },
    ...over,
  };
}

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("RiwayatBarangMasukPage", () => {
  it("menampilkan daftar barang masuk terbaru", async () => {
    signedInAdmin();
    getFake().table("stock_movements", {
      data: [
        movementRow(),
        movementRow({
          id: "m-2",
          qty: 3,
          referensi: null,
          catatan: "Sisa stok opname",
          products: { kode: "BRG-002", nama: "Teh" },
        }),
      ],
      error: null,
    });

    render(await RiwayatBarangMasukPage());

    expect(
      screen.getByRole("heading", { name: "Riwayat barang masuk" }),
    ).toBeInTheDocument();

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);

    const sel1 = within(rows[0]).getAllByRole("cell");
    expect(sel1[0].textContent).toBe(formatDateTime("2026-11-01T08:00:00Z"));
    expect(sel1[1]).toHaveTextContent("BRG-001 — Kopi Susu");
    expect(sel1[2]).toHaveTextContent("12");
    expect(sel1[3]).toHaveTextContent("Nota #9");
    expect(sel1[4]).toHaveTextContent("Restock");
    expect(sel1[5]).toHaveTextContent("Admin");

    const sel2 = within(rows[1]).getAllByRole("cell");
    expect(sel2[3]).toHaveTextContent("—"); // referensi kosong
    expect(sel2[4]).toHaveTextContent("Sisa stok opname");
  });

  it("menampilkan empty state saat belum ada catatan barang masuk", async () => {
    signedInAdmin();
    getFake().table("stock_movements", { data: [], error: null });

    render(await RiwayatBarangMasukPage());

    expect(
      screen.getByText("Belum ada barang masuk tercatat."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("menampilkan pesan error saat riwayat gagal dimuat", async () => {
    // Tanpa sesi: requireRole di service menolak dengan AU001.
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(await RiwayatBarangMasukPage());

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGES.AU001);
  });
});

describe("RiwayatBarangMasukLoading", () => {
  it("menampilkan status memuat riwayat", () => {
    render(<RiwayatBarangMasukLoading />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Riwayat barang masuk");
    expect(status).toHaveTextContent("Memuat riwayat…");
  });
});
