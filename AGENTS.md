# Earnings IQ

Project conventions for AI agents working in this repo.

- **Framework**: TanStack Start with Nitro for Vercel deployment
- **Package manager**: npm
- **Path alias**: `@/*` maps to `src/*`
- **Server functions**: Use `createServerFn` from `@tanstack/react-start`
- **LLM calls**: Route through `src/lib/ai-gateway.ts` (Vercel AI Gateway)
- **Eve agent**: Files under `agent/`; chat UI at `/chat` via `useEveAgent` from `eve/react`
- **Do not** reintroduce `@lovable.dev/*` packages or Lovable-specific tooling
