import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { login, selectAuthLoading } from "../store/authSlice";
import { addToast } from "../store/toastsSlice";

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loading = useAppSelector(selectAuthLoading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Заповніть усі поля");
      return;
    }

    const action = await dispatch(login({ email, password }));
    if (login.fulfilled.match(action)) {
      dispatch(addToast({ message: `Вітаємо, ${action.payload.full_name}!`, type: "success" }));
      navigate("/");
    } else if (login.rejected.match(action)) {
      setError(action.payload ?? "Помилка входу");
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 440 }}>
      <div className="page-header">
        <Link to="/" className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          На головну
        </Link>
      </div>

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <h2 className="form-title">Вхід</h2>

        {error && (
          <div className="field-error" style={{ fontSize: 14, padding: "8px 0" }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            placeholder="Ваш пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? "Вхід..." : "Увійти"}
        </button>

        <p className="text-muted" style={{ textAlign: "center", marginTop: 4 }}>
          Тестові акаунти: admin@example.com / admin123, organizer@example.com / org123
        </p>
      </form>
    </div>
  );
}
