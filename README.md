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

## Server

Node.js HTTP server (no frameworks)

```bash
npm install
npm run server:dev
```

Runs at http://localhost:3000

### API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/events` | All events |
| GET | `/api/events?search=keyword` | Filter by title |
| GET | `/api/events/:id` | Single event |

`server:dev` uses nodemon for auto-restart on file changes. Use `npm run server` for a plain node start.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Redux Toolkit, React Router, Zod, Recharts
- **Backend:** Node.js, http module, nodemon
- **Deploy:** Vercel (frontend)
