import { redirect } from "next/navigation";

import { getSessionProfile } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect("/login");
  }
  redirect(profile.homePath);
}
