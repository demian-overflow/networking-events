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

## Server (Express.js)

Express 5 server with middleware, pagination, sorting, and query validation. Located in `express-server/`.

```bash
npm install
npm run express:dev
```

Runs at http://localhost:3002

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/events` | All events (paginated) |
| GET | `/events?page=2&limit=5` | Pagination |
| GET | `/events?sort=date&order=desc` | Sort by date or title |
| GET | `/events?search=keyword` | Filter by title |
| GET | `/events/:id` | Single event |

Query parameters can be combined: `/events?search=tech&sort=date&order=desc&page=1&limit=5`

Invalid queries return `400` with error details. Unknown routes return `404`.

`express:dev` uses nodemon for auto-restart. Use `npm run express` for plain node.

### Structure

```
express-server/
  index.mjs                    — server entry point
  config.mjs                   — port, host, CORS, pagination defaults
  data.mjs                     — in-memory event data
  routes/events.mjs            — GET /events, GET /events/:id
  middleware/logger.mjs        — request logging (method, url, status, duration)
  middleware/validateQuery.mjs — query param validation (page, limit, sort, order)
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Redux Toolkit, React Router, Zod, Recharts
- **Backend:** Node.js http module, Express 5, nodemon
- **Deploy:** Vercel (frontend)
