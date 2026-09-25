# AGENTS.md Hierarchy Plan

## Tree

```
packages/
├── AGENTS.md                              ← NEW: Root package conventions
├── core/
│   ├── AGENTS.md                          ← NEW: Core library conventions
│   └── src/
│       └── tool/
│           └── AGENTS.md                  ← EXISTING: Core tool architecture
├── schema/
│   └── AGENTS.md                          ← EXISTING: Schema package guide
├── protocol/
│   └── AGENTS.md                          ← NEW: Protocol/HttpApi conventions
├── server/
│   └── AGENTS.md                          ← NEW: Server conventions
├── llm/
│   └── AGENTS.md                          ← EXISTING: LLM package guide
├── opencode/
│   ├── AGENTS.md                          ← EXISTING: opencode TUI/app specifics
│   ├── src/
│   │   ├── session/
│   │   │   └── llm/
│   │   │       └── AGENTS.md              ← EXISTING: Session LLM runtime boundaries
│   │   └── server/
│   │       └── routes/
│   │           └── instance/
│   │               └── httpapi/
│   │                   └── AGENTS.md      ← EXISTING: HttpApi route patterns
│   └── test/
│       ├── AGENTS.md                      ← EXISTING: Test fixtures guide
│       └── server/
│           └── AGENTS.md                  ← EXISTING: Server test guide
├── tui/
│   └── AGENTS.md                          ← NEW: TUI/React/Ink/Solid specifics
├── cli/
│   └── AGENTS.md                          ← NEW: CLI entrypoint conventions
├── app/
│   ├── AGENTS.md                          ← EXISTING: Web app conventions
│   └── e2e/
│       └── performance/
│           └── AGENTS.md                  ← EXISTING: Performance testing
├── desktop/
│   └── AGENTS.md                          ← EXISTING: Desktop/Electron conventions
├── sdk/
│   └── AGENTS.md                          ← NEW: Legacy JS SDK conventions
├── sdk-next/
│   └── AGENTS.md                          ← NEW: New SDK composition conventions
├── client/
│   └── AGENTS.md                          ← NEW: Generated client conventions
├── plugin/
│   └── AGENTS.md                          ← NEW: Plugin system v2 conventions
├── codemode/
│   └── AGENTS.md                          ← EXISTING: CodeMode sandbox conventions
├── effect-drizzle-sqlite/
│   └── AGENTS.md                          ← EXISTING: Generic Drizzle adapter
├── console/
│   └── AGENTS.md                          ← NEW: Console app conventions
├── enterprise/
│   └── AGENTS.md                          ← NEW: Enterprise features conventions
├── ui/
│   └── AGENTS.md                          ← NEW: Shared SolidJS UI components
├── session-ui/
│   └── AGENTS.md                          ← NEW: Session-specific UI components
├── stats/
│   └── AGENTS.md                          ← EXISTING: Stats site dev command
├── slack/
│   └── AGENTS.md                          ← NEW: Slack integration conventions
├── script/
│   └── AGENTS.md                          ← NEW: Shared scripts conventions
├── http-recorder/
│   └── AGENTS.md                          ← NEW: HTTP recorder conventions
├── httpapi-codegen/
│   └── AGENTS.md                          ← NEW: HTTP API codegen conventions
├── storybook/
│   └── AGENTS.md                          ← NEW: Storybook conventions
└── web/
    └── AGENTS.md                          ← NEW: Web landing page conventions
```

---

## Details

### packages/AGENTS.md
**Purpose**: Monorepo-wide package conventions — build, test, typecheck commands, dependency direction, catalog usage, workspace scripts  
**Parent**: `../../AGENTS.md`  
**Key Instructions**:
- Build: `bun run build` from package root (or `bun turbo build` for all)
- Test: `bun test` from package dir (never from repo root — guard exists)
- Typecheck: `bun typecheck` from package dir (uses `tsgo --noEmit`)
- Dependency direction: Schema → Protocol → Server → Core → opencode/app/desktop
- Client runtime (sdk, sdk-next, client) may depend on Schema/Protocol only, never Core/Server
- Use workspace:* for internal deps; catalog for shared external deps
- Branch names: short, hyphenated, max 3 words (e.g., `session-recovery`)
- Commits: conventional `type(scope): summary` (scopes: core, opencode, tui, app, desktop, sdk, plugin)
- Effect v4 patterns: `Effect.gen`, `Effect.fn`, `Effect.void`, prefer services over ad-hoc platform APIs
- Drizzle schemas: snake_case fields, no explicit column names

