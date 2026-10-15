export type Role = "admin" | "kasir";

export type AuthUser = {
  id: string;
  nama: string;
  username: string;
  role: Role;
  homePath: string;
};

export type SessionProfile = AuthUser;

export const HOME_PATH: Record<Role, string> = {
  admin: "/admin",
  kasir: "/kasir",
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  kasir: "Kasir",
};

export function isRole(value: unknown): value is Role {
  return value === "admin" || value === "kasir";
}

export function homePathForRole(role: Role): string {
  return HOME_PATH[role];
}
