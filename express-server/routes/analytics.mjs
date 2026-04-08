import { Router } from "express";
import { query } from "../db.mjs";

const router = Router();

// GET /analytics — aggregate stats from DB
router.get("/", async (req, res, next) => {
  try {
    const [eventsCount, participantsCount, registrationsByDay, participantsPerEvent, organizerDist] =
      await Promise.all([
        query("SELECT COUNT(*) AS count FROM events"),
        query("SELECT COUNT(*) AS count FROM participants"),
        query(
          `SELECT DATE(registered_at) AS date, COUNT(*) AS count
           FROM participants GROUP BY DATE(registered_at) ORDER BY date`
        ),
        query(
          `SELECT e.id, e.title, COUNT(p.id) AS count
           FROM events e LEFT JOIN participants p ON p.event_id = e.id
           GROUP BY e.id, e.title HAVING COUNT(p.id) > 0
           ORDER BY count DESC`
        ),
        query(
          `SELECT organizer AS name, COUNT(*) AS value
           FROM events GROUP BY organizer ORDER BY value DESC`
        ),
      ]);

    res.json({
      totalEvents: Number(eventsCount.rows[0].count),
      totalParticipants: Number(participantsCount.rows[0].count),
      registrationsByDay: registrationsByDay.rows.map((r) => ({
        date: r.date.toISOString().split("T")[0],
        count: Number(r.count),
      })),
      participantsPerEvent: participantsPerEvent.rows.map((r) => ({
        name: r.title.length > 25 ? r.title.slice(0, 25) + "..." : r.title,
        count: Number(r.count),
      })),
      organizerDistribution: organizerDist.rows.map((r) => ({
        name: r.name,
        value: Number(r.value),
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