---

### packages/core/AGENTS.md
**Purpose**: Core library conventions — Effect services, database, session runner, system context, module shape  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Module shape: flat exports + self-reexport (`export * as Foo from "./foo"`), no barrel `index.ts` in multi-sibling dirs
- Effect services: `makeRuntime` for shared services, `InstanceState` for per-directory/project state
- Database: Drizzle schema in `src/**/*.sql.ts`, migrations in `packages/core`, applied by core
- Use `#sqlite`, `#pty`, `#fff` imports for platform-specific implementations
- Test: `bun test --only-failures` (from `packages/core`)
- Typecheck: `tsgo --noEmit`
- Effect v4: `Effect.forkIn(scope)`, no `Effect.fork`/`forkDaemon`
- Prefer `FileSystem.FileSystem`, `HttpClient.HttpClient`, `ChildProcessSpawner` over raw APIs
- `Effect.cached` for deduplication, `EffectBridge` for external callbacks

---

### packages/core/src/tool/AGENTS.md
**Purpose**: Core tool architecture — canonical tool representation, registration, permissions, output bounding  
**Parent**: `../../AGENTS.md`  
**Key Instructions**:
- Single canonical `Tool.make({ description, input, output, execute, toModelOutput })` type
- Registration: `Tools.Service.register` (built-ins), `ApplicationTools.Service.register` (app tools)
- Location-scoped registry overlays application tools; latest same-placement wins
- Registry has no `PermissionV2.Service` dependency — filtering ≠ authorization
- Output: `ToolRegistry.Materialization.settle` is the only execution/bounding boundary
- Gaps: plugin boot, MCP, Session-scoped registrations not yet redesigned

---

### packages/schema/AGENTS.md
**Purpose**: Schema package guide — browser-safe wire/storage contracts, V1/V2 coexistence, module shape  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Dependency direction: `@opencode-ai/schema` ← `@opencode-ai/protocol` ← `@opencode-ai/server`
- Current contracts unversioned; legacy explicitly `V1` under `src/v1/`
- Remove `V2` from current names as contracts normalize
- Events: classify by protocol role (`current`, `shared transitional`, `V1-only`)
- Module shape: one canonical export per contract, namespace projection (`export * as SessionMessage from "./session-message"`)
- Optional fields: use package `optional(...)` helper so encoded objects omit `undefined`
- Public types: same-name interfaces for `Schema.Struct` records
- IDs: `create()` constructors, validate exact prefix including underscore
- Tests for contract changes: cover optional omission, no `Schema.Any`, stable identifiers, facade identity

---

### packages/protocol/AGENTS.md
**Purpose**: Protocol/HttpApi conventions — route groups, SSE, WebSocket, middleware, error contracts  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Use `HttpApiBuilder.group(...)` for all declared endpoints (including SSE)
- SSE: return `HttpServerResponse.stream(...)`, annotate with `HttpApiSchema.asText({ contentType: "text/event-stream" })`
- WebSocket/Raw: `HttpApiBuilder.group` with `handleRaw(...)`
- Avoid `Effect.provide` in handlers — provide stable layers at assembly boundary
- Use `Effect.provideService` in middleware only for request-derived context
- Public JSON errors: explicit `Schema.ErrorClass` per endpoint; translate domain errors at handler boundary
- Middleware: declare on owning `HttpApiGroup`, provide implementation at `server.ts` assembly

---

### packages/server/AGENTS.md
**Purpose**: Server conventions — HttpApi assembly, middleware order, database, WebSocket, static fallback  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Assemble HttpApi groups in `server.ts` with correct middleware order
- Middleware: `InstanceContextMiddleware` → `WorkspaceRoutingMiddleware` → route groups
- Use `NodeHttpServer.layer` for Effect HTTP stack; avoid `Bun.serve` unless Bun-specific
- Database: depends on core migrations; use core's `#sqlite` import
- Static/UI fallback: raw `HttpRouter.use` only for catch-all outside declared API
- Typecheck: `tsgo --noEmit`

