"use server";

import { checkoutSale } from "@/services/sales.service";
import { reportServiceError } from "@/services/errors";
import type { CheckoutResult } from "@/types/sale";

export type CheckoutState = {
  error?: string;
  receipt?: CheckoutResult;
} | null;

function parseItems(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || raw === "") return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * TB-18: identitas kasir diambil dari sesi tepercaya di dalam service/RPC —
 * tidak ada nilai role, ID, harga, total, atau stok yang dipercaya dari client.
 * Client hanya mengirim daftar product_id + qty, metode, dan nominal tunai.
 */
export async function checkoutAction(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const metodeBayar = formData.get("metodeBayar");
  const bayar = formData.get("bayar");

  try {
    const result = await checkoutSale({
      items: parseItems(formData.get("items")) as Array<{
        product_id: string;
        qty: number;
      }>,
      metodeBayar,
      bayar: typeof bayar === "string" ? bayar : null,
    });

    if (!result.ok) {
      return { error: result.error.message };
    }

    return { receipt: result.data };
  } catch (error) {
    reportServiceError("checkoutAction", error);
    return { error: "Gagal memproses transaksi. Silakan coba lagi." };
  }
}
