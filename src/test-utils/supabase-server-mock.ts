/**
 * Mock `@/lib/supabase/server` untuk unit test.
 *
 * Dipakai lewat `vi.mock("@/lib/supabase/server", () => import("@/test-utils/supabase-server-mock"))`
 * — pabrik mock dan test berbagi satu instance modul ini, sehingga test dapat
 * mengonfigurasi fake lewat `getFake()` langsung.
 */
import { FakeSupabase } from "./fake-supabase";

let fake = new FakeSupabase();

export function getFake(): FakeSupabase {
  return fake;
}

/** Buat instance baru di awal tiap test. */
export function resetFake(): FakeSupabase {
  fake = new FakeSupabase();
  return fake;
}

export async function createClient(): Promise<FakeSupabase> {
  return fake;
}