---

### packages/llm/AGENTS.md
**Purpose**: LLM package guide — Effect patterns, provider facades, route composition, recording tests  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Effect: prefer `HttpClient`/`Stream` over `fetch`/async generators; Schema codecs for JSON
- Constructors: per-type on the type (`Message.system()`, `Model.make()`, `ToolDefinition.make()`)
- Top-level `LLM` namespace reserved for request APIs (`LLM.request`, `LLM.stream`, `LLM.generate`)
- Route = Protocol + Endpoint + Auth + Framing composed via `Route.make(...)`
- Provider facades: small, explicit `.configure()` before model selection
- Protocol files: self-similar section order (input → body schema → event schema → parser → construction → parsing → route)
- Tests: `testEffect(...)`, fixture-first provider tests behind `RECORD=true`
- Recording: one cassette per scenario, `recordedTests({ prefix, requires })`, pretty-printed JSON

---

### packages/opencode/AGENTS.md
**Purpose**: opencode TUI application — dev server, module shape, Effect rules, database guide  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Dev server: `tmux new-session -d -s opencode-dev 'bun dev'` (non-blocking)
- Capture output: `tmux capture-pane -pt opencode-dev`
- Module shape: flat exports + self-reexport, no barrel `index.ts` in multi-sibling dirs
- Effect rules: `Effect.gen`, `Effect.fn`, `Effect.void`, `makeRuntime`/`InstanceState`
- Schemas: `Schema.Class`, branded `Schema.brand`, `Schema.TaggedErrorClass`, `Schema.Defect`
- Direct error yield: `yield* new MyError(...)` over `Effect.fail(new MyError(...))`
- `Effect.cached` for deduplication, `EffectBridge` for external callbacks
- Database: schema in `packages/core/src/**/*.sql.ts`, migrations in `packages/core`

---

### packages/opencode/src/session/llm/AGENTS.md
**Purpose**: Session LLM runtime boundaries — adapter layer between session orchestration and llm package  
**Parent**: `../../../AGENTS.md`  
**Key Instructions**:
- `../llm.ts` owns session concerns (auth, config, plugins, permissions, telemetry, runtime selection)
- Adapters: `ai-sdk.ts` (AI SDK → LLMEvent), `native-request.ts` (session input → LLMRequest), `native-runtime.ts` (native gate, tool bridge, LLMClient handoff)
- Integration: `llm.ts` imports `LLMClient` from `@opencode-ai/llm/route`; native path only calls it directly
- Runtime selection: per-request gate, AI SDK default, native opt-in via `OPENCODE_EXPERIMENTAL_NATIVE_LLM`
- Native supports: OpenAI, OpenAI-compatible, Anthropic API-key; falls back for OAuth/missing keys
- Keep session services out of `native-request.ts`; pass normalized data via `RequestInput`

---

### packages/opencode/src/server/routes/instance/httpapi/AGENTS.md
**Purpose**: HttpApi route patterns for instance-scoped endpoints  
**Parent**: `../../../../../AGENTS.md`  
**Key Instructions**:
- Use `HttpApiBuilder.group` for normal + SSE endpoints; yield services once at layer construction
- SSE: `HttpServerResponse.stream`, annotate with `HttpApiSchema.asText({ contentType: "text/event-stream" })`
- Raw/WebSocket: `HttpApiBuilder.group` with `handleRaw`
- Avoid `Effect.provide` in handlers; stable layers at assembly boundary
- Public errors: explicit `Schema.ErrorClass` per endpoint; translate domain errors at boundary
- Middleware: declare on owning group, provide at assembly

---

