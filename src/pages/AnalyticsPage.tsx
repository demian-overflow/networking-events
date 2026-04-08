import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useAppSelector, useAppDispatch } from "../store";
import {
  selectFavorites,
  importExternalEvents,
  selectImporting,
} from "../store/eventsSlice";
import { api } from "../api";

const COLORS = ["#7c5cfc", "#a855f7", "#6366f1", "#8b5cf6", "#c084fc", "#a78bfa", "#818cf8"];

interface AnalyticsData {
  totalEvents: number;
  totalParticipants: number;
  registrationsByDay: { date: string; count: number }[];
  participantsPerEvent: { name: string; count: number }[];
  organizerDistribution: { name: string; value: number }[];
}

export function AnalyticsPage() {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectFavorites);
  const importing = useAppSelector(selectImporting);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container analytics-container">
      <div className="page-header">
        <Link to="/" className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          На головну
        </Link>
      </div>

      <div className="analytics-title-row">
        <h2 className="page-title">Аналітика</h2>
        <button
          className="btn btn-primary"
          disabled={importing}
          onClick={() => dispatch(importExternalEvents())}
        >
          {importing ? "Імпорт..." : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Імпортувати події
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="center-content" style={{ padding: "80px 0" }}>
          <p className="text-muted">Завантаження аналітики...</p>
        </div>
      ) : !data ? (
        <div className="center-content" style={{ padding: "80px 0" }}>
          <p className="text-muted">Не вдалося завантажити аналітику. Переконайтесь, що сервер запущено.</p>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-value">{data.totalEvents}</span>
              <span className="stat-label">Подій</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{data.totalParticipants}</span>
              <span className="stat-label">Реєстрацій</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{favorites.length}</span>
              <span className="stat-label">Обраних</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{data.organizerDistribution.length}</span>
              <span className="stat-label">Організаторів</span>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card chart-wide">
              <h3 className="chart-title">Активність реєстрацій за днями</h3>
              {data.registrationsByDay.length === 0 ? (
                <div className="chart-empty"><p>Немає даних</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.registrationsByDay}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fill: "#8b8a94", fontSize: 12 }}
                      tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}.${d.getMonth() + 1}`; }} />
                    <YAxis tick={{ fill: "#8b8a94", fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e0dfe6", fontSize: 13 }}
                      labelFormatter={(v) => new Date(v).toLocaleDateString("uk-UA", { day: "numeric", month: "long" })}
                      formatter={(value) => [String(value), "Реєстрацій"]}
                    />
                    <Area type="monotone" dataKey="count" stroke="#7c5cfc" strokeWidth={2} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <h3 className="chart-title">Організатори</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.organizerDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {data.organizerDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e0dfe6", fontSize: 13 }}
                    formatter={(value) => [String(value), "Подій"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {data.organizerDistribution.map((entry, i) => (
                  <div key={entry.name} className="pie-legend-item">
                    <span className="pie-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="pie-legend-label">{entry.name}</span>
                    <span className="pie-legend-value">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {data.participantsPerEvent.length > 0 && (
              <div className="chart-card chart-wide">
                <h3 className="chart-title">Реєстрації за подіями</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.participantsPerEvent} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" tick={{ fill: "#8b8a94", fontSize: 12 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#8b8a94", fontSize: 12 }} width={150} />
                    <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e0dfe6", fontSize: 13 }}
                      formatter={(value) => [String(value), "Учасників"]} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#7c5cfc" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
