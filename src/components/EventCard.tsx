import { Link } from "react-router-dom";
import { useAppDispatch } from "../store";
import { toggleFavorite } from "../store/eventsSlice";

interface EventCardProps {
  id: number;
  title: string;
  description: string;
  date: string;
  organizer: string;
  location: string;
  tags: string[];
  isFavorite: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const event = new Date(dateStr);
  event.setHours(0, 0, 0, 0);
  return Math.ceil((event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function EventCard({
  id,
  title,
  description,
  date,
  organizer,
  location,
  tags,
  isFavorite,
}: EventCardProps) {
  const dispatch = useAppDispatch();
  const daysUntil = getDaysUntil(date);

  return (
    <article className="event-card">
      <div className="event-card-header">
        <div className="event-date-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formatDate(date)}</span>
          {daysUntil >= 0 && (
            <span className="days-badge">
              {daysUntil === 0 ? "Сьогодні" : `через ${daysUntil} дн.`}
            </span>
          )}
          {daysUntil < 0 && <span className="days-badge past">Завершено</span>}
        </div>

        <button
          className={`favorite-btn ${isFavorite ? "active" : ""}`}
          onClick={() => dispatch(toggleFavorite(id))}
          aria-label={isFavorite ? "Видалити з цікавих" : "Додати до цікавих"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <h3 className="event-title">{title}</h3>
      <p className="event-description">{description}</p>

      <div className="event-meta">
        <div className="event-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{organizer}</span>
        </div>
        <div className="event-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{location}</span>
        </div>
      </div>

      <div className="event-tags">
        {tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="event-actions">
        <Link to={`/register/${id}`} className="btn btn-primary btn-sm">
          Зареєструватися
        </Link>
        <Link to={`/participants/${id}`} className="btn btn-secondary btn-sm">
          Учасники
        </Link>
      </div>
    </article>
  );
}
