# 🎬 Panduan Demo Final Project — STOKITA

**Durasi ideal:** 10–15 menit · **Branche/demo di:** `main` @ hasil merge PR #1–#4
**Kriteria resmi:** Unit Test (W) · Linter (W) · Integration Testing (Opsional) · SonarQube (W)
**Penilaian:** Reliability A · Maintainability A · Security A · Coverage ≥80% (Opsional)

---

## 0. Peta 60 Detik — Kriteria → Apa yang Ditunjukkan

| Kriteria | Bukti utama | Perintah / Link |
| --- | --- | --- |
| Unit Test (Wajib) | **66 file · 467 test lulus · coverage 98,73%** | `npm test` / `npm run test:coverage` |
| Linter (Wajib) | **0 error, 0 warning** + typecheck 0 error | `npm run lint` · `npm run typecheck` |
| **Integration Testing (Opsional — nilai plus)** | **19 skenario BDD lulus** (5 fitur) | `npm run test:bdd` · `npm run test:bdd:report` |
| SonarQube (Wajib) | **Quality Gate Passed · A/A/A · Coverage 96,9%** | http://localhost:9000/dashboard?id=stokita |
| Reliability A | 0 bug, 0 open issue | dashboard → tab Overall Code |
| Maintainability A | 0 code smell | dashboard → tab Overall Code |
| Security A | 0 vulnerability + `npm audit` 0 vulnerability | dashboard + PR #3 (Next.js 16.4.4) |
| Coverage ≥80% | **96,9%** (Sonar) / **98,73%** (Vitest) | `coverage/lcov-report/index.html` |
| Kelengkapan dokumen | PR merged + dokumentasi | PR #4 · `docs/SONARQUBE.md` |

---

## 0B. 🎯 Skrip Demo 10 Menit (urutan persis kriteria resmi)

> Hafalkan baris **Ketik** dan **katakan** — sisanya detail. Total ±10 menit.

**Pembuka (30 detik):**
> *"Saya demo 4 kriteria: unit test, linter, integration testing (opsional), dan integrasi
> SonarQube — hasil akhirnya: Quality Gate Passed, Reliability A, Maintainability A,
> Security A, dan coverage 96,9%."*

| Menit | Kriteria | Ketik | Hasil yang benar | Katakan |
| --- | --- | --- | --- | --- |
| 0–2 | **1. Unit Test (W)** | `npm test` | `Test Files 66 passed (66)` · `Tests 467 passed (467)` | *"467 unit test di 66 file — services, actions, lib, komponen, halaman — semuanya lulus."* |
| 2–3 | **1. Coverage (opsional)** | `npm run test:coverage` → `start coverage\lcov-report\index.html` | tabel `All files … 98.73` + laporan terbuka | *"Coverage 98,73% — jauh di atas syarat 80%."* |
| 3–4 | **2. Linter (W)** | `npm run lint` lalu `npm run typecheck` | dua-duanya kembali ke prompt **tanpa error** | *"ESLint 0 error 0 warning, TypeScript 0 error."* |
| 4–7 | **3. Integration (opsional)** | `npm run test:bdd` lalu `npm run test:bdd:report` | `19 passed` + laporan HTML terbuka | *"Bonus: 19 skenario end-to-end Playwright/BDD lulus — login, CRUD, POS, otorisasi, terekam video."* |
| 7–10 | **4. SonarQube (W)** + penilaian | `start http://localhost:9000/dashboard?id=stokita` | Quality Gate **Passed** | Lihat kotak di bawah |
| 10–12 | **Presentasi GitHub** | buka **PR #4** → tab *Files changed* → `docs/SONARQUBE.md` | 4 PR merged, 79 file | *"Bukti lengkapnya di GitHub — kode, test, konfigurasi, dan dokumentasi hasil analisis."* (lihat **§2B**) |

**Di dashboard SonarQube — tunjukkan 1 per 1 (kriteria penilaian):**
1. **Quality Gate: Passed** ✔ (hijau)
2. Tab **Overall Code** → sebut: **Reliability A** (0 bug) · **Maintainability A** (0 code smell) · **Security A** (0 vulnerability)
3. **Coverage 96,9%** → *"di atas 80% meskipun kriterianya opsional"*
4. Menu **Issues** → *"0 temuan terbuka"*
5. Nilai plus — kisah perbaikan: *"Awalnya ada 1 temuan `S6848` (elemen interaktif non-native di confirm-dialog), saya perbaiki menjadi `<button>` native, scan ulang → 0 temuan, semua A. Detail di `docs/SONARQUBE.md`."*

