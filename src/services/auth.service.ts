import "server-only";

import { MESSAGES } from "@/lib/business/messages";
import { createClient } from "@/lib/supabase/server";
import type { AuthUser, Role } from "@/types/auth";
import { homePathForRole, isRole } from "@/types/auth";
import { fail, ok, type Result } from "@/types/result";
import { reportServiceError } from "./errors";

const EMAIL_DOMAIN = "stokita.local";
const USERNAME_PATTERN = /^[a-z0-9_.-]+$/;
const USERNAME_MAX_LENGTH = 64;

/**
 * PB-AUTH-01: username dipetakan deterministik ke email internal Supabase Auth
 * (tanpa registrasi publik dan tanpa membocorkan mekanisme ke pengguna).
 * Fungsi ini juga dipakai oleh seed akun (TB-26) agar pemetaan konsisten.
 */
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

/**
 * Memvalidasi kolom lalu menandatangani masuk melalui Supabase Auth.
 * Kegagalan autentikasi selalu disamarkan menjadi pesan umum.
 */
export async function authenticateUser(input: {
  username: string;
  password: string;
}): Promise<Result<AuthUser>> {
  const username = typeof input.username === "string" ? input.username.trim() : "";
  if (username === "") {
    return fail({
      code: "USERNAME_REQUIRED",
      message: MESSAGES.USERNAME_REQUIRED,
      field: "username",
    });
  }

  const password = typeof input.password === "string" ? input.password : "";
  if (password === "") {
    return fail({
      code: "PASSWORD_REQUIRED",
      message: MESSAGES.PASSWORD_REQUIRED,
      field: "password",
    });
  }

  const normalized = username.toLowerCase();
  if (
    normalized.length > USERNAME_MAX_LENGTH ||
    !USERNAME_PATTERN.test(normalized)
  ) {
    return fail({ code: "AUTH_INVALID", message: MESSAGES.AUTH_INVALID });
  }

  const supabase = await createClient();

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: usernameToEmail(normalized),
      password,
    });

  if (signInError) {
    reportServiceError("authenticateUser", signInError);
    const status = (signInError as { status?: number }).status;
    if (typeof status === "number" && status >= 400 && status < 500) {
      return fail({ code: "AUTH_INVALID", message: MESSAGES.AUTH_INVALID });
    }
    return fail({ code: "LOGIN_FAILED", message: MESSAGES.LOGIN_FAILED });
  }

  const userId = signInData.user?.id;
  if (!userId) {
    return fail({ code: "AUTH_INVALID", message: MESSAGES.AUTH_INVALID });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("nama, username, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    reportServiceError("authenticateUser:profile", profileError);
    await supabase.auth.signOut();
    return fail({ code: "LOGIN_FAILED", message: MESSAGES.LOGIN_FAILED });
  }

  if (
    !profile ||
    !isRole(profile.role) ||
    typeof profile.username !== "string" ||
    profile.username.toLowerCase() !== normalized
  ) {
    await supabase.auth.signOut();
    return fail({
      code: "AUTH_PROFILE_INVALID",
      message: MESSAGES.AUTH_PROFILE_INVALID,
    });
  }

  const role: Role = profile.role;
  return ok({
    id: userId,
    nama: profile.nama,
    username: profile.username,
    role,
    homePath: homePathForRole(role),
  });
}

/**
 * PB-AUTH-02: mengakhiri sesi Supabase Auth. Sesi yang sudah tidak ada
 * dianggap berhasil (idempoten); kegagalan nyata dikembalikan sebagai error.
 */
export async function endSession(): Promise<Result<void>> {
  const supabase = await createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return ok(undefined);
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    reportServiceError("endSession", error);
    return fail({ code: "LOGOUT_FAILED", message: MESSAGES.LOGOUT_FAILED });
  }

  return ok(undefined);
}
