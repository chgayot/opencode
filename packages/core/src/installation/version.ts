declare global {
  const OPENCODE_VERSION: string
  const OPENCODE_CHANNEL: string
  const OPENCODE_DEFAULT_DB: string
}

export const InstallationVersion = typeof OPENCODE_VERSION === "string" ? OPENCODE_VERSION : "local"
export const InstallationChannel = typeof OPENCODE_CHANNEL === "string" ? OPENCODE_CHANNEL : "local"
export const InstallationDefaultDatabase = typeof OPENCODE_DEFAULT_DB === "string" ? OPENCODE_DEFAULT_DB : undefined
export const InstallationLocal = InstallationChannel === "local"
