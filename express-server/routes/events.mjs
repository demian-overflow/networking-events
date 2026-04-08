import { Router } from "express";
import { events } from "../data.mjs";
import { config } from "../config.mjs";
import { validateEventsQuery } from "../middleware/validateQuery.mjs";

const router = Router();

// GET /events — list with pagination, sorting, search
router.get("/", validateEventsQuery, (req, res) => {
  let result = [...events];

  // Search filter
  const search = req.query.search?.toLowerCase();
  if (search) {
    result = result.filter((e) => e.title.toLowerCase().includes(search));
  }

  // Sorting
  const sort = req.query.sort; // "date" | "title"
  const order = req.query.order ?? "asc";
  if (sort) {
    result.sort((a, b) => {
      const valA = a[sort];
      const valB = b[sort];
      const cmp = typeof valA === "string" ? valA.localeCompare(valB) : 0;
      return order === "desc" ? -cmp : cmp;
    });
  }

  // Pagination
  const total = result.length;
  const page = Number(req.query.page) || config.defaultPage;
  const limit = Number(req.query.limit) || config.defaultLimit;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paged = result.slice(start, start + limit);

  res.json({
    data: paged,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

// GET /events/:id — single event
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const event = events.find((e) => e.id === id);

  if (!event) {
    return res.status(404).json({ error: "Подію не знайдено" });
  }

  res.json(event);
});

export default router;