### packages/opencode/test/AGENTS.md
**Purpose**: Test fixtures and Effect testing patterns  
**Parent**: `../../AGENTS.md`  
**Key Instructions**:
- `tmpdir` fixture: temp dirs with auto-cleanup, options for git, config, custom init/dispose
- `testEffect(Layer)` for Effect tests; `it.effect` (TestClock), `it.live` (real OS), `it.instance` (scoped temp dir)
- Effect fixtures: `tmpdirScoped`, `provideInstance`, `provideTmpdirInstance`, `provideTmpdirServer`
- Partial stubs: `Layer.mock` over hand-rolled `Layer.succeed`
- Synchronization: wait on published signals (`pollWithTimeout`, `SessionStatus`, `BackgroundJob.wait`, `Deferred`), not `Effect.sleep`
- Fixed sleeps OK only for debounce/throttle tests, mtime boundaries, intentional race-regression

---

### packages/opencode/test/server/AGENTS.md
**Purpose**: Server/HttpApi middleware test patterns  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Focused middleware tests with tiny fake routes over full API trees
- `testEffect` + `NodeHttpServer.layerTest` for primary in-test server
- Tiny `HttpApiBuilder` probe groups declaring typed middleware under test
- Declare middleware in production order (e.g., `InstanceContextMiddleware` → `WorkspaceRoutingMiddleware`)
- Secondary upstream servers: `NodeHttpServer.layer` + `Layer.build`
- WebSocket: `Socket.makeWebSocket` from test client
- Scoped layers for flags/db reset; restore in finalizers
- `tmpdirScoped({ git: true })` + `Project.use.fromDirectory(dir)` for project-backed requests

---

### packages/tui/AGENTS.md
**Purpose**: TUI conventions — React/Ink/Solid components, opentui integration, keymap, plugin slots  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Framework: SolidJS + `@opentui/core`/`@opentui/solid`/`@opentui/keymap`
- Context system: `src/context/*.tsx` for runtime, project, theme, editor, sync, sdk, args, kv, clipboard
- Plugin runtime: `src/plugin/runtime.tsx` + `src/plugin/slots.tsx` for extension points
- Keymap: `src/keymap.tsx` + `src/config/keybind.ts` for bindings
- Components: `src/component/`, `src/ui/` for dialogs, spinners, toasts
- Test: `bun test --timeout 30000 --only-failures`
- Typecheck: `tsgo --noEmit`
- Dependencies: core, plugin, sdk, ui (workspace), opentui (catalog)

---

### packages/cli/AGENTS.md
**Purpose**: CLI entrypoint conventions — bin script, build, dev, dependencies  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Bin entry: `bin/lildax.cjs` (compiled from `script/build.ts`)
- Dev: `bun run src/index.ts` (direct TS execution)
- Build: `bun run script/build.ts` (bundles to `bin/`)
- Dependencies: core, sdk, server, tui (workspace), `@opentui/*`, `@effect/platform-node` (catalog)
- Typecheck: `tsgo --noEmit`
- No test script (integration tested via opencode)

---

### packages/app/AGENTS.md
**Purpose**: Web app conventions — SolidJS/Vite, local dev, browser automation, priorities  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Priorities: stability → simplicity → performance; benchmark before changing session/timeline
- Debugging: NEVER restart app or server process
- Local dev: backend (`packages/opencode` serve --port 4096) + app (`packages/app` dev --port 4444) separately
- SolidJS: prefer `createStore` over multiple `createSignal`
- Browser automation: `agent-browser` (open, snapshot -i, click/fill via refs)
- Test: `bun test` (unit + browser), Playwright for e2e
- Typecheck: `tsgo -b` (project references), `tsgo -p e2e/tsconfig.json` for e2e

---

### packages/app/e2e/performance/AGENTS.md
**Purpose**: Performance testing conventions — stability, traces, benchmarks  
**Parent**: `../../AGENTS.md`  
**Key Instructions**:
- Prioritize stability → simplicity → measurement overhead
- Playwright for scenario control; Chrome Performance traces for profiling
- Electron `contentTracing` for multi-process profiling
- Custom probes only for product-specific measurements
- Run benchmarks serially, against production builds
- Detailed profiling opt-in; preserve raw diagnostic data
- No machine-dependent thresholds; assert completion + metric collection only
- Keep normal test discovery free of manual benchmarks

---

