# EduMeter MVP Monorepo

## Apps
- `apps/web`: Vite + React front-end (current MVP UI)
- `apps/api`: Node + Fastify API (tenant/auth/rbac/audit baseline)
- `apps/worker`: Batch jobs for analytics/detection/migration

## Run (web)
1. Install dependencies from the repo root: `npm install`
2. Run the web app: `npm run dev`

## Run (api)
1. Configure env: copy `apps/api/.env.example` to `apps/api/.env` and update values
2. Run migrations: `npm -w apps/api run migrate`
3. Start API: `npm -w apps/api run dev`

## Import requirements (CSV/JSON)
- CSV/JSON import (script): `npm -w apps/api run import:requirements -- <path> <baselineVersion>`
- Script requires `TENANT_ID` and `USER_ID` in `apps/api/.env` (use the admin user created via `/api/auth/register`)
- API import: `POST /api/requirements/import` with `{ format, data, baselineVersion }`

## Run (worker)
1. Configure env: copy `apps/worker/.env.example` to `apps/worker/.env` and update values
2. Run jobs (from repo root):
   - CTT: `npm run worker:ctt`
   - IRT: `npm run worker:irt`
   - Exposure: `npm run worker:exposure`
   - Detection: `npm run worker:detect`
