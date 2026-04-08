import { Router } from "express";
import { query } from "../db.mjs";
import { config } from "../config.mjs";

const router = Router();

// GET /participants/:eventId — offset-based by default, cursor if ?cursor= provided
router.get("/:eventId", async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);

    // Check event exists
    const eventResult = await query("SELECT id FROM events WHERE id = $1", [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: "Подію не знайдено" });
    }

    const search = req.query.search;
    const limit = Number(req.query.limit) || config.defaultLimit;

    // Cursor-based pagination
    if (req.query.cursor) {
      const cursor = Number(req.query.cursor);
      const conditions = ["event_id = $1", "id > $2"];
      const params = [eventId, cursor];
      let paramIdx = 3;

      if (search) {
        conditions.push(`(full_name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`);
        params.push(`%${search}%`);
        paramIdx++;
      }

      const result = await query(
        `SELECT * FROM participants WHERE ${conditions.join(" AND ")} ORDER BY id LIMIT $${paramIdx}`,
        [...params, limit]
      );

      const data = result.rows;
      const nextCursor = data.length === limit ? data[data.length - 1].id : null;

      return res.json({ data, pagination: { limit, nextCursor } });
    }

    // Offset-based pagination
    const page = Number(req.query.page) || config.defaultPage;
    const offset = (page - 1) * limit;

    const conditions = ["event_id = $1"];
    const params = [eventId];
    let paramIdx = 2;

    if (search) {
      conditions.push(`(full_name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM participants ${where}`,
      params
    );
    const total = Number(countResult.rows[0].total);

    const result = await query(
      `SELECT * FROM participants ${where} ORDER BY registered_at DESC, id DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      data: result.rows,
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

export default router;
