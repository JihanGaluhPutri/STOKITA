import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getSupabasePublicConfig } from "@/lib/env";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const SAVED_ENV: Record<string, string | undefined> = {};
for (const key of ENV_KEYS) SAVED_ENV[key] = process.env[key];

beforeEach(() => {
  // Bersihkan dulu agar tiap test mengatur variabelnya sendiri.
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (SAVED_ENV[key] === undefined) delete process.env[key];
    else process.env[key] = SAVED_ENV[key];
  }
});

describe("getSupabasePublicConfig", () => {
  it("mengembalikan url dan anon key yang sudah terisi", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://stokita.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-valid";

    expect(getSupabasePublicConfig()).toEqual({
      url: "https://stokita.supabase.co",
      anonKey: "anon-key-valid",
    });
  });

  it("membuang spasi di sekitar nilai env", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "  https://stokita.supabase.co  ";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "\tanon-key-valid\n";

    const config = getSupabasePublicConfig();

    expect(config.url).toBe("https://stokita.supabase.co");
    expect(config.anonKey).toBe("anon-key-valid");
  });

  it("melempar dengan nama kedua variabel saat keduanya kosong", () => {
    expect(() => getSupabasePublicConfig()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("melempar dan hanya menyebut URL saat URL belum diisi", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-valid";

    expect(() => getSupabasePublicConfig()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => getSupabasePublicConfig()).not.toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("melempar dan hanya menyebut ANON_KEY saat ANON_KEY belum diisi", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://stokita.supabase.co";

    expect(() => getSupabasePublicConfig()).toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
    expect(() => getSupabasePublicConfig()).not.toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("menolak nilai yang hanya berupa spasi (format kosong)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "   ";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "   ";

    expect(() => getSupabasePublicConfig()).toThrow(
      /Konfigurasi Supabase belum lengkap/,
    );
    expect(() => getSupabasePublicConfig()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("menolak URL kosong walau anon key sudah terisi", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-valid";

    expect(() => getSupabasePublicConfig()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
