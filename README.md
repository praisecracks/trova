# Trova — Escrow-by-Link Social Commerce

Trova is an escrow-by-link social commerce platform. Sellers create secure escrow
payment links, buyers track delivery progress in real time, and funds are released
only when the buyer confirms everything is right. Disputes are handled with a built-in
support chat and staff review.

## Features

- **Escrow-by-link**: Generate secure payment links for any product or service.
- **Buyer tracking page**: Public, shareable status page with live milestone updates.
- **Protected payments**: Funds are held in escrow and released on buyer confirmation.
- **Dispute resolution**: In-app support chat and staff review for problem orders.
- **Seller dashboard**: Manage links, transactions, storefront, and analytics.
- **Ratings**: Post-delivery buyer reviews for sellers.

## Tech Stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend / Data**: Supabase (Postgres + Realtime + Edge Functions) and a Go backend service
- **Auth / RLS**: Supabase Row Level Security

## Project Structure

```
frontend/      React app (Vite) — buyer tracking, seller dashboard, admin
backend/       Go backend service
supabase/      Migrations, RLS policies, edge functions
scripts/       Helper / build scripts
```

## Getting Started

### Prerequisites

- Node.js (18+)
- A Supabase project

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase values:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key-here
VITE_TROVA_PUBLIC_URL=https://your-domain
```

> The `.env` file is git-ignored and must never be committed.

### 3. Run the app locally

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

### 4. Apply database migrations

Use the Supabase CLI or run the SQL in `supabase/migrations/` against your project.

## Available Scripts

| Script                  | Description                                  |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Start the Vite dev server on port 3000      |
| `npm run build`         | Production build                             |
| `npm run preview`       | Preview the production build                 |
| `npm run lint`          | TypeScript typecheck (`tsc --noEmit`)        |
| `npm run test:transactions` | Run transaction service tests            |

## Security Notes

- The Supabase **anon/publishable** key is safe to expose in the browser by design.
- All data access is protected by **Row Level Security** policies — keep RLS enabled
  on every table and never expose the service-role key in the frontend.
- Keep the repo private until RLS is verified in production.

## License

Private — all rights reserved.
