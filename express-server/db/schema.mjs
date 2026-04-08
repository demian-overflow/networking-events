import { query } from "../db.mjs";

export async function createTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name     VARCHAR(255) NOT NULL,
      role          VARCHAR(50) NOT NULL DEFAULT 'organizer',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS events (
      id            SERIAL PRIMARY KEY,
      title         VARCHAR(255) NOT NULL,
      description   TEXT NOT NULL DEFAULT '',
      date          DATE NOT NULL,
      organizer     VARCHAR(255) NOT NULL,
      location      VARCHAR(255) NOT NULL DEFAULT '',
      tags          TEXT[] NOT NULL DEFAULT '{}',
      creator_id    INTEGER REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Add creator_id if table already exists without it
  await query(`
    DO $$ BEGIN
      ALTER TABLE events ADD COLUMN IF NOT EXISTS creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN NULL;
    END $$;
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

  // Session table for connect-pg-simple
  await query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" VARCHAR NOT NULL COLLATE "default",
      "sess" JSON NOT NULL,
      "expire" TIMESTAMP(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);`);

  // Indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_events_title ON events(title);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_events_date_id ON events(date, id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_events_title_id ON events(title, id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_participants_registered_at ON participants(registered_at);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);

  console.log("Tables and indexes created.");
}
