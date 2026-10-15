import "server-only";

import { MESSAGES } from "@/lib/business/messages";
import { createClient } from "@/lib/supabase/server";
import type { SessionProfile } from "@/types/auth";
import { homePathForRole, isRole } from "@/types/auth";
import { fail, ok, type Result } from "@/types/result";

/**
 * Mengambil profil sesi aktif (user Supabase Auth + baris profiles).
 * Mengembalikan null bila tanpa sesi, profil hilang, atau role tidak valid
 * (penolakan default — PB-AUTH-03).
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("nama, username, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || !isRole(profile.role)) {
    return null;
  }

  return {
    id: user.id,
    nama: profile.nama,
    username: profile.username,
    role: profile.role,
    homePath: homePathForRole(profile.role),
  };
}

/** Wajib sesi valid; dipakai Server Action/service untuk otorisasi server-side. */
export async function requireUser(): Promise<Result<SessionProfile>> {
  const profile = await getSessionProfile();
  if (!profile) {
    return fail({ code: "AU001", message: MESSAGES.AU001 });
  }
  return ok(profile);
}
