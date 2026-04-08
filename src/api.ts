const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3002";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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
};
