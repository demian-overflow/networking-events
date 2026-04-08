import { Router } from "express";
import { query } from "../db.mjs";
import { config } from "../config.mjs";
import { validateEventsQuery } from "../middleware/validateQuery.mjs";
import { requireAuth, requireRole } from "../middleware/auth.mjs";

const router = Router();

const SORT_COLUMNS = { date: "date", title: "title" };

// GET /events — offset-based pagination (default)
router.get("/", validateEventsQuery, async (req, res, next) => {
  try {
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
      conditions.push(`e.title ILIKE $${paramIdx}`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query(`SELECT COUNT(*) AS total FROM events e ${where}`, params);
    const total = Number(countResult.rows[0].total);

    const dataResult = await query(
      `SELECT e.*, u.full_name AS creator_name, u.email AS creator_email
       FROM events e LEFT JOIN users u ON e.creator_id = u.id
       ${where} ORDER BY e.${sortCol} ${order}, e.id ${order}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

async function cursorPaginate(req, res) {
  const cursor = Number(req.query.cursor);
  const limit = Number(req.query.limit) || config.defaultLimit;
  const search = req.query.search;
  const sortCol = SORT_COLUMNS[req.query.sort] ?? "date";
  const order = req.query.order === "desc" ? "DESC" : "ASC";
  const op = order === "DESC" ? "<" : ">";

  const conditions = [`(e.${sortCol}, e.id) ${op} (SELECT ${sortCol}, id FROM events WHERE id = $1)`];
  const params = [cursor];
  let paramIdx = 2;

  if (search) {
    conditions.push(`e.title ILIKE $${paramIdx}`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const result = await query(
    `SELECT e.*, u.full_name AS creator_name, u.email AS creator_email
     FROM events e LEFT JOIN users u ON e.creator_id = u.id
     ${where} ORDER BY e.${sortCol} ${order}, e.id ${order} LIMIT $${paramIdx}`,
    [...params, limit]
  );

  const data = result.rows;
  const nextCursor = data.length === limit ? data[data.length - 1].id : null;

  res.json({ data, pagination: { limit, nextCursor } });
}

// GET /events/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query(
      `SELECT e.*, u.full_name AS creator_name, u.email AS creator_email
       FROM events e LEFT JOIN users u ON e.creator_id = u.id WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Подію не знайдено" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /events — create event (auth required)
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title, description, date, organizer, location, tags } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: "title та date є обов'язковими" });
    }

    const result = await query(
      `INSERT INTO events (title, description, date, organizer, location, tags, creator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description ?? "", date, organizer ?? "", location ?? "", tags ?? [], req.session.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /events/:id — edit own event, or any if admin
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // Check ownership or admin
    const existing = await query("SELECT creator_id FROM events WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Подію не знайдено" });
    }

    const isOwner = existing.rows[0].creator_id === req.session.userId;
    const isAdmin = req.session.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Можна редагувати лише свої події" });
    }

    const { title, description, date, organizer, location, tags } = req.body;

    const result = await query(
      `UPDATE events SET title = COALESCE($1, title), description = COALESCE($2, description),
       date = COALESCE($3, date), organizer = COALESCE($4, organizer),
       location = COALESCE($5, location), tags = COALESCE($6, tags)
       WHERE id = $7 RETURNING *`,
      [title, description, date, organizer, location, tags, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /events/:id — delete own event, or any if admin
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const existing = await query("SELECT creator_id FROM events WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Подію не знайдено" });
    }

    const isOwner = existing.rows[0].creator_id === req.session.userId;
    const isAdmin = req.session.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Можна видаляти лише свої події" });
    }

    await query("DELETE FROM events WHERE id = $1", [id]);
    res.json({ message: "Подію видалено", id });
  } catch (err) {
    next(err);
  }
});

export default router;
