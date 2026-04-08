export const config = {
  port: process.env.PORT ?? 3002,
  host: process.env.HOST ?? "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 100,
  session: {
    secret: process.env.SESSION_SECRET ?? "networking-events-secret-key-change-in-prod",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  bcryptRounds: 10,
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5433),
    user: process.env.DB_USER ?? "networking",
    password: process.env.DB_PASSWORD ?? "networking",
    database: process.env.DB_NAME ?? "networking_events",
  },
};
