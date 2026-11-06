/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// redirect Next.js melempar NEXT_REDIRECT di produksi; tiru di test agar
// eksekusi berhenti persis seperti perilaku aslinya.
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/auth/require-user", () => ({ getSessionProfile: vi.fn() }));

import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/require-user";
import type { SessionProfile } from "@/types/auth";
import HomePage from "./page";

const redirectMock = vi.mocked(redirect);
const getSessionProfileMock = vi.mocked(getSessionProfile);

const adminProfile: SessionProfile = {
  id: "u1",
  nama: "Budi Santoso",
  username: "budi",
  role: "admin",
  homePath: "/admin",
};

const kasirProfile: SessionProfile = {
  id: "u2",
  nama: "Siti Aminah",
  username: "siti",
  role: "kasir",
  homePath: "/kasir",
};

describe("HomePage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    getSessionProfileMock.mockReset();
  });

  it("mengalihkan ke halaman login bila tanpa sesi", async () => {
    getSessionProfileMock.mockResolvedValue(null);

    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT");

    expect(getSessionProfileMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("mengalihkan ke beranda admin bila sesi admin", async () => {
    getSessionProfileMock.mockResolvedValue(adminProfile);

    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });

  it("mengalihkan ke beranda kasir bila sesi kasir", async () => {
    getSessionProfileMock.mockResolvedValue(kasirProfile);

    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/kasir");
  });
});
