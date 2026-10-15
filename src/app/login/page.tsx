import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionProfile } from "@/lib/auth/require-user";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const profile = await getSessionProfile();
  if (profile) {
    redirect(profile.homePath);
  }

  const { next } = await searchParams;
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "";

  return (
    <main className="auth-page">
      <div className="card">
        <div className="stack">
          <h1 className="brand brand-lg">Stokita</h1>
          <p className="muted">Masuk untuk melanjutkan.</p>
        </div>
        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
