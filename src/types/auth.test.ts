import { describe, expect, expectTypeOf, it } from "vitest";

import {
  HOME_PATH,
  ROLE_LABEL,
  homePathForRole,
  isRole,
  type Role,
} from "@/types/auth";

describe("isRole", () => {
  it("menerima role admin dan kasir", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("kasir")).toBe(true);
  });

  it("menolak role yang tidak dikenal", () => {
    expect(isRole("hantu")).toBe(false);
    expect(isRole("superuser")).toBe(false);
    expect(isRole("")).toBe(false);
    expect(isRole("ADMIN")).toBe(false);
  });

  it("menolak nilai non-string", () => {
    expect(isRole(null)).toBe(false);
    expect(isRole(undefined)).toBe(false);
    expect(isRole(1)).toBe(false);
    expect(isRole({ role: "admin" })).toBe(false);
    expect(isRole(["admin"])).toBe(false);
  });
});

describe("homePathForRole", () => {
  it("menunjuk ke halaman admin untuk role admin", () => {
    expect(homePathForRole("admin")).toBe("/admin");
  });

  it("menunjuk ke halaman kasir untuk role kasir", () => {
    expect(homePathForRole("kasir")).toBe("/kasir");
  });

  it("selalu selaras dengan tabel HOME_PATH", () => {
    expect(homePathForRole("admin")).toBe(HOME_PATH.admin);
    expect(homePathForRole("kasir")).toBe(HOME_PATH.kasir);
  });
});

describe("konstanta role", () => {
  it("HOME_PATH memuat kedua role saja", () => {
    expect(Object.keys(HOME_PATH).sort()).toEqual(["admin", "kasir"]);
    expect(HOME_PATH).toEqual({ admin: "/admin", kasir: "/kasir" });
  });

  it("ROLE_LABEL memuat label manusiawi untuk kedua role", () => {
    expect(ROLE_LABEL).toEqual({ admin: "Admin", kasir: "Kasir" });
  });
});

describe("kontrak tipe", () => {
  it("Role hanya bisa admin atau kasir", () => {
    expectTypeOf<Role>().toEqualTypeOf<"admin" | "kasir">();
  });
});
