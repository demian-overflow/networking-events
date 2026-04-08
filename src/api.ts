const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3002";

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
  // Events
  getEvents: (params?: string) => request<{ data: unknown[]; pagination: unknown }>(`/events${params ? `?${params}` : ""}`),
  getEvent: (id: number) => request<unknown>(`/events/${id}`),

  // Analytics
  getAnalytics: () =>
    request<{
      totalEvents: number;
      totalParticipants: number;
      registrationsByDay: { date: string; count: number }[];
      participantsPerEvent: { name: string; count: number }[];
      organizerDistribution: { name: string; value: number }[];
    }>("/analytics"),

  // Participants
  getParticipants: (eventId: number) =>
    request<{ data: { id: number; event_id: number; full_name: string; email: string; registered_at: string }[] }>(
      `/participants/${eventId}?limit=100`
    ),
  registerParticipant: (data: { event_id: number; full_name: string; email: string }) =>
    request<unknown>("/participants", { method: "POST", body: JSON.stringify(data) }),

  // Auth
  login: (email: string, password: string) =>
    request<{ user: { id: number; email: string; full_name: string; role: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<unknown>("/auth/logout", { method: "POST" }),
  me: () =>
    request<{ user: { id: number; email: string; full_name: string; role: string } }>("/auth/me"),
};
