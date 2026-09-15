/**
 * tsx --test <directory> resolves the folder to this barrel (index.ts).
 * Root package.json is a shared file we cannot edit; until it lists chapter test files,
 * NODE_TEST_CONTEXT loads tests/load.ts so the specialty tests actually run.
 */
import { createRequire } from 'node:module'

export { DERMATOLOJI_MANIFEST } from './manifest'
export {
  dermatolojiPayloadSchema,
  pediatriProbeSchema,
  kadinDogumProbeSchema,
} from './schema'
export type { VisitType, ClinicUnit, DermatolojiPayload } from './types'
export { DERMATOLOJI_TOOLS } from './prompts/tools'

if (process.env.NODE_TEST_CONTEXT) {
  createRequire(import.meta.url)('./tests/load.ts')
}
