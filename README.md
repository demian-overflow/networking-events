# Networking Events

Web application for discovering networking events and finding business partners.

## Frontend

React + TypeScript + Vite + Redux Toolkit + Recharts

```bash
npm install
npm run dev
```

Open http://localhost:5173

Build for production:

```bash
npm run build
npm run preview
```

### Pages

- `/` — event list with search and favorites
- `/register/:eventId` — registration form (Zod validation)
- `/participants/:eventId` — participant list with search
- `/analytics` — charts and stats, external event import

## Server (Node.js http)

Pure Node.js HTTP server, no frameworks. Located in `server/`.

```bash
npm install
npm run server:dev
```

Runs at http://localhost:3000

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/events` | All events |
| GET | `/api/events?search=keyword` | Filter by title |
| GET | `/api/events/:id` | Single event |

`server:dev` uses nodemon for auto-restart. Use `npm run server` for plain node.

## Server (Express.js + PostgreSQL)

Express 5 server with PostgreSQL, middleware, pagination, sorting, and query validation. Located in `express-server/`.

### Setup

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Install dependencies
npm install

# 3. Seed the database
npm run db:seed

# 4. Start the server
npm run express:dev
```

Runs at http://localhost:3002

### API — Events

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/events` | All events (offset pagination) |
| GET | `/events?page=2&limit=5` | Offset pagination |
| GET | `/events?cursor=5&limit=5` | Cursor-based pagination |
| GET | `/events?sort=date&order=desc` | Sort by date or title |
| GET | `/events?search=keyword` | Filter by title |
| GET | `/events/:id` | Single event |

### API — Participants

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/participants/:eventId` | Participants for an event (offset pagination) |
| GET | `/participants/:eventId?page=2&limit=5` | Offset pagination |
| GET | `/participants/:eventId?cursor=10&limit=5` | Cursor-based pagination |
| GET | `/participants/:eventId?search=name` | Filter by name or email |

Query parameters can be combined. Invalid queries return `400` with error details. Unknown routes return `404`.

`express:dev` uses nodemon for auto-restart. Use `npm run express` for plain node.

### Database

PostgreSQL 16 via Docker Compose. Connection: `postgresql://networking:networking@localhost:5433/networking_events`

Tables:
- `events` — id, title, description, date, organizer, location, tags
- `participants` — id, event_id (FK), full_name, email, registered_at

Indexes on: `events(date)`, `events(title)`, `events(date, id)`, `events(title, id)`, `participants(event_id)`, `participants(registered_at)`

### Structure

```
express-server/
  index.mjs                    — server entry point
  config.mjs                   — port, host, CORS, DB connection, pagination
  db.mjs                       — pg connection pool
  data.mjs                     — seed data (events)
  db/schema.mjs                — CREATE TABLE + indexes
  db/seed.mjs                  — seed script (events + participants)
  routes/events.mjs            — GET /events, GET /events/:id
  routes/participants.mjs      — GET /participants/:eventId
  middleware/logger.mjs        — request logging
  middleware/validateQuery.mjs — query param validation
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Redux Toolkit, React Router, Zod, Recharts
- **Backend:** Node.js http module, Express 5, PostgreSQL 16, pg
- **Deploy:** Vercel (frontend)