### packages/desktop/AGENTS.md
**Purpose**: Desktop/Electron conventions — main/renderer IPC, build, packaging  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Renderer: only call `window.api` from `src/preload`
- Main: register IPC handlers in `src/main/ipc.ts`
- Dev: `bun run scripts/predev.ts` then `electron-vite dev`
- Build: `bun run scripts/prebuild.ts` then `electron-vite build`
- Package: `electron-builder` with config (mac/win/linux)
- Typecheck: `tsgo -b` (project references)
- Dependencies: app, ui (workspace), Electron, electron-builder, electron-vite

---

### packages/sdk/AGENTS.md
**Purpose**: Legacy JavaScript SDK conventions — OpenAPI generation, build, exports  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Regenerate: `./packages/sdk/js/script/build.ts` (from repo root)
- Build: `bun ./script/build.ts` (outputs to `dist/`)
- Exports: main, client, server, v2, v2/client, v2/gen/client, v2/server, v2/types
- Typecheck: `tsgo --noEmit`
- Test: `bun test`
- Dependencies: cross-spawn (prod), @hey-api/openapi-ts (dev)

---

### packages/sdk-next/AGENTS.md
**Purpose**: New SDK composition conventions — composes Client, Core, Server  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Composes `@opencode-ai/client`, `@opencode-ai/core`, `@opencode-ai/server`
- Single export: `./src/index.ts`
- Test: `bun test --timeout 5000`
- Typecheck: `tsgo --noEmit`
- Client runtime may depend on Schema/Protocol but never Core/Server directly
- Effect peer dependency (optional)

---

### packages/client/AGENTS.md
**Purpose**: Generated client conventions — HttpApi codegen, generated files, testing  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Generate: `bun run generate` from `packages/client` after Protocol/Server HttpApi changes
- Do NOT edit `src/generated` or `src/generated-effect` directly
- Check: `bun run check:generated` (generate + git diff --exit-code)
- Test: `bun test --timeout 5000`
- Typecheck: `tsgo --noEmit`
- Exports: main (`./src/index.ts`), effect (`./src/effect.ts`)
- Peer dep: effect (optional)

---

### packages/plugin/AGENTS.md
**Purpose**: Plugin system v2 conventions — Effect integration, tool/TUI extensions, peer deps  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- v2 Effect-based: `src/v2/effect/` for integration, plugin, effect runtime
- v2 Promise-based: `src/v2/promise/` for non-Effect consumers
- Exports: main, tool, tui, v2/effect, v2/effect/integration, v2/effect/plugin, v2/promise
- Build: `tsc` (outputs to `dist/`)
- Peer deps: `@opentui/core/keymap/solid` (optional)
- Typecheck: `tsgo --noEmit`

---

### packages/codemode/AGENTS.md
**Purpose**: CodeMode sandbox conventions — confined execution, OpenAPI, host boundaries  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Owns confined execution over schema-described tools; host owns auth/persistence/external authority
- No speculative generic permission policy; host omits unexposed tools
- Keep unaware of host session/channel/conversation models
- Tool schemas = model-facing interface; minimal natural arguments
- OpenAPI: generate only when transport supported; skip with precise reason
- Never guess parameter serialization; fail closed on malformed security
- Network reads bounded; map failures to model-safe `ToolError`

---

### packages/effect-drizzle-sqlite/AGENTS.md
**Purpose**: Generic Drizzle/Effect/SQLite adapter — no opencode specifics  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Keep generic: Drizzle + Effect + SQLite only
- No opencode tables, paths, migrations, hooks, or domain storage APIs
- Depend on generic `effect/unstable/sql/SqlClient`, not specific driver
- Concrete drivers (`@effect/sql-sqlite-bun`) in tests/examples only
- Preserve Drizzle adapter naming for upstream replacement compatibility
- Verify against `drizzle-orm@1.0.0-rc.2` and `/Users/kit/code/open-source/effect-smol`

---

### packages/console/AGENTS.md
**Purpose**: Console app conventions — multi-subpackage (app, core, function, mail, resource, support)  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Subpackages: `app` (SolidStart), `core` (DB/migrations), `function` (Cloudflare Workers), `mail`, `resource`, `support`
- App dev: `vite dev` or `bun sst shell --stage=dev bun dev` for remote
- Build: `bun script/generate-sitemap.ts && vite build && bun ../../opencode/script/schema.ts`
- Core: migrations in `core/migrations`, Drizzle schema
- Typecheck: `tsgo --noEmit` per subpackage

