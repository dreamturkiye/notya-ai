/**
 * STRIPE-NOTYA-AU-04 — webhook reachable on country builds (pageExtensions = *.ulke.ts).
 * Same handler as the Türkiye route; re-exported so Next mounts it under the country build.
 */
export { dynamic, POST } from './route'
