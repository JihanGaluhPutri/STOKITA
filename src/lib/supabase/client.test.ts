import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createBrowserClient = vi.fn(
  (_url: string, _anonKey: string) => ({ kind: "browser-client" }),
);

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (url: string, anonKey: string) =>
    createBrowserClient(url, anonKey),
}));

import { createClient } from "./client";

const OLD_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-123";
});

afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe("createClient (browser)", () => {
  it("membuat client dari konfigurasi env publik", () => {
    const client = createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key-123",
    );
    expect(client).toEqual({ kind: "browser-client" });
  });

  it("melempar error bila konfigurasi env hilang", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    expect(() => createClient()).toThrow();
    expect(createBrowserClient).not.toHaveBeenCalled();
  });
});
