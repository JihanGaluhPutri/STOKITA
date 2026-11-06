import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Objek cookieStore & spy createServerClient dibuat via vi.hoisted agar bisa
// dirujuk dari pabrik vi.mock yang di-hoist ke atas file.
const { cookieStore, createServerClientMock } = vi.hoisted(() => ({
  cookieStore: {
    getAll: vi.fn(() => [{ name: "sb-session", value: "token-abc" }]),
    set: vi.fn(),
    get: vi.fn(),
    setAll: vi.fn(),
  },
  createServerClientMock: vi.fn((..._args: unknown[]) => ({
    __kind: "dummy-client",
  })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const SAVED_ENV: Record<string, string | undefined> = {};
for (const key of ENV_KEYS) SAVED_ENV[key] = process.env[key];

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (SAVED_ENV[key] === undefined) delete process.env[key];
    else process.env[key] = SAVED_ENV[key];
  }
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://stokita.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-terisi";
  createServerClientMock.mockClear();
  cookieStore.getAll.mockClear();
  cookieStore.set.mockClear();
  vi.mocked(cookies).mockClear();
});

type CapturedOptions = {
  cookies: {
    getAll(): unknown;
    setAll(cookiesToSet: Array<{ name: string; value: string; options?: unknown }>): void;
  };
  cookieOptions: Record<string, unknown>;
};

function captureOptions(): CapturedOptions {
  const call = createServerClientMock.mock.calls[0];
  expect(call).toBeDefined();
  return call![2] as CapturedOptions;
}

describe("createClient", () => {
  it("membuat client dengan url dan anon key dari env", async () => {
    await createClient();

    expect(createServerClientMock).toHaveBeenCalledTimes(1);
    const [url, anonKey] = createServerClientMock.mock.calls[0];
    expect(url).toBe("https://stokita.supabase.co");
    expect(anonKey).toBe("anon-key-terisi");
  });

  it("memanggil cookies() sekali dari next/headers", async () => {
    await createClient();

    expect(cookies).toHaveBeenCalledTimes(1);
  });

  it("meneruskan cookieStore pada getAll", async () => {
    await createClient();

    const options = captureOptions();
    const result = options.cookies.getAll();

    expect(cookieStore.getAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ name: "sb-session", value: "token-abc" }]);
  });

  it("meneruskan setiap cookie ke cookieStore.set pada setAll", async () => {
    await createClient();

    const options = captureOptions();
    options.cookies.setAll([
      { name: "sb-a", value: "1", options: { path: "/" } },
      { name: "sb-b", value: "2" },
    ]);

    expect(cookieStore.set).toHaveBeenCalledTimes(2);
    expect(cookieStore.set).toHaveBeenNthCalledWith(1, "sb-a", "1", {
      path: "/",
    });
    expect(cookieStore.set).toHaveBeenNthCalledWith(2, "sb-b", "2", undefined);
  });

  it("menelan error cookieStore.set (dipanggil dari Server Component)", async () => {
    await createClient();

    cookieStore.set.mockImplementationOnce(() => {
      throw new Error("Cookies can only be modified in a Server Action.");
    });
    const options = captureOptions();

    expect(() =>
      options.cookies.setAll([{ name: "sb-a", value: "1" }]),
    ).not.toThrow();
    expect(cookieStore.set).toHaveBeenCalledTimes(1);
  });

  it("mengirim opsi cookie httpOnly lax path root dan secure non-produksi", async () => {
    await createClient();

    const options = captureOptions();
    expect(options.cookieOptions).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  });

  it("melempar error konfigurasi saat env Supabase belum lengkap", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    await expect(createClient()).rejects.toThrow(
      /NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
    expect(createServerClientMock).not.toHaveBeenCalled();
  });
});
