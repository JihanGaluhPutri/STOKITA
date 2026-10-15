const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function formatRupiah(value: number): string {
  return rupiahFormatter.format(value);
}

/**
 * Angka rupiah tanpa simbol "Rp" — untuk kolom sempit (tabel struk) agar
 * nominal utuh tanpa bertabrakan dengan kolom sebelahnya. Nilai tidak
 * diubah, hanya penyajian.
 */
export function formatNumberRupiah(value: number): string {
  return rupiahFormatter.format(value).replace(/^Rp[\s\u00a0]*/, "");
}

export function formatDateTime(value: string): string {
  return dateFormatter.format(new Date(value));
}
