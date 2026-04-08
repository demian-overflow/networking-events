export function CardSkeleton() {
  return (
    <div className="event-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line skeleton-short" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-full" />
          <div className="skeleton-line skeleton-full" />
          <div className="skeleton-line skeleton-medium" />
          <div className="skeleton-tags">
            <div className="skeleton-tag" />
            <div className="skeleton-tag" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ParticipantsSkeleton() {
  return (
    <div className="participants-list">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="participant-row">
          <div className="skeleton-avatar" />
          <div className="participant-info">
            <div className="skeleton-line skeleton-short" />
            <div className="skeleton-line skeleton-medium" />
          </div>
        </div>
      ))}
    </div>
  );
}
