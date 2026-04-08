import { query } from "../db.mjs";

export async function createTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS events (
      id            SERIAL PRIMARY KEY,
      title         VARCHAR(255) NOT NULL,
      description   TEXT NOT NULL DEFAULT '',
      date          DATE NOT NULL,
      organizer     VARCHAR(255) NOT NULL,
      location      VARCHAR(255) NOT NULL DEFAULT '',
      tags          TEXT[] NOT NULL DEFAULT '{}'
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS participants (
      id              SERIAL PRIMARY KEY,
      event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      full_name       VARCHAR(255) NOT NULL,
      email           VARCHAR(255) NOT NULL,
      registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Indexes for sorting and search
  await query(`CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_events_title ON events(title);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_events_date_id ON events(date, id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_events_title_id ON events(title, id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_participants_registered_at ON participants(registered_at);`);

  console.log("Tables and indexes created.");
}
