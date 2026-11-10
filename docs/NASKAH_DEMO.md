# 🎤 Naskah Demo Final Project — STOKITA

> **Cara pakai:** teks **tebal** = kalimat yang **diucapkan** · `[aba-aba]` = tindakan di layar ·
> waktu perkiraan per bagian. Total **±13 menit**. Boleh dibuka sebagai tab di VS Code saat demo.
> Kalimat bersifat panduan — boleh diucapkan dengan gaya bahasa sendiri asal poinnya sampai.

---

## ▶ PEMBUKA (±40 detik)

**[Tunjuk layar: VS Code terbuka, tab dashboard SonarQube & GitHub sudah siap]**

> *"Assalamualaikum / selamat siang Pak/Bu. Saya [Nama], ini demo Final Project saya.*
>
> *Ada **4 kriteria** yang saya tunjukkan: **pertama unit test, kedua linter, ketiga integration testing sebagai opsional, dan keempat integrasi SonarQube** untuk static code analysis.*
>
> *Hasil akhirnya: **Quality Gate Passed**, penilaian **Reliability A, Maintainability A, Security A**, dan **coverage 96,9%** — di atas target 80%.*
>
> *Saya mulai dari unit test ya."*

---

## 1️⃣ UNIT TEST (WAJIB) — ±3 menit

**[Ketik]** `npm test` **[Enter]**

**[Saat menunggu test jalan ±70 detik — ucapkan:]**

> *"Ini menjalankan seluruh unit test di aplikasi. Cakupannya lengkap — services, server actions, lib, types, komponen, sampai seluruh halaman admin dan kasir.*
>
> *Supaya cepat dan deterministik, test-nya memakai mock Supabase buatan sendiri di `src/test-utils`, jadi tidak tergantung database dan bisa dijalankan kapan pun, offline."*

**[Tampil hasil]** `Test Files 66 passed (66)` · `Tests 467 passed (467)`

> *"Selesai — **66 file test, 467 kasus uji, semuanya lulus**."*

**[Ketik]** `npm run test:coverage` **[Enter]** → **[saat selesai]** `start coverage\lcov-report\index.html`

**[Tunjuk laporan coverage di browser]**

> *"Ini laporan coverage-nya: **98,73%** statements — jauh di atas syarat 80% yang bersifat opsional ini. Laporan per-file-nya juga bisa dibuka seperti ini."*

---

## 2️⃣ IMPLEMENT LINTER (WAJIB) — ±1 menit

**[Kembali ke terminal]** **[Ketik]** `npm run lint` **[Enter]**

> *"Kriteria kedua: linter. ESLint-nya kembali bersih — **0 error, 0 warning**."*

**[Ketik]** `npm run typecheck` **[Enter]**

> *"Dan TypeScript `tsc --noEmit` juga **0 error** — jadi kode bebas masalah statis sebelum masuk ke tahap pengujian lain."*

---

## 3️⃣ INTEGRATION TESTING (OPSIONAL — bonus) — ±2,5 menit

**[Ketik]** `npm run test:bdd` **[Enter]**

**[Saat menunggu ±1–2 menit — ucapkan:]**

> *"Ini bagian opsional yang saya kerjakan sebagai nilai plus: **integration testing end-to-end dengan Playwright**.*
>
> *Berbeda dengan unit test yang menguji fungsi satu-satu, yang ini menjalankan **aplikasi sungguhan di browser** — dari login, CRUD barang, barang masuk, transaksi POS, sampai pengecekan otoritas admin vs kasir.*
>
> *Skenarionya ditulis dalam format BDD, jadi bisa dibaca seperti bahasa manusia: Given-When-Then."*

**[Tampil hasil]** `19 passed`

> *"**19 skenario lulus semua**, di 5 file fitur. Laporan lengkapnya ada video perekamannya — saya buka contohnya."*

**[Ketik]** `npm run test:bdd:report` → **[tunjuk 1 skenario + videonya di browser]**

> *"Setiap skenario terekam video, jadi kalau ada kegagalan bisa langsung dilihat penyebabnya."*

---

## 4️⃣ INTEGRASI SONARQUBE (WAJIB) — ±3,5 menit

**[Buka browser tab Dashboard SonarQube]** `http://localhost:9000/dashboard?id=stokita`
**(kalau perlu)** `start http://localhost:9000/dashboard?id=stokita`

**[Tunjuk bagian Quality Gate]**

> *"Sekarang kriteria wajib terakhir: **integrasi SonarQube untuk static code analysis**.*
>
> *Ini berjalan **lokal di laptop saya** — SonarQube Community Edition + SonarScanner, jadi analisisnya tidak mengirim kode keluar. Pertama saya perlihatkan **Quality Gate-nya: Passed**."*

**[Klik tab Overall Code → tunjuk kartu satu per satu]**

> *"Ini hasil penilaian yang diminta:*
> - ***Reliability A** — 0 bug, 0 open issue*
> - ***Maintainability A** — 0 code smell*
> - ***Security A** — 0 vulnerability*
> - *Dan **coverage 96,9%** — di atas 80% meskipun kriterinya opsional.*
>
> *Di menu **Issues**-nya juga kosong — **0 temuan terbuka**."*

**[Klik menu Issues → tunjukkan kosong]**

**[Nilai plus — ceritakan dengan percaya diri:]**