**Penutup (30 detik):**
> *"Semua terkirim di PR #4 (merged) — 467 unit test, konfigurasi SonarQube, dan dokumentasi
> `docs/SONARQUBE.md` beserta screenshot hasil analisis. `npm audit` juga 0 vulnerability."*

**Kalau diminta scan ulang langsung** (PowerShell, ±1,5 menit — sudah teruji jalan):
```powershell
$env:SONAR_TOKEN = (Get-Content "$env:USERPROFILE\AppData\Local\Temp\opencode\sonar-token.txt" -Raw).Trim()
npm run sonar:fast
```
tunggu `ANALYSIS SUCCESSFUL` → refresh dashboard. (Versi lengkap ulang-test dulu: `npm run sonar`, ±3–4 menit.)

---

## 1. Persiapan (lakukan H-1 malam & H-30 menit)

### Checklist H-1 malam
```powershell
git checkout main
git pull origin main          # pastikan commit merge PR #3 + #4 terbaru
npm install
```
- [ ] Pastikan `.env.local` ada (salin dari `.env.example`, isi Supabase + `STOKITA_ADMIN_PASSWORD` + `STOKITA_KASIR1_PASSWORD`) — **wajib untuk BDD & demo aplikasi**
- [ ] Nyalakan **SonarQube** (lihat kotak di bawah) dan pastikan status UP
- [ ] (Opsional) `npm run seed:accounts` → buat akun demo aplikasi

> **Server SonarQube — cara nyalakan/berhenti (penjelasan catatan tadi):**
> SonarQube adalah **server Java yang berjalan di laptop ini** (bukan layanan online), dibuka lewat
> `C:\Users\HP\Downloads\sonarqube-26.11.0.134175\sonarqube-26.11.0.134175\bin\windows-x86-64\StartSonar.bat`.
> - **Untuk demo besok: biarkan berjalan saja** — paling aman, dashboard langsung siap (butuh RAM ±1 GB, port 9000).
> - Server sekarang jalan **tersembunyi** (tanpa jendela konsol yang bisa diklik) — jadi jangan bingung mencari jendelanya. Kalau ingin mematikan setelah demo: matikan/lakukan restart laptop, atau tutup proses Java-nya lewat Task Manager.
> - **Nyalakan lagi** kapan pun: jalankan `StartSonar.bat`, tunggu **1–2 menit**, lalu buka
>   http://localhost:9000/api/system/status → tampil `"status":"UP"` berarti siap.
> - **Hasil analisis TIDAK hilang** saat dimatikan — tersimpan permanen di folder `sonarqube-26.11.0.134175` (database lokal), jadi dashboard tetap sama saat dinyalakan lagi.

### Siapkan 3 jendela terminal + 3 tab browser
| Terminal | Perintah |
| --- | --- |
| A | `npm run dev` (server aplikasi :3000) — *opsional, BDD otomatis menyalakan server sendiri* |
| B | untuk test/lint (dipakai bergantian) |
| C | `StartSonar.bat` — *biarkan jalan* |

| Tab browser | Untuk |
| --- | --- |
| 1 | Dashboard SonarQube `http://localhost:9000/dashboard?id=stokita` |
| 2 | GitHub PR #4 (https://github.com/JihanGaluhPutri/STOKITA/pull/4) + `docs/SONARQUBE.md` |
| 3 | Laporan coverage / aplikasi :3000 (saat bagian itu dibuka) |

---

## 1A. 🖥️ Persiapan Screen Share Google Meet (H-30)

> ⚠️ **Penting untuk Meet:** `http://localhost:9000` hanya berjalan di laptop **ANDA** —
> dosen **tidak bisa membuka link SonarQube-nya**. Jadi dashboard **wajib ditunjukkan lewat share layar**,
> dan cadangan buktinya adalah **screenshot di `docs/SONARQUBE.md`** (dosen bisa membukanya dari GitHub kapan pun).

