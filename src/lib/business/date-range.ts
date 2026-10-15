import type { Result, ServiceError } from "@/types/result";

export const DATE_INVALID = "DATE_INVALID";
export const DATE_RANGE_INVALID = "DATE_RANGE_INVALID";

/** Zona waktu bisnis Stokita (usulan default; konsisten dengan format.ts). */
export const BUSINESS_TIMEZONE = "Asia/Jakarta";
const BUSINESS_UTC_OFFSET = "+07:00";

export type DateRange = {
  tanggalAwal: Date;
  tanggalAkhir: Date;
};

function parseDate(
  value: unknown,
  boundary: "start" | "end",
): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const iso =
        boundary === "start"
          ? `${trimmed}T00:00:00${BUSINESS_UTC_OFFSET}`
          : `${trimmed}T23:59:59.999${BUSINESS_UTC_OFFSET}`;
      const parsed = new Date(iso);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function error(code: string, message: string): { ok: false; error: ServiceError } {
  return { ok: false, error: { code, message } };
}

/**
 * PB-RWY-03: rentang tanggal inklusif pada zona waktu bisnis.
 * Tanggal pola YYYY-MM-DD dibaca sebagai hari penuh Asia/Jakarta:
 * awal = 00:00:00, akhir = 23:59:59.999.
 */
export function validateDateRange(
  tanggalAwal: unknown,
  tanggalAkhir: unknown,
): Result<DateRange> {
  const awal = parseDate(tanggalAwal, "start");
  const akhir = parseDate(tanggalAkhir, "end");

  if (!awal || !akhir) {
    return error(DATE_INVALID, "Format tanggal tidak valid.");
  }
  if (akhir.getTime() < awal.getTime()) {
    return error(
      DATE_RANGE_INVALID,
      "Tanggal akhir tidak boleh lebih awal dari tanggal awal.",
    );
  }

  return { ok: true, data: { tanggalAwal: awal, tanggalAkhir: akhir } };
}

/**
 * Batas "hari ini" menurut zona waktu bisnis: [start, endExclusive).
 * Dipakai ringkasan penjualan harian dashboard (PB-STOK-03).
 */
export function getBusinessDayBounds(now: Date = new Date()): {
  startIso: string;
  endExclusiveIso: string;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const pick = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "01";
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");

  const nextDayUtc = new Date(`${year}-${month}-${day}T00:00:00Z`);
  nextDayUtc.setUTCDate(nextDayUtc.getUTCDate() + 1);
  const nextYear = nextDayUtc.toISOString().slice(0, 4);
  const nextMonth = nextDayUtc.toISOString().slice(5, 7);
  const nextDay = nextDayUtc.toISOString().slice(8, 10);

  return {
    startIso: `${year}-${month}-${day}T00:00:00${BUSINESS_UTC_OFFSET}`,
    endExclusiveIso: `${nextYear}-${nextMonth}-${nextDay}T00:00:00${BUSINESS_UTC_OFFSET}`,
  };
}
