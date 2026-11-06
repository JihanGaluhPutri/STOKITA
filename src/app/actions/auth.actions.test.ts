import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { login, logout } from "@/app/actions/auth.actions";
import { MESSAGES } from "@/lib/business/messages";
import { authenticateUser, endSession } from "@/services/auth.service";
import type { AuthUser } from "@/types/auth";
import { fail, ok } from "@/types/result";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/services/auth.service", () => ({
  authenticateUser: vi.fn(),
  endSession: vi.fn(),
}));

const ADMIN: AuthUser = {
  id: "admin-1",
  nama: "Admin",
  username: "admin",
  role: "admin",
  homePath: "/admin",
};

const KASIR: AuthUser = {
  id: "kasir-1",
  nama: "Kasir",
  username: "kasir",
  role: "kasir",
  homePath: "/kasir",
};

function loginForm(next?: string): FormData {
  const fd = new FormData();
  fd.set("username", "admin");
  fd.set("password", "rahasia");
  if (next !== undefined) fd.set("next", next);
  return fd;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("login", () => {
  it("mengembalikan LOGIN_FAILED tanpa redirect saat authenticateUser melempar error", async () => {
    vi.mocked(authenticateUser).mockRejectedValue(new Error("database down"));

    const state = await login(null, loginForm());

    expect(state).toEqual({ error: MESSAGES.LOGIN_FAILED });
    expect(redirect).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stokita:login]"),
    );
  });

  it("mengembalikan pesan error service dan tidak redirect saat autentikasi ditolak", async () => {
    vi.mocked(authenticateUser).mockResolvedValue(
      fail({ code: "AUTH_INVALID", message: MESSAGES.AUTH_INVALID }),
    );

    const state = await login(null, loginForm());

    expect(state).toEqual({ error: MESSAGES.AUTH_INVALID });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("meneruskan username & password form ke authenticateUser", async () => {
    vi.mocked(authenticateUser).mockResolvedValue(ok(ADMIN));

    await login(null, loginForm());

    expect(authenticateUser).toHaveBeenCalledWith({
      username: "admin",
      password: "rahasia",
    });
  });

  it("mengarahkan admin ke /admin bila tidak ada parameter next", async () => {
    vi.mocked(authenticateUser).mockResolvedValue(ok(ADMIN));

    const state = await login(null, loginForm());

    expect(redirect).toHaveBeenCalledWith("/admin");
    expect(state).toBeUndefined();
  });

  it("mengarahkan kasir ke /kasir bila tidak ada parameter next", async () => {
    vi.mocked(authenticateUser).mockResolvedValue(ok(KASIR));

    const state = await login(null, loginForm());

    expect(redirect).toHaveBeenCalledWith("/kasir");
    expect(state).toBeUndefined();
  });

  it("menerima next sesuai prefix role admin (redirect ke halaman tujuan)", async () => {
    vi.mocked(authenticateUser).mockResolvedValue(ok(ADMIN));

    await login(null, loginForm("/admin/barang"));

    expect(redirect).toHaveBeenCalledWith("/admin/barang");
  });

  it("menerima next berupa homePath kasir yang persis", async () => {
    vi.mocked(authenticateUser).mockResolvedValue(ok(KASIR));

    await login(null, loginForm("/kasir"));

    expect(redirect).toHaveBeenCalledWith("/kasir");
  });

  it("menolak next lintas role kasir dan jatuh ke homePath admin", async () => {
    vi.mocked(authenticateUser).mockResolvedValue(ok(ADMIN));

    await login(null, loginForm("/kasir/penjualan"));

    expect(redirect).toHaveBeenCalledWith("/admin");
  });

  it("menolak next lintas role admin dan jatuh ke homePath kasir", async () => {
    vi.mocked(authenticateUser).mockResolvedValue(ok(KASIR));

    await login(null, loginForm("/admin/barang"));

    expect(redirect).toHaveBeenCalledWith("/kasir");
  });

  it("menolak next open-redirect protocol-relative (//evil) dan jatuh ke homePath", async () => {
    vi.mocked(authenticateUser).mockResolvedValue(ok(ADMIN));

    await login(null, loginForm("//evil.example"));

    expect(redirect).toHaveBeenCalledWith("/admin");
  });

  it("menolak next absolut eksternal (https://evil) dan jatuh ke homePath", async () => {
    vi.mocked(authenticateUser).mockResolvedValue(ok(ADMIN));

    await login(null, loginForm("https://evil.example/phish"));

    expect(redirect).toHaveBeenCalledWith("/admin");
  });

  it("menolak next yang hanya menyerupai prefix role (/administrator)", async () => {
    vi.mocked(authenticateUser).mockResolvedValue(ok(ADMIN));

    await login(null, loginForm("/administrator"));

    expect(redirect).toHaveBeenCalledWith("/admin");
  });
});

describe("logout", () => {
  it("mengembalikan pesan error service dan tidak redirect bila endSession gagal", async () => {
    vi.mocked(endSession).mockResolvedValue(
      fail({ code: "LOGOUT_FAILED", message: "Sesi gagal dihapus." }),
    );

    const state = await logout(null, new FormData());

    expect(state).toEqual({ error: "Sesi gagal dihapus." });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("mengembalikan LOGOUT_FAILED tanpa redirect saat endSession melempar error", async () => {
    vi.mocked(endSession).mockRejectedValue(new Error("koneksi putus"));

    const state = await logout(null, new FormData());

    expect(state).toEqual({ error: MESSAGES.LOGOUT_FAILED });
    expect(redirect).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stokita:logout]"),
    );
  });

  it("mengarahkan ke /login setelah sesi berhasil diakhiri", async () => {
    vi.mocked(endSession).mockResolvedValue(ok(undefined));

    const state = await logout(null, new FormData());

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(state).toBeUndefined();
  });
});