---

### packages/enterprise/AGENTS.md
**Purpose**: Enterprise features conventions — Hono/Cloudflare, auth, billing  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Framework: Hono + Cloudflare Workers + SolidJS
- Auth: `@openauthjs/openauth`, Stripe for billing
- Dev: `bun dev` (Vite), `bun sst shell` for remote
- Build: `vite build`
- Test: `bun test` (unit), Playwright for e2e
- Typecheck: `tsgo --noEmit`

---

### packages/ui/AGENTS.md
**Purpose**: Shared SolidJS UI components — primitives, theme, storybook  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Components: `src/components/`, `src/context/`, `src/hooks/`, `src/theme/`, `src/styles/`
- SolidJS primitives: `@kobalte/core`, `@pierre/trees`, `@solid-primitives/*`
- TailwindCSS + `@tailwindcss/vite`
- Storybook: `src/storybook/` for component stories
- Typecheck: `tsgo --noEmit`
- Build: `vite build` (if published)
- Dependencies: solid-js, effect (catalog), UI primitives (catalog)

---

### packages/session-ui/AGENTS.md
**Purpose**: Session-specific UI components — v2 session integration, components  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Components: `src/components/`, `src/context/`, `src/v2/` for session v2 integration
- Dependencies: ui, core, schema, sdk, session-ui (workspace), SolidJS primitives (catalog)
- Typecheck: `tsgo --noEmit`

---

### packages/stats/AGENTS.md
**Purpose**: Stats site dev command  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Start locally: `bun dev:stats` from repo root

---

### packages/slack/AGENTS.md
**Purpose**: Slack integration conventions — Bolt, Cloudflare Workers  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Framework: `@slack/bolt` + Cloudflare Workers
- Dependencies: core, schema (workspace), Slack SDK (catalog)
- Typecheck: `tsgo --noEmit`

---

### packages/script/AGENTS.md
**Purpose**: Shared scripts conventions — build utilities, schema generation, migrations  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Exports: build scripts, schema generation, migration utilities
- Used by: sdk (build), opencode (schema), desktop (predev/prebuild), console (schema)
- Typecheck: `tsgo --noEmit`

---

### packages/http-recorder/AGENTS.md
**Purpose**: HTTP recorder conventions — cassette recording/replay for provider tests  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Used by llm package for recorded provider tests
- Cassettes: pretty-printed JSON, one per scenario
- Binary bodies: base64 with `bodyEncoding: "base64"`
- Matching: sequential cursor, validate method/URL/headers/body

---

### packages/httpapi-codegen/AGENTS.md
**Purpose**: HTTP API codegen conventions — generates client from HttpApi  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Used by client package `generate` script
- Generates `src/generated` and `src/generated-effect`
- Typecheck: `tsgo --noEmit`

---

### packages/storybook/AGENTS.md
**Purpose**: Storybook conventions — component documentation, visual testing  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Framework: Storybook + SolidJS + Vite
- Mocks: `.storybook/mocks/`
- Dev: `bun storybook`
- Typecheck: `tsgo --noEmit`

---

### packages/web/AGENTS.md
**Purpose**: Web landing page conventions — Astro, content, i18n  
**Parent**: `../AGENTS.md`  
**Key Instructions**:
- Framework: Astro + SolidJS islands
- Content: `src/content/`, i18n in `src/i18n/`
- Components: `src/components/`, styles in `src/styles/`
- Typecheck: `tsgo --noEmit`
- Dev: `bun dev` (Astro)

---

## Migration Steps

### Phase 1: Create Root & Core Infrastructure AGENTS.md
1. **Create `packages/AGENTS.md`** — Root package conventions (parent: `../../AGENTS.md`)
2. **Create `packages/core/AGENTS.md`** — Core library conventions (parent: `../AGENTS.md`)
3. **Create `packages/protocol/AGENTS.md`** — Protocol conventions (parent: `../AGENTS.md`)
4. **Create `packages/server/AGENTS.md`** — Server conventions (parent: `../AGENTS.md`)

