import http from "node:http";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { ApolloServer, HeaderMap } from "@apollo/server";
import { config } from "./config.mjs";
import pool from "./db.mjs";
import { requestLogger } from "./middleware/logger.mjs";
import authRouter from "./routes/auth.mjs";
import eventsRouter from "./routes/events.mjs";
import participantsRouter from "./routes/participants.mjs";
import analyticsRouter from "./routes/analytics.mjs";
import { typeDefs } from "./graphql/schema.mjs";
import { resolvers } from "./graphql/resolvers.mjs";
import { setupChat } from "./chat.mjs";

const PgStore = connectPgSimple(session);
const app = express();

app.use(express.json());
app.use(requestLogger);

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Sessions
const sessionMiddleware = session({
  store: new PgStore({ pool, tableName: "session" }),
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: config.session.maxAge,
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  },
});
app.use(sessionMiddleware);

// REST routes
app.use("/auth", authRouter);
app.use("/events", eventsRouter);
app.use("/participants", participantsRouter);
app.use("/analytics", analyticsRouter);

// GraphQL
const apollo = new ApolloServer({ typeDefs, resolvers });
await apollo.start();

app.post("/graphql", async (req, res) => {
  const headers = new HeaderMap();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
  }

  const httpGraphQLResponse = await apollo.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: req.method,
      headers,
      body: req.body,
      search: new URL(req.url, `http://${req.headers.host}`).search ?? "",
    },
    context: async () => ({ session: req.session }),
  });

  for (const [key, value] of httpGraphQLResponse.headers) {
    res.setHeader(key, value);
  }
  res.status(httpGraphQLResponse.status || 200);

  if (httpGraphQLResponse.body.kind === "complete") {
    res.send(httpGraphQLResponse.body.string);
  } else {
    for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
      res.write(chunk);
    }
    res.end();
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не знайдено" });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Внутрішня помилка сервера" });
});

const server = http.createServer(app);

// Socket.io chat
setupChat(server, sessionMiddleware);

server.listen(config.port, config.host, () => {
  const addr = server.address();
  const host = addr.address === "0.0.0.0" ? "localhost" : addr.address;
  console.log(`Server running at http://${host}:${addr.port}`);
  console.log("REST:      /auth, /events, /participants, /analytics");
  console.log("GraphQL:   POST /graphql");
  console.log("WebSocket: Socket.io chat");
});
