const agentsPlatform = {
  name: 'agents-platform',
  type: 'local',
  description: 'Unavailable in restored development build.',
  supportsNonInteractive: true,
  load: async () => ({
    async call() {
      return { type: 'skip' as const }
    },
  }),
}

export default agentsPlatform
