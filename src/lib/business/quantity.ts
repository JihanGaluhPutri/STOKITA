import type { Result } from "@/types/result";

export const INVALID_INTEGER = "INVALID_INTEGER";

export function parseInteger(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) return null;
    const parsed = Number(trimmed);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

export function validatePositiveInteger(
  value: unknown,
  message = "Nilai harus berupa bilangan bulat lebih dari 0.",
): Result<number> {
  const parsed = parseInteger(value);
  if (parsed === null || parsed <= 0) {
    return { ok: false, error: { code: INVALID_INTEGER, message } };
  }
  return { ok: true, data: parsed };
}

export function validateNonNegativeInteger(
  value: unknown,
  message = "Nilai harus berupa bilangan bulat tidak negatif.",
): Result<number> {
  const parsed = parseInteger(value);
  if (parsed === null || parsed < 0) {
    return { ok: false, error: { code: INVALID_INTEGER, message } };
  }
  return { ok: true, data: parsed };
}