### Sebelum masuk meeting
- [ ] **Matikan notifikasi**: Windows → klik jam kanan → **Focus / Do not disturb**; tutup aplikasi WhatsApp/email yang sering muncul.
- [ ] **Rapikan tab browser** — sisakan 4 tab saja: **Dashboard SonarQube** · **GitHub PR #4** · (siapkan) laporan coverage & laporan BDD. Tutup tab pribadi.
- [ ] **Zoom browser SonarQube**: tekan `Ctrl + -` sekali-dua kali → kartu **Reliability / Maintainability / Security + Coverage** terlihat sekaligus dalam satu layar (grid-nya 3 kolom, default agak lebar).
- [ ] **Perbesar teks terminal VS Code**: `Ctrl + +` (atau Settings → Terminal → Font Size: **15**) supaya hasil test terbaca jelas saat di-share.
- [ ] **Atur posisi jendela**: VS Code di **kiri**, browser di **kanan** → perpindahan mulus tanpa kehilangan fokus share.
- [ ] **Uji share 30 detik** sebelum dosen masuk: Meet → *Present now* → pilih layar → Stop present.

### Saat presentasi di Meet
1. Klik **Present now / Bagikan sekarang** → pilih **"Your entire screen / Seluruh layar"** — paling fleksibel karena demo bolak-balik: terminal VS Code → browser coverage → laporan BDD → dashboard SonarQube → GitHub. (Pilih *"A window"* hanya kalau dosen minta fokus ke satu aplikasi.)
2. **Matikan share audio** (tidak diperlukan).
3. Kalau dosen bilang *"layarnya blank/freeze"* → klik banner **"You are presenting"** → **Stop sharing** → **Present** ulang.
4. **Kalimat pembuka:** *"Saya share layar ya — SonarQube-nya berjalan di server lokal laptop saya, jadi harus lewat layar; nanti saya kirim link buktinya di chat."*
5. **Tempel di chat Meet saat penutup** (biar dosen bisa memverifikasi sendiri):
   - Repo: `https://github.com/JihanGaluhPutri/STOKITA`
   - PR #4 (pengiriman final): `https://github.com/JihanGaluhPutri/STOKITA/pull/4`
   - Dokumen hasil SonarQube + screenshot: `https://github.com/JihanGaluhPutri/STOKITA/blob/main/docs/SONARQUBE.md`
   - Dokumen lain: `docs/UNIT_TESTING.md` · `docs/BDD_TESTING.md` · `docs/PANDUAN_DEMO.md`

---

## 2. Alur Demo Kronologis (script bicara disertakan)

> **Mau jalankan semuanya lewat Terminal VS Code?** Ikuti saja urutan nomor di **§2A** —
> semua perintah di bawah ini sama, hanya tempat mengetiknya yang di terminal VS Code.

### Tahap 1 — Linter & Typecheck (≈1 menit)
```powershell
npm run lint
npm run typecheck
```
**Katakan:** *"Ini kriteria wajib kedua — ESLint bersih 0 error 0 warning, dan TypeScript `tsc --noEmit` juga 0 error, jadi kode bebas masalah statis sebelum masuk test."*

### Tahap 2 — Unit Test (≈2 menit)
```powershell
npm test
```
**Yang muncul:** `Test Files 66 passed (66)` · `Tests 467 passed (467)` (±2 menit).
**Katakan:** *"467 unit test di 66 file mencakup services, server actions, lib, types, komponen, dan seluruh halaman. Semuanya memakai mock Supabase (`src/test-utils/FakeSupabase`) sehingga deterministik — tanpa database, bisa dijalankan kapan pun, offline."*

### Tahap 3 — Coverage ≥80% (≈1 menit)
```powershell
npm run test:coverage
```
**Yang muncul:** `All files | 98.73 | 93.93 | 99.5 | 99.23` (Stmts/Branch/Funcs/Lines).
**Buka di browser:** `coverage/lcov-report/index.html` → bukti visual per-file.
**Katakan:** *"Coverage statements 98,73% — jauh di atas target 80% yang bersifat opsional ini."*

