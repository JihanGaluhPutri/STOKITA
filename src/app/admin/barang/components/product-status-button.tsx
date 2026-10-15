"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  setProductStatusAction,
  type ProductStatusState,
} from "@/app/admin/barang/actions";

/**
 * Tombol toggle status barang (Aktifkan/Nonaktifkan) dengan dialog
 * konfirmasi. Kedua arah memakai satu server action
 * (setProductStatusAction) dengan parameter target, diikuti muat ulang
 * daftar agar badge dan status tetap konsisten setelah refresh halaman.
 */
export function ProductStatusButton({
  productId,
  aktif,
  kode,
  nama,
}: {
  productId: string;
  aktif: boolean;
  kode: string;
  nama: string;
}) {
  const action = setProductStatusAction.bind(null, productId, !aktif);
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
          className="button button-secondary button-small"
          onClick={() => setOpen(true)}
          disabled={pending}
        >
          {pending ? "Memproses…" : aktif ? "Nonaktifkan" : "Aktifkan"}
        </button>
        {state?.error ? (
          <span className="error error-inline" role="alert">
            {state.error}
          </span>
        ) : null}
      </form>

      <ConfirmDialog
        open={open}
        title={aktif ? "Nonaktifkan barang?" : "Aktifkan barang?"}
        description={
          aktif
            ? `Barang “${nama}” (${kode}) akan dinonaktifkan dan tidak muncul di pencarian penjualan. Riwayat penjualan dan pergerakan stok tetap tersimpan.`
            : `Barang “${nama}” (${kode}) akan diaktifkan kembali dan muncul di pencarian penjualan.`
        }
        confirmLabel={aktif ? "Nonaktifkan" : "Aktifkan"}
        danger={aktif}
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
