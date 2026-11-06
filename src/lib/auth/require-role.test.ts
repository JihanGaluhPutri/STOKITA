import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");
const { requireRole } = await import("@/lib/auth/require-role");

function signedIn(role: string) {
  getFake().signedInAs({
    id: `${role}-1`,
    nama: role === "admin" ? "Admin" : "Kasir",
    username: role,
    role,
  });
}

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("requireRole", () => {
  it("menolak dengan AU001 saat tidak ada sesi", async () => {
    const result = await requireRole("admin");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
    expect(result.error.message).toBe(MESSAGES.AU001);
  });

  it("menolak dengan AU001 saat profil gagal dimuat", async () => {
    signedIn("admin");
    getFake().table("profiles", {
      data: null,
      error: { message: "query gagal" },
    });

    const result = await requireRole("admin");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
  });

  it("menolak dengan AU001 saat role di database tidak valid", async () => {
    signedIn("hantu");

    const result = await requireRole("admin");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
  });

  it("menolak dengan PAGE_ACCESS saat role tidak cocok", async () => {
    signedIn("kasir");

    const result = await requireRole("admin");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PAGE_ACCESS");
    expect(result.error.message).toBe(MESSAGES.PAGE_ACCESS);
  });

  it("mengembalikan profil saat role admin cocok", async () => {
    signedIn("admin");

    const result = await requireRole("admin");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.role).toBe("admin");
    expect(result.data.homePath).toBe("/admin");
  });

  it("mengembalikan profil saat role kasir cocok", async () => {
    signedIn("kasir");

    const result = await requireRole("kasir");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.role).toBe("kasir");
    expect(result.data.homePath).toBe("/kasir");
  });
});
