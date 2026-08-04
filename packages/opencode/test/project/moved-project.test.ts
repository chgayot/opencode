import { describe, expect } from "bun:test"
import { Project } from "@/project/project"
import { Database } from "@opencode-ai/core/database/database"
import { eq } from "drizzle-orm"
import { SessionTable } from "@opencode-ai/core/session/sql"
import { ProjectTable } from "@opencode-ai/core/project/sql"
import { AbsolutePath } from "@opencode-ai/core/schema"
import { ProjectV2 } from "@opencode-ai/core/project"
import { SessionID } from "../../src/session/schema"
import { $ } from "bun"
import fs from "node:fs/promises"
import path from "node:path"
import { tmpdirScoped } from "../fixture/fixture"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { CrossSpawnSpawner } from "@opencode-ai/core/cross-spawn-spawner"
import { Effect } from "effect"
import { testEffect } from "../lib/effect"

const it = testEffect(LayerNode.compile(LayerNode.group([Project.node, Database.node, CrossSpawnSpawner.node])))

function sessionID() {
  return `ses_${crypto.randomUUID()}` as SessionID
}

function seed(opts: { id: SessionID; dir: string; project: ProjectV2.ID }) {
  const now = Date.now()
  return Database.Service.use(({ db }) =>
    db
      .insert(SessionTable)
      .values({
        id: opts.id,
        project_id: opts.project,
        slug: opts.id,
        directory: opts.dir,
        title: "test",
        version: "0.0.0-test",
        time_created: now,
        time_updated: now,
      })
      .run()
      .pipe(Effect.orDie),
  )
}

function directory(id: SessionID) {
  return Database.Service.use(({ db }) =>
    db
      .select({ directory: SessionTable.directory })
      .from(SessionTable)
      .where(eq(SessionTable.id, id))
      .get()
      .pipe(Effect.orDie, Effect.map((row) => row?.directory)),
  )
}

async function gitInit(dir: string) {
  await fs.mkdir(dir, { recursive: true })
  await $`git init`.cwd(dir).quiet()
  await $`git config user.name "Test"`.cwd(dir).quiet()
  await $`git config user.email "test@opencode.test"`.cwd(dir).quiet()
  await $`git config commit.gpgsign false`.cwd(dir).quiet()
  await $`git commit --allow-empty -m "root"`.cwd(dir).quiet()
}

describe("moved project", () => {
  it.live("repairs worktree and session directories when the checkout moved", () =>
    Effect.gen(function* () {
      const tmp = yield* tmpdirScoped()
      const oldDir = path.join(tmp, "repo")
      const newDir = path.join(tmp, "repo-moved")
      yield* Effect.promise(() => gitInit(oldDir))

      const projects = yield* Project.Service
      const { project } = yield* projects.fromDirectory(oldDir)
      expect(project.id).not.toBe(ProjectV2.ID.global)
      expect(project.worktree).toBe(oldDir)

      const root = sessionID()
      const nested = sessionID()
      yield* seed({ id: root, dir: oldDir, project: project.id })
      yield* seed({ id: nested, dir: path.join(oldDir, "sub"), project: project.id })

      yield* Effect.promise(() => fs.rename(oldDir, newDir))

      const { project: moved } = yield* projects.fromDirectory(newDir)
      expect(moved.id).toBe(project.id)
      expect(moved.worktree).toBe(newDir)
      expect(moved.sandboxes).not.toContain(newDir)

      expect(yield* directory(root)).toBe(newDir)
      expect(yield* directory(nested)).toBe(path.join(newDir, "sub"))
    }),
  )

  it.live("does not rewrite sessions of other projects", () =>
    Effect.gen(function* () {
      const tmp = yield* tmpdirScoped()
      const oldDir = path.join(tmp, "repo")
      const newDir = path.join(tmp, "repo-moved")
      yield* Effect.promise(() => gitInit(oldDir))

      const projects = yield* Project.Service
      const { project } = yield* projects.fromDirectory(oldDir)

      const otherID = ProjectV2.ID.make("other-project")
      yield* Database.Service.use(({ db }) =>
        db
          .insert(ProjectTable)
          .values({
            id: otherID,
            worktree: AbsolutePath.make(oldDir),
            time_created: Date.now(),
            time_updated: Date.now(),
            sandboxes: [],
          })
          .run()
          .pipe(Effect.orDie),
      )
      const foreign = sessionID()
      yield* seed({ id: foreign, dir: oldDir, project: otherID })

      yield* Effect.promise(() => fs.rename(oldDir, newDir))
      yield* projects.fromDirectory(newDir)

      expect(yield* directory(foreign)).toBe(oldDir)
    }),
  )

  it.live("keeps the existing worktree when it still exists", () =>
    Effect.gen(function* () {
      const tmp = yield* tmpdirScoped()
      const worktree = path.join(tmp, "repo")
      const checkout = path.join(tmp, "checkout")
      yield* Effect.promise(() => gitInit(worktree))
      // A clone shares the root commit, so it resolves to the same project.
      yield* Effect.promise(() => $`git clone ${worktree} ${checkout}`.quiet())

      const projects = yield* Project.Service
      const { project } = yield* projects.fromDirectory(worktree)
      const session = sessionID()
      yield* seed({ id: session, dir: worktree, project: project.id })

      const { project: second } = yield* projects.fromDirectory(checkout)
      expect(second.id).toBe(project.id)
      expect(second.worktree).toBe(worktree)
      expect(second.sandboxes).toContain(checkout)
      expect(yield* directory(session)).toBe(worktree)
    }),
  )
})
