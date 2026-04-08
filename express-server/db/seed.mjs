import bcrypt from "bcrypt";
import { query, closePool } from "../db.mjs";
import { createTables } from "./schema.mjs";
import { config } from "../config.mjs";
import { events } from "../data.mjs";

const sampleParticipants = [
  { full_name: "Іванов Іван Іванович", email: "ivanov@example.com" },
  { full_name: "Петренко Марія Олексіївна", email: "petrenko@example.com" },
  { full_name: "Коваленко Андрій Вікторович", email: "kovalenko@example.com" },
  { full_name: "Шевченко Ольга Сергіївна", email: "shevchenko@example.com" },
  { full_name: "Бондаренко Дмитро Павлович", email: "bondarenko@example.com" },
  { full_name: "Ткаченко Наталія Ігорівна", email: "tkachenko@example.com" },
  { full_name: "Мельник Олександр Юрійович", email: "melnyk@example.com" },
  { full_name: "Кравченко Юлія Андріївна", email: "kravchenko@example.com" },
];

const seedUsers = [
  { email: "admin@example.com", password: "admin123", full_name: "Адміністратор", role: "admin" },
  { email: "organizer@example.com", password: "org123", full_name: "Організатор Подій", role: "organizer" },
];

async function seed() {
  console.log("Creating tables...");
  await createTables();

  // Clear existing data
  await query("DELETE FROM participants");
  await query("DELETE FROM events");
  await query("DELETE FROM users");
  await query("ALTER SEQUENCE events_id_seq RESTART WITH 1");
  await query("ALTER SEQUENCE participants_id_seq RESTART WITH 1");
  await query("ALTER SEQUENCE users_id_seq RESTART WITH 1");

  // Seed users
  console.log("Seeding users...");
  for (const user of seedUsers) {
    const hash = await bcrypt.hash(user.password, config.bcryptRounds);
    await query(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)",
      [user.email, hash, user.full_name, user.role]
    );
  }

  // Seed events
  console.log("Seeding events...");
  for (const event of events) {
    await query(
      `INSERT INTO events (title, description, date, organizer, location, tags)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [event.title, event.description, event.date, event.organizer, event.location, event.tags]
    );
  }

  // Seed participants
  console.log("Seeding participants...");
  const { rows: dbEvents } = await query("SELECT id FROM events");

  for (const { id: eventId } of dbEvents) {
    const count = 2 + Math.floor(Math.random() * 3);
    const shuffled = [...sampleParticipants].sort(() => Math.random() - 0.5);
    for (let i = 0; i < count; i++) {
      const p = shuffled[i];
      const daysAgo = Math.floor(Math.random() * 14);
      await query(
        `INSERT INTO participants (event_id, full_name, email, registered_at)
         VALUES ($1, $2, $3, NOW() - INTERVAL '1 day' * $4)`,
        [eventId, p.full_name, p.email, daysAgo]
      );
    }
  }

  const { rows: [{ count: userCount }] } = await query("SELECT COUNT(*) AS count FROM users");
  const { rows: [{ count: eventCount }] } = await query("SELECT COUNT(*) AS count FROM events");
  const { rows: [{ count: partCount }] } = await query("SELECT COUNT(*) AS count FROM participants");
  console.log(`Seeded ${userCount} users, ${eventCount} events, ${partCount} participants.`);
  console.log("Test accounts:");
  console.log("  admin@example.com / admin123 (role: admin)");
  console.log("  organizer@example.com / org123 (role: organizer)");

  await closePool();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
