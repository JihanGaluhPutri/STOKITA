import { LogoutButton } from "./logout-button";

export function AppHeader({
  nama,
  roleLabel,
}: {
  nama: string;
  roleLabel: string;
}) {
  return (
    <header className="shell-header">
      <span className="brand">Stokita</span>
      <div className="shell-header-right">
        <span className="muted">{nama}</span>
        <span className="badge">{roleLabel}</span>
        <LogoutButton />
      </div>
    </header>
  );
}
