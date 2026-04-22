# 🌱 SmartSeason - Field Monitoring System

A Full-Stack Web Application for tracking crop progress across multiple fields during a growing season. Built as a Full-Stack Developer Technical Assessment for the **Shamba Records Software Engineer Intern** position.

**Live Demo:** https://smartseason-six.vercel.app/
---

## Tech Stack

| Layer      | Technology                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Framework  | [Next.js 14](https://nextjs.org/) (App Router - React frontend + serverless API routes in one project) |
| Auth       | [NextAuth.js v4](https://next-auth.js.org/) with JWT sessions + bcrypt                                 |
| ORM        | [Prisma v5](https://www.prisma.io/)                                                                    |
| Database   | [Neon PostgreSQL](https://neon.tech/) (serverless, always-on free tier)                                |
| Styling    | [Tailwind CSS v3](https://tailwindcss.com/)                                                            |
| Deployment | [Vercel](https://vercel.com/) (zero-config, serverless-first)                                          |

### Why this stack?

- **Next.js over separate frontend + backend**: The App Router lets us co-locate server components with their data fetching and ship client-side React where interactivity is genuinely needed. No CORS config, no separate deploy, no cold starts from Render.
- **Neon over Supabase/PlanetScale**: Neon is serverless PostgreSQL - the connection pooler handles the stateless serverless environment perfectly. Free tier is always-on (no sleeping).
- **Prisma**: Type-safe queries with zero SQL boilerplate. Schema migrations are a single `db push` command.
- **NextAuth**: Battle-tested, well-integrated with Next.js and credentials-based login is exactly what this use case needs.

---

## Features

### Admin (Coordinator)

- Dashboard with field overview, status breakdown, stage breakdown, agent summary and recent activity feed
- Create, view, edit and delete fields
- Assign / reassign fields to agents
- Log field updates directly
- Manage agents - view all users, add new agents or admins
- At-risk alert banner when fields need attention

### Field Agent

- Personalised dashboard (greeting, assigned fields, at-risk alerts)
- View all assigned fields
- Log field updates with stage progression and observation notes
- Suggested-next-stage hint to guide progression
- Full update history per field

### Shared

- Role-based access control - agents see only their fields; admins see everything
- Visual stage progress pipeline (Planted → Growing → Ready → Harvested)
- Computed field status (Active / At Risk / Completed)
- Status and stage badges throughout the UI
- Toast notifications for all actions

---

## Field Status Logic

Each field has a **computed status** derived at query time from its data - it is never stored in the database.

```
COMPLETED  →  stage === HARVESTED

AT_RISK    →  (stage is PLANTED or GROWING) AND planting date was >120 days ago
               OR last field update was >21 days ago

ACTIVE     →  everything else
```

**Rationale:**

- **Stagnant detection (120 days):** Most staple crops in Kenya (maize, beans, wheat) complete a full cycle in 90–120 days. A field still at PLANTED/GROWING after 120 days is likely neglected or facing serious problems - surfacing it as AT_RISK prompts coordinator intervention.
- **Unmonitored detection (21 days):** A field with no logged update in three weeks is effectively invisible to the system. Even if the crop is healthy, the absence of data is itself a risk signal. This threshold can be tuned per crop type in future.
- **Why computed, not stored?** Status is a function of time - a field that was ACTIVE yesterday can become AT_RISK today without any data change. Storing it would require background jobs to keep it fresh. Computing it on read is simpler, always accurate, and performant at this scale.

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech/) account (free tier)
- A [Vercel](https://vercel.com/) account (for deployment)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/smartseason.git
cd smartseason
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
# Get this from your Neon dashboard → Connection string
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-random-secret"

# Local dev only (Vercel sets this automatically)
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Push the database schema

```bash
npx prisma db push
```

### 5. Seed demo data

```bash
npm run db:seed
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Credentials

| Role         | Email                 | Password |
| ------------ | --------------------- | -------- |
| Admin        | admin@smartseason.com | admin123 |
| Agent (John) | john@smartseason.com  | agent123 |
| Agent (Mary) | mary@smartseason.com  | agent123 |

---

## Deploying to Vercel

1. Push your code to GitHub.
2. Import the repository on [vercel.com/new](https://vercel.com/new).
3. Add the following **Environment Variables** in the Vercel dashboard:
   - `DATABASE_URL` - your Neon connection string
   - `NEXTAUTH_SECRET` - your generated secret
   - _(Do **not** add `NEXTAUTH_URL` - Vercel sets this automatically)_
4. Click **Deploy**.
5. After deploy, run the seed via the Vercel CLI or Neon's SQL editor:
   ```sql
   -- Or use: npx vercel env pull && npm run db:seed
   ```

> **Neon + Vercel tip:** In the Neon dashboard you can enable the Vercel integration which auto-syncs `DATABASE_URL` to your Vercel project.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/
│   │   ├── admin/             # Admin dashboard, fields, agents
│   │   └── agent/             # Agent dashboard, fields
│   ├── api/
│   │   ├── auth/[...nextauth] # NextAuth handler
│   │   ├── fields/            # GET all, POST create
│   │   ├── fields/[id]/       # GET, PATCH, DELETE by ID
│   │   ├── fields/[id]/updates# POST update
│   │   ├── users/             # GET agents, POST create user
│   │   └── dashboard/         # GET dashboard stats
│   ├── globals.css
│   ├── layout.tsx
│   └── providers.tsx
├── components/
│   ├── ui/
│   │   ├── StatusBadge.tsx
│   │   └── StatsCard.tsx
│   ├── FieldCard.tsx
│   └── Sidebar.tsx
├── lib/
│   ├── auth.ts                # NextAuth config
│   ├── db.ts                  # Prisma client singleton
│   ├── status.ts              # Field status computation logic
│   └── utils.ts
└── types/
    └── index.ts
prisma/
├── schema.prisma
└── seed.ts
```

---

## Design Decisions & Assumptions

1. **Monorepo (Next.js full-stack):** Keeps the codebase simple and the deployment friction minimal. A separate Express/Django API would add complexity without meaningful benefit at this scale.

2. **Server Components for data fetching:** Dashboard and list pages fetch data directly in server components - no client-side `useEffect` + loading spinners for the initial render. Interactive islands (forms, delete buttons) are client components.

3. **JWT sessions over database sessions:** Eliminates a `Session` table in the database. The role is encoded in the JWT, so every API route can authorise without an extra DB round-trip.

4. **Soft field assignment:** Fields can exist without an assigned agent (`agentId` is nullable). Admins can reassign freely. Agents are forbidden from reassigning.

5. **Cascade deletes:** Deleting a field also deletes its update history (Prisma `onDelete: Cascade`). This felt appropriate - orphaned updates have no value.

6. **No over-engineering:** No Redux, no complex state management, no microservices. Tailwind utility classes over a component library. Simple is maintainable.

---

## If I Had More Time

- Email notifications when a field becomes AT_RISK
- Crop-type-specific stage thresholds (maize vs. wheat have different timelines)
- Field photo uploads via Cloudflare R2
- Map view of fields using MapLibre/Leaflet
- Export to CSV/PDF for offline coordinators
- PWA support for field agents with spotty connectivity
