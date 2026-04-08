import http from "node:http";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { config } from "./config.mjs";
import { logRequest } from "./logger.mjs";

function json(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const start = Date.now();

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    logRequest(req, res, Date.now() - start);
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname === "/api/events" && req.method === "GET") {
      const data = await readFile(config.dataFile, "utf-8");
      const events = JSON.parse(data);

      // Optional query filter: ?search=keyword
      const search = url.searchParams.get("search")?.toLowerCase();
      const filtered = search
        ? events.filter((e) => e.title.toLowerCase().includes(search))
        : events;

      json(res, 200, filtered);
    } else if (
      url.pathname.match(/^\/api\/events\/\d+$/) &&
      req.method === "GET"
    ) {
      const id = Number(url.pathname.split("/").pop());
      const data = await readFile(config.dataFile, "utf-8");
      const events = JSON.parse(data);
      const event = events.find((e) => e.id === id);

      if (event) {
        json(res, 200, event);
      } else {
        json(res, 404, { error: "Подію не знайдено" });
      }
    } else {
      json(res, 404, { error: "Маршрут не знайдено" });
    }
  } catch (err) {
    console.error("Server error:", err.message);
    json(res, 500, { error: "Внутрішня помилка сервера" });
  }

  logRequest(req, res, Date.now() - start);
});

server.listen(config.port, config.host, () => {
  console.log(`Server running at http://${config.host}:${config.port}`);
  console.log("Routes:");
  console.log("  GET /api/events          — list all events");
  console.log("  GET /api/events?search=  — filter by title");
  console.log("  GET /api/events/:id      — single event");
});
