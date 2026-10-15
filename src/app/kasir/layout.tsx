import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/access-denied";
import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/auth/require-role";
import { ROLE_LABEL } from "@/types/auth";

import { KasirNav } from "./nav";

export const dynamic = "force-dynamic";

export default async function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireRole("kasir");
  if (!auth.ok) {
    if (auth.error.code === "AU001") {
      redirect("/login?next=/kasir");
    }
    return <AccessDenied message={auth.error.message} />;
  }

  return (
    <div className="shell">
      <AppHeader nama={auth.data.nama} roleLabel={ROLE_LABEL.kasir} />
      <KasirNav />
      <main className="shell-main">{children}</main>
    </div>
  );
}
