# Deployment Guide

## Live URLs

- **Frontend:** https://networking-events-three.vercel.app
- **Backend API:** https://networking-events-api.onrender.com
- **GraphQL:** https://networking-events-api.onrender.com/graphql

## Architecture

```
Vercel (Frontend)              Render (Backend)
┌──────────────────┐           ┌──────────────────────┐
│  React SPA       │  REST     │  Express.js          │
│  Vite build      │ ────────► │  Apollo GraphQL      │
│  Redux Toolkit   │  GraphQL  │  Socket.io           │
│  Recharts        │ ◄──────── │                      │
│  Socket.io Client│  WebSocket│  PostgreSQL (Render)  │
└──────────────────┘           └──────────────────────┘
```

## Frontend — Vercel

### Setup

1. Import `networking-events` repo on [vercel.com/new](https://vercel.com/new)
2. Framework auto-detects **Vite**
3. Add environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://networking-events-api.onrender.com` |

4. Deploy — `vercel.json` handles SPA routing rewrites

### Redeployment

Push to `main` branch — Vercel auto-deploys.

## Backend — Render

### 1. PostgreSQL

1. Create **New Postgres** on [render.com](https://render.com)
2. Free tier, region: Frankfurt (EU Central)
3. Note the **Internal Database URL** for the web service config

### 2. Web Service

1. Create **New Web Service**, connect `networking-events` repo
2. Fill in:

| Field | Value |
|-------|-------|
| Name | `networking-events-api` |
| Language | Node |
| Branch | `main` |
| Root Directory | `express-server` |
| Build Command | `cd .. && npm install` |
| Start Command | `cd .. && node express-server/index.mjs` |
| Instance Type | Free |

3. Add environment variables:

| Key | Value |
|-----|-------|
| `PORT` | `10000` |
| `HOST` | `0.0.0.0` |
| `CORS_ORIGIN` | `*` |
| `SESSION_SECRET` | *(generate a random string)* |
| `DB_HOST` | *(internal hostname from Postgres dashboard, e.g. `dpg-xxx-a`)* |
| `DB_PORT` | `5432` |
| `DB_USER` | *(from Postgres dashboard)* |
| `DB_PASSWORD` | *(from Postgres dashboard)* |
| `DB_NAME` | *(from Postgres dashboard)* |

4. Deploy

### 3. Seed the Database

From your local machine, using the **external** Postgres hostname:

```bash
DB_HOST=dpg-xxx-a.frankfurt-postgres.render.com \
DB_PORT=5432 \
DB_USER=networking \
DB_PASSWORD=your-password \
DB_NAME=your-db-name \
DB_SSL=true \
node express-server/db/seed.mjs
```

Internal hostnames are only reachable from Render services. For seeding from outside, use the external hostname (`*.frankfurt-postgres.render.com`) with `DB_SSL=true`.

### Redeployment

Push to `main` branch — Render auto-deploys.

## Notes

- Render free tier spins down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds.
- Render free Postgres expires after 90 days — back up or upgrade before then.
- Socket.io WebSocket connections work on Render free tier.
- `CORS_ORIGIN=*` allows any frontend origin. For production, set it to your Vercel URL.
