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

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

import StokPage from "./page";
import StokLoading from "./loading";

function signedInAdmin() {
  getFake().signedInAs({
    id: "admin-1",
    nama: "Admin",
    username: "admin",
    role: "admin",
  });
}

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("StokPage", () => {
  it("menampilkan tabel barang berisiko dengan status habis dan menipis", async () => {
    signedInAdmin();
    getFake().table("products", {
      data: [
        { id: "p-1", kode: "BRG-001", nama: "Kopi Susu", stok: 0, stok_min: 2 },
        { id: "p-2", kode: "BRG-002", nama: "Teh", stok: 3, stok_min: 5 },
      ],
      error: null,
    });

    render(await StokPage());

    expect(
      screen.getByRole("heading", { name: "Monitoring stok" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Riwayat pergerakan stok" }),
    ).toHaveAttribute("href", "/admin/stok/riwayat");

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Habis")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Menipis")).toBeInTheDocument();
    expect(within(rows[0]).getAllByRole("cell")[2]).toHaveTextContent("0");
    expect(within(rows[1]).getAllByRole("cell")[3]).toHaveTextContent("5");
  });

  it("menampilkan empty state saat semua stok aman", async () => {
    signedInAdmin();
    getFake().table("products", { data: [], error: null });

    render(await StokPage());

    expect(screen.getByText("Semua stok aman.")).toBeInTheDocument();
    expect(
      screen.getByText("Tidak ada barang aktif yang menipis atau habis."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("menampilkan pesan error saat monitoring gagal dimuat", async () => {
    // Tanpa sesi: requireRole di service menolak dengan AU001.
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(await StokPage());

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGES.AU001);
  });
});

describe("StokLoading", () => {
  it("menampilkan status memuat data stok", () => {
    render(<StokLoading />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Monitoring stok");
    expect(status).toHaveTextContent("Memuat data stok…");
  });
});
