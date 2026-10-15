"use client";

import { useActionState, useRef, useState } from "react";

import { logout, type LogoutState } from "@/app/actions/auth.actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

/**
 * Tombol Keluar dengan dialog konfirmasi: sesi hanya diakhiri setelah
 * pengguna menyetujui. Tombol Batal mempertahankan sesi.
 */
export function LogoutButton() {
  const [state, formAction, pending] = useActionState<LogoutState, FormData>(
    logout,
    null,
  );
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={formAction} className="logout-form" ref={formRef}>
      {state?.error ? (
        <span className="error error-inline" role="alert">
          {state.error}
        </span>
      ) : null}
      <button
        type="button"
        className="button button-secondary"
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        {pending ? "Keluar…" : "Keluar"}
      </button>

      <ConfirmDialog
        open={open}
        title="Keluar dari Stokita?"
        description="Sesi Anda akan berakhir dan Anda akan kembali ke halaman login."
        confirmLabel="Ya, keluar"
        busy={pending}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setOpen(false)}
      />
    </form>
  );
}
