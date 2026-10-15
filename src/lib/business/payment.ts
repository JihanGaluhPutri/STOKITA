import { MESSAGES } from "@/lib/business/messages";
import type { Result, ServiceError } from "@/types/result";
import type { PaymentMethod } from "@/types/sale";

export type PaymentResolution = {
  metodeBayar: PaymentMethod;
  bayar: number;
  kembalian: number;
};

function error(code: string, message: string): { ok: false; error: ServiceError } {
  return { ok: false, error: { code, message } };
}

export function calculateSubtotal(hargaSatuan: number, qty: number): Result<number> {
  if (
    !Number.isSafeInteger(hargaSatuan) ||
    hargaSatuan < 0 ||
    !Number.isSafeInteger(qty) ||
    qty <= 0
  ) {
    return error("CALC", MESSAGES.CALC);
  }
  const subtotal = hargaSatuan * qty;
  if (!Number.isSafeInteger(subtotal)) {
    return error("OVERFLOW", MESSAGES.OVERFLOW);
  }
  return { ok: true, data: subtotal };
}

export function calculateTotal(
  lines: ReadonlyArray<{ hargaSatuan: number; qty: number }>,
): Result<number> {
  let total = 0;
  for (const line of lines) {
    const subtotal = calculateSubtotal(line.hargaSatuan, line.qty);
    if (!subtotal.ok) return subtotal;
    total += subtotal.data;
    if (!Number.isSafeInteger(total)) {
      return error("OVERFLOW", MESSAGES.OVERFLOW);
    }
  }
  return { ok: true, data: total };
}

export function calculateChange(bayar: number, total: number): Result<number> {
  if (!Number.isSafeInteger(bayar) || bayar < 0) {
    return error("PY002", MESSAGES.PY002);
  }
  if (bayar < total) {
    return error("PY003", MESSAGES.PY003);
  }
  return { ok: true, data: bayar - total };
}

/**
 * Menetapkan nominal akhir pembayaran.
 * NON_TUNAI selalu memaksa bayar = total dan kembalian = 0,
 * mengabaikan nominal apa pun yang dikirim klien.
 */
export function resolvePayment(
  metode: unknown,
  total: number,
  bayar?: number | null,
): Result<PaymentResolution> {
  if (!Number.isSafeInteger(total) || total < 0) {
    return error("CALC", MESSAGES.CALC);
  }

  if (metode === "NON_TUNAI") {
    return { ok: true, data: { metodeBayar: "NON_TUNAI", bayar: total, kembalian: 0 } };
  }

  if (metode === "TUNAI") {
    if (bayar === null || bayar === undefined) {
      return error("PY002", MESSAGES.PY002);
    }
    const change = calculateChange(bayar, total);
    if (!change.ok) return change;
    return { ok: true, data: { metodeBayar: "TUNAI", bayar, kembalian: change.data } };
  }

  return error("PY001", MESSAGES.PY001);
}
