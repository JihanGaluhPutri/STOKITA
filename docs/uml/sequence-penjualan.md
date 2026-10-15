# Sequence Diagram — Penjualan (Checkout Kasir)

**Tujuan diagram:** memvisualisasikan proses penjualan dari sisi kasir:
penyusunan keranjang di klien, validasi input, Server Action, service,
panggilan fungsi PostgreSQL `checkout_sale`, pemeriksaan stok & pembayaran,
penyimpanan transaksi atomik, hingga tampilan struk — sesuai kode
`src/app/kasir/penjualan/` dan `supabase/migrations/005_checkout_sale.sql`.

**Catatan:** transaksi database (INSERT `sales`/`sale_items`, UPDATE
`products.stok`, INSERT `stock_movements`) dilakukan **di dalam satu
fungsi RPC** `checkout_sale` — bukan beberapa panggilan terpisah dari
aplikasi. Inilah alur "transaksi database" yang dipakai Stokita.

```mermaid
sequenceDiagram
    autonumber
    actor K as Kasir
    participant POS as SaleTerminal (klien)
    participant CA as Server Action "checkoutAction"
    participant SV as sales.service (checkoutSale)
    participant RPC as Fungsi PostgreSQL checkout_sale
    participant PG as PostgreSQL

    K ->> POS: cari & klik barang (aktifOnly dari render halaman)
    POS ->> POS: tambah ke keranjang (qty 1 / +1), ubah qty, hapus item
    POS ->> POS: pilih metode TUNAI / NON_TUNAI, isi bayar (TUNAI)
    POS ->> POS: hitung tampilan total & kembalian (util payment.ts)

    K ->> POS: klik "Bayar & selesaikan"
    POS ->> POS: tampilkan ConfirmDialog (ringkasan item, total, metode, bayar, kembalian)
    K ->> POS: konfirmasi "Bayar & selesaikan"
    POS ->> CA: submit form (items JSON [{product_id, qty}], metodeBayar, bayar)

    CA ->> SV: checkoutSale(input)

    alt items kosong / tidak terbaca
        SV -->> CA: fail CT001 "Keranjang masih kosong."
    else qty tidak valid
        SV -->> CA: fail CT002 "Qty harus berupa bilangan bulat lebih dari 0."
    else metode tidak TUNAI/NON_TUNAI
        SV -->> CA: fail PY001 "Pilih metode pembayaran terlebih dahulu."
    else sesi bukan kasir
        SV ->> SV: requireRole("kasir") gagal
        SV -->> CA: fail AU001 / AC002
    else input diterima
        SV ->> RPC: supabase.rpc("checkout_sale", {p_items, p_metode_bayar, p_bayar})
        RPC ->> PG: auth.uid() & cek profiles.role = kasir
        alt bukan kasir / tanpa sesi
            PG -->> RPC: raise AU001 / AC002
            RPC -->> SV: error terpetakan
        else role benar
            RPC ->> RPC: validasi array items, tiap product_id uuid, qty > 0 (barang ganda dijumlahkan)
            RPC ->> PG: SELECT products ... ORDER BY id FOR UPDATE (kunci baris)
            alt barang nonaktif / tidak ditemukan
                PG -->> RPC: baris tidak aktif / hilang
                RPC -->> SV: raise CT003
            else qty > stok tersedia
                RPC -->> SV: raise ST001 "Stok barang X tidak mencukupi."
            else stok mencukupi
                RPC ->> RPC: baca harga_jual ulang, hitung subtotal & total (di DB)
                alt TUNAI & bayar < total / tidak valid
                    RPC -->> SV: raise PY002 / PY003
                else metode valid
                    RPC ->> PG: INSERT sales (no_transaksi dari sequence)
                    RPC ->> PG: INSERT sale_items (per produk)
                    RPC ->> PG: UPDATE products.stok = stok - qty (per produk)
                    RPC ->> PG: INSERT stock_movements tipe OUT (referensi no_transaksi)
                    Note over RPC, PG: satu transaksi database —<br/>gagal di satu langkah = rollback seluruh checkout
                    RPC -->> SV: ok {sale_id, no_transaksi, total, bayar, kembalian, items}
                    SV -->> CA: ok CheckoutResult
                end
            end
        end
    end

    CA -->> POS: state {receipt}
    POS ->> POS: tampilkan SaleReceipt (struk) + tombol "Transaksi baru"
    K ->> POS: klik "Transaksi baru" (sesi POS direset)
```

**Penjelasan langkah penting:**

1. **Klien tidak dipercaya untuk nilai uang.** Form hanya membawa
   `product_id` + `qty` + metode + nominal tunai. Harga, stok, total,
   bayar akhir, dan kembalian dihitung/divalidasi ulang di dalam fungsi
   database (harga diambil ulang dari baris yang terkunci).
2. **Penguncian baris (`FOR UPDATE`) dengan urutan `id`** menyerialisasi
   dua kasir yang menjual produk sama; stok diperiksa **setelah** kunci
   dipegang sehingga tidak ada cek-terus-pakai yang basi (race condition).
3. **Atomik penuh** — `sales` + `sale_items` + pengurangan stok + mutasi
   `OUT` terjadi dalam satu transaksi database; kegagalan di titik mana pun
   (stok kurang, bayar kurang, overflow) membatalkan semuanya sehingga tidak
   pernah ada stok terpotong tanpa nota.
4. **Hasil sukses berupa objek struk lengkap** yang dikembalikan RPC lalu
   dirender sebagai struk digital; nomor transaksi `TRX-YYYYMMDD-NNNNNN`
   dibangkitkan atomik dari sequence.
5. **Gagal = tanpa efek samping.** Pesan error dipetakan dari kode kustom
   (`CT001…ST001`, `PY001–003`) ke katalog pesan aplikasi dan tampil di
   POS; keranjang tetap utuh untuk diperbaiki kasir.

Terkait: [Activity Penjualan](activity-penjualan.md),
[Sequence Penjualan lebih dari fungsi DB](../DATABASE_AND_STATE.md#6-konsistensi-data-dan-transaksi),
[Use Case](use-case.md).
