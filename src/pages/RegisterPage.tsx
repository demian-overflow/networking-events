import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store";
import { selectEventById } from "../store/eventsSlice";
import { registerParticipant } from "../store/participantsSlice";
import {
  registrationSchema,
  INFO_SOURCES,
} from "../schemas/registration";
import type { ZodIssue } from "zod";

export function RegisterPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const event = useAppSelector((state) =>
    selectEventById(state, Number(eventId))
  );

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    birthDate: "",
    source: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = registrationSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: ZodIssue) => {
        const field = String(err.path[0]);
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const action = await dispatch(
      registerParticipant({
        eventId: Number(eventId),
        data: result.data,
      })
    );
    setSubmitting(false);

    if (registerParticipant.fulfilled.match(action)) {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="page-container">
        <div className="page-card center-content">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2>Реєстрацію завершено!</h2>
          <p className="text-muted">
            Ви зареєстровані на <strong>{event.title}</strong>
          </p>
          <div className="btn-group">
            <Link to={`/participants/${event.id}`} className="btn btn-primary">
              Переглянути учасників
            </Link>
            <Link to="/" className="btn btn-secondary">
              На головну
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Назад
        </button>
      </div>

      <div className="register-layout">
        <aside className="event-summary">
          <h3 className="event-summary-title">{event.title}</h3>
          <p className="text-muted">{event.description}</p>
          <div className="event-summary-details">
            <div className="event-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>
                {new Date(event.date).toLocaleDateString("uk-UA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="event-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{event.location}</span>
            </div>
            <div className="event-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{event.organizer}</span>
            </div>
          </div>
          <div className="event-tags">
            {event.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </aside>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <h2 className="form-title">Реєстрація на подію</h2>

          <div className={`form-group ${errors.fullName ? "has-error" : ""}`}>
            <label htmlFor="fullName">ПІБ</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Іванов Іван Іванович"
              value={form.fullName}
              onChange={handleChange}
            />
            {errors.fullName && (
              <span className="field-error">{errors.fullName}</span>
            )}
          </div>

          <div className={`form-group ${errors.email ? "has-error" : ""}`}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>

          <div className={`form-group ${errors.birthDate ? "has-error" : ""}`}>
            <label htmlFor="birthDate">Дата народження</label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              value={form.birthDate}
              onChange={handleChange}
            />
            {errors.birthDate && (
              <span className="field-error">{errors.birthDate}</span>
            )}
          </div>

          <div className={`form-group ${errors.source ? "has-error" : ""}`}>
            <label htmlFor="source">Звідки дізнались про подію?</label>
            <select
              id="source"
              name="source"
              value={form.source}
              onChange={handleChange}
            >
              <option value="">Оберіть варіант...</option>
              {INFO_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
            {errors.source && (
              <span className="field-error">{errors.source}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
          >
            {submitting ? "Реєстрація..." : "Зареєструватися"}
          </button>
        </form>
      </div>
    </div>
  );
}
