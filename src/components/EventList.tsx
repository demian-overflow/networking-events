import { useAppSelector } from "../store";
import { selectFilteredEvents, selectIsFavorite, selectEventsLoading } from "../store/eventsSlice";
import { EventCard } from "./EventCard";
import { CardSkeleton } from "./Skeleton";

export function EventList() {
  const events = useAppSelector(selectFilteredEvents);
  const loading = useAppSelector(selectEventsLoading);

  if (loading) {
    return <CardSkeleton />;
  }

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <h3>Подій не знайдено</h3>
        <p>Спробуйте змінити параметри пошуку</p>
      </div>
    );
  }

  return (
    <div className="event-grid">
      {events.map((event) => (
        <ConnectedEventCard key={event.id} eventId={event.id} />
      ))}
    </div>
  );
}

function ConnectedEventCard({ eventId }: { eventId: number }) {
  const events = useAppSelector(selectFilteredEvents);
  const event = events.find((e) => e.id === eventId)!;
  const isFavorite = useAppSelector((state) => selectIsFavorite(state, eventId));

  return <EventCard {...event} isFavorite={isFavorite} />;
}