### Tahap 4 — Integration Testing Playwright/BDD (≈3 menit)
```powershell
npm run test:bdd        # 19 skenario; otomatis menyalakan dev server (konfigurasi webServer)
npm run test:bdd:report # buka laporan HTML di browser
```
**Katakan:** *"Ini BDD end-to-end: 5 file fitur — autentikasi, barang, barang masuk, penjualan, otorisasi — total 19 skenario yang menjalankan aplikasi sungguhan lewat browser (login, CRUD, POS, cek role). Setiap skenario terekam video."*
*(Detail & konsep BDD: `docs/BDD_RANGKUMAN.md`, `docs/BDD_TESTING.md` — siap untuk sesi tanya jawab.)*

### Tahap 5 — SonarQube Static Analysis (≈4 menit) ⭐ poin wajib
1. Buka **http://localhost:9000/dashboard?id=stokita**
2. Tunjukkan **Quality Gate: Passed** (hijau ✔)
3. Klik tab **Overall Code**, sebutkan kartu:
   - **Security A** — 0 open issues, 0 vulnerability
   - **Reliability A** — 0 open issues, 0 bug
   - **Maintainability A** — 0 open issues, 0 code smell
   - **Coverage 96,9%** · **Duplications 1,6%** · 0 accepted issue
4. Klik menu **Issues** → kosong (0 temuan).
5. **Ceritakan kisah perbaikan (nilai plus):**
   > *"Analisis pertama menemukan 1 temuan `typescript:S6848` (MAJOR) di `confirm-dialog.tsx` — backdrop dialog berupa `<div>` interaktif tanpa dukungan keyboard. Saya perbaiki menjadi `<button type='button' aria-label>` native. Hasil scan ulang: 0 temuan, semua rating naik A. Ceritanya ada di `docs/SONARQUBE.md` bagian 4."*
6. **Kalau diminta scan ulang di depan dosen:**
   ```powershell
   $env:SONAR_TOKEN = (Get-Content "$env:USERPROFILE\AppData\Local\Temp\opencode\sonar-token.txt" -Raw).Trim()
   npm run sonar:fast
   ```
   *Token dibaca otomatis dari file lokal — jangan ketik `<token analisis Anda>` secara literal, itu hanya contoh.* Token tidak pernah ditulis di repo. Kalau file token hilang: buat baru di UI SonarQube →
   avatar → **Security** → **Generate Tokens** → pilih **Global Analysis Token** → Generate (token muncul sekali, salin).
   Pastikan `sonar.host.url=http://localhost:9000` (sudah benar di `sonar-project.properties`; tanpa itu scanner menunjuk SonarQube Cloud dan berhenti `403`).

### Tahap 6 — Demo Aplikasi (opsional, ≈3 menit)
```powershell
npm run dev        # http://localhost:3000
```
Login **admin** (cek `docs/USER_GUIDE.md` untuk kredensial) → tunjukkan dashboard, CRUD barang, barang masuk → logout → login **kasir** → POS (keranjang, pembayaran, struk) → buktikan kasir **tidak bisa** buka halaman admin (otorisasi).

### Tahap 7 — Bukti Pengiriman di GitHub (≈1 menit)
- **PR #4** (merged): 467 unit test + integrasi SonarQube — https://github.com/JihanGaluhPutri/STOKITA/pull/4
- **PR #3** (merged): upgrade Next.js 16.4.0 → **16.4.4** → alasan nilai Security
- Dokumen: `docs/SONARQUBE.md` (+ 4 screenshot hasil analisis), `docs/UNIT_TESTING.md`, `docs/BDD_RANGKUMAN.md`

---

## 2A. Jalur Khusus: Menjalankan Semua lewat Terminal VS Code

Cocok kalau dosen berkata: *"jalankan lewat terminal VS Code saja"*.

### A. Buka & siapkan
1. **Buka folder proyek di VS Code**: `File → Open Folder… → C:\Users\HP\Downloads\STOKITA`
   (kalau VS Code sudah terbuka di folder STOKITA, langkah ini lewati).
