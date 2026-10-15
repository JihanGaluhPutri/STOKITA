"use server";

import { redirect } from "next/navigation";

import { MESSAGES } from "@/lib/business/messages";
import {
  authenticateUser,
  endSession,
} from "@/services/auth.service";
import { reportServiceError } from "@/services/errors";
import type { AuthUser } from "@/types/auth";

export type LoginState = { error: string } | null;
export type LogoutState = { error: string } | null;

/**
 * Membatasi parameter next agar hanya jalur internal milik role yang bersangkutan
 * (melindungi dari open redirect dan akses silang role).
 */
function resolveHome(next: FormDataEntryValue | null, user: AuthUser): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    const prefix = user.role === "admin" ? "/admin" : "/kasir";
    if (next === prefix || next.startsWith(`${prefix}/`)) {
      return next;
    }
  }
  return user.homePath;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");

  let result;
  try {
    result = await authenticateUser({
      username: typeof username === "string" ? username : "",
      password: typeof password === "string" ? password : "",
    });
  } catch (error) {
    reportServiceError("login", error);
    return { error: MESSAGES.LOGIN_FAILED };
  }

  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect(resolveHome(formData.get("next"), result.data));
}

export async function logout(
  _prevState: LogoutState,
  _formData: FormData,
): Promise<LogoutState> {
  try {
    const result = await endSession();
    if (!result.ok) {
      return { error: result.error.message };
    }
  } catch (error) {
    reportServiceError("logout", error);
    return { error: MESSAGES.LOGOUT_FAILED };
  }

  redirect("/login");
}
