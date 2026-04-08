export const config = {
  port: process.env.PORT ?? 3002,
  host: process.env.HOST ?? "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 100,
};
