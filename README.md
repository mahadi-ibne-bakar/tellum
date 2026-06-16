# Tellum

> Every move reveals a pattern.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-database-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/license-MIT-green)

**Live demo:** [tellum.vercel.app](https://tellum.vercel.app)

<!-- Add a screenshot or demo GIF here -->

Tellum is an AI-powered Rock Paper Scissors app that learns how a person plays and uses that to predict — and counter — their next move. It runs entirely as a single Next.js app with a Supabase backend, and the prediction engine is fully transparent: every suggestion comes with a plain-English explanation of the pattern behind it.

## Modes

**Coach Mode** — for two people playing in real life. One person holds Tellum. It watches the real opponent's moves round by round and tells the app holder exactly what to throw next, building a separate memory for each named opponent over time.

**Mirror Mode** — solo play against Tellum itself. The AI quietly studies your own patterns during an observation phase, then dramatically reveals what it's learned and starts predicting your moves openly.

## How the AI works

Tellum doesn't rely on one model — it runs five lightweight pattern detectors in parallel, each reading the move history from a different angle: overall move frequency, what tends to follow a specific move, how someone reacts after winning versus losing, whether they repeat a move in streaks, and whether they rotate through moves in a cycle. Each detector scores its own confidence based on how much data supports it. Those five outputs are then blended into a single weighted prediction, where the detector that has found the clearest pattern gets the most influence. As more rounds are played, weak signals get crowded out by strong ones and the prediction sharpens — which is why Tellum gets noticeably better the longer you play.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Database & Auth | Supabase (PostgreSQL) |
| Image export | html2canvas |
| Deployment | Vercel |

## Getting started

### Prerequisites
- Node.js 20+
- pnpm
- A free [Supabase](https://supabase.com) account

### 1. Clone and install

```bash
git clone https://github.com/mahadi-ibne-bakar/tellum.git
cd tellum
pnpm install
```

### 2. Set up Supabase

Create a new Supabase project, then open the **SQL Editor** and run:

```sql
-- Opponent profiles (Coach Mode)
create table opponent_profiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  created_at timestamptz default now()
);

alter table opponent_profiles enable row level security;

create policy "Users manage their own profiles"
  on opponent_profiles for all
  using (auth.uid() = user_id);

-- Every round played, in both modes
create table rounds (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users(id) on delete cascade not null,
  mode                 text check (mode in ('coach', 'mirror')) not null,
  opponent_move        text check (opponent_move in ('rock', 'paper', 'scissors')) not null,
  your_move            text check (your_move in ('rock', 'paper', 'scissors')) not null,
  outcome              text check (outcome in ('win', 'loss', 'tie')) not null,
  opponent_profile_id  uuid references opponent_profiles(id) on delete set null,
  played_at            timestamptz default now()
);

alter table rounds enable row level security;

create policy "Users manage their own rounds"
  on rounds for all
  using (auth.uid() = user_id);
```

Then go to **Authentication → Providers → Email** and make sure email sign-in is enabled.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key (found under **Project Settings → API**):

```bash
cp .env.example .env.local
```

### 4. Run it

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

tellum/

├── app/
│   ├── auth/                  Sign in / sign up
│   ├── coach/                 Coach Mode + opponent profile selector
│   │   └── profile/[id]/      Shareable pattern card per opponent
│   ├── mirror/                Mirror Mode
│   ├── settings/              Display + AI sensitivity settings
│   └── page.tsx                Landing page
├── components/                 Reusable UI (auth button, toggle, pattern card, theme)
├── hooks/                       useSettings — reads/writes localStorage preferences
├── lib/
│   ├── ai/
│   │   ├── engine.ts            The 5-signal prediction ensemble
│   │   └── patterns.ts          Turns raw model output into labeled badges
│   ├── supabase/                Client, server, and database query helpers
│   └── types.ts
└── proxy.ts                     Refreshes Supabase auth sessions on every request


## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).