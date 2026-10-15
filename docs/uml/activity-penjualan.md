# Activity Diagram — Proses Penjualan

**Tujuan diagram:** memetakan alur aktivitas penjualan kasir dari persiapan
keranjang sampai struk, termasuk seluruh percabangan kondisi gagal (input
tidak valid, metode/bayar tidak valid, barang nonaktif, stok tidak
mencukupi, transaksi gagal) berdasarkan implementasi
`sale-terminal.tsx`, `checkoutAction`, dan fungsi `checkout_sale`.

**Sintaks:** Mermaid `flowchart TD`. Simbol belah ketupat = keputusan;
labeled edge = hasil percabangan.

```mermaid
flowchart TD
    Start([Kasir membuka /kasir/penjualan]) --> LoadMuat["Muat daftar barang aktif<br/>(listProducts aktifOnly)"]
    LoadMuat --> AdaBarang{Ada barang aktif?}
    AdaBarang -- "Tidak" --> Empty["Tampilkan empty state<br/>(Hubungi admin)"]
    AdaBarang -- "Ya" --> Cari["Cari & klik barang<br/>masuk keranjang"]

    Cari --> Qty{"Ubah qty item<br/>(opsional)"}
    Qty --> QtyValid{"Qty bilangan bulat<br/>1 ≤ qty ≤ stok tampil?"}
    QtyValid -- "Tidak" --> QtyError["Tampilkan pesan CT002<br/>tombol bayar nonaktif"]
    QtyError --> Qty
    QtyValid -- "Ya" --> Bayar["Pilih metode bayar<br/>TUNAI / NON_TUNAI"]

    Bayar --> BayarValid{"Metode terpilih &<br/>kondisi bayar valid?"}
    BayarValid -- "Tidak" --> BayarWait["Tombol bayar tetap<br/>nonaktif (canCheckout=false)"]
    BayarWait --> Bayar
    BayarValid -- "Ya" --> KlikBayar["Klik 'Bayar & selesaikan'"]

    KlikBayar --> Dialog["Tampilkan ConfirmDialog<br/>ringkasan item, total, metode,<br/>dibayar, kembalian"]
    Dialog --> Konfirm{Kasir konfirmasi?}
    Konfirm -- "Batal / Escape" --> Cari
    Konfirm -- "Ya" --> Submit["Submit form → checkoutAction<br/>(items, metodeBayar, bayar)"]

    Submit --> ServerValid["Validasi server (service):<br/>items & qty, metode, requireRole kasir"]
    ServerValid --> SrvOk{Valid?}
    SrvOk -- "CT001 / CT002 / PY001 /<br/>AU001 / AC002" --> ShowErr1["Tampilkan pesan error<br/>tanpa perubahan data"]
    ShowErr1 --> Cari

    SrvOk -- "Ya" --> RPC["Panggil RPC checkout_sale"]

    RPC --> Sesi{"Sesi & role = kasir?"}
    Sesi -- "Tidak" --> E1(["Gagal: AU001 / AC002"])
    Sesi -- "Ya" --> Kunci["Kunci baris produk<br/>SELECT ... ORDER BY id FOR UPDATE"]

    Kunci --> AdaProduk{"Semua produk ditemukan<br/>& aktif?"}
    AdaProduk -- "Tidak" --> E2(["Gagal: CT003<br/>rollback"])
    AdaProduk -- "Ya" --> StokCek{"qty ≤ stok<br/>(setelah kunci)?"}
    StokCek -- "Tidak" --> E3(["Gagal: ST001<br/>Stok tidak mencukupi — rollback"])
    StokCek -- "Ya" --> Hitung["Hitung subtotal & total<br/>dari harga_jual aktual (di DB)"]

    Hitung --> Metode{"Metode?"}
    Metode -- "TUNAI: bayar ≥ total?" --> BayarCek{Cukup?}
    BayarCek -- "Tidak" --> E4(["Gagal: PY002 / PY003<br/>rollback"])
    BayarCek -- "Ya" --> Tulis["kembalian = bayar - total"]
    Metode -- "NON_TUNAI" --> NonTunai["paksa bayar = total,<br/>kembalian = 0"]

    Tulis --> Transaksi
    NonTunai --> Transaksi

    subgraph Transaksi["Transaksi database ATOMIK"]
        T1["INSERT sales<br/>(no_transaksi dari sequence)"] --> T2["INSERT sale_items<br/>(per produk)"]
        T2 --> T3["UPDATE products.stok<br/>stok - qty"]
        T3 --> T4["INSERT stock_movements<br/>tipe OUT (referensi no transaksi)"]
    end

    Transaksi --> Ok{"Semua langkah sukses?"}
    Ok -- "Tidak (mis. overflow 22003)" --> E5(["Gagal umum + rollback<br/>seluruh checkout"])
    Ok -- "Ya" --> Commit["COMMIT — transaksi tersimpan"]

    Commit --> Res["State: {receipt} → struk<br/>no_transaksi, item, bayar, kembalian"]
    Res --> Struk["SaleReceipt ditampilkan<br/>(opsional cetak)"]
    Struk --> Baru{"Kasir klik<br/>'Transaksi baru'?"}
    Baru -- "Ya" --> Reset["Sesi POS direset<br/>(keranjang kosong)"]
    Reset --> Cari
    Baru -- "Tidak" --> Struk

    E1 --> ShowErr1
    E2 --> ShowErr1
    E3 --> ShowErr1
    E4 --> ShowErr1
    E5 --> ShowErr1
```

**Penjelasan percabangan:**

| Titik keputusan | Kondisi | Hasil |
| --- | --- | --- |
| Qty | bukan bilangan bulat > 0 atau melebihi stok tampil | pesan `CT002`, tombol bayar nonaktif |
| Metode/bayar | metode belum dipilih; TUNAI dengan bayar < total | `canCheckout = false` di klien; di server `PY001–PY003` |
| Konfirmasi | kasir membatalkan dialog | kembali ke POS tanpa request |
| Validasi service | input tidak valid / sesi-role salah | pesan error, tanpa panggilan RPC |
| Setelah kunci baris | barang hilang/nonaktif | `CT003`, rollback |
| Setelah kunci baris | qty > stok aktual | `ST001`, rollback |
| Pembayaran | TUNAI bayar kurang | `PY002/PY003`, rollback |
| Saat menulis | kegagalan apa pun (termasuk overflow `22003`) | rollback seluruh checkout — tidak ada stok terpotong tanpa nota |
| Sukses | seluruh langkah selesai | commit → struk → opsi transaksi baru |

Catatan: perhitungan tampilan total/kembalian di klien
(`calculateTotal`/`calculateChange`) **hanya untuk UI** — nilai yang
disimpan selalu hasil hitung fungsi database.

Terkait: [Sequence Penjualan](sequence-penjualan.md),
[Use Case dan Alur](../USE_CASE_AND_FLOW.md#44-penjualan-oleh-kasir-pos),
[Database dan State](../DATABASE_AND_STATE.md).
