/**
 * NOTYA-UZ-MUAYENE-01 — TEST CODE. Importing this file FIRST makes the test process an Uzbekistan build
 * (NOTYA_COUNTRY=uz), the way next.config.mjs fixes the country before anything is compiled.
 *
 * Why a file and not a line at the top of the test: `import` statements are hoisted above every other statement, so
 * an assignment written in the test runs only after its static imports have already picked a pack. Imports run in
 * order, though — this one, placed first, runs before the modules that read the country.
 */
process.env.NOTYA_COUNTRY = 'uz'
