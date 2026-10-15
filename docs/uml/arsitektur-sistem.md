# Diagram Arsitektur Sistem STOKITA

**Tujuan diagram:** memperlihatkan komponen sistem Stokita — frontend
(halaman & komponen klien), backend (Server Component, Server Action,
service), autentikasi, database, dan layanan eksternal — beserta arah
komunikasinya, sesuai struktur kode yang ada (Next.js App Router +
Supabase + Vercel).

**Dua tampilan:**

1. **Diagram komponen** (diagram 1) — satuan fungsional aplikasi dan
   dependensinya.
2. **Diagram deployment/arsitektur runtime** (diagram 2) — bagaimana
   komponen tersebut dipasang pada Vercel dan Supabase.

```mermaid
flowchart TB
    subgraph FE["Frontend (dijalankan di browser)"]
        HAL["Server-Rendered Pages<br/>login, admin/*, kasir/*"]
        CLI["Client Component<br/>SaleTerminal, ProductSearch,<br/>SaleCart, PaymentForm,<br/>ProductStatusButton, ConfirmDialog,<br/>LoginForm (toggle ikon mata)"]
        CSS["globals.css<br/>desain Stokita"]
    end

    subgraph BE["Backend dalam Next.js (runtime Vercel)"]
        PXY["src/proxy.ts<br/>validasi sesi + refresh cookie<br/>(middleware konvensi Next 16)"]
        RSC["Server Component Pages<br/>render + baca data (force-dynamic)"]
        ACT["Server Actions<br/>login, logout, createProduct,<br/>updateProduct, setProductStatus,<br/>deleteProduct, stockIn, checkout"]
        SVC["Service Layer (server-only)<br/>auth, product, stock, sales, dashboard"]
        HEL["Helpers<br/>requireUser / requireRole,<br/>validation, business/*, env"]
        ERR["errors.ts<br/>mapSupabaseError + reportServiceError<br/>(katalog messages.ts)"]
    end

    subgraph AUTH["Autentikasi Supabase"]
        SAUTH["Supabase Auth<br/>signInWithPassword / signOut<br/>sesi cookie httpOnly + SameSite=Lax"]
    end

    subgraph DB["Database PostgreSQL (Supabase)"]
        PGR["PostgREST<br/>query tabel (RLS aktif)"]
        FUN["Fungsi transaksional<br/>add_stock_in (admin),<br/>checkout_sale (kasir)"]
        TBL[("5 tabel: profiles, products,<br/>sales, sale_items, stock_movements<br/>+ constraint, RLS, sequence")]
        RLS["Lapis keamanan:<br/>RLS per tabel, grant minimal,<br/>UPDATE products tanpa kolom stok"]
    end

    subgraph EXT["Lingkungan / Layanan"]
        VER["Vercel<br/>build + hosting production<br/>Environment Variables"]
        ENV[".env.local (dev)<br/>NEXT_PUBLIC_SUPABASE_URL,<br/>NEXT_PUBLIC_SUPABASE_ANON_KEY,<br/>SUPABASE_SERVICE_ROLE_KEY (server)"]
        SEED["scripts/create-accounts.mjs<br/>(admin API — jalur seed, bukan runtime)"]
    end

    CLI --> HAL
    HAL --> PXY
    PXY --> RSC
    CLI -- "POST Server Action" --> ACT
    ACT --> SVC
    RSC --> SVC
    SVC --> HEL
    SVC --> ERR
    SVC --> SAUTH
    SVC -- "select / insert produk" --> PGR
    SVC -- "rpc (barang masuk / checkout)" --> FUN
    PGR --> RLS
    FUN --> RLS
    RLS --> TBL
    SAUTH --> TBL
    VER -.-> BE
    ENV -.-> BE
    SEED -.->|service role key| SAUTH
```

**Diagram runtime (deploy):**

```mermaid
flowchart LR
    subgraph UserDevice["Perangkat pengguna"]
        BR["Browser<br/>(admin / kasir)"]
    end

    subgraph VercelRun["Vercel Production"]
        Edge["Edge/Node runtime<br/>proxy.ts → halaman/server action"]
        Build["Build Next.js<br/>(npm run build, Turbopack)"]
    end

    subgraph SupaRun["Supabase"]
        AuthRun["Auth API<br/>(token & refresh)"]
        API["PostgREST / RPC"]
        Pg[("PostgreSQL<br/>+ RLS")]
    end

    BR -- "HTTPS (cookie sesi)" --> Edge
    Edge -- "getUser / signIn" --> AuthRun
    Edge -- "query & rpc (anon key + sesi)" --> API
    API --> Pg
    AuthRun --> Pg
    Build -.->|deployment| Edge
```

**Penjelasan alur komponen:**

1. **Permintaan masuk** → `proxy.ts` memvalidasi sesi (dan me-refresh
   cookie) → Server Component merender halaman, memanggil service untuk
   membaca data → HTML + payload RSC dikirim ke browser.
2. **Interaksi pengguna** (submit form, checkout, toggle status) → POST
   Server Action → service memvalidasi input & otorisasi → PostgREST
   (CRUD produk) atau RPC (`add_stock_in`, `checkout_sale`) → state
   hasil/redirect → UI menyegarkan data dari server.
3. **Autentikasi** sepenuhnya di Supabase Auth; aplikasi hanya memakai
   sesi cookie dan membaca profil `profiles` — tanpa sesi publik/registrasi.
4. **Keamanan data** berada di database: RLS + grant minimal + fungsi
   SECURITY DEFINER; anon key yang ada di browser tidak cukup untuk
   menembus aturan tersebut.
5. **Operasional**: build & runtime di Vercel dengan environment variables
   produksi; pembuatan akun awal memakai service role key **hanya** di
   script lokal seed (tidak pernah mengalir ke browser).

Keterangan lebih lanjut: [Arsitektur Sistem](../ARCHITECTURE.md),
[API dan Keamanan](../API_AND_SECURITY.md),
[Deployment dan Operasional](../DEPLOYMENT_AND_OPERATIONS.md).
