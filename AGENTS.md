# Earnings IQ

Project conventions for AI agents working in this repo.

- **Framework**: Next.js App Router with `withEve()` from `eve/next`
- **Package manager**: npm
- **Path alias**: `@/*` maps to `src/*`
- **Server actions**: Use `"use server"` in `src/lib/actions.ts` (or dedicated action modules)
- **LLM calls**: Route through `src/lib/ai-gateway.ts` (Vercel AI Gateway)
- **Eve agent**: Files under `agent/`; chat UI via `useEveAgent` from `eve/react` (same-origin `/eve/v1/*`)
- **Do not** reintroduce `@lovable.dev/*` packages or Lovable-specific tooling
