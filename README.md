# Earnings IQ

Next.js app for earnings intelligence dashboards. Deployed on Vercel with Eve co-located via `withEve()`.

## Local development

Eve requires **Node.js 24+**. Use `.nvmrc` if you use nvm:

```bash
nvm use
npm install
cp .env.example .env.local
```

Start the app and Eve agent together:

```bash
npm run dev
```

`withEve()` in `next.config.ts` boots the Eve dev server alongside Next.js and proxies `/eve/v1/*` on the same origin. No second terminal needed.

Open [http://localhost:3000](http://localhost:3000) — GeniusAI chat is on the home page (`/#geniusai`).

## Environment variables

Copy `.env.example` to `.env.local` and fill in values. For Vercel deployments, set the same variables in the project dashboard.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | Supabase publishable key |
| `SUPABASE_URL` | Server | Same as above for server actions |
| `SUPABASE_PUBLISHABLE_KEY` | Server | Same as above for server actions |
| `AI_GATEWAY_API_KEY` | Recommended | Vercel AI Gateway API key — uses purchased AI Gateway credits |
| `VERCEL_AI_API_KEY` | Optional | Alias for `AI_GATEWAY_API_KEY` |
| `VERCEL_OIDC_TOKEN` | Optional | From `vercel env pull`; uses free monthly AI Gateway pool |
| `AI_SCORECARD_MODEL` | Optional | Model slug for scorecard + Eve agent, default `google/gemini-2.5-flash` |
| `AI_ANALYSIS_MODEL` | Optional | Model for earnings report generation, default `perplexity/sonar` then `google/gemini-2.5-flash` |

Legacy `VITE_SUPABASE_*` env vars still work as fallbacks.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Link and import the project:

```bash
npx vercel link
npx vercel env pull .env.local
```

3. Vercel detects **Next.js** automatically.
4. `withEve()` configures Eve as a co-located service at `/eve/v1/*` — no manual `vercel.json` routing needed.
5. Add environment variables in Project Settings.
6. Enable **AI Gateway** in project settings for LLM features (scorecard + Eve).

## Stack

- [Next.js](https://nextjs.org/) App Router + React 19
- [Supabase](https://supabase.com/)
- [Tailwind CSS v4](https://tailwindcss.com/) + shadcn/ui
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- [Vercel Eve](https://eve.dev/) — durable agent framework (`agent/` directory, `/eve/v1/*` routes)
