"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteProductAction, type ProductStatusState } from "@/app/admin/barang/actions";

/**
 * Tombol hapus permanen dengan dialog konfirmasi berbahaya.
 * Produk yang memiliki riwayat penjualan/pergerakan stok ditolak database
 * (FK restrict 23503) — pesan dan saran menonaktifkan ditampilkan tanpa
 * menghapus riwayat apa pun.
 */
export function DeleteProductButton({
  productId,
  kode,
  nama,
}: {
  productId: string;
  kode: string;
  nama: string;
}) {
  const action = deleteProductAction.bind(null, productId);
  const [state, formAction, pending] = useActionState<ProductStatusState, FormData>(
    action,
    null,
  );
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state?.done) return;
    const params = new URLSearchParams(window.location.search);
    params.set("ok", state.done);
    router.push(`/admin/barang?${params.toString()}`);
  }, [state, router]);

  return (
    <>
      <form ref={formRef} action={formAction} className="row-actions">
        <button
          type="button"
          className="button button-danger button-small"
          onClick={() => setOpen(true)}
          disabled={pending}
        >
          {pending ? "Menghapus…" : "Hapus"}
        </button>
        {state?.error ? (
          <span className="error error-inline" role="alert">
            {state.error}
            {state.errorCode === "23503"
              ? " Nonaktifkan barang sebagai gantinya agar riwayat tetap tersimpan."
              : null}
          </span>
        ) : null}
      </form>

      <ConfirmDialog
        open={open}
        title="Hapus barang secara permanen?"
        description={`Barang “${nama}” (${kode}) akan dihapus dari daftar barang. Tindakan ini tidak dapat dibatalkan.`}
        details={
          <p className="muted small-note">
            Produk yang sudah memiliki riwayat penjualan atau pergerakan stok
            tidak dapat dihapus permanen — gunakan Nonaktifkan sebagai
            gantinya.
          </p>
        }
        confirmLabel="Hapus barang"
        danger
        busy={pending}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
