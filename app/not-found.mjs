/**
 * NOTYA-ULKE-01 — not-found page of a country that is not the pre-split application; text from its pack
 * (components/ulke/UlkeSistemSayfasi.tsx).
 *
 * Why this ONE country route file is named .mjs and not .ulke.tsx like the others. Next.js 14.2 writes the client
 * manifest of the root not-found page only when the file has a single extension: its build plugin strips one extension
 * and compares what is left with "app/not-found". Named not-found.ulke.tsx, the production build of a country stopped
 * at "/_not-found" with "Cannot read properties of undefined (reading 'clientModules')"; the development server does
 * not show the fault. So `mjs` is a route extension in a country build (next.config.mjs) and this is the only file
 * that uses it — lib/ulke/ulkeEkranlari.uz.test.ts fails on a second one. In the pre-split application `mjs` is not a
 * route extension: this file is not part of that build, and app/not-found.tsx is untouched.
 */
export { UlkeBulunamadi as default } from '../components/ulke/UlkeSistemSayfasi'
