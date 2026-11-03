#!/usr/bin/env node
/**
 * scripts/merge-test-videos.mjs — menggabungkan video rekaman tiap skenario
 * (hasil `npm run test:bdd`, tersimpan di test-results/) menjadi SATU berkas
 * video untuk lampiran pelaporan.
 *
 * Pemakaian:
 *   1. npm run test:bdd            # merekam video tiap skenario (video: "on")
 *   2. npm i --no-save ffmpeg-static   # sekali saja, bila ffmpeg belum ada
 *   3. node scripts/merge-test-videos.mjs
 *
 * Output: docs/lampiran/video-bdd-stokita.webm  (urut sesuai eksekusi test)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEST_RESULTS = path.join(ROOT, "test-results");
const OUT_DIR = path.join(ROOT, "docs", "lampiran");
const LIST = path.join(OUT_DIR, "_concat-list.txt");
const OUTPUT = path.join(OUT_DIR, "video-bdd-stokita.webm");

/** Cari biner ffmpeg: (1) ffmpeg-static, (2) PATH. */
function findFfmpeg() {
  const local = path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg.exe");
  if (fs.existsSync(local)) return local;
  const probe = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (!probe.error) return "ffmpeg";
  return null;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === "video.webm") out.push(full);
  }
  return out;
}

const videos = walk(TEST_RESULTS).sort(
  (a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs,
);
if (videos.length === 0) {
  console.error("Belum ada video di test-results/. Jalankan dulu: npm run test:bdd");
  process.exit(1);
}

const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.error(
    "ffmpeg tidak ditemukan. Jalankan dulu:  npm i --no-save ffmpeg-static\n" +
      "atau pasang ffmpeg global lalu ulangi perintah ini.",
  );
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  LIST,
  videos.map((p) => `file '${p.split(path.sep).join("/")}'`).join("\n") + "\n",
);

console.log(`Menggabungkan ${videos.length} video → ${path.relative(ROOT, OUTPUT)}`);
const result = spawnSync(
  ffmpeg,
  ["-y", "-f", "concat", "-safe", "0", "-i", LIST, "-c", "copy", OUTPUT],
  { stdio: "inherit", windowsHide: true },
);

fs.rmSync(LIST, { force: true });
if (result.status !== 0) {
  console.error("ffmpeg gagal menggabungkan video.");
  process.exit(result.status ?? 1);
}
console.log(`Selesai: ${path.relative(ROOT, OUTPUT)}`);
