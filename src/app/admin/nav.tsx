"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Beranda", exact: true },
  { href: "/admin/barang", label: "Barang" },
  { href: "/admin/barang-masuk", label: "Barang Masuk" },
  { href: "/admin/stok", label: "Stok" },
  { href: "/admin/penjualan/riwayat", label: "Riwayat Penjualan" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="tabs" aria-label="Navigasi admin">
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
