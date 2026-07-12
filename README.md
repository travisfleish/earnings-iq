# Earnings IQ

TanStack Start app for earnings intelligence dashboards. Deployed on Vercel with Nitro and Supabase.

## Local development

Eve requires **Node.js 24+**. Use `.nvmrc` if you use nvm:

```bash
nvm use
npm install
cp .env.example .env.local
```

Run the app and Eve agent in **two terminals**:

```bash
# Terminal 1 — TanStack Start app
npm run dev

# Terminal 2 — Eve agent (same-origin /eve/v1/* proxied in dev)
npm run dev:eve
```

Open [http://localhost:5173/chat](http://localhost:5173/chat) for the Eve earnings assistant.

## Environment variables

Copy `.env.example` to `.env.local` and fill in values. For Vercel deployments, set the same variables in the project dashboard.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key |
| `SUPABASE_URL` | Server | Same as above for SSR/server functions |
| `SUPABASE_PUBLISHABLE_KEY` | Server | Same as above for SSR/server functions |
| `AI_GATEWAY_API_KEY` | Optional | Vercel AI Gateway API key (local/CI) |
| `VERCEL_OIDC_TOKEN` | Optional | Auto-provisioned via `vercel env pull` |
| `AI_SCORECARD_MODEL` | Optional | Model slug for scorecard + Eve agent, default `google/gemini-2.5-flash` |
| `EVE_BASE_URL` | Optional | Eve dev server origin (default `http://127.0.0.1:4274` in development) |

## Deploy to Vercel

1. Push this repo to GitHub.
2. Link and import the project:

```bash
npx vercel link
npx vercel env pull .env.local
```

3. Vercel detects **TanStack Start** automatically (requires the Nitro Vite plugin in `vite.config.ts`).
4. `vercel.json` mounts the Eve agent as a co-located service at `/eve/v1/*`.
5. Add environment variables in Project Settings.
6. Enable **AI Gateway** in project settings for LLM features (scorecard + Eve).

For local AI Gateway auth:

```bash
vercel link
vercel env pull .env.local
```

## Stack

- [TanStack Start](https://tanstack.com/start) + React 19
- [Nitro](https://nitro.build/) (Vercel preset)
- [Supabase](https://supabase.com/)
- [Tailwind CSS v4](https://tailwindcss.com/) + shadcn/ui
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- [Vercel Eve](https://eve.dev/) — durable agent framework (`agent/` directory, `/eve/v1/*` routes)
