# AI Career Guidance System

An ML-powered platform for universities to analyze student academic data, predict performance, suggest career domains, and determine placement eligibility.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/career-guidance run dev` — run the frontend (port 18999)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind + shadcn/ui + recharts

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions (students, mlModels, predictions, eligibility, careerSuggestions, percentageGroups)
- `artifacts/api-server/src/routes/` — Express route handlers (students, models, predictions, eligibility, careerSuggestions, percentageGroups, dashboard)
- `artifacts/career-guidance/src/` — React frontend with wouter routing

## Architecture decisions

- ML logic is simulated server-side: weighted score formulas for prediction, rule-based eligibility checks, and skill-profile-based career domain assignment
- Upsert pattern used for predictions/eligibility/career suggestions so re-running an analysis for the same student updates rather than duplicates
- Dashboard aggregation endpoints query the DB directly for counts/averages rather than computing client-side
- All API routes use Zod schemas from `@workspace/api-zod` (codegen-derived) for validation

## Product

- **Dashboard** — at-a-glance stats: total students, predictions run, eligible count, averages
- **Students** — searchable/filterable CRUD for student records with all academic scores
- **Predictions** — run ML performance predictions; view predicted score and performance level per student
- **Career Suggestions** — generate AI-based career domain suggestions (Web Dev, AI/ML, Data Science, Cloud, Cyber Security)
- **Placement Eligibility** — compute and view placement eligibility based on attendance, aptitude, and percentage
- **Analytics** — department breakdown, performance distribution, career domain distribution, eligibility summary charts
- **ML Models** — admin panel to view and add ML model registry entries

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always re-run codegen after spec changes: `pnpm --filter @workspace/api-spec run codegen`
- Restart API server after route changes (it rebuilds with esbuild on `dev`)
- `pnpm --filter @workspace/db run push-force` if schema push fails due to column conflicts

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
