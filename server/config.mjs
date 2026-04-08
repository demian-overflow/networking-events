export const config = {
  port: process.env.PORT ?? 3000,
  host: process.env.HOST ?? "localhost",
  dataFile: "./server/data/events.json",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
};
