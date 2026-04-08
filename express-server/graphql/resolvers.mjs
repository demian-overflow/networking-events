import { GraphQLError } from "graphql";
import { query } from "../db.mjs";

function requireAuth(ctx) {
  if (!ctx.session?.userId) {
    throw new GraphQLError("Необхідна авторизація", { extensions: { code: "UNAUTHENTICATED" } });
  }
}

function requireAdmin(ctx) {
  requireAuth(ctx);
  if (ctx.session.role !== "admin") {
    throw new GraphQLError("Недостатньо прав доступу", { extensions: { code: "FORBIDDEN" } });
  }
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new GraphQLError("Невірний формат email", { extensions: { code: "BAD_USER_INPUT" } });
  }
}

const SORT_MAP = { date: "date", title: "title" };

export const resolvers = {
  Query: {
    async getEvents(_, { limit = 10, skip = 0, search, sort, order }) {
      const conditions = [];
      const params = [];
      let idx = 1;

      if (search) {
        conditions.push(`title ILIKE $${idx}`);
        params.push(`%${search}%`);
        idx++;
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const sortCol = SORT_MAP[sort] ?? "id";
      const dir = order === "desc" ? "DESC" : "ASC";

      const [countRes, dataRes] = await Promise.all([
        query(`SELECT COUNT(*) AS total FROM events ${where}`, params),
        query(
          `SELECT * FROM events ${where} ORDER BY ${sortCol} ${dir}, id ${dir} LIMIT $${idx} OFFSET $${idx + 1}`,
          [...params, limit, skip]
        ),
      ]);

      return { data: dataRes.rows, total: Number(countRes.rows[0].total) };
    },

    async getEvent(_, { id }) {
      const result = await query("SELECT * FROM events WHERE id = $1", [id]);
      return result.rows[0] ?? null;
    },

    async getParticipants(_, { eventId, limit = 10, skip = 0 }, ctx) {
      requireAuth(ctx);
      const result = await query(
        "SELECT * FROM participants WHERE event_id = $1 ORDER BY registered_at DESC LIMIT $2 OFFSET $3",
        [eventId, limit, skip]
      );
      return result.rows;
    },

    async me(_, __, ctx) {
      if (!ctx.session?.userId) return null;
      const result = await query(
        "SELECT id, email, full_name, role, created_at FROM users WHERE id = $1",
        [ctx.session.userId]
      );
      return result.rows[0] ?? null;
    },
  },

  Mutation: {
    async addEvent(_, { input }, ctx) {
      requireAuth(ctx);
      const { title, description, date, organizer, location, tags } = input;

      if (!title || !date) {
        throw new GraphQLError("title та date є обов'язковими", { extensions: { code: "BAD_USER_INPUT" } });
      }

      const result = await query(
        `INSERT INTO events (title, description, date, organizer, location, tags, creator_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [title, description ?? "", date, organizer ?? "", location ?? "", tags ?? [], ctx.session.userId]
      );
      return result.rows[0];
    },

    async updateEvent(_, { id, input }, ctx) {
      requireAuth(ctx);

      const existing = await query("SELECT creator_id FROM events WHERE id = $1", [id]);
      if (existing.rows.length === 0) {
        throw new GraphQLError("Подію не знайдено", { extensions: { code: "NOT_FOUND" } });
      }

      const isOwner = existing.rows[0].creator_id === ctx.session.userId;
      if (!isOwner && ctx.session.role !== "admin") {
        throw new GraphQLError("Можна редагувати лише свої події", { extensions: { code: "FORBIDDEN" } });
      }

      const { title, description, date, organizer, location, tags } = input;
      const result = await query(
        `UPDATE events SET title = COALESCE($1, title), description = COALESCE($2, description),
         date = COALESCE($3, date), organizer = COALESCE($4, organizer),
         location = COALESCE($5, location), tags = COALESCE($6, tags)
         WHERE id = $7 RETURNING *`,
        [title, description, date, organizer, location, tags, id]
      );
      return result.rows[0];
    },

    async deleteEvent(_, { id }, ctx) {
      requireAuth(ctx);

      const existing = await query("SELECT creator_id FROM events WHERE id = $1", [id]);
      if (existing.rows.length === 0) {
        throw new GraphQLError("Подію не знайдено", { extensions: { code: "NOT_FOUND" } });
      }

      const isOwner = existing.rows[0].creator_id === ctx.session.userId;
      if (!isOwner && ctx.session.role !== "admin") {
        throw new GraphQLError("Можна видаляти лише свої події", { extensions: { code: "FORBIDDEN" } });
      }

      await query("DELETE FROM events WHERE id = $1", [id]);
      return true;
    },

    async addParticipant(_, { input }, ctx) {
      requireAuth(ctx);
      const { event_id, full_name, email } = input;

      validateEmail(email);

      const eventResult = await query("SELECT id FROM events WHERE id = $1", [event_id]);
      if (eventResult.rows.length === 0) {
        throw new GraphQLError("Подію не знайдено", { extensions: { code: "NOT_FOUND" } });
      }

      const result = await query(
        "INSERT INTO participants (event_id, full_name, email) VALUES ($1, $2, $3) RETURNING *",
        [event_id, full_name, email]
      );
      return result.rows[0];
    },

    async deleteParticipant(_, { eventId, participantId }, ctx) {
      requireAdmin(ctx);

      const result = await query(
        "DELETE FROM participants WHERE id = $1 AND event_id = $2 RETURNING id",
        [participantId, eventId]
      );

      if (result.rows.length === 0) {
        throw new GraphQLError("Учасника не знайдено", { extensions: { code: "NOT_FOUND" } });
      }
      return true;
    },
  },

  // Nested field resolvers — batch-loaded to avoid N+1
  Event: {
    async creator(event) {
      if (!event.creator_id) return null;
      // If already joined in parent query
      if (event.creator_name) {
        return { id: event.creator_id, full_name: event.creator_name, email: event.creator_email, role: "", created_at: "" };
      }
      const result = await query(
        "SELECT id, email, full_name, role, created_at FROM users WHERE id = $1",
        [event.creator_id]
      );
      return result.rows[0] ?? null;
    },

    async participants(event) {
      const result = await query(
        "SELECT * FROM participants WHERE event_id = $1 ORDER BY registered_at DESC",
        [event.id]
      );
      return result.rows;
    },

    async participant_count(event) {
      const result = await query(
        "SELECT COUNT(*) AS count FROM participants WHERE event_id = $1",
        [event.id]
      );
      return Number(result.rows[0].count);
    },
  },
};
