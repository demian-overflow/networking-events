// In production (Vercel), requests go to /api/* which proxies to Render.
// In dev, requests go directly to the local Express server.
const API_BASE = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL ?? "http://localhost:3002")
  : "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getEvents: (params?: string) =>
    request<{ data: Record<string, unknown>[]; pagination: unknown }>(
      `/events${params ? `?${params}` : ""}`
    ),
  getEvent: (id: number) => request<Record<string, unknown>>(`/events/${id}`),

  getAnalytics: () =>
    request<{
      totalEvents: number;
      totalParticipants: number;
      registrationsByDay: { date: string; count: number }[];
      participantsPerEvent: { name: string; count: number }[];
      organizerDistribution: { name: string; value: number }[];
    }>("/analytics"),

  getParticipants: (eventId: number) =>
    request<{
      data: { id: number; event_id: number; full_name: string; email: string; registered_at: string }[];
    }>(`/participants/${eventId}?limit=100`),

  registerParticipant: (data: { event_id: number; full_name: string; email: string }) =>
    request<Record<string, unknown>>("/participants", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (email: string, password: string) =>
    request<{ user: { id: number; email: string; full_name: string; role: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<unknown>("/auth/logout", { method: "POST" }),
  me: () =>
    request<{ user: { id: number; email: string; full_name: string; role: string } }>("/auth/me"),
};