2. **Buka terminal bawaan**: tekan **`` Ctrl + ` ``** (Ctrl + tombol di atas tombol Esc),
   atau menu `Terminal → New Terminal`. Panel terminal muncul di bawah.
   - **Tab terminal baru:** ikon **`+`** di panel terminal.
   - **Split (2 terminal berdampingan):** ikon **`▢`** di pojok kanan atas panel.
   - **Ganti tab:** ikon panah **`⌄`** di panel terminal.
3. Pastikan lokasinya benar — baris prompt harus `PS C:\Users\HP\Downloads\STOKITA>`.
   Kalau belum: `cd C:\Users\HP\Downloads\STOKITA`
4. (Sekali per sesi, kalau belum yakin dependency terbaru) `npm install`

### B. Urutan perintah — ketik satu per satu, lihat "hasil yang benar"

| # | Ketik | Hasil yang benar (tanda sukses) |
| --- | --- | --- |
| 1 | `git log --oneline -1` | commit merge terbaru (PR #3/#4) — *opsional* |
| 2 | `npm run lint` | kembali ke prompt **tanpa error** (hanya header `> eslint .`) |
| 3 | `npm run typecheck` | kembali ke prompt **tanpa output** = 0 error |
| 4 | `npm test` | `Test Files 66 passed (66)` dan `Tests 467 passed (467)` (±2 menit) |
| 5 | `npm run test:coverage` | tabel coverage + baris `All files … 98.73 … 99.23` |
| 6 | `start coverage\lcov-report\index.html` | browser terbuka → laporan coverage visual |
| 7 | `npm run test:bdd` | `19 passed` (Playwright; **otomatis menyalakan server app** di :3000) |
| 8 | `npm run test:bdd:report` | browser terbuka → laporan HTML BDD (video + screenshot) |
| 9 | `start http://localhost:9000/dashboard?id=stokita` | dashboard SonarQube terbuka → Quality Gate **Passed** |

> **Split terminal untuk demo aplikasi:** buka tab terminal kedua (ikon `+` atau split `▢`),
> lalu jalankan `npm run dev` → aplikasi di http://localhost:3000. Terminal pertama tetap
> dipakai untuk perintah test, jadi keduanya bisa berjalan bersamaan.

### C. Kalau diminta *scan ulang SonarQube* dari terminal VS Code
PowerShell (terminal default VS Code di Windows) — dua baris ini (sudah teruji jalan):
```powershell
$env:SONAR_TOKEN = (Get-Content "$env:USERPROFILE\AppData\Local\Temp\opencode\sonar-token.txt" -Raw).Trim()
npm run sonar:fast
```
Tunggu `ANALYSIS SUCCESSFUL … http://localhost:9000/dashboard?id=stokita` (±1,5 menit),
lalu refresh dashboard di browser. Kalau dosen minta test ulang dari nol, ganti baris 2 jadi `npm run sonar` (±3–4 menit).
Kalau file token hilang: buat baru via UI SonarQube
→ avatar → **Security** → **Generate Tokens** → **Global Analysis Token**.

### D. Kalau ada error di tengah jalan
- **`Cannot find module` / dependency aneh** → `npm install` lalu ulangi perintahnya.
- **`EADDRINUSE :3000`** → ada server lama: `Get-NetTCPConnection -LocalPort 3000` → `Stop-Process -Id <Id proses>` lalu `npm run dev` ulang.
- **localhost:9000 terbuka tapi kosong/404** → bukan alamatnya, pakai `/dashboard?id=stokita`; kalau benar-benar mati → jalankan ulang `StartSonar.bat`.
- **BDD gagal soal password/env** → cek `.env.local` terisi (`STOKITA_ADMIN_PASSWORD`, `STOKITA_KASIR1_PASSWORD`).
- **Salah ketik** → tekan **↑** untuk memanggil perintah sebelumnya; **Ctrl+C** membatalkan perintah yang sedang jalan.

### E. Katakan apa setelah tiap perintah
| Setelah | Kalimat singkat |
| --- | --- |
| `npm run lint` | *"Linter bersih — 0 error, 0 warning."* |
| `npm test` | *"467 unit test di 66 file, seluruhnya lulus."* |
| `test:coverage` | *"Coverage 98,73% — di atas target 80%."* |
| `test:bdd` | *"19 skenario end-to-end BDD lulus, server aplikasi otomatis ikut dijalankan."* |
| dashboard SonarQube | *"Quality Gate Passed; Reliability, Security, Maintainability semuanya A; coverage 96,9%; 0 open issue."* |

---

## 2B. 🐙 Presentasi GitHub (±2–3 menit)

Buka `https://github.com/JihanGaluhPutri/STOKITA` (tab sudah disiapkan). Urutan klik + kalimatnya:

