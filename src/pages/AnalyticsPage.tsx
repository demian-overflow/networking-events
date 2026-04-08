import { useMemo } from "react";
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
  selectAllEvents,
  selectFavorites,
  selectTotalCount,
  importExternalEvents,
  selectImporting,
} from "../store/eventsSlice";

const COLORS = ["#7c5cfc", "#a855f7", "#6366f1", "#8b5cf6", "#c084fc", "#a78bfa", "#818cf8"];

export function AnalyticsPage() {
  const dispatch = useAppDispatch();
  const events = useAppSelector(selectAllEvents);
  const favorites = useAppSelector(selectFavorites);
  const totalCount = useAppSelector(selectTotalCount);
  const importing = useAppSelector(selectImporting);

  // Registrations per day (from all localStorage participant data)
  const registrationsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of events) {
      try {
        const raw = localStorage.getItem(`participants-${event.id}`);
        if (!raw) continue;
        const participants = JSON.parse(raw) as { registeredAt: string }[];
        for (const p of participants) {
          const day = p.registeredAt.split("T")[0];
          counts[day] = (counts[day] || 0) + 1;
        }
      } catch {
        // skip
      }
    }
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  // Events per month
  const eventsByMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of events) {
      const month = event.date.slice(0, 7); // YYYY-MM
      counts[month] = (counts[month] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([month, count]) => {
        const d = new Date(month + "-01");
        return {
          month,
          label: d.toLocaleDateString("uk-UA", { month: "short", year: "numeric" }),
          count,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [events]);

  // Participants per event
  const participantsPerEvent = useMemo(() => {
    return events
      .map((event) => {
        let count = 0;
        try {
          const raw = localStorage.getItem(`participants-${event.id}`);
          if (raw) count = JSON.parse(raw).length;
        } catch {
          // skip
        }
        return { name: event.title.length > 20 ? event.title.slice(0, 20) + "..." : event.title, count };
      })
      .filter((e) => e.count > 0);
  }, [events]);

  // Organizer distribution
  const organizerDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of events) {
      const org = event.organizer.replace(" (imported)", "");
      counts[org] = (counts[org] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [events]);

  // Total participants
  const totalParticipants = useMemo(() => {
    let total = 0;
    for (const event of events) {
      try {
        const raw = localStorage.getItem(`participants-${event.id}`);
        if (raw) total += JSON.parse(raw).length;
      } catch {
        // skip
      }
    }
    return total;
  }, [events]);

  const importedCount = events.filter((e) => e.tags.includes("imported")).length;

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
          {importing ? (
            "Імпорт..."
          ) : (
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

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-value">{totalCount}</span>
          <span className="stat-label">Подій</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalParticipants}</span>
          <span className="stat-label">Реєстрацій</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{favorites.length}</span>
          <span className="stat-label">Обраних</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{importedCount}</span>
          <span className="stat-label">Імпортованих</span>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Registration Activity */}
        <div className="chart-card chart-wide">
          <h3 className="chart-title">Активність реєстрацій за днями</h3>
          {registrationsByDay.length === 0 ? (
            <div className="chart-empty">
              <p>Зареєструйте учасників, щоб побачити графік</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={registrationsByDay}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8b8a94", fontSize: 12 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getDate()}.${d.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  tick={{ fill: "#8b8a94", fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a24",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: "#e0dfe6",
                    fontSize: 13,
                  }}
                  labelFormatter={(v) =>
                    new Date(v).toLocaleDateString("uk-UA", {
                      day: "numeric",
                      month: "long",
                    })
                  }
                  formatter={(value) => [String(value), "Реєстрацій"]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#7c5cfc"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Events per month */}
        <div className="chart-card">
          <h3 className="chart-title">Подій за місяцями</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={eventsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#8b8a94", fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: "#8b8a94", fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1a24",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "#e0dfe6",
                  fontSize: 13,
                }}
                formatter={(value) => [String(value), "Подій"]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {eventsByMonth.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Organizer distribution */}
        <div className="chart-card">
          <h3 className="chart-title">Організатори</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={organizerDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {organizerDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1a1a24",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "#e0dfe6",
                  fontSize: 13,
                }}
                formatter={(value) => [String(value), "Подій"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {organizerDistribution.map((entry, i) => (
              <div key={entry.name} className="pie-legend-item">
                <span
                  className="pie-legend-dot"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="pie-legend-label">{entry.name}</span>
                <span className="pie-legend-value">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Participants per event */}
        {participantsPerEvent.length > 0 && (
          <div className="chart-card chart-wide">
            <h3 className="chart-title">Реєстрації за подіями</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={participantsPerEvent} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  type="number"
                  tick={{ fill: "#8b8a94", fontSize: 12 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#8b8a94", fontSize: 12 }}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a24",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: "#e0dfe6",
                    fontSize: 13,
                  }}
                  formatter={(value) => [String(value), "Учасників"]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#7c5cfc" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
