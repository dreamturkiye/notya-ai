/**
 * NOTYA-ULKE-UYGULA-US — TEST CODE. Importing this file FIRST makes the test process a build of the United States
 * (NOTYA_COUNTRY=us), the way next.config.mjs fixes the country before anything is compiled. Imports are hoisted
 * above every other statement and run in order, so only an import placed first runs before the modules that read
 * the country (the same device as lib/ulke/testing/uzDerlemesi.ts). No application code imports this file.
 */
process.env.NOTYA_COUNTRY = 'us'