| # | Klik | Katakan |
| --- | --- | --- |
| 1 | Halaman utama **repo** → tunjukkan README (tabel *Perintah* + *Daftar Dokumentasi*) | *"Semua sudah di-merge ke `main`. README memuat daftar perintah — `npm test`, `npm run test:coverage`, `npm run sonar` — dan 10 dokumen lengkap."* |
| 2 | **Pull requests → PR #4** (tab *Conversation*) | *"Ini pengiriman utama tugas — **79 file berubah**, sudah di-merge."* |
| 3 | Tab **Files changed** → tunjukkan sekilas | *"Puluhan file test baru (66 file), infrastruktur mock Supabase, `sonar-project.properties`, script coverage & sonar, `docs/SONARQUBE.md` dengan 4 screenshot, plus perbaikan `confirm-dialog.tsx`."* |
| 4 | Buka file **`docs/SONARQUBE.md`** → klik salah satu **screenshot** | *"Ini bukti visual hasil analisis: Quality Gate Passed, rating A/A/A, coverage 96,9% — saya perbesar supaya jelas."* |
| 5 | Kembali ke daftar **Pull requests** | *"Riwayatnya: PR #1 unit test awal, PR #2 BDD Playwright, PR #3 upgrade Next.js 16.4.4 untuk keamanan, PR #4 final — **empat-empatnya merged**."* |
| 6 | Tab **Actions** → klik run terbaru **Continuous Testing** → tunjukkan ✓ Linter, ✓ Typecheck, ✓ Unit test + coverage | *"Dan ini continuous testing-nya: setiap push/PR, GitHub Actions otomatis menjalankan lint, typecheck, dan seluruh unit test — semua hijau."* |
| 7 | (Penutup) | *"Jadi semua kriteria — unit test, linter, integration testing, SonarQube — ada buktinya di repo: kode, test, konfigurasi, dan dokumentasi hasil analisis."* |

**Kalau internet/GitHub lambat atau gagal dimuat** (fallback lokal — hasilnya sama):
```powershell
git log --oneline -12        # riwayat commit di terminal VS Code
```
lalu buka `docs/SONARQUBE.md` di VS Code → tekan **`Ctrl + Shift + V`** → preview Markdown lengkap dengan screenshot.

---

## 3. Tabel Kilat: "Kalau dosen minta X → jalankan Y"

| Permintaan dosen | Perintah / Aksi |
| --- | --- |
| "Jalankan test-nya" | `npm test` |
| "Buktikan coverage-nya" | `npm run test:coverage` → buka `coverage/lcov-report/index.html` |
| "Lint-nya mana" | `npm run lint` |
| "TypeScript-nya aman?" | `npm run typecheck` |
| "Jalankan BDD-nya" | `npm run test:bdd` lalu `npm run test:bdd:report` |
| "Buka hasil SonarQube" | browser → http://localhost:9000/dashboard?id=stokita |
| "Scan ulang sekarang" | 2 baris: `$env:SONAR_TOKEN = (Get-Content "$env:USERPROFILE\AppData\Local\Temp\opencode\sonar-token.txt" -Raw).Trim()` lalu `npm run sonar:fast` |
| "Bisa saya buka link-nya?" | **Tidak bisa** (`localhost` hanya di laptop Anda) → share layar, lalu beri link GitHub: PR #4 & `docs/SONARQUBE.md` (berisi screenshot) |
| "SonarQube tidak bisa dibuka" | jalankan `StartSonar.bat`, tunggu 1–2 menit, cek `/api/system/status` |
| "Mana bukti di GitHub" | PR #4, PR #3, `docs/SONARQUBE.md` |
| "Keamanan dependensi" | `npm audit --omit=dev` → **0 vulnerabilities** |

---

## 4. Troubleshooting Cepat

