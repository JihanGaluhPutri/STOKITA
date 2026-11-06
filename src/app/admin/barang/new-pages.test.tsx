import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Server Action cukup direpresentasikan sebagai stub — halaman hanya
// meneruskannya sebagai prop `action`.
vi.mock("@/app/admin/barang/actions", () => ({
  createProductAction: vi.fn(),
  updateProductAction: vi.fn(),
}));

import TambahBarangPage, {
  dynamic,
  metadata,
} from "./tambah/page";

describe("TambahBarangPage", () => {
  it("memaksa rendering dinamis dan metadata judul", () => {
    expect(dynamic).toBe("force-dynamic");
    expect(metadata.title).toBe("Tambah Barang");
  });

  it("merender form tambah barang", () => {
    const html = renderToStaticMarkup(<TambahBarangPage />);

    expect(html).toContain("Tambah barang");
    expect(html).toContain("card-wide");
    expect(html).toContain('name="kode"');
    expect(html).toContain("Simpan barang");
  });
});
