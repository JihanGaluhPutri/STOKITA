import Link from "next/link";

export function AccessDenied({ message }: { message: string }) {
  return (
    <main className="auth-page">
      <div className="card">
        <div className="stack">
          <h1>Akses ditolak</h1>
          <p className="error" role="alert">
            {message}
          </p>
          <Link className="button button-secondary button-link" href="/">
            Kembali
          </Link>
        </div>
      </div>
    </main>
  );
}
