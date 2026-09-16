// Codemod: wrap every server-side @supabase/supabase-js createClient() in app/api + lib
// with a no-store fetch so Next 14 fetch caching can never serve stale rows.
// Idempotent. Usage: node scripts/codemod-no-store.mjs [--check]
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const CHECK = process.argv.includes('--check')
const FETCH = "fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' })"
const files = execSync("grep -rlE 'createClient\\(' app/api lib --include='*.ts' --include='*.tsx' || true")
  .toString().trim().split('\n').filter(Boolean)

const changed = []
const manual = []
const isStrQuote = (c) => c === "'" || c === '"' || c === '`'

function matchClose(src, start) {
  let depth = 1, j = start, s = null
  while (j < src.length && depth > 0) {
    const c = src[j]
    if (s) { if (c === '\\') j++; else if (c === s) s = null }
    else if (isStrQuote(c)) s = c
    else if (c === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); if (j < 0) j = src.length; continue }
    else if ('([{'.includes(c)) depth++
    else if (')]}'.includes(c)) depth--
    j++
  }
  return j // index just past the closing paren
}

function splitTop(args) {
  const parts = []; let d = 0, s = null, last = 0
  for (let k = 0; k < args.length; k++) {
    const c = args[k]
    if (s) { if (c === '\\') k++; else if (c === s) s = null }
    else if (isStrQuote(c)) s = c
    else if ('([{'.includes(c)) d++
    else if (')]}'.includes(c)) d--
    else if (c === ',' && d === 0) { parts.push(args.slice(last, k)); last = k + 1 }
  }
  parts.push(args.slice(last))
  return parts
}

for (const f of files) {
  if (/\.test\.tsx?$/.test(f)) continue
  const src = fs.readFileSync(f, 'utf8')
  if (!src.includes('@supabase/supabase-js')) continue
  let out = '', i = 0, touched = false
  for (;;) {
    const idx = src.indexOf('createClient(', i)
    if (idx < 0) { out += src.slice(i); break }
    const start = idx + 'createClient('.length
    const j = matchClose(src, start)
    const args = src.slice(start, j - 1)
    const parts = splitTop(args)
    const nonEmpty = parts.filter((p) => p.trim().length)
    if (args.includes('no-store') || nonEmpty.length < 2) { out += src.slice(i, j); i = j; continue }
    let newArgs
    if (nonEmpty.length === 2) {
      const body = args.replace(/\s*$/, '')
      const tail = args.slice(body.length)
      newArgs = `${body.replace(/,$/, '')}, { global: { ${FETCH} } }${tail}`
    } else {
      const opt = nonEmpty[2]
      if (!opt.trim().startsWith('{')) { manual.push(`${f}: options arg is not an object literal`); out += src.slice(i, j); i = j; continue }
      const newOpt = /\bglobal\s*:\s*\{/.test(opt)
        ? opt.replace(/\bglobal\s*:\s*\{/, (m) => `${m} ${FETCH},`)
        : opt.replace('{', `{ global: { ${FETCH} },`)
      newArgs = args.replace(opt, newOpt)
    }
    out += src.slice(i, start) + newArgs + ')'
    i = j; touched = true
  }
  if (touched) { changed.push(f); if (!CHECK) fs.writeFileSync(f, out) }
}

for (const m of manual) console.log('MANUAL', m)
for (const c of changed) console.log(CHECK ? 'STALE' : 'FIXED', c)
console.log(`${CHECK ? 'stale' : 'changed'}=${changed.length} manual=${manual.length}`)
if (CHECK && changed.length) process.exit(1)
