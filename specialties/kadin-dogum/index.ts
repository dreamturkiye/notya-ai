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
export { currentGa, naegeleEdd, crlToGa, crlToEdd } from './engines/sat-edd'
export { buildIzlemCalendar, sbMinimumFour, privateOverlay, lohusaCalendar } from './engines/izlem-calendar'
export { evaluateWindows, antiDIndicated, souvenir3d4d } from './engines/test-windows'

if (process.env.NODE_TEST_CONTEXT) {
  await import('./tests/load')
}
