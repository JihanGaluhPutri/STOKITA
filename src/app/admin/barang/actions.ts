"use server";

import { redirect } from "next/navigation";

import {
  createProduct,
  deleteProduct,
  setProductActive,
  updateProduct,
} from "@/services/product.service";
import { reportServiceError } from "@/services/errors";

export type ProductFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

function toFormState(error: {
  code: string;
  message: string;
  field?: string;
}): ProductFormState {
  if (error.field) {
    return { fieldErrors: { [error.field]: error.message } };
  }
  return { error: error.message };
}

function readForm(formData: FormData): Record<string, unknown> {
  return {
    kode: formData.get("kode"),
    nama: formData.get("nama"),
    hargaBeli: formData.get("hargaBeli"),
    hargaJual: formData.get("hargaJual"),
    stokAwal: formData.get("stokAwal"),
    stokMin: formData.get("stokMin"),
  };
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    const result = await createProduct(readForm(formData));
    if (!result.ok) {
      return toFormState(result.error);
    }
  } catch (error) {
    reportServiceError("createProductAction", error);
    return { error: "Gagal menyimpan barang. Silakan coba lagi." };
  }

  redirect("/admin/barang?ok=created");
}

export async function updateProductAction(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    const result = await updateProduct(productId, readForm(formData));
    if (!result.ok) {
      return toFormState(result.error);
    }
  } catch (error) {
    reportServiceError("updateProductAction", error);
    return { error: "Gagal menyimpan perubahan. Silakan coba lagi." };
  }

  redirect("/admin/barang?ok=updated");
}

export type ProductStatusState = {
  error?: string;
  errorCode?: string;
  done?: "activated" | "deactivated" | "deleted";
} | null;

/**
 * Mengubah status aktif barang (aktivasi & deaktivasi) melalui satu
 * server action dengan parameter target. Penggunaan satu action untuk
 * kedua arah penting: build produksi (Turbopack) pernah salah memetakan
 * id antara dua action berdampingan sehingga tombol "Aktifkan" memanggil
 * action nonaktif dan sebaliknya. Menulis ke kolom products.aktif di
 * database (bukan sekadar state UI) lalu daftar dimuat ulang.
 */
export async function setProductStatusAction(
  productId: string,
  aktif: boolean,
  _prevState: ProductStatusState,
  _formData: FormData,
): Promise<ProductStatusState> {
  try {
    const result = await setProductActive(productId, aktif);
    if (!result.ok) {
      return { error: result.error.message, errorCode: result.error.code };
    }
    return { done: aktif ? "activated" : "deactivated" };
  } catch (error) {
    reportServiceError("setProductStatusAction", error);
    return {
      error: aktif
        ? "Gagal mengaktifkan barang. Silakan coba lagi."
        : "Gagal menonaktifkan barang. Silakan coba lagi.",
    };
  }
}

/**
 * Penghapusan permanen. Bila barang memiliki riwayat penjualan/pergerakan
 * stok, database menolak (FK restrict, kode 23503) dan pesan + saran
 * menonaktifkan dikembalikan ke UI. Riwayat tidak pernah dihapus.
 */
export async function deleteProductAction(
  productId: string,
  _prevState: ProductStatusState,
  _formData: FormData,
): Promise<ProductStatusState> {
  try {
    const result = await deleteProduct(productId);
    if (!result.ok) {
      return { error: result.error.message, errorCode: result.error.code };
    }
    return { done: "deleted" };
  } catch (error) {
    reportServiceError("deleteProductAction", error);
    return { error: "Gagal menghapus barang. Silakan coba lagi." };
  }
}
