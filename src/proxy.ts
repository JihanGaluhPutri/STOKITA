import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicConfig } from "@/lib/env";

const PROTECTED_PREFIXES = ["/admin", "/kasir"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Proteksi request (konvensi Next.js 16: proxy.ts — pengganti middleware.ts).
 * Peran: memvalidasi keberadaan sesi dan me-refresh cookie; pengaturan role
 * secara otoritatif tetap di layout halaman, Server Action/service, RLS,
 * dan fungsi database.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const protectedPath = isProtectedPath(pathname);
  const response = NextResponse.next({ request });

  let url: string;
  let anonKey: string;
  try {
    const config = getSupabasePublicConfig();
    url = config.url;
    anonKey = config.anonKey;
  } catch {
    if (protectedPath) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname + search)}`, request.url),
      );
    }
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (protectedPath && !user) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(pathname + search)}`, request.url),
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
