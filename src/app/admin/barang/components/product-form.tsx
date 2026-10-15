"use client";

import { useActionState, useRef, useState } from "react";

import type { ProductFormState } from "@/app/admin/barang/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Action = (
  prevState: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;

export type ProductFormValues = {
  kode?: string;
  nama?: string;
  hargaBeli?: string;
  hargaJual?: string;
  stokAwal?: string;
  stokMin?: string;
};

export function ProductForm({
  action,
  mode,
  defaultValues,
}: {
  action: Action;
  mode: "create" | "edit";
  defaultValues?: ProductFormValues;
}) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    action,
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [summary, setSummary] = useState<{ kode: string; nama: string } | null>(
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fieldErrors = state?.fieldErrors ?? {};
  const values = defaultValues ?? {};

  function openConfirm() {
    if (!formRef.current?.reportValidity()) return;
    const formData = new FormData(formRef.current);
    setSummary({
      kode: String(formData.get("kode") ?? "").trim(),
      nama: String(formData.get("nama") ?? "").trim(),
    });
    setConfirmOpen(true);
  }

  return (
    <form action={formAction} className="form form-grid" ref={formRef}>
      <div className="field">
        <label className="label" htmlFor="kode">
          Kode barang
        </label>
        <input
          className="input"
          id="kode"
          name="kode"
          type="text"
          defaultValue={values.kode ?? ""}
          required
        />
        {fieldErrors.kode ? (
          <span className="field-error">{fieldErrors.kode}</span>
        ) : null}
      </div>

      <div className="field">
        <label className="label" htmlFor="nama">
          Nama barang
        </label>
        <input
          className="input"
          id="nama"
          name="nama"
          type="text"
          defaultValue={values.nama ?? ""}
          required
        />
        {fieldErrors.nama ? (
          <span className="field-error">{fieldErrors.nama}</span>
        ) : null}
      </div>

      <div className="field">
        <label className="label" htmlFor="hargaBeli">
          Harga beli (Rp)
        </label>
        <input
          className="input"
          id="hargaBeli"
          name="hargaBeli"
          type="number"
          min={0}
          step={1}
          defaultValue={values.hargaBeli ?? "0"}
          required
        />
        {fieldErrors.hargaBeli ? (
          <span className="field-error">{fieldErrors.hargaBeli}</span>
        ) : null}
      </div>

      <div className="field">
        <label className="label" htmlFor="hargaJual">
          Harga jual (Rp)
        </label>
        <input
          className="input"
          id="hargaJual"
          name="hargaJual"
          type="number"
          min={0}
          step={1}
          defaultValue={values.hargaJual ?? ""}
          required
        />
        {fieldErrors.hargaJual ? (
          <span className="field-error">{fieldErrors.hargaJual}</span>
        ) : null}
      </div>

      {mode === "create" ? (
        <>
          <div className="field">
            <label className="label" htmlFor="stokAwal">
              Stok awal
            </label>
            <input
              className="input"
              id="stokAwal"
              name="stokAwal"
              type="number"
              min={0}
              step={1}
              defaultValue={values.stokAwal ?? "0"}
              required
            />
            {fieldErrors.stokAwal ? (
              <span className="field-error">{fieldErrors.stokAwal}</span>
            ) : null}
          </div>

          <div className="field">
            <label className="label" htmlFor="stokMin">
              Stok minimum
            </label>
            <input
              className="input"
              id="stokMin"
              name="stokMin"
              type="number"
              min={0}
              step={1}
              defaultValue={values.stokMin ?? "0"}
              required
            />
            {fieldErrors.stokMin ? (
              <span className="field-error">{fieldErrors.stokMin}</span>
            ) : null}
          </div>
        </>
      ) : (
        <p className="muted span-2">
          Stok hanya berubah melalui barang masuk atau penjualan, bukan lewat
          formulir ini.
        </p>
      )}

      {state?.error ? (
        <p className="error span-2" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="span-2">
        <button type="button" className="button" onClick={openConfirm} disabled={pending}>
          {pending
            ? "Menyimpan…"
            : mode === "create"
              ? "Simpan barang"
              : "Simpan perubahan"}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={
          mode === "create" ? "Simpan barang baru?" : "Simpan perubahan barang?"
        }
        description={
          mode === "create"
            ? `Barang “${summary?.nama ?? ""}” dengan kode ${summary?.kode ?? ""} akan disimpan ke daftar barang.`
            : `Perubahan data barang “${summary?.nama ?? ""}” (${summary?.kode ?? ""}) akan disimpan.`
        }
        confirmLabel={
          mode === "create" ? "Simpan barang" : "Simpan perubahan"
        }
        busy={pending}
        onConfirm={() => {
          setConfirmOpen(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </form>
  );
}
