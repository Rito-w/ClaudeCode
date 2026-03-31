export const DEFAULT_GRANT_FLAGS = {
  accessibility: false,
  screenRecording: false,
}

export const API_RESIZE_PARAMS = {}

export function targetImageSize(width: number, height: number) {
  return [width, height] as const
}

export function buildComputerUseTools() {
  return [] as Array<{ name: string }>
}

export function createComputerUseMcpServer() {
  return {
    async connect() {},
    setRequestHandler() {},
    async close() {},
  }
}

export function bindSessionContext() {
  return async () => ({
    is_error: true,
    content: [
      {
        type: 'text',
        text: 'Computer use is unavailable in the restored development build.',
      },
    ],
  })
}

export type DisplayGeometry = Record<string, unknown>
export type FrontmostApp = Record<string, unknown>
export type InstalledApp = { name?: string; bundleId?: string }
export type ResolvePrepareCaptureResult = Record<string, unknown>
export type RunningApp = Record<string, unknown>
export type ScreenshotResult = Record<string, unknown>
export type ScreenshotDims = {
  width: number
  height: number
  displayWidth?: number
  displayHeight?: number
  displayId?: number
  originX?: number
  originY?: number
}
export type CuPermissionRequest = Record<string, unknown>
export type CuPermissionResponse = Record<string, unknown>
export type CuCallToolResult = {
  is_error?: boolean
  content?: Array<{ type: string; text?: string }>
  telemetry?: Record<string, unknown>
}
export type ComputerUseSessionContext = Record<string, unknown>
export type ComputerExecutor = Record<string, unknown>
