import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// createServerClient dipalsukan agar keputusan sesi bisa diatur per-test
// tanpa menyentuh jaringan.
const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

import proxy, { config } from "@/proxy";

type CookieToSet = { name: string; value: string; options?: unknown };

type CapturedCall = {
  url: string;
  anonKey: string;
  options: {
    cookies: {
      getAll(): unknown[];
      setAll(cookiesToSet: CookieToSet[]): void;
    };
    cookieOptions: Record<string, unknown>;
  };
};

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const SAVED_ENV: Record<string, string | undefined> = {};
for (const key of ENV_KEYS) SAVED_ENV[key] = process.env[key];

let sessionUser: { id: string } | null = null;
let lastCall: CapturedCall | null = null;

function setValidEnv() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://stokita.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-terisi";
}

beforeEach(() => {
  setValidEnv();
  sessionUser = null;
  lastCall = null;
  createServerClientMock.mockReset();
  createServerClientMock.mockImplementation(
    (url: string, anonKey: string, options: CapturedCall["options"]) => {
      lastCall = { url, anonKey, options };
      return {
        auth: {
          getUser: async () => ({ data: { user: sessionUser }, error: null }),
        },
      };
    },
  );
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (SAVED_ENV[key] === undefined) delete process.env[key];
    else process.env[key] = SAVED_ENV[key];
  }
});

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

function locationOf(response: Response): string | null {
  return response.headers.get("location");
}

describe("proxy", () => {
  it("mengalihkan ke login bila path admin diakses tanpa sesi", async () => {
    const response = await proxy(request("/admin/products?tab=stok"));

    expect(response.status).toBe(307);
    expect(locationOf(response)).toBe(
      "http://localhost:3000/login?next=%2Fadmin%2Fproducts%3Ftab%3Dstok",
    );
  });

  it("mengalihkan ke login bila path kasir diakses tanpa sesi", async () => {
    const response = await proxy(request("/kasir"));

    expect(response.status).toBe(307);
    expect(locationOf(response)).toBe(
      "http://localhost:3000/login?next=%2Fkasir",
    );
  });

  it("mengizinkan path admin yang dilindungi saat sesi valid", async () => {
    sessionUser = { id: "admin-1" };

    const response = await proxy(request("/admin/products"));

    expect(response.status).toBe(200);
    expect(locationOf(response)).toBeNull();
  });

  it("membiarkan path publik lewat tanpa sesi", async () => {
    const response = await proxy(request("/login"));

    expect(response.status).toBe(200);
    expect(locationOf(response)).toBeNull();
  });

  it("tidak menganggap /administrator sebagai path terlindungi", async () => {
    const response = await proxy(request("/administrator"));

    expect(response.status).toBe(200);
    expect(locationOf(response)).toBeNull();
  });

  it("meneruskan url dan anon key env ke createServerClient", async () => {
    sessionUser = { id: "admin-1" };

    await proxy(request("/admin"));

    expect(lastCall).not.toBeNull();
    expect(lastCall!.url).toBe("https://stokita.supabase.co");
    expect(lastCall!.anonKey).toBe("anon-key-terisi");
    expect(lastCall!.options.cookieOptions).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  });

  it("membaca cookie sesi dari request melalui getAll", async () => {
    sessionUser = { id: "admin-1" };

    await proxy(request("/admin", { cookie: "sb-access-token=abc123" }));

    expect(lastCall!.options.cookies.getAll()).toEqual([
      { name: "sb-access-token", value: "abc123" },
    ]);
  });

  it("menulis cookie refresh ke response melalui setAll", async () => {
    sessionUser = { id: "admin-1" };

    const response = await proxy(request("/admin"));

    lastCall!.options.cookies.setAll([
      { name: "sb-refresh-token", value: "baru", options: { path: "/" } },
    ]);

    expect(response.cookies.get("sb-refresh-token")?.value).toBe("baru");
  });

  it("mengalihkan ke login bila env Supabase hilang pada path terlindungi", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await proxy(request("/admin/laporan"));

    expect(response.status).toBe(307);
    expect(locationOf(response)).toBe(
      "http://localhost:3000/login?next=%2Fadmin%2Flaporan",
    );
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("tetap melayani path publik bila env Supabase hilang", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await proxy(request("/login"));

    expect(response.status).toBe(200);
    expect(locationOf(response)).toBeNull();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("hanya mencocokkan path statis dan gambar di matcher", () => {
    expect(config.matcher).toHaveLength(1);
    expect(config.matcher[0]).toContain("_next/static");
    expect(config.matcher[0]).toContain("favicon.ico");
  });
});
