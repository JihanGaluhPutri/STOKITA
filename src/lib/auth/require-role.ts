import "server-only";

import { MESSAGES } from "@/lib/business/messages";
import type { Role, SessionProfile } from "@/types/auth";
import { fail, ok, type Result } from "@/types/result";
import { getSessionProfile } from "./require-user";

/**
 * PB-AUTH-03: pemeriksaan role server-side yang diulang pada Server Action,
 * service, dan layout halaman — pelengkap (bukan pengganti) RLS dan fungsi DB.
 * Tanpa sesi = AU001; role salah/tidak valid = ditolak default.
 */
export async function requireRole(
  role: Role,
): Promise<Result<SessionProfile>> {
  const profile = await getSessionProfile();
  if (!profile) {
    return fail({ code: "AU001", message: MESSAGES.AU001 });
  }
  if (profile.role !== role) {
    return fail({ code: "PAGE_ACCESS", message: MESSAGES.PAGE_ACCESS });
  }
  return ok(profile);
}
