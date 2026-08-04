import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { Database } from "@opencode-ai/core/database/database"
import { AppNodeBuilder } from "@opencode-ai/core/effect/app-node-builder"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { EventV2 } from "@opencode-ai/core/event"
import { Location } from "@opencode-ai/core/location"
import { ProjectV2 } from "@opencode-ai/core/project"
import { ProjectTable } from "@opencode-ai/core/project/sql"
import { AbsolutePath } from "@opencode-ai/core/schema"
import { SessionV2 } from "@opencode-ai/core/session"
import { SessionProjector } from "@opencode-ai/core/session/projector"
import { SessionExecution } from "@opencode-ai/core/session/execution"
import { SessionTable } from "@opencode-ai/core/session/sql"
import { SessionStore } from "@opencode-ai/core/session/store"
import { testEffect } from "./lib/effect"

const projects = Layer.succeed(
  ProjectV2.Service,
  ProjectV2.Service.of({
    resolve: (directory) => Effect.succeed({ id: ProjectV2.ID.global, directory }),
    directories: () => Effect.succeed([]),
    commit: () => Effect.void,
  }),
)

const it = testEffect(
  AppNodeBuilder.build(
    LayerNode.group([Database.node, EventV2.node, SessionProjector.node, SessionStore.node, SessionV2.node]),
    [
      [ProjectV2.node, projects],
      [SessionExecution.node, SessionExecution.noopLayer],
    ],
  ),
)

const location = Location.Ref.make({ directory: AbsolutePath.make("/project") })

