"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/kasir", label: "Beranda", exact: true },
  { href: "/kasir/penjualan", label: "Penjualan", exact: true },
  { href: "/kasir/penjualan/riwayat", label: "Riwayat" },
];

export function KasirNav() {
  const pathname = usePathname();

  return (
    <nav className="tabs" aria-label="Navigasi kasir">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "tab tab-active" : "tab"}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
