export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="empty" role="status">
      <p className="empty-title">{title}</p>
      {description ? <p className="muted">{description}</p> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="empty" role="alert">
      <p className="error error-inline">{message}</p>
    </div>
  );
}
