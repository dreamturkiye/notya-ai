/**
 * Dermatoloji chapter barrel. Tests run via package.json globs (test:derm / test),
 * not via NODE_TEST_CONTEXT side-load of tests/load.ts.
 */
export { DERMATOLOJI_MANIFEST } from './manifest'
export {
  dermatolojiPayloadSchema,
  pediatriProbeSchema,
  kadinDogumProbeSchema,
} from './schema'
export type { VisitType, ClinicUnit, DermatolojiPayload } from './types'
export { DERMATOLOJI_TOOLS } from './prompts/tools'
