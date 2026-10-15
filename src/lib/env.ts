const MISSING_MESSAGE_PREFIX =
  "Konfigurasi Supabase belum lengkap. Variabel yang belum tersedia:";

export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    const missing: string[] = [];
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    throw new Error(`${MISSING_MESSAGE_PREFIX} ${missing.join(", ")}.`);
  }

  return { url, anonKey };
}
