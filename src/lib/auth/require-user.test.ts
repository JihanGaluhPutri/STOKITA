import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");
const { getSessionProfile, requireUser } = await import(
  "@/lib/auth/require-user"
);

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("getSessionProfile", () => {
  it("mengembalikan null saat tidak ada sesi login", async () => {
    expect(await getSessionProfile()).toBeNull();
  });

  it("mengembalikan null saat query profil gagal", async () => {
    getFake().signedInAs({
      id: "admin-1",
      nama: "Admin",
      username: "admin",
      role: "admin",
    });
    getFake().table("profiles", {
      data: null,
      error: { message: "RLS menolak baris" },
    });

    expect(await getSessionProfile()).toBeNull();
  });

  it("mengembalikan null saat profil tidak ada (maybeSingle kosong)", async () => {
    getFake().auth.user = { id: "admin-1" };
    getFake().table("profiles", { data: null, error: null });

    expect(await getSessionProfile()).toBeNull();
  });

  it("menolak default bila role di database tidak valid", async () => {
    getFake().signedInAs({
      id: "hantu-1",
      nama: "Hantu",
      username: "hantu",
      role: "hantu",
    });

    expect(await getSessionProfile()).toBeNull();
  });

  it("mengembalikan profil admin lengkap dengan homePath", async () => {
    getFake().signedInAs({
      id: "admin-1",
      nama: "Admin Utama",
      username: "admin",
      role: "admin",
    });

    const profile = await getSessionProfile();

    expect(profile).toEqual({
      id: "admin-1",
      nama: "Admin Utama",
      username: "admin",
      role: "admin",
      homePath: "/admin",
    });
  });

  it("mengembalikan homePath kasir untuk role kasir", async () => {
    getFake().signedInAs({
      id: "kasir-1",
      nama: "Kasir Satu",
      username: "kasir",
      role: "kasir",
    });

    const profile = await getSessionProfile();

    expect(profile?.role).toBe("kasir");
    expect(profile?.homePath).toBe("/kasir");
  });

  it("memilih kolom profil dan menyaring berdasarkan id user", async () => {
    getFake().signedInAs({
      id: "admin-1",
      nama: "Admin",
      username: "admin",
      role: "admin",
    });

    await getSessionProfile();

    const select = getFake().findCalls("profiles.select")[0];
    expect(select).toBeDefined();
    expect(select.args).toEqual(["nama, username, role"]);

    const eq = getFake().findCalls("profiles.eq")[0];
    expect(eq).toBeDefined();
    expect(eq.args).toEqual(["id", "admin-1"]);
  });
});

describe("requireUser", () => {
  it("mengembalikan error AU001 saat tanpa sesi", async () => {
    const result = await requireUser();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
    expect(result.error.message).toBe(MESSAGES.AU001);
  });

  it("mengembalikan error AU001 saat role profil tidak valid", async () => {
    getFake().signedInAs({
      id: "hantu-1",
      nama: "Hantu",
      username: "hantu",
      role: "hantu",
    });

    const result = await requireUser();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
  });

  it("mengembalikan profil sesi saat login valid", async () => {
    getFake().signedInAs({
      id: "admin-1",
      nama: "Admin",
      username: "admin",
      role: "admin",
    });

    const result = await requireUser();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.id).toBe("admin-1");
    expect(result.data.homePath).toBe("/admin");
  });
});
