# Sequence Diagram — Login

**Tujuan diagram:** memvisualisasikan proses login Stokita dari pengiriman
form hingga validasi kredensial, pemeriksaan profil/role, penetapan tujuan
redirect, termasuk cabang gagal — sesuai alur di
`src/app/actions/auth.actions.ts` → `src/services/auth.service.ts` →
Supabase Auth, serta proteksi sesi oleh `src/proxy.ts`.

**Alur ringkas:** form login → Server Action `login` → validasi input →
username dipetakan ke email internal → `signInWithPassword` → baca baris
`profiles` → role & username cocok → redirect ke home role (atau `next`
yang masih dalam prefix role). Kegagalan apa pun menghasilkan pesan umum
tanpa membocorkan penyebab.

```mermaid
sequenceDiagram
    autonumber
    actor P as Pengguna
    participant B as Browser
    participant PR as proxy.ts
    participant LP as LoginPage / LoginForm
    participant LA as Server Action "login"
    participant AS as auth.service
    participant AU as Supabase Auth
    participant DB as PostgreSQL (profiles + RLS)

    P ->> B: buka /login (atau /admin tanpa sesi)
    B ->> PR: GET jalur terproteksi
    PR ->> AU: getUser() via cookie
    AU -->> PR: tanpa sesi
    PR -->> B: redirect /login?next=/admin...
    B ->> LP: GET /login
    LP -->> B: render LoginForm (input username/password, ikon mata)

    P ->> B: isi username & password, klik Masuk
    B ->> LA: POST Server Action (FormData)
    LA ->> AS: authenticateUser(username, password)

    alt username atau password kosong
        AS -->> LA: fail USERNAME_REQUIRED / PASSWORD_REQUIRED
        LA -->> B: state {error} per field (tidak ada panggilan Auth)
        B ->> P: pesan error di bawah input
    else username tidak sesuai pola / > 64 karakter
        AS -->> LA: fail AUTH_INVALID
        LA -->> B: state {error}
    else input valid
        AS ->> AS: username ke huruf kecil, petakan ke {username}@stokita.local
        AS ->> AU: signInWithPassword(email, password)
        alt kredensial ditolak (HTTP 4xx)
            AU -->> AS: error auth
            AS ->> AS: log server (reportServiceError), samarkan pesan
            AS -->> LA: fail AUTH_INVALID ("Username atau password salah.")
            LA -->> B: state {error}
            B ->> P: pesan umum (tanpa info user/password salah)
        else kredensial benar
            AU -->> AS: user + session (cookie di-set)
            AS ->> DB: select nama, username, role dari profiles (eq id)
            alt profil tidak ada / role tidak valid / username tidak cocok
                DB -->> AS: baris tidak valid
                AS ->> AU: signOut() (batalkan sesi)
                AS -->> LA: fail AUTH_PROFILE_INVALID
                LA -->> B: state {error}
            else profil valid
                DB -->> AS: {nama, username, role}
                AS -->> LA: ok AuthUser (id, nama, role, homePath)
                LA ->> LA: resolveHome(next, user) - hanya bila next masih di prefix role
                LA -->> B: redirect 303 ke /admin, /kasir, atau next valid
                B ->> PR: request halaman tujuan (cookie sesi baru)
                PR ->> AU: getUser()
                AU -->> PR: sesi valid
                PR -->> B: lanjut render halaman sesuai role (layout requireRole)
                B ->> P: tampil area kerja (dashboard admin / beranda kasir)
            end
        end
    end
```

**Penjelasan langkah penting:**

1. **Proteksi terjadi sebelum halaman** — `proxy.ts` me-refresh cookie dan
   mengarahkan pengguna tanpa sesi ke `/login?next=…`; parameter `next`
   dipakai lagi saat login.
2. **Validasi dua tahap** — format input dulu (tanpa panggilan Auth), baru
   `signInWithPassword`; kegagalan Auth 4xx disamarkan menjadi satu pesan
   umum agar tidak membocorkan keberadaan akun.
3. **Profil adalah gerbang role** — sesi Auth saja tidak cukup; baris
   `profiles` harus ada, role harus `admin|kasir`, dan username harus cocok;
   jika tidak, sesi langsung diakhiri (`signOut`).
4. **Redirect aman** — `next` hanya diterima bila masih dalam prefix role
   sendiri (`/admin…` untuk admin, `/kasir…` untuk kasir), selain itu ke
   home role (`homePathForRole`).
5. **Sesi berikutnya** kembali diverifikasi `proxy.ts` + layout
   `requireRole` — kegagalan role menghasilkan halaman akses ditolak, bukan
   konten.

**Cabang gagal yang tidak ditampilkan agar tetap ringkas:** jaringan
error saat memanggil Auth (dipetakan `LOGIN_FAILED` — "Login gagal. Silakan
coba lagi.") dan penolakan layout halaman (`requireRole` → `AccessDenied`).

Terkait: [Use Case](use-case.md),
[API dan Keamanan](../API_AND_SECURITY.md#1-autentikasi-dan-logout).
