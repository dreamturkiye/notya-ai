/**
 * NOTYA-ULKE-OZEL-01 — TEST CODE. Importing this file FIRST makes the test process a build of ONE REAL
 * English-speaking country, the way next.config.mjs fixes the country before anything is compiled (the same device
 * as ../uzDerlemesi.ts, and for the same reason: imports are hoisted, so only an import can run first).
 *
 * WHY A REAL COUNTRY. The kit's screens ask the ACTIVE pack how the country writes a number and a day and what the
 * shared words of a tool's screen are; the test country "xx" is in no build and can never be the active pack. Its
 * TOOLS are handed to the screens as content (as every screen takes them), inside a build whose language form is the
 * one the test country writes in. Nothing of that real country is asserted, and nothing of the test country is
 * added to it.
 */
process.env.NOTYA_COUNTRY = 'gb'
