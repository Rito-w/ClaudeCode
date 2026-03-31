export const DEFAULT_GRANT_FLAGS = {
  accessibility: false,
  screenRecording: false,
}

export type CoordinateMode = 'screen' | 'viewport'
export type CuSubGates = Record<string, boolean>
export type Logger = {
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}
export type ComputerUseHostAdapter = Record<string, unknown>
export type CuPermissionRequest = Record<string, unknown>
export type CuPermissionResponse = Record<string, unknown>
