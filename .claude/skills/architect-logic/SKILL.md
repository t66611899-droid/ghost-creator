# Architect Logic — System Design Constraints

## Mandate

Ghost Creator is a **local-first, server-rendered, edge-deployable** video content platform.
Every architectural decision must survive a cold start with no external state.

---

## Stack Locks

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js App Router (16.x) | Server Components where possible |
| Runtime | Node.js edge-compatible | No native binaries in edge routes |
| 3D | Three.js + @react-three/fiber | `next/dynamic ssr: false` — mandatory |
| Animation | framer-motion v12 | Spring physics only — no easing |
| Styling | Tailwind CSS v4 | No inline style overrides for colors |
| State | React `useState` + `localStorage` | No external state store |
| Streaming | SSE (Server-Sent Events) | No WebSockets |
| Video proc | FFmpeg binary (local path) | `FFMPEG_PATH` env var |
| STT | Deepgram nova-2 REST | No SDK — raw fetch |
| LLM | OpenRouter (OpenAI-compat) | Model priority chain |

---

## API Route Rules

- All routes in `src/app/api/` export `maxDuration`
- Render routes: `maxDuration = 600` (FFmpeg can run 10 min)
- Strategy routes: `maxDuration = 120`
- SSE routes: always use `ReadableStream` with `text/event-stream`
- Never return `Buffer` directly — use `new Uint8Array(buffer)` in `NextResponse`

---

## File Boundary Rules

```
lib/           → pure logic, no Next.js imports
src/app/       → pages and API routes only
src/components/ → UI components, no API calls
src/types/     → TypeScript interfaces and enums only
scripts/       → one-shot test utilities, never imported
```

---

## 3D Loading Pattern (mandatory)

```typescript
// ALWAYS load R3F components this way — never import directly in a page
const MyScene = dynamic(() => import('@/components/3d/MyScene'), {
  ssr: false,
  loading: () => <div style={{ width, height }} />,
});
```

---

## Error Handling Hierarchy

1. **API routes**: catch → `NextResponse.json({ error: msg }, { status: 500 })`
2. **SSE streams**: emit `event: error\ndata: {...}\n\n` then close
3. **LLM calls**: try model chain → fallback plan (never throw to user)
4. **FFmpeg**: check exit code → parse stderr → surface in render response

---

## Forbidden Patterns

- `console.log` in production paths (use `console.error` for real errors)
- `any` type annotations in new code
- `React.ElementType` for icon props — use `React.ComponentType<{ className?: string }>`
- Hardcoded API keys anywhere except `.env.local`
- Synchronous `fs` calls in API routes
- `setTimeout` in React components (use `useEffect` + cleanup)
