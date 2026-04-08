import http from "node:http";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { config } from "./config.mjs";
import pool from "./db.mjs";
import { requestLogger } from "./middleware/logger.mjs";
import authRouter from "./routes/auth.mjs";
import eventsRouter from "./routes/events.mjs";
import participantsRouter from "./routes/participants.mjs";

const PgStore = connectPgSimple(session);
const app = express();

// Global middleware
app.use(express.json());
app.use(requestLogger);

// CORS (with credentials for sessions)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Sessions (stored in PostgreSQL)
app.use(
  session({
    store: new PgStore({ pool, tableName: "session" }),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: config.session.maxAge,
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true behind HTTPS in prod
    },
  })
);

// Routes
app.use("/auth", authRouter);
app.use("/events", eventsRouter);
app.use("/participants", participantsRouter);

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
  console.log("Public routes:");
  console.log("  POST /auth/register                       — create account");
  console.log("  POST /auth/login                          — login");
  console.log("  POST /auth/logout                         — logout");
  console.log("  GET  /auth/me                             — current user (auth)");
  console.log("  GET  /events                              — all events");
  console.log("  GET  /events/:id                          — single event");
  console.log("Protected routes:");
  console.log("  GET    /participants/:eventId              — list (auth)");
  console.log("  PUT    /events/:id                        — edit event (admin)");
  console.log("  DELETE /events/:id                        — delete event (admin)");
  console.log("  DELETE /participants/:eid/:pid             — remove participant (admin)");
});