describe("SessionV2.list", () => {
  it.effect("includes pinned sessions even when they are not in the most recent limit", () =>
    Effect.gen(function* () {
      const session = yield* SessionV2.Service
      const { db } = yield* Database.Service

      yield* db
        .insert(ProjectTable)
        .values({ id: ProjectV2.ID.global, worktree: location.directory, sandboxes: [] })
        .onConflictDoNothing()
        .run()
        .pipe(Effect.orDie)

      yield* db
        .insert(SessionTable)
        .values({
          id: SessionV2.ID.make("ses_list_pinned_old"),
          project_id: ProjectV2.ID.global,
          directory: location.directory,
          slug: "pinned-old",
          title: "Pinned Old",
          version: "test",
          metadata: { pinned: true },
          time_created: 100,
          time_updated: 100,
          cost: 0,
          tokens_input: 0,
          tokens_output: 0,
          tokens_cache_read: 0,
          tokens_cache_write: 0,
          tokens_reasoning: 0,
        })
        .run()
        .pipe(Effect.orDie)

      yield* db
        .insert(SessionTable)
        .values({
          id: SessionV2.ID.make("ses_list_recent_1"),
          project_id: ProjectV2.ID.global,
          directory: location.directory,
          slug: "recent-1",
          title: "Recent 1",
          version: "test",
          time_created: 200,
          time_updated: 200,
          cost: 0,
          tokens_input: 0,
          tokens_output: 0,
          tokens_cache_read: 0,
          tokens_cache_write: 0,
          tokens_reasoning: 0,
        })
        .run()
        .pipe(Effect.orDie)

      yield* db
        .insert(SessionTable)
        .values({
          id: SessionV2.ID.make("ses_list_recent_2"),
          project_id: ProjectV2.ID.global,
          directory: location.directory,
          slug: "recent-2",
          title: "Recent 2",
          version: "test",
          time_created: 300,
          time_updated: 300,
          cost: 0,
          tokens_input: 0,
          tokens_output: 0,
          tokens_cache_read: 0,
          tokens_cache_write: 0,
          tokens_reasoning: 0,
        })
        .run()
        .pipe(Effect.orDie)

      const rows = yield* session.list({ directory: location.directory, limit: 2 } as any)

      expect(rows).toHaveLength(2)
      expect(rows[0].id).toBe(SessionV2.ID.make("ses_list_pinned_old"))
      expect(rows[1].id).toBe(SessionV2.ID.make("ses_list_recent_2"))
    }),
  )

  it.effect("returns all pinned sessions regardless of limit", () =>
    Effect.gen(function* () {
      const session = yield* SessionV2.Service
      const { db } = yield* Database.Service

      yield* db
        .insert(ProjectTable)
        .values({ id: ProjectV2.ID.global, worktree: location.directory, sandboxes: [] })
        .onConflictDoNothing()
        .run()
        .pipe(Effect.orDie)

      yield* db
        .insert(SessionTable)
        .values({
          id: SessionV2.ID.make("ses_all_pin_1"),
          project_id: ProjectV2.ID.global,
          directory: location.directory,
          slug: "pinned-1",
          title: "Pinned 1",
          version: "test",
          metadata: { pinned: true },
          time_created: 100,
          time_updated: 100,
          cost: 0,
          tokens_input: 0,
          tokens_output: 0,
          tokens_cache_read: 0,
          tokens_cache_write: 0,
          tokens_reasoning: 0,
        })
        .run()
        .pipe(Effect.orDie)

      yield* db
        .insert(SessionTable)
        .values({
          id: SessionV2.ID.make("ses_all_pin_2"),
          project_id: ProjectV2.ID.global,
          directory: location.directory,
          slug: "pinned-2",
          title: "Pinned 2",
          version: "test",
          metadata: { pinned: true },
          time_created: 200,
          time_updated: 200,
          cost: 0,
          tokens_input: 0,
          tokens_output: 0,
          tokens_cache_read: 0,
          tokens_cache_write: 0,
          tokens_reasoning: 0,
        })
        .run()
        .pipe(Effect.orDie)

      yield* db
        .insert(SessionTable)
        .values({
          id: SessionV2.ID.make("ses_all_recent"),
          project_id: ProjectV2.ID.global,
          directory: location.directory,
          slug: "recent",
          title: "Recent",
          version: "test",
          time_created: 300,
          time_updated: 300,
          cost: 0,
          tokens_input: 0,
          tokens_output: 0,
          tokens_cache_read: 0,
          tokens_cache_write: 0,
          tokens_reasoning: 0,
        })
        .run()
        .pipe(Effect.orDie)

      const rows = yield* session.list({ directory: location.directory, limit: 2 } as any)

      expect(rows).toHaveLength(2)
      expect(rows[0].id).toBe(SessionV2.ID.make("ses_all_pin_1"))
      expect(rows[1].id).toBe(SessionV2.ID.make("ses_all_pin_2"))
    }),
  )

  it.effect("does not duplicate pinned sessions in results", () =>
    Effect.gen(function* () {
      const session = yield* SessionV2.Service
      const { db } = yield* Database.Service

      yield* db
        .insert(ProjectTable)
        .values({ id: ProjectV2.ID.global, worktree: location.directory, sandboxes: [] })
        .onConflictDoNothing()
        .run()
        .pipe(Effect.orDie)

      yield* db
        .insert(SessionTable)
        .values({
          id: SessionV2.ID.make("ses_dup_pinned"),
          project_id: ProjectV2.ID.global,
          directory: location.directory,
          slug: "pinned",
          title: "Pinned",
          version: "test",
          metadata: { pinned: true },
          time_created: 100,
          time_updated: 100,
          cost: 0,
          tokens_input: 0,
          tokens_output: 0,
          tokens_cache_read: 0,
          tokens_cache_write: 0,
          tokens_reasoning: 0,
        })
        .run()
        .pipe(Effect.orDie)

      yield* db
        .insert(SessionTable)
        .values({
          id: SessionV2.ID.make("ses_dup_recent"),
          project_id: ProjectV2.ID.global,
          directory: location.directory,
          slug: "recent",
          title: "Recent",
          version: "test",
          time_created: 200,
          time_updated: 200,
          cost: 0,
          tokens_input: 0,
          tokens_output: 0,
          tokens_cache_read: 0,
          tokens_cache_write: 0,
          tokens_reasoning: 0,
        })
        .run()
        .pipe(Effect.orDie)

      const rows = yield* session.list({ directory: location.directory, limit: 5 } as any)

      expect(rows).toHaveLength(2)
      expect(rows.filter((r) => r.id === SessionV2.ID.make("ses_dup_pinned"))).toHaveLength(1)
    }),
  )
})
