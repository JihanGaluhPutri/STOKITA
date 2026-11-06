# 🎬 Panduan Demo Final Project — STOKITA

**Durasi ideal:** 10–15 menit · **Branche/demo di:** `main` @ hasil merge PR #1–#4
**Kriteria:** Unit Test (W) · Linter (W) · Integration Testing Playwright · SonarQube (W)
**Penilaian:** Reliability A · Maintainability A · Security A · Coverage ≥80% (opsional ✅)

---

## 0. Peta 60 Detik — Kriteria → Apa yang Ditunjukkan

| Kriteria | Bukti utama | Perintah / Link |
| --- | --- | --- |
| Unit Test (Wajib) | **66 file · 467 test lulus · coverage 98,73%** | `npm test` / `npm run test:coverage` |
| Linter (Wajib) | **0 error, 0 warning** + typecheck 0 error | `npm run lint` · `npm run typecheck` |
| Integration Playwright | **19 skenario BDD lulus** (5 fitur) | `npm run test:bdd` · `npm run test:bdd:report` |
| SonarQube (Wajib) | **Quality Gate Passed · A/A/A · Coverage 96,9%** | http://localhost:9000/dashboard?id=stokita |
| Reliability A | 0 bug, 0 open issue | dashboard → tab Overall Code |
| Maintainability A | 0 code smell | dashboard → tab Overall Code |
| Security A | 0 vulnerability + `npm audit` 0 vulnerability | dashboard + PR #3 (Next.js 16.4.4) |
| Coverage ≥80% | **96,9%** (Sonar) / **98,73%** (Vitest) | `coverage/lcov-report/index.html` |
| Kelengkapan dokumen | PR merged + dokumentasi | PR #4 · `docs/SONARQUBE.md` |

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

## 2. Alur Demo Kronologis (script bicara disertakan)

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
   $env:SONAR_TOKEN = "<token analisis Anda>"
   npm run sonar        # = vitest run --coverage && sonar-scanner (±1–2 menit)
   ```
   *Token tidak pernah ditulis di repo.* Kalau lupa/hilang: buat baru di UI SonarQube →
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

## 3. Tabel Kilat: "Kalau dosen minta X → jalankan Y"

| Permintaan dosen | Perintah / Aksi |
| --- | --- |
| "Jalankan test-nya" | `npm test` |
| "Buktikan coverage-nya" | `npm run test:coverage` → buka `coverage/lcov-report/index.html` |
| "Lint-nya mana" | `npm run lint` |
| "TypeScript-nya aman?" | `npm run typecheck` |
| "Jalankan BDD-nya" | `npm run test:bdd` lalu `npm run test:bdd:report` |
| "Buka hasil SonarQube" | browser → http://localhost:9000/dashboard?id=stokita |
| "Scan ulang sekarang" | `$env:SONAR_TOKEN="<token>"` lalu `npm run sonar` |
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
- [ ] `git log --oneline -1` menunjukkan merge commit terbaru
- [ ] http://localhost:9000/api/system/status → `"status":"UP"`
- [ ] `npm run lint` bersih (sudah pasti, tapi biar tenang)
- [ ] Tab terbuka: dashboard SonarQube · PR #4 · VS Code
- [ ] `.env.local` lengkap (kalau tahap demo aplikasi/BDD dipakai)
- [ ] Laptop terisi daya / colokan siap 😄
