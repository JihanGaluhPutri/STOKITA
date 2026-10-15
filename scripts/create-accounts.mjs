#!/usr/bin/env node
/**
 * TB-26 — Pembuatan akun awal Stokita (1 admin + 2 kasir) melalui mekanisme
 * administratif Supabase Auth (admin.createUser), lalu penyelarasan baris
 * profiles. Tidak ada halaman registrasi publik.
 *
 * Idempoten: akun yang sudah ada tidak diduplikasi; profil diselaraskan.
 * Password dibaca HANYA dari environment variable — tidak pernah dari
 * source code, argumen baris perintah, maupun file SQL.
 *
 * Pemakaian:
 *   1. Isi di .env.local (atau sesi shell aman):
 *        NEXT_PUBLIC_SUPABASE_URL=...
 *        SUPABASE_SERVICE_ROLE_KEY=...
 *        STOKITA_ADMIN_PASSWORD=...
 *        STOKITA_KASIR1_PASSWORD=...
 *        STOKITA_KASIR2_PASSWORD=...
 *   2. npm run seed:accounts
 *
 * Pemetaan username → email internal mengikuti src/services/auth.service.ts
 * (usernameToEmail): `{username_lowercase}@stokita.local`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// Muat .env.local bila variabel belum ada di process.env (tanpa dependensi).
// Nilai di environment proses tetap diutamakan.
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const name of [".env.local", ".env"]) {
  let raw;
  try {
    raw = readFileSync(join(projectRoot, name), "utf8");
  } catch {
    continue;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (value !== "" && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const EMAIL_DOMAIN = "stokita.local";

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Variabel environment wajib belum diisi: ${name}. ` +
        `Isi melalui .env.local atau sesi shell, lalu jalankan ulang.`,
    );
  }
  return value;
}

function usernameToEmail(username) {
  if (!/^[a-z0-9_.-]+$/.test(username)) {
    throw new Error(`Username tidak valid: ${username}`);
  }
  return `${username}@${EMAIL_DOMAIN}`;
}

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const adminPassword = requireEnv("STOKITA_ADMIN_PASSWORD");
const kasir1Password = requireEnv("STOKITA_KASIR1_PASSWORD");
const kasir2Password = requireEnv("STOKITA_KASIR2_PASSWORD");

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ACCOUNTS = [
  {
    username: "admin",
    nama: "Admin Gudang",
    role: "admin",
    password: adminPassword,
  },
  {
    username: "kasir1",
    nama: "Kasir Satu",
    role: "kasir",
    password: kasir1Password,
  },
  {
    username: "kasir2",
    nama: "Kasir Dua",
    role: "kasir",
    password: kasir2Password,
  },
];

/** Cari user Auth berdasarkan email via admin.listUsers (paginate). */
async function findUserByEmail(email) {
  const perPage = 100;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Gagal memeriksa daftar akun: ${error.message}`);
    }
    const users = data?.users ?? [];
    const match = users.find(
      (u) => typeof u.email === "string" && u.email.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (users.length < perPage) break;
  }
  return null;
}

async function ensureAccount(account) {
  const email = usernameToEmail(account.username);

  let existing = await findUserByEmail(email);

  let userId;
  if (existing) {
    userId = existing.id;
    console.log(`• Akun Auth sudah ada, dilewati pembuatan: ${email}`);
  } else {
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: account.password,
        email_confirm: true,
      });
    if (createError) {
      // Jika ternyata sudah terdaftar (mis. race), cari ulang lalu lanjutkan.
      if (/already|registered|exists/i.test(createError.message)) {
        existing = await findUserByEmail(email);
        if (existing) {
          userId = existing.id;
          console.log(`• Akun Auth sudah ada, dilewati pembuatan: ${email}`);
        } else {
          throw new Error(
            `Gagal membuat akun Auth ${email}: ${createError.message}`,
          );
        }
      } else {
        throw new Error(
          `Gagal membuat akun Auth ${email}: ${createError.message}`,
        );
      }
    } else {
      userId = created.user.id;
      console.log(`• Akun Auth dibuat: ${email} (role ${account.role})`);
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) {
    throw new Error(
      `Gagal memeriksa profil ${account.username}: ${profileError.message}`,
    );
  }

  if (profile) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ nama: account.nama, username: account.username, role: account.role })
      .eq("id", userId);
    if (updateError) {
      throw new Error(
        `Gagal menyelaraskan profil ${account.username}: ${updateError.message}`,
      );
    }
    console.log(`• Profil diselaraskan: ${account.username} (${account.role})`);
  } else {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      nama: account.nama,
      username: account.username,
      role: account.role,
    });
    if (insertError) {
      throw new Error(
        `Gagal membuat profil ${account.username}: ${insertError.message}. ` +
          `Jika username sudah dipakai akun lain, periksa data profiles.`,
      );
    }
    console.log(`• Profil dibuat: ${account.username} (${account.role})`);
  }
}

let failed = false;
for (const account of ACCOUNTS) {
  try {
    await ensureAccount(account);
  } catch (error) {
    failed = true;
    console.error(`✗ ${error.message}`);
  }
}

if (failed) {
  console.error(
    "Seed akun GAGAL sebagian. Perbaiki konfigurasi/data lalu jalankan ulang " +
      "(script idempoten — akun yang sudah benar tidak diduplikasi).",
  );
  process.exit(1);
}

console.log("Seed akun selesai: 1 admin + 2 kasir.");
console.log(
  "Bagikan kredensial secara aman kepada pengguna; password dapat diganti " +
    "melalui dashboard Supabase (Authentication → Users).",
);
