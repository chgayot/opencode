# AGENTS.md Hierarchy Auditor Prompt

## Role
You are an expert at analyzing monorepo structures and designing hierarchical AGENTS.md files that work with opencode's loading behavior:
- **Startup**: Only FIRST project-level AGENTS.md loads (nearest to cwd)
- **Read-time**: When reading a file, parent AGENTS.md files ARE loaded dynamically
- **Middle folders**: AGENTS.md in intermediate directories are NOT loaded unless you read a file in their subtree

## Task
Analyze `/home/charles/Git/_Other_projects/OpenCode_pins/packages/` and create a hierarchy audit that:

1. **Maps the directory tree** (packages/ + subdirectories)
2. **Identifies which folders need AGENTS.md** based on:
   - Distinct domain/purpose (packages/opencode, packages/core, packages/tui, etc.)
   - Shared conventions that differ from parent
   - Team ownership boundaries
   - Build/test/config differences
3. **Designs the hierarchy** with explicit parent links:
   ```
   packages/AGENTS.md              → Root: "See packages/opencode/AGENTS.md for TUI specifics"
   packages/opencode/AGENTS.md     → Parent: packages/AGENTS.md
   packages/opencode/src/AGENTS.md → Parent: packages/opencode/AGENTS.md
   ```
4. **Outputs a plan** as a Markdown document with:
   - Tree diagram showing proposed AGENTS.md locations
   - For each: purpose, parent link, key instructions to include
   - Migration steps (create new, update parent links)

## Rules
- Only create AGENTS.md where behavior/instructions actually diverge
- Each AGENTS.md MUST link to its parent: `Parent: ../AGENTS.md`
- Root (packages/AGENTS.md) links to global: `Parent: ../../AGENTS.md`
- Don't create empty/placeholder files - only where value exists
- Consider: build configs, test patterns, coding conventions, domain boundaries

## Output Format
```markdown
# AGENTS.md Hierarchy Plan

## Tree
packages/
├── AGENTS.md                    ← Root package conventions
├── opencode/
│   ├── AGENTS.md               ← TUI/app specifics
│   ├── src/
│   │   └── AGENTS.md           ← Session/core logic
│   └── test/
│       └── AGENTS.md           ← Test patterns
├── core/
│   ├── AGENTS.md               ← Core library conventions
│   └── src/
│       └── AGENTS.md           ← Effect patterns
├── tui/
│   └── AGENTS.md               ← React/Ink specifics
└── ...

## Details
### packages/AGENTS.md
**Purpose**: Monorepo-wide package conventions
**Parent**: ../../AGENTS.md
**Key Instructions**:
- Build: `bun run build` from package root
- Test: `bun test` from package root
- Typecheck: `bun typecheck`
- No barrel exports (per AGENTS.md Module shape)
...

### packages/opencode/AGENTS.md
**Purpose**: opencode TUI application specifics
**Parent**: ../AGENTS.md
**Key Instructions**:
- Dev server: `tmux new-session -d -s opencode-dev 'bun dev'`
- Test: `bun test --timeout 30000`
- Effect v4 patterns (see core/AGENTS.md)
...
```

## Deliverable
Write the complete plan to `/home/charles/Git/_Other_projects/OpenCode_pins/AGENTS_HIERARCHY_PLAN.md`