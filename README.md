# Networking Events

Full-stack event management system with REST/GraphQL API, real-time chat, and analytics.

## Quick Start

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Install dependencies
npm install

# 3. Seed the database
npm run db:seed

# 4. Start backend (terminal 1)
npm run express:dev

# 5. Start frontend (terminal 2)
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3002
- GraphQL: http://localhost:3002/graphql

### Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | admin |
| organizer@example.com | org123 | organizer |

## Environment Variables

Copy `express-server/.env.example` and adjust values:

```
PORT=3002
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=change-me-in-production
DB_HOST=localhost
DB_PORT=5433
DB_USER=networking
DB_PASSWORD=networking
DB_NAME=networking_events
```

Frontend uses `VITE_API_URL` (defaults to `http://localhost:3002`).

## Frontend

React 19 + TypeScript + Vite + Redux Toolkit + Recharts + Socket.io

```bash
npm run dev       # dev server on :5173
npm run build     # production build
npm run preview   # preview production build
```

### Pages

- `/` — event list with search, favorites, filtering
- `/register/:eventId` — registration form (Zod validation)
- `/participants/:eventId` — participant list with search
- `/analytics` — interactive charts from DB (registrations/day, per event, organizers)
- `/chat` — real-time support chat (Socket.io)

## Server (Node.js http)

Pure `http` module server in `server/`. No frameworks.

```bash
npm run server:dev    # port 3000
```

## Server (Express.js + PostgreSQL)

Express 5 + PostgreSQL + Apollo GraphQL + Socket.io. Located in `express-server/`.

```bash
npm run express:dev   # port 3002
npm run db:seed       # seed database
```

### REST API

**Auth:**

| Method | Route | Access |
|--------|-------|--------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Public |
| GET | `/auth/me` | Auth |

**Events:**

| Method | Route | Access |
|--------|-------|--------|
| GET | `/events` | Public |
| GET | `/events/:id` | Public |
| POST | `/events` | Auth |
| PUT | `/events/:id` | Owner/Admin |
| DELETE | `/events/:id` | Owner/Admin |

Supports `?page=&limit=`, `?cursor=`, `?sort=date&order=desc`, `?search=`.

**Participants:**

| Method | Route | Access |
|--------|-------|--------|
| GET | `/participants/:eventId` | Auth |
| POST | `/participants` | Auth |
| DELETE | `/participants/:eid/:pid` | Admin |

**Analytics:**

| Method | Route | Access |
|--------|-------|--------|
| GET | `/analytics` | Public |

### GraphQL

`POST /graphql` — queries and mutations with session auth via cookies.

```graphql
# Nested query (event + creator + participants in one request)
{
  getEvents(limit: 5, search: "tech") {
    data {
      id title date
      creator { full_name email }
      participants { full_name email }
      participant_count
    }
    total
  }
}

# Mutation
mutation {
  addEvent(input: { title: "New Event", date: "2026-09-01" }) {
    id title creator_id
  }
}
```

### WebSocket Chat

Socket.io at the same port. Events:

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:message` | Client → Server | Send message `{ text }` |
| `chat:message` | Server → Client | Broadcast `{ id, userName, text, timestamp }` |
| `chat:typing` | Client → Server | Typing indicator |
| `chat:typing` | Server → Client | Broadcast `{ userName }` |
| `chat:welcome` | Server → Client | On connect `{ message, userName }` |
| `chat:system` | Server → Client | Join/leave notifications |

### Database

PostgreSQL 16 via Docker Compose on port 5433.

Tables: `users`, `events` (with `creator_id` FK), `participants`, `session`

Indexes: `events(date)`, `events(title)`, `events(date,id)`, `events(title,id)`, `events(creator_id)`, `participants(event_id)`, `participants(registered_at)`, `users(email)`

### Structure

```
express-server/
  index.mjs                    — server entry (Express + Apollo + Socket.io)
  config.mjs                   — all configuration
  db.mjs                       — pg connection pool
  chat.mjs                     — Socket.io chat handler
  data.mjs                     — seed data
  db/schema.mjs                — CREATE TABLE + indexes
  db/seed.mjs                  — seed script
  graphql/schema.mjs           — GraphQL type definitions
  graphql/resolvers.mjs        — GraphQL resolvers
  routes/auth.mjs              — register, login, logout, me
  routes/events.mjs            — CRUD + pagination + sorting
  routes/participants.mjs      — list + register + delete
  routes/analytics.mjs         — aggregated stats
  middleware/auth.mjs           — requireAuth, requireRole
  middleware/logger.mjs         — request logging
  middleware/validateQuery.mjs  — query param validation
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Redux Toolkit, React Router, Zod, Recharts, Socket.io Client
- **Backend:** Express 5, PostgreSQL 16, Apollo Server 5 (GraphQL), Socket.io, bcrypt, express-session
- **Deploy:** Vercel (frontend), Render/Railway (backend + DB)
