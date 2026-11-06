/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Server action "use server" tidak dijalankan di jsdom; cukup jadi stub.
vi.mock("@/app/actions/auth.actions", () => ({ logout: vi.fn() }));

import { AppHeader } from "./app-header";

describe("AppHeader", () => {
  it("menampilkan brand, nama pengguna, role, dan tombol keluar", () => {
    render(<AppHeader nama="Budi Santoso" roleLabel="Admin" />);

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("shell-header");
    expect(screen.getByText("Stokita")).toHaveClass("brand");
    expect(screen.getByText("Budi Santoso")).toHaveClass("muted");
    expect(screen.getByText("Admin")).toHaveClass("badge");
    expect(screen.getByRole("button", { name: "Keluar" })).toBeInTheDocument();
  });

  it("memakai label role yang diberikan pemanggil", () => {
    render(<AppHeader nama="Siti Aminah" roleLabel="Kasir" />);

    const header = screen.getByRole("banner");
    expect(header).toHaveTextContent("Siti Aminah");
    expect(header).toHaveTextContent("Kasir");
    expect(screen.queryByText("Admin")).toBeNull();
  });
});
