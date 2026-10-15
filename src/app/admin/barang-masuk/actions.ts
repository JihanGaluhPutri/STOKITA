"use server";

import { recordStockIn } from "@/services/stock.service";
import { reportServiceError } from "@/services/errors";

export type StockInFormState = {
  error?: string;
  success?: {
    qty: number;
    stokSebelum: number;
    stokSesudah: number;
  };
} | null;

export async function stockInAction(
  _prevState: StockInFormState,
  formData: FormData,
): Promise<StockInFormState> {
  const productId = formData.get("productId");
  const qty = formData.get("qty");
  const referensi = formData.get("referensi");
  const catatan = formData.get("catatan");

  try {
    const result = await recordStockIn({
      product_id: typeof productId === "string" ? productId : "",
      qty: typeof qty === "string" ? qty : "",
      referensi: typeof referensi === "string" ? referensi : null,
      catatan: typeof catatan === "string" ? catatan : null,
    });

    if (!result.ok) {
      return { error: result.error.message };
    }

    return {
      success: {
        qty: Number(qty),
        stokSebelum: result.data.stok_sebelum,
        stokSesudah: result.data.stok_sesudah,
      },
    };
  } catch (error) {
    reportServiceError("stockInAction", error);
    return { error: "Gagal mencatat barang masuk. Silakan coba lagi." };
  }
}
