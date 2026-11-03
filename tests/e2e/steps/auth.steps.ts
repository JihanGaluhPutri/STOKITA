import { expect } from "@playwright/test";

import { Given, Then, When } from "../fixtures";
import { loginSebagai, tungguPathname } from "../support/ui";

Given("saya membuka halaman {string}", async ({ page }, path: string) => {
  await page.goto(path);
});

Given("saya belum login", async () => {
  // Konteks browser baru selalu tanpa sesi — tidak ada tindakan tambahan.
});

When(
  "saya isi username {string} dan password {string} lalu tekan Masuk",
  async ({ page }, username: string, password: string) => {
    await page.locator("#username").fill(username);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Masuk" }).click();
  },
);

When("saya login sebagai admin", async ({ page }) => {
  await loginSebagai(page, "admin");
});

When("saya login sebagai kasir", async ({ page }) => {
  await loginSebagai(page, "kasir");
});

When("saya keluar dari aplikasi", async ({ page }) => {
  await page.getByRole("button", { name: "Keluar" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ya, keluar" })
    .click();
  await tungguPathname(page, "/login");
});

Then("saya diarahkan ke {string}", async ({ page }, path: string) => {
  await tungguPathname(page, path);
});

Then("saya tetap berada di halaman {string}", async ({ page }, path: string) => {
  await expect.poll(() => new URL(page.url()).pathname).toBe(path);
});

Then("saya melihat teks {string}", async ({ page }, teks: string) => {
  await expect(page.getByText(teks).first()).toBeVisible();
});

Then("saya melihat pesan error {string}", async ({ page }, teks: string) => {
  await expect(page.getByText(teks).first()).toBeVisible();
});
