/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  it("membungkus children dengan html berbahasa Indonesia dan body", () => {
    // Layout akar merender <html>/<body>; dirender sebagai markup server
    // karena elemen <html> tidak boleh jadi anak <div> pada DOM uji klien.
    const markup = renderToStaticMarkup(
      <RootLayout>
        <p>Konten utama</p>
      </RootLayout>,
    );

    expect(markup).toMatch(/<html[^>]*lang="id"/);
    expect(markup).toMatch(/<body[^>]*>/);
    expect(markup).toContain("Konten utama");
  });

  it("menyediakan metadata judul bawaan aplikasi", () => {
    expect(metadata.title).toEqual({
      default: "Stokita",
      template: "%s — Stokita",
    });
    expect(metadata.description).toContain("manajemen stok");
  });
});
