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

import StockMovementHistoryPage from "./page";
import StockMovementHistoryLoading from "./loading";

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
    tipe: "IN",
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

describe("StockMovementHistoryPage", () => {
  it("menampilkan pergerakan IN dan OUT lengkap dengan referensi", async () => {
    signedInAdmin();
    getFake().table("stock_movements", {
      data: [
        movementRow(),
        movementRow({
          id: "m-2",
          tipe: "OUT",
          qty: 2,
          referensi: null,
          catatan: null,
          products: { kode: "BRG-002", nama: "Teh" },
          profiles: { nama: "Kasir Satu" },
        }),
      ],
      error: null,
    });

    render(await StockMovementHistoryPage());

    expect(
      screen.getByRole("heading", { name: "Riwayat pergerakan stok" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Monitoring stok" }),
    ).toHaveAttribute("href", "/admin/stok");

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);

    const sel1 = within(rows[0]).getAllByRole("cell");
    expect(sel1[0].textContent).toBe(formatDateTime("2026-11-01T08:00:00Z"));
    expect(sel1[1]).toHaveTextContent("BRG-001 — Kopi Susu");
    expect(within(rows[0]).getByText("IN")).toBeInTheDocument();
    expect(sel1[3]).toHaveTextContent("12");
    expect(sel1[4]).toHaveTextContent("Nota #9");
    expect(sel1[5]).toHaveTextContent("Restock");
    expect(sel1[6]).toHaveTextContent("Admin");

    const sel2 = within(rows[1]).getAllByRole("cell");
    expect(within(rows[1]).getByText("OUT")).toBeInTheDocument();
    expect(sel2[4]).toHaveTextContent("-");
    expect(sel2[5]).toHaveTextContent("-");
    expect(sel2[6]).toHaveTextContent("Kasir Satu");
  });

  it("menampilkan empty state saat belum ada pergerakan stok", async () => {
    signedInAdmin();
    getFake().table("stock_movements", { data: [], error: null });

    render(await StockMovementHistoryPage());

    expect(screen.getByText("Belum ada pergerakan stok.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("menampilkan pesan error saat riwayat gagal dimuat", async () => {
    // Tanpa sesi: requireRole di service menolak dengan AU001.
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(await StockMovementHistoryPage());

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGES.AU001);
  });
});

describe("StockMovementHistoryLoading", () => {
  it("menampilkan status memuat riwayat", () => {
    render(<StockMovementHistoryLoading />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Riwayat pergerakan stok");
    expect(status).toHaveTextContent("Memuat riwayat…");
  });
});
