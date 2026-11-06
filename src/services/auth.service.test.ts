import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";
import {
  authenticateUser,
  endSession,
  usernameToEmail,
} from "@/services/auth.service";

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("usernameToEmail", () => {
  it("memetakan username dengan trim dan lowercase ke domain internal", () => {
    expect(usernameToEmail("  Admin.01 ")).toBe("admin.01@stokita.local");
    expect(usernameToEmail("BUDI")).toBe("budi@stokita.local");
  });
});

describe("authenticateUser", () => {
  it("menolak username kosong (USERNAME_REQUIRED)", async () => {
    const fake = getFake();

    const result = await authenticateUser({
      username: "   ",
      password: "rahasia",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("USERNAME_REQUIRED");
    expect(result.error.message).toBe(MESSAGES.USERNAME_REQUIRED);
    expect(result.error.field).toBe("username");
    expect(fake.auth.signInCalls).toHaveLength(0);
  });

  it("menolak password kosong (PASSWORD_REQUIRED)", async () => {
    const fake = getFake();

    const result = await authenticateUser({ username: "admin", password: "" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PASSWORD_REQUIRED");
    expect(result.error.message).toBe(MESSAGES.PASSWORD_REQUIRED);
    expect(result.error.field).toBe("password");
    expect(fake.auth.signInCalls).toHaveLength(0);
  });

  it("menolak username dengan karakter di luar pola (AUTH_INVALID)", async () => {
    const fake = getFake();

    const result = await authenticateUser({
      username: "admin!",
      password: "rahasia",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AUTH_INVALID");
    expect(result.error.message).toBe(MESSAGES.AUTH_INVALID);
    expect(fake.auth.signInCalls).toHaveLength(0);
  });

  it("menolak username lebih panjang dari 64 karakter", async () => {
    const fake = getFake();

    const result = await authenticateUser({
      username: "a".repeat(65),
      password: "rahasia",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AUTH_INVALID");
    expect(fake.auth.signInCalls).toHaveLength(0);
  });

  it("menyamarkan kegagalan kredensial 4xx sebagai AUTH_INVALID", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = getFake();
    fake.auth.signInResult = {
      data: { user: null, session: null },
      error: { message: "Invalid login credentials", status: 400 },
    };

    const result = await authenticateUser({
      username: "admin",
      password: "salah",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AUTH_INVALID");
    expect(result.error.message).toBe(MESSAGES.AUTH_INVALID);
    expect(fake.auth.signInCalls[0].email).toBe("admin@stokita.local");
  });

  it("menerjemahkan gangguan server 5xx sebagai LOGIN_FAILED", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = getFake();
    fake.auth.signInResult = {
      data: { user: null, session: null },
      error: { message: "internal error", status: 500 },
    };

    const result = await authenticateUser({
      username: "admin",
      password: "rahasia",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("LOGIN_FAILED");
    expect(result.error.message).toBe(MESSAGES.LOGIN_FAILED);
  });

  it("menolak bila sesi masuk tidak memiliki user (AUTH_INVALID)", async () => {
    const fake = getFake();
    fake.auth.signInResult = {
      data: { user: {}, session: {} },
      error: null,
    };

    const result = await authenticateUser({
      username: "admin",
      password: "rahasia",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AUTH_INVALID");
    expect(fake.auth.signOutCalls).toBe(0);
  });

  it("menutup sesi dan mengembalikan LOGIN_FAILED saat baca profil gagal", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = getFake();
    fake.table("profiles", {
      data: null,
      error: { message: "db down" },
    });

    const result = await authenticateUser({
      username: "admin",
      password: "rahasia",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("LOGIN_FAILED");
    expect(result.error.message).toBe(MESSAGES.LOGIN_FAILED);
    expect(fake.auth.signOutCalls).toBe(1);
  });

  it("menutup sesi saat profil tidak ada (AUTH_PROFILE_INVALID)", async () => {
    const fake = getFake();
    fake.table("profiles", { data: null, error: null });

    const result = await authenticateUser({
      username: "admin",
      password: "rahasia",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AUTH_PROFILE_INVALID");
    expect(result.error.message).toBe(MESSAGES.AUTH_PROFILE_INVALID);
    expect(fake.auth.signOutCalls).toBe(1);
  });

  it("menutup sesi saat role profil tidak valid", async () => {
    const fake = getFake();
    fake.table("profiles", {
      data: { nama: "X", username: "admin", role: "supervisor" },
      error: null,
    });

    const result = await authenticateUser({
      username: "admin",
      password: "rahasia",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AUTH_PROFILE_INVALID");
    expect(fake.auth.signOutCalls).toBe(1);
  });

  it("menutup sesi saat username profil berbeda dari yang dimasukkan", async () => {
    const fake = getFake();
    fake.table("profiles", {
      data: { nama: "X", username: "lain", role: "admin" },
      error: null,
    });

    const result = await authenticateUser({
      username: "admin",
      password: "rahasia",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AUTH_PROFILE_INVALID");
    expect(fake.auth.signOutCalls).toBe(1);
  });

  it("berhasil login sebagai admin dengan homePath /admin", async () => {
    const fake = getFake();
    fake.auth.signInResult = {
      data: { user: { id: "u-1" }, session: {} },
      error: null,
    };
    fake.table("profiles", {
      data: { nama: "Admin Utama", username: "admin", role: "admin" },
      error: null,
    });

    const result = await authenticateUser({
      username: "  Admin ",
      password: "rahasia",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({
      id: "u-1",
      nama: "Admin Utama",
      username: "admin",
      role: "admin",
      homePath: "/admin",
    });
    expect(fake.auth.signInCalls[0]).toEqual({
      email: "admin@stokita.local",
      password: "rahasia",
    });
    expect(fake.auth.signOutCalls).toBe(0);
  });

  it("berhasil login sebagai kasir dengan homePath /kasir", async () => {
    const fake = getFake();
    fake.table("profiles", {
      data: { nama: "Budi", username: "budi", role: "kasir" },
      error: null,
    });

    const result = await authenticateUser({
      username: "budi",
      password: "rahasia",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.role).toBe("kasir");
    expect(result.data.homePath).toBe("/kasir");
    expect(result.data.nama).toBe("Budi");
  });
});

describe("endSession", () => {
  it("dianggap sukses idempoten bila sesi sudah tidak ada", async () => {
    const fake = getFake();
    fake.auth.session = null;

    const result = await endSession();

    expect(result.ok).toBe(true);
    expect(fake.auth.signOutCalls).toBe(0);
  });

  it("mengembalikan LOGOUT_FAILED bila signOut gagal", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = getFake();
    fake.auth.session = { user: { id: "u-1" } };
    fake.auth.signOutResult = { data: null, error: { message: "network" } };

    const result = await endSession();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("LOGOUT_FAILED");
    expect(result.error.message).toBe(MESSAGES.LOGOUT_FAILED);
    expect(fake.auth.signOutCalls).toBe(1);
  });

  it("mengakhiri sesi aktif dengan sukses", async () => {
    const fake = getFake();
    fake.auth.session = { user: { id: "u-1" } };

    const result = await endSession();

    expect(result.ok).toBe(true);
    expect(fake.auth.signOutCalls).toBe(1);
  });
});
