import { Router } from "express";
import { query } from "../db.mjs";
import { config } from "../config.mjs";
import { validateEventsQuery } from "../middleware/validateQuery.mjs";

const router = Router();

const SORT_COLUMNS = { date: "date", title: "title" };

// GET /events — offset-based pagination (default)
router.get("/", validateEventsQuery, async (req, res, next) => {
  try {
    // If cursor param present, use cursor-based pagination
    if (req.query.cursor) {
      return cursorPaginate(req, res);
    }

    const search = req.query.search;
    const sortCol = SORT_COLUMNS[req.query.sort] ?? "id";
    const order = req.query.order === "desc" ? "DESC" : "ASC";
    const page = Number(req.query.page) || config.defaultPage;
    const limit = Number(req.query.limit) || config.defaultLimit;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`title ILIKE $${paramIdx}`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total
    const countResult = await query(`SELECT COUNT(*) AS total FROM events ${where}`, params);
    const total = Number(countResult.rows[0].total);

    // Fetch page
    const dataResult = await query(
      `SELECT * FROM events ${where} ORDER BY ${sortCol} ${order}, id ${order} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Cursor-based pagination for infinite scroll
async function cursorPaginate(req, res) {
  const cursor = Number(req.query.cursor);
  const limit = Number(req.query.limit) || config.defaultLimit;
  const search = req.query.search;
  const sortCol = SORT_COLUMNS[req.query.sort] ?? "date";
  const order = req.query.order === "desc" ? "DESC" : "ASC";
  const op = order === "DESC" ? "<" : ">";

  const conditions = [`(${sortCol}, id) ${op} (SELECT ${sortCol}, id FROM events WHERE id = $1)`];
  const params = [cursor];
  let paramIdx = 2;

  if (search) {
    conditions.push(`title ILIKE $${paramIdx}`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const result = await query(
    `SELECT * FROM events ${where} ORDER BY ${sortCol} ${order}, id ${order} LIMIT $${paramIdx}`,
    [...params, limit]
  );

  const data = result.rows;
  const nextCursor = data.length === limit ? data[data.length - 1].id : null;

  res.json({
    data,
    pagination: {
      limit,
      nextCursor,
    },
  });
}

// GET /events/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query("SELECT * FROM events WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Подію не знайдено" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
