import type { Session } from "@opencode-ai/sdk/v2/client"

export const SESSION_COLORS = [
  "#e06c75",
  "#d19a66",
  "#e5c07b",
  "#98c379",
  "#56b6c2",
  "#61afef",
  "#c678dd",
  "#be5046",
  "#7f8c8d",
  "#8be9fd",
] as const

export type SessionColor = (typeof SESSION_COLORS)[number]

export const SESSION_COLOR_ROTATION = ["#98c379", "#d19a66", "#e06c75", "#c678dd"] as const satisfies readonly SessionColor[]

export function nextSessionColor(current: SessionColor | undefined): SessionColor | undefined {
  const index = current === undefined ? -1 : SESSION_COLOR_ROTATION.findIndex((color) => color === current)
  if (index === -1) return SESSION_COLOR_ROTATION[0]
  const next = (index + 1) % (SESSION_COLOR_ROTATION.length + 1)
  return next === SESSION_COLOR_ROTATION.length ? undefined : SESSION_COLOR_ROTATION[next]
}

export function isPinned(session: Session) {
  return session.metadata?.pinned === true
}

export function getSessionColor(session: Session): SessionColor | undefined {
  const color = session.metadata?.color
  if (typeof color === "string" && (SESSION_COLORS as readonly string[]).includes(color)) return color as SessionColor
  return undefined
}

export function togglePin(session: Session, updateFn: (input: { sessionID: string; metadata: Record<string, unknown> }) => Promise<unknown>) {
  const pinned = !isPinned(session)
  return updateFn({ sessionID: session.id, metadata: { ...(session.metadata ?? {}), pinned } })
}

export function setSessionColor(session: Session, color: string | undefined, updateFn: (input: { sessionID: string; metadata: Record<string, unknown> }) => Promise<unknown>) {
  const metadata = { ...(session.metadata ?? {}) }
  if (color === undefined) {
    delete metadata.color
  } else {
    metadata.color = color
  }
  return updateFn({ sessionID: session.id, metadata })
}
