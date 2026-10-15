import { MESSAGES, type MessageCode } from "@/lib/business/messages";
import type { ServiceError } from "@/types/result";

/**
 * Pemetaan SQLSTATE bawaan PostgreSQL/PostgREST ke pesan bisnis.
 * Kode kustom fungsi (AU001, AC001, IN001, dst.) dipetakan langsung dari
 * MESSAGES tanpa membawa pesan mentah database ke pengguna.
 */
const SQLSTATE_FALLBACKS: Record<string, MessageCode> = {
  "42501": "ACCESS",
  "22003": "OVERFLOW",
  "22P02": "INVALID_INPUT",
  "23503": "FK_HISTORY",
  "23505": "DUPLICATE",
  "PGRST301": "AU001",
  "PGRST302": "AU001",
};

function extractCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && code !== "") return code;
  }
  return "";
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return String(error);
}

export function mapSupabaseError(error: unknown): ServiceError {
  const code = extractCode(error);

  if (code && Object.prototype.hasOwnProperty.call(MESSAGES, code)) {
    return { code, message: MESSAGES[code as MessageCode] };
  }

  const fallback = code ? SQLSTATE_FALLBACKS[code] : undefined;
  if (fallback) {
    return { code, message: MESSAGES[fallback] };
  }

  return { code: code || "UNKNOWN", message: MESSAGES.GENERIC };
}

/** Log diagnostik aman di server; tidak pernah dikirim ke browser. */
export function reportServiceError(context: string, error: unknown): void {
  const code = extractCode(error) || "UNKNOWN";
  console.error(`[stokita:${context}] ${code}: ${extractMessage(error)}`);
}
