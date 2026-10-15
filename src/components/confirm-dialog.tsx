"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Dialog konfirmasi universal Stokita.
 * - Escape dan klik backdrop membatalkan (selama tidak sedang memproses).
 * - Fokus awal ke tombol Batal; fokus dikembalikan ke pemicu saat ditutup.
 * - Aksi hanya dijalankan setelah pengguna menekan tombol konfirmasi.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel,
  cancelLabel = "Batal",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  details?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const handlersRef = useRef({ busy, onCancel });

  useEffect(() => {
    handlersRef.current = { busy, onCancel };
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previous?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !handlersRef.current.busy) {
        handlersRef.current.onCancel();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="confirm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-desc" : undefined}
      >
        <h2 className="confirm-title" id="confirm-dialog-title">
          {title}
        </h2>
        {description ? (
          <p className="muted confirm-desc" id="confirm-dialog-desc">
            {description}
          </p>
        ) : null}
        {details ? <div className="confirm-details">{details}</div> : null}
        <div className="confirm-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onCancel}
            disabled={busy}
            ref={cancelRef}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "button button-danger" : "button"}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
