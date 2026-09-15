/**
 * tsx --test <directory> resolves the folder to this barrel (index.ts).
 * Root package.json is a shared file we cannot edit; until it globs
 * specialties/kadin-dogum/**/*.test.ts, NODE_TEST_CONTEXT loads chapter tests here.
 */
export { KADIN_DOGUM_MANIFEST } from './manifest'
export {
  kadinDogumPayloadSchema,
  pediatriProbeSchema,
  fetusSchema,
  obstetricScoreSchema,
  antiDSchema,
} from './schema'
export type {
  VisitType,
  KadinDogumPayload,
  FetusPlaceholder,
  ObstetricScore,
  AntiDDose,
} from './types'

if (process.env.NODE_TEST_CONTEXT) {
  await import('./tests/load')
}
