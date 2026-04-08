import http from "node:http";
import express from "express";
import { config } from "./config.mjs";
import { requestLogger } from "./middleware/logger.mjs";
import eventsRouter from "./routes/events.mjs";

const app = express();

// Global middleware
app.use(express.json());
app.use(requestLogger);

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Routes
app.use("/events", eventsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не знайдено" });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Внутрішня помилка сервера" });
});

const server = http.createServer(app);

server.listen(config.port, config.host, () => {
  const addr = server.address();
  const host = addr.address === "0.0.0.0" ? "localhost" : addr.address;
  console.log(`Express server running at http://${host}:${addr.port}`);
  console.log("Routes:");
  console.log("  GET /events                              — all events (paginated)");
  console.log("  GET /events?page=1&limit=5               — pagination");
  console.log("  GET /events?sort=date&order=desc          — sorting");
  console.log("  GET /events?search=fintech                — search");
  console.log("  GET /events/:id                          — single event");
});
