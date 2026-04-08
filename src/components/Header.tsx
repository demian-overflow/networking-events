import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store";
import {
  selectSearch,
  selectFavoritesOnly,
  selectTotalCount,
  selectFilteredEvents,
  setSearch,
  toggleFavoritesOnly,
} from "../store/eventsSlice";
import { selectUser, logout } from "../store/authSlice";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const dispatch = useAppDispatch();
  const search = useAppSelector(selectSearch);
  const favoritesOnly = useAppSelector(selectFavoritesOnly);
  const totalCount = useAppSelector(selectTotalCount);
  const filteredCount = useAppSelector(selectFilteredEvents).length;
  const user = useAppSelector(selectUser);
  const [focused, setFocused] = useState(false);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="header-title">Networking Events</h1>
            <p className="header-subtitle">
              Знаходьте ділових партнерів на нетворкінг-вечорах
            </p>
          </div>
        </div>

        <div className="header-controls">
          <div className={`search-wrapper ${focused ? "search-focused" : ""}`}>
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Пошук подій за назвою..."
              value={search}
              onChange={(e) => dispatch(setSearch(e.target.value))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => dispatch(setSearch(""))}
                aria-label="Очистити пошук"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <button
            className={`favorites-toggle ${favoritesOnly ? "active" : ""}`}
            onClick={() => dispatch(toggleFavoritesOnly())}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={favoritesOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>Цікаві</span>
          </button>

          <Link to="/analytics" className="btn btn-secondary btn-sm" title="Аналітика">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span className="analytics-label">Аналітика</span>
          </Link>

          <Link to="/chat" className="btn btn-secondary btn-sm" title="Чат">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="analytics-label">Чат</span>
          </Link>

          <ThemeToggle />

          {user ? (
            <div className="user-menu">
              <div className="user-avatar">
                {user.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{user.full_name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => dispatch(logout())}
              >
                Вийти
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span className="analytics-label">Увійти</span>
            </Link>
          )}

          <span className="result-count">
            {filteredCount} / {totalCount}
          </span>
        </div>
      </div>
    </header>
  );
}