### Phase 2: Create Application Layer AGENTS.md
5. **Create `packages/tui/AGENTS.md`** — TUI conventions (parent: `../AGENTS.md`)
6. **Create `packages/cli/AGENTS.md`** — CLI conventions (parent: `../AGENTS.md`)
7. **Create `packages/sdk/AGENTS.md`** — Legacy SDK conventions (parent: `../AGENTS.md`)
8. **Create `packages/sdk-next/AGENTS.md`** — New SDK conventions (parent: `../AGENTS.md`)
9. **Create `packages/client/AGENTS.md`** — Generated client conventions (parent: `../AGENTS.md`)
10. **Create `packages/plugin/AGENTS.md`** — Plugin v2 conventions (parent: `../AGENTS.md`)

### Phase 3: Create Supporting Package AGENTS.md
11. **Create `packages/console/AGENTS.md`** — Console app conventions (parent: `../AGENTS.md`)
12. **Create `packages/enterprise/AGENTS.md`** — Enterprise conventions (parent: `../AGENTS.md`)
13. **Create `packages/ui/AGENTS.md`** — Shared UI conventions (parent: `../AGENTS.md`)
14. **Create `packages/session-ui/AGENTS.md`** — Session UI conventions (parent: `../AGENTS.md`)
15. **Create `packages/slack/AGENTS.md`** — Slack integration conventions (parent: `../AGENTS.md`)
16. **Create `packages/script/AGENTS.md`** — Shared scripts conventions (parent: `../AGENTS.md`)
17. **Create `packages/http-recorder/AGENTS.md`** — HTTP recorder conventions (parent: `../AGENTS.md`)
18. **Create `packages/httpapi-codegen/AGENTS.md`** — HTTP API codegen conventions (parent: `../AGENTS.md`)
19. **Create `packages/storybook/AGENTS.md`** — Storybook conventions (parent: `../AGENTS.md`)
20. **Create `packages/web/AGENTS.md`** — Web landing page conventions (parent: `../AGENTS.md`)

### Phase 4: Verify Existing Files Have Correct Parent Links
21. **Update `packages/schema/AGENTS.md`** — Add `Parent: ../AGENTS.md` at top
22. **Update `packages/llm/AGENTS.md`** — Add `Parent: ../AGENTS.md` at top
23. **Update `packages/opencode/AGENTS.md`** — Add `Parent: ../AGENTS.md` at top
24. **Update `packages/opencode/src/session/llm/AGENTS.md`** — Verify parent: `../../../AGENTS.md`
25. **Update `packages/opencode/src/server/routes/instance/httpapi/AGENTS.md`** — Verify parent: `../../../../../AGENTS.md`
26. **Update `packages/opencode/test/AGENTS.md`** — Add `Parent: ../../AGENTS.md` at top
27. **Update `packages/opencode/test/server/AGENTS.md`** — Add `Parent: ../AGENTS.md` at top
28. **Update `packages/core/src/tool/AGENTS.md`** — Verify parent: `../../AGENTS.md`
29. **Update `packages/app/AGENTS.md`** — Add `Parent: ../AGENTS.md` at top
30. **Update `packages/app/e2e/performance/AGENTS.md`** — Add `Parent: ../../AGENTS.md` at top
31. **Update `packages/desktop/AGENTS.md`** — Add `Parent: ../AGENTS.md` at top
32. **Update `packages/codemode/AGENTS.md`** — Add `Parent: ../AGENTS.md` at top
33. **Update `packages/effect-drizzle-sqlite/AGENTS.md`** — Add `Parent: ../AGENTS.md` at top
34. **Update `packages/stats/AGENTS.md`** — Add `Parent: ../AGENTS.md` at top

---

## Notes

- **Total new files**: 20
- **Total existing files to update**: 14
- **Files intentionally NOT created**: `packages/containers`, `packages/docs`, `packages/function`, `packages/http-recorder` (already covered), `packages/identity`, `packages/effect-sqlite-node` — these either have no divergent conventions or are implementation details of parent packages
- Each AGENTS.md must start with a `Parent: <relative-path>` line linking to its parent
- The root `packages/AGENTS.md` links to global: `Parent: ../../AGENTS.md`
- Subdirectory AGENTS.md (e.g., `core/src/tool/`) link to their package root AGENTS.md