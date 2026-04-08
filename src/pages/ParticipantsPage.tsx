import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store";
import { selectEventById } from "../store/eventsSlice";
import {
  fetchParticipants,
  selectFilteredParticipants,
  selectParticipantsLoading,
  selectParticipantsError,
  selectParticipantSearch,
  setParticipantSearch,
} from "../store/participantsSlice";
import { ParticipantsSkeleton } from "../components/Skeleton";

export function ParticipantsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const dispatch = useAppDispatch();
  const event = useAppSelector((state) =>
    selectEventById(state, Number(eventId))
  );
  const participants = useAppSelector(selectFilteredParticipants);
  const loading = useAppSelector(selectParticipantsLoading);
  const error = useAppSelector(selectParticipantsError);
  const search = useAppSelector(selectParticipantSearch);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (eventId) {
      dispatch(fetchParticipants(Number(eventId)));
    }
    return () => {
      dispatch(setParticipantSearch(""));
    };
  }, [dispatch, eventId]);

  if (!event) {
    return (
      <div className="page-container">
        <div className="page-card center-content">
          <h2>Подію не знайдено</h2>
          <Link to="/" className="btn btn-secondary">
            На головну
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/" className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          На головну
        </Link>
      </div>

      <div className="page-card">
        <div className="participants-header">
          <div>
            <h2 className="page-title">Учасники</h2>
            <p className="text-muted">{event.title}</p>
          </div>
          <Link to={`/register/${event.id}`} className="btn btn-primary">
            Зареєструватися
          </Link>
        </div>

        <div className={`search-wrapper participants-search ${searchFocused ? "search-focused" : ""}`}>
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Пошук за ім'ям або email..."
            value={search}
            onChange={(e) => dispatch(setParticipantSearch(e.target.value))}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {search && (
            <button
              className="search-clear"
              onClick={() => dispatch(setParticipantSearch(""))}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <ParticipantsSkeleton />
        ) : error ? (
          <div className="center-content" style={{ padding: "48px 0" }}>
            <p className="text-muted">{error}</p>
            <button
              className="btn btn-secondary"
              onClick={() => dispatch(fetchParticipants(Number(eventId)))}
            >
              Спробувати знову
            </button>
          </div>
        ) : participants.length === 0 ? (
          <div className="center-content" style={{ padding: "48px 0" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3>{search ? "Учасників не знайдено" : "Поки що немає учасників"}</h3>
            <p className="text-muted">{search ? "Спробуйте інший запит" : "Станьте першим!"}</p>
          </div>
        ) : (
          <div className="participants-list">
            {participants.map((p, i) => (
              <div key={p.id ?? i} className="participant-row">
                <div className="participant-avatar">
                  {p.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="participant-info">
                  <span className="participant-name">{p.fullName}</span>
                  <span className="participant-email">{p.email}</span>
                </div>
                <span className="participant-date">
                  {new Date(p.registeredAt).toLocaleDateString("uk-UA")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
