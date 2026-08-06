import { describe, expect, test } from "bun:test"
import {
  isPinned,
  getSessionColor,
  togglePin,
  setSessionColor,
  nextSessionColor,
  SESSION_COLORS,
  SESSION_COLOR_ROTATION,
} from "./session-metadata"
import type { Session } from "@opencode-ai/sdk/v2/client"

const baseSession = (overrides?: Partial<Session>): Session =>
  ({
    id: "ses_1",
    version: "v2",
    title: "",
    directory: "/tmp",
    parentID: undefined,
    messageCount: 0,
    permissions: { session: {}, share: {} },
    time: { created: 0, updated: 0 },
    ...overrides,
  }) as Session

const noop = async () => undefined

describe("isPinned", () => {
  test("returns true when metadata.pinned is exactly true", () => {
    expect(isPinned(baseSession({ metadata: { pinned: true } }))).toBe(true)
  })

  test("returns false when metadata.pinned is falsy", () => {
    expect(isPinned(baseSession({ metadata: { pinned: false } }))).toBe(false)
    expect(isPinned(baseSession({ metadata: { pinned: 0 } }))).toBe(false)
    expect(isPinned(baseSession({ metadata: { pinned: "yes" } }))).toBe(false)
  })

  test("returns false when metadata is missing or pinned is absent", () => {
    expect(isPinned(baseSession())).toBe(false)
    expect(isPinned(baseSession({ metadata: {} }))).toBe(false)
    expect(isPinned(baseSession({ metadata: { color: "#61afef" } }))).toBe(false)
  })
})

describe("getSessionColor", () => {
  test("returns color when metadata.color matches a palette color", () => {
    expect(getSessionColor(baseSession({ metadata: { color: "#61afef" } }))).toBe("#61afef")
  })

  test("returns undefined when metadata.color is not in the palette", () => {
    expect(getSessionColor(baseSession({ metadata: { color: "#ff0000" } }))).toBeUndefined()
  })

  test("returns undefined when metadata or color is absent", () => {
    expect(getSessionColor(baseSession())).toBeUndefined()
    expect(getSessionColor(baseSession({ metadata: {} }))).toBeUndefined()
  })
})

describe("togglePin", () => {
  test("pins an unpinned session", async () => {
    let captured: any
    const updateFn = async (input: any) => { captured = input }
    await togglePin(baseSession({ metadata: { color: "#61afef" } }), updateFn as any)
    expect(captured.metadata.pinned).toBe(true)
    expect(captured.metadata.color).toBe("#61afef")
  })

  test("unpins a pinned session", async () => {
    let captured: any
    const updateFn = async (input: any) => { captured = input }
    await togglePin(baseSession({ metadata: { pinned: true, color: "#61afef" } }), updateFn as any)
    expect(captured.metadata.pinned).toBe(false)
    expect(captured.metadata.color).toBe("#61afef")
  })

  test("works when session.metadata is undefined", async () => {
    let captured: any
    const updateFn = async (input: any) => { captured = input }
    await togglePin(baseSession({ metadata: undefined }), updateFn as any)
    expect(captured.metadata.pinned).toBe(true)
  })
})

describe("setSessionColor", () => {
  test("sets a color on the session", async () => {
    let captured: any
    const updateFn = async (input: any) => { captured = input }
    await setSessionColor(baseSession({ metadata: { pinned: true } }), "#e06c75", updateFn as any)
    expect(captured.metadata.pinned).toBe(true)
    expect(captured.metadata.color).toBe("#e06c75")
  })

  test("removes color when undefined is passed", async () => {
    let captured: any
    const updateFn = async (input: any) => { captured = input }
    await setSessionColor(baseSession({ metadata: { pinned: true, color: "#61afef" } }), undefined, updateFn as any)
    expect(captured.metadata.pinned).toBe(true)
    expect(captured.metadata.color).toBeUndefined()
  })

  test("works when session.metadata is undefined", async () => {
    let captured: any
    const updateFn = async (input: any) => { captured = input }
    await setSessionColor(baseSession({ metadata: undefined }), "#e06c75", updateFn as any)
    expect(captured.metadata.color).toBe("#e06c75")
  })

  test("removing color from session without existing color", async () => {
    let captured: any
    const updateFn = async (input: any) => { captured = input }
    await setSessionColor(baseSession({ metadata: { pinned: true } }), undefined, updateFn as any)
    expect(captured.metadata.pinned).toBe(true)
    expect("color" in captured.metadata).toBe(false)
  })
})

describe("SESSION_COLORS", () => {
  test("has the expected number of palette colors", () => {
    expect(SESSION_COLORS.length).toBe(10)
  })

  test("each entry is a valid hex color", () => {
    SESSION_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
    })
  })
})

describe("SESSION_COLOR_ROTATION", () => {
  test("orders colors as green, orange, red, purple", () => {
    expect(SESSION_COLOR_ROTATION).toEqual(["#98c379", "#d19a66", "#e06c75", "#c678dd"])
  })

  test("each entry is part of the full palette", () => {
    SESSION_COLOR_ROTATION.forEach((color) => {
      expect(SESSION_COLORS).toContain(color)
    })
  })
})

describe("nextSessionColor", () => {
  test("no color cycles to the first rotation color (green)", () => {
    expect(nextSessionColor(undefined)).toBe("#98c379")
  })

  test("a legacy non-rotation color behaves like no color and cycles to green", () => {
    expect(nextSessionColor("#61afef")).toBe("#98c379")
  })

  test("cycles forward through the rotation", () => {
    expect(nextSessionColor("#98c379")).toBe("#d19a66")
    expect(nextSessionColor("#d19a66")).toBe("#e06c75")
    expect(nextSessionColor("#e06c75")).toBe("#c678dd")
  })

  test("purple cycles back to no color", () => {
    expect(nextSessionColor("#c678dd")).toBeUndefined()
  })
})
