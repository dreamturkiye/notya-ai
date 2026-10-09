/**
 * NOTYA-UZ-ACILIS-02 — TEST CODE. Stand-ins for what only the bundler understands, so that a pack's page entry
 * (countries/<kod>/acilis/index.tsx) and the shared presentational components it reuses load in a plain Node test.
 * Import it before the module under test.
 *
 *   - a photograph: the entry imports three. The build turns each into an address under its own asset folder
 *     (<prefix>/_next/static/media/…); here it becomes that address without the content hash.
 *   - `React` in scope: the build compiles JSX with the automatic runtime; the test runner compiles it to
 *     React.createElement. The pack's own files import React for that reason; the shared landing components
 *     (components/doktor-landing/*) do not, and they are not edited for another country.
 */
import React from 'react'

type Yukleyici = (m: { exports: unknown }, dosya: string) => void
const uzantilar = (require as unknown as { extensions: Record<string, Yukleyici> }).extensions

uzantilar['.jpg'] = (m, dosya) => {
  m.exports = { src: `/uzbek/_next/static/media/${dosya.split(/[\\/]/).pop()}`, width: 1, height: 1 }
}

;(globalThis as { React?: unknown }).React = React
