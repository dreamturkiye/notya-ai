#!/usr/bin/env node
/**
 * SES-KILIT (founder lock, Kaan 2026-10-29) — the mechanical guard of .cursor/rules/ses-omurga-kilidi.mdc.
 *
 * The voice / text assistant path (Ses Omurgası v2) is locked: no change of ANY size without Kaan's explicit written
 * "go" for that specific change. This script enforces it:
 *
 *   node scripts/ses-kilit.mjs --denetle
 *       Hashes every file in lib/asistan/ses-kilit.json and fails (exit 1) when one differs or is missing.
 *       Runs in `prebuild` (a Vercel build of an unapproved change fails) and in `npm test` (lib/asistan/sesKilit.test.ts).
 *
 *   node scripts/ses-kilit.mjs --onayla "Kaan-onay: YYYY-MM-DD <what Kaan approved>" [--ekle <path> ...] [--cikar <path> ...]
 *       Only after Kaan wrote "go" in the chat for THIS change. Re-hashes the locked files, records the approval line,
 *       the changed files and the git HEAD in docs/SES-KILIT-ONAYLARI.md, and writes the new manifest.
 *
 * Plain Node (no dependencies) so it runs in the Vercel build before `next build`.
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const KOK = process.cwd()
const MANIFEST = resolve(KOK, 'lib/asistan/ses-kilit.json')
const KAYIT = resolve(KOK, 'docs/SES-KILIT-ONAYLARI.md')
const ONAY_BICIMI = /^Kaan-onay: (\d{4}-\d{2}-\d{2}) (.{10,})$/

const ozet = (yol) => {
  const tam = resolve(KOK, yol)
  if (!existsSync(tam)) return null
  // Line endings normalised: a checkout with CRLF must not look like a change.
  return createHash('sha256').update(readFileSync(tam, 'utf8').replace(/\r\n/g, '\n')).digest('hex')
}

function manifestOku() {
  if (!existsSync(MANIFEST)) { console.error(`[ses-kilit] manifest yok: ${MANIFEST}`); process.exit(1) }
  return JSON.parse(readFileSync(MANIFEST, 'utf8'))
}

export function denetle(m = manifestOku()) {
  const farkli = []
  for (const [yol, beklenen] of Object.entries(m.dosyalar || {})) {
    const gercek = ozet(yol)
    if (gercek !== beklenen) farkli.push({ yol, durum: gercek === null ? 'silinmiş' : 'değişmiş' })
  }
  return farkli
}

const arg = process.argv.slice(2)
if (arg[0] === '--denetle' || !arg.length) {
  const farkli = denetle()
  if (farkli.length) {
    console.error('[ses-kilit] KİLİTLİ SES / METİN OMURGASI DEĞİŞMİŞ — Kaan\'ın açık onayı olmadan değiştirilemez (.cursor/rules/ses-omurga-kilidi.mdc).')
    for (const f of farkli) console.error(`  ${f.durum}: ${f.yol}`)
    console.error('Onay alındıysa: node scripts/ses-kilit.mjs --onayla "Kaan-onay: YYYY-MM-DD <onaylanan değişiklik>"')
    process.exit(1)
  }
  console.log(`[ses-kilit] tamam — ${Object.keys(manifestOku().dosyalar).length} kilitli dosya manifestle aynı`)
} else if (arg[0] === '--onayla') {
  const satir = String(arg[1] || '').trim()
  const m = satir.match(ONAY_BICIMI)
  if (!m) { console.error('[ses-kilit] onay satırı biçimi: "Kaan-onay: YYYY-MM-DD <en az 10 karakterlik özet>"'); process.exit(1) }
  const eski = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { dosyalar: {} }
  const yollar = new Set(Object.keys(eski.dosyalar || {}))
  for (let i = 2; i < arg.length; i++) {
    if (arg[i] === '--ekle' && arg[i + 1]) yollar.add(arg[++i])
    else if (arg[i] === '--cikar' && arg[i + 1]) yollar.delete(arg[++i])
  }
  const dosyalar = {}
  const degisen = []
  for (const yol of [...yollar].sort()) {
    const h = ozet(yol)
    if (h === null) { console.error(`[ses-kilit] dosya yok: ${yol}`); process.exit(1) }
    dosyalar[yol] = h
    if (eski.dosyalar?.[yol] !== h) degisen.push(yol)
  }
  let bas = 'yok'
  try { bas = execSync('git rev-parse --short HEAD', { cwd: KOK }).toString().trim() } catch { /* git yok */ }
  const yeni = { kural: '.cursor/rules/ses-omurga-kilidi.mdc', onay: satir, guncelleme: m[1], dosyalar }
  writeFileSync(MANIFEST, `${JSON.stringify(yeni, null, 2)}\n`)
  if (!existsSync(KAYIT)) writeFileSync(KAYIT, '# SES-KILIT onayları\n\n')
  appendFileSync(KAYIT, `\n## ${m[1]} — ${m[2]}\n\n- Onay satırı: \`${satir}\`\n- Taban commit: \`${bas}\`\n- Değişen kilitli dosyalar: ${degisen.length ? degisen.map((d) => `\`${d}\``).join(', ') : '(yok — yalnız liste)'}\n`)
  console.log(`[ses-kilit] manifest yazıldı (${Object.keys(dosyalar).length} dosya, ${degisen.length} değişen); kayıt: docs/SES-KILIT-ONAYLARI.md`)
} else {
  console.error('kullanım: node scripts/ses-kilit.mjs --denetle | --onayla "Kaan-onay: YYYY-MM-DD <özet>" [--ekle yol] [--cikar yol]')
  process.exit(1)
}
