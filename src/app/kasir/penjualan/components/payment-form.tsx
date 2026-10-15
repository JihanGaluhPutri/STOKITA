"use client";

import { calculateChange } from "@/lib/business/payment";
import { formatRupiah } from "@/lib/business/format";
import { parseInteger } from "@/lib/business/quantity";
import type { PaymentMethod } from "@/types/sale";

export function PaymentForm({
  total,
  metode,
  bayar,
  disabled,
  onMetodeChange,
  onBayarChange,
}: {
  total: number;
  metode: PaymentMethod | "";
  bayar: string;
  disabled: boolean;
  onMetodeChange: (metode: PaymentMethod | "") => void;
  onBayarChange: (value: string) => void;
}) {
  const parsedBayar = parseInteger(bayar);
  const change =
    metode === "TUNAI" && parsedBayar !== null
      ? calculateChange(parsedBayar, total)
      : null;

  return (
    <div className="stack">
      <div className="field">
        <label className="label" htmlFor="metodeBayar">
          Metode pembayaran
        </label>
        <select
          className="input"
          id="metodeBayar"
          value={metode}
          disabled={disabled}
          onChange={(event) =>
            onMetodeChange(event.target.value as PaymentMethod | "")
          }
        >
          <option value="" disabled>
            Pilih metode…
          </option>
          <option value="TUNAI">Tunai</option>
          <option value="NON_TUNAI">Non-tunai</option>
        </select>
      </div>

      {metode === "TUNAI" ? (
        <div className="field">
          <label className="label" htmlFor="bayar">
            Uang dibayar (Rp)
          </label>
          <input
            className="input"
            id="bayar"
            type="number"
            min={0}
            step={1}
            value={bayar}
            disabled={disabled}
            onChange={(event) => onBayarChange(event.target.value)}
          />
          {parsedBayar !== null && change && change.ok ? (
            <span className="muted small-note">
              Kembalian: {formatRupiah(change.data)}
            </span>
          ) : null}
          {parsedBayar !== null && change && !change.ok ? (
            <span className="field-error" role="alert">
              {change.error.message}
            </span>
          ) : null}
        </div>
      ) : null}

      {metode === "NON_TUNAI" ? (
        <p className="muted small-note">
          Pembayaran non-tunai: bayar otomatis sama dengan total
          ({formatRupiah(total)}) dan kembalian 0.
        </p>
      ) : null}
    </div>
  );
}
