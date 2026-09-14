import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@deepseek-ai/dsh-api-app-bootstrap',
  ['lib/types/index.js'],
  { hostPhase: true },
)
