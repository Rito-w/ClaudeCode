import { buildTool } from '../../Tool.js'

export const TungstenTool = buildTool({
  name: 'tungsten',
  userFacingName() {
    return 'Tungsten'
  },
  async description() {
    return 'Unavailable in restored development build.'
  },
  async prompt() {
    return 'Unavailable in restored development build.'
  },
  inputSchema: {
    parse(value: unknown) {
      return value
    },
  } as never,
  outputSchema: {
    parse(value: unknown) {
      return value
    },
  } as never,
  isEnabled() {
    return false
  },
  isReadOnly() {
    return true
  },
  isConcurrencySafe() {
    return true
  },
  async call() {
    return { data: { ok: false } }
  },
})