| Gejala | Solusi |
| --- | --- |
| `localhost:9000` tidak terbuka | Server SonarQube belum jalan → `StartSonar.bat`, tunggu hingga `/api/system/status` = `UP` |
| Scanner error `403 / SonarQube Cloud` | `sonar.host.url` salah — pastikan `http://localhost:9000` di `sonar-project.properties` |
| `SONAR_TOKEN` tidak ada | Buat baru: UI SonarQube → Security → Generate Tokens → **Global Analysis Token** |
| Port 3000 sibuk | Tutup dev server lama: `Get-NetTCPConnection -LocalPort 3000` → `Stop-Process -Id <pid>` |
| BDD gagal "env tidak ditemukan" | `.env.local` belum ada/isi tidak lengkap (`STOKITA_ADMIN_PASSWORD`, `STOKITA_KASIR1_PASSWORD`) |
| Folder `coverage/` tidak ada | Artefak tidak ikut di-commit (by design) → regenerasi `npm run test:coverage` (±2 menit) |
| Hasil SonarQube berubah/di-reset | Data analisis tersimpan di folder SonarQube — jangan hapus/unduh ulang ZIP tersebut |
| Test tiba-tiba gagal setelah `git pull` | `npm install` (dependency/lockfile ikut ter-update) |

---

## 5. Angka yang Perlu Dihafal

| Metrik | Nilai |
| --- | --- |
| Unit test | **66 file · 467 kasus · 100% lulus** |
| Coverage Vitest | **98,73%** statements (940/952) · branch 93,93% · lines 99,23% |
| Lint / Typecheck | **0 error, 0 warning** / **0 error** |
| BDD Playwright | **19 skenario · 5 fitur · 14 file** · video terekam |
| Quality Gate SonarQube | **Passed** |
| Rating | **Reliability A · Security A · Maintainability A** |
| Temuan Sonar | 0 bug · 0 vulnerability · 0 code smell · **0 open issue** |
| Coverage SonarQube | **96,9%** (target ≥80% ✅) · Duplications **1,6%** · ncloc 4.998 |
| Perbaikan temuan | 1 temuan `S6848` diperbaiki → kini 0 |
| Keamanan | Next.js **16.4.4** (PR #3) · `npm audit` **0 vulnerability** |

---

## 6. Siapkan Jawaban untuk Pertanyaan Umum

**Kenapa pakai mock Supabase di unit test?**
Agar 467 test deterministik, cepat (±2 menit), dan jalan offline tanpa database. Infrastruktur mock-nya sendiri (`src/test-utils/FakeSupabase`) juga teruji.

**Kenapa coverage SonarQube 96,9% tapi Vitest 98,73%?**
Basis hitung berbeda: Vitest menghitung *statements*, SonarQube menghitung *baris dalam lingkup analisisnya*. Keduanya jauh di atas 80%.

**Apa bedanya unit test dan BDD?**
Unit test (Vitest) menguji fungsi/komponen secara terisolasi dengan mock; BDD (Playwright) menjalankan aplikasi sungguhan di browser dari sudut pandang pengguna, termasuk alur login & otorisasi.

**Kenapa SonarQube lokal, bukan SonarCloud?**
Community Edition dijalankan offline di mesin — data analisis tidak keluar dari laptop, bisa diulang kapan pun tanpa akun/kuota internet.

**Kenapa ada 1 temuan pada awalnya?**
Aturan `S6848` (elemen interaktif non-native) — nilai plus: ditemukan oleh SonarQube, diperbaiki, dan diverifikasi ulang hingga 0 temuan.

**Di mana bukti pengirimannya?**
PR #4 (merged) beserta `docs/SONARQUBE.md` berisi konfigurasi, hasil, dan screenshot dashboard.

---

### Checklist 5 Menit Sebelum Demo Dimulai
- [ ] **Meet:** notifikasi mati (Focus/Do not disturb) · tab browser tinggal 4 tab · zoom browser SonarQube `Ctrl + -` · teks terminal `Ctrl + +`
- [ ] **SonarQube UP**: http://localhost:9000/api/system/status → `"status":"UP"`
- [ ] `git log --oneline -1` menunjukkan merge commit terbaru
- [ ] `npm run lint` bersih (sudah pasti, tapi biar tenang)
- [ ] Tab terbuka: dashboard SonarQube · GitHub PR #4 · VS Code (kiri) + browser (kanan)
- [ ] `.env.local` lengkap (kalau tahap demo aplikasi/BDD dipakai)
- [ ] Siap tempel ke **chat Meet** saat penutup: link PR #4 + `docs/SONARQUBE.md`
- [ ] Uji *Present now* 30 detik → Stop → laptop terisi daya / colokan siap 😄