> *"Menariknya, saat analisis pertama SonarQube **menemukan 1 temuan** — aturan `S6848`, elemen interaktif non-native di komponen dialog konfirmasi. Saya perbaiki menjadi `<button>` native yang aksesibel, lalu scan ulang — **sekarang 0 temuan dan semua rating A**.*
>
> *Jadi alat analisisnya benar-benar dipakai, bukan sekadar dipasang. Cerita lengkapnya beserta screenshot ada di `docs/SONARQUBE.md`."*

---

## 5️⃣ PRESENTASI GITHUB — ±2,5 menit

**[Buka tab GitHub → PR #4]**

> *"Terakhir, bukti pengirimannya di GitHub — **PR #4**, sudah merged, **79 file berubah**."*

**[Klik tab *Files changed* → tunjuk beberapa file]**

> *"Di sini terlihat: puluhan file test baru, infrastruktur mock Supabase, `sonar-project.properties`, script `test:coverage` dan `sonar`, dokumentasi SonarQube beserta 4 screenshot, plus perbaikan komponen dialog tadi."*

**[Buka `docs/SONARQUBE.md` → klik salah satu screenshot → perbesar]**

> *"Ini bukti visual dashboard-nya: Quality Gate Passed, rating A/A/A, coverage 96,9% — bisa dibuka kapan pun dari GitHub."*

**[Kembali ke daftar Pull requests]**

> *"Riwayatnya: PR #1 unit test awal, PR #2 BDD testing, PR #3 upgrade Next.js ke 16.4.4 untuk keamanan — dan `npm audit`-nya juga **0 vulnerability** — lalu PR #4 ini. **Empat-empatnya merged**."*

---

## ✅ PENUTUP (±30 detik)

**[Tempel di chat Meet:]**
```
Repo   : https://github.com/JihanGaluhPutri/STOKITA
PR #4  : https://github.com/JihanGaluhPutri/STOKITA/pull/4
Hasil SonarQube + screenshot : https://github.com/JihanGaluhPutri/STOKITA/blob/main/docs/SONARQUBE.md
```

> *"Jadi kesimpulannya: **unit test 467 kasus lulus dengan coverage 98,73%, linter bersih, integration testing 19 skenario, dan SonarQube Quality Gate Passed dengan Reliability A, Maintainability A, Security A, coverage 96,9%**.*
>
> *Semua buktinya ada di repo yang sudah saya tempel di chat — kode, test, konfigurasi, dan dokumentasi. Sekian demo dari saya, terima kasih — silakan kalau ada pertanyaan."*

---

## 🗣️ Kata-kata penyelamat (kalau terjadi sesuatu)

| Situasi | Kalimat yang diucapkan |
| --- | --- |
| Test lambat / diam | *"Lumayan butuh waktu karena 467 test — sebentar ya, sambil saya jelaskan cakupannya…"* |
| Salah ketik | *"Maaf, salah ketik — saya ulangi."* **[↑ lalu Enter]** |
| SonarQube tidak terbuka | *"Server SonarQube-nya belum saya nyalakan sebentar — saya nyalakan dulu ±1 menit. Sambil menunggu, ini bukti screenshot-nya di `docs/SONARQUBE.md`."* |
| Layar share berhenti | *"Mohon maaf, share-nya berhenti — saya present ulang sebentar."* |
| Diminta scan ulang | *"Siap, saya scan ulang sekarang — ±1,5 menit hasilnya muncul."* **[ketik 2 baris perintah]** |
| Internet/GitHub lemot | *"Kayaknya jaringan ke GitHub-nya lambat — saya buka versi lokalnya ya"* **[buka `docs/SONARQUBE.md` di VS Code, `Ctrl+Shift+V`]** |
| Lupa angka | Lihat **§5 Angka yang Perlu Dihafal** di `docs/PANDUAN_DEMO.md` |

---

## ❓ Persiapan Tanya Jawab (poin singkat)

**Q: Kenapa coverage-nya dua angka (98,73% vs 96,9%)?**
> *"Basis hitungnya beda — Vitest menghitung statements, SonarQube menghitung baris dalam lingkup analisisnya. Dua-duanya jauh di atas 80%."*

**Q: Kenapa pakai mock, bukan database asli?**
> *"Supaya 467 test cepat, deterministik, dan bisa jalan offline. Database aslinya diuji lewat integration testing BDD."*

**Q: Kenapa SonarQube lokal, bukan SonarCloud?**
> *"Supaya analisisnya offline dan bisa diulang kapan pun tanpa akun/kuota — cocok untuk pengembangan lokal."*

**Q: Apa bedanya unit test dan BDD?**
> *"Unit test menguji fungsi terisolasi dengan mock; BDD menjalankan aplikasi sungguhan di browser dari sudut pandang pengguna."*

**Q: Selain itu, ada yang diperbaiki dari hasil analisis?**
> *"Ada — 1 temuan aksesibilitas (S6848), sudah saya perbaiki dan terverifikasi 0 temuan."*

**Q: Kenapa pakai SonarQube Community?**
> *"Karena free dan open source untuk analisis kode produksi — dapat rating A/A/A, coverage, duplikasi, dan quality gate."*

**Q: Berapa lama seluruh test dijalankan?**
> *"Unit test ±70 detik, BDD ±1–2 menit, scan SonarQube ±1,5 menit."*

**Q: Di mana dokumentasinya?**
> *"`docs/SONARQUBE.md` untuk hasil analisis, `docs/UNIT_TESTING.md` untuk unit test, `docs/BDD_TESTING.md` untuk BDD — semua ada di repo."*
