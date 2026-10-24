#!/usr/bin/env node
/**
 * Page-parity matrix: every Türkiye doctor-side page (gold reference) against its Australian equivalent.
 * Reads the live route list from app/ so a new Türkiye page that nobody mapped shows up as "UNMAPPED".
 * Usage: node scripts/ulke-sayfa-matrisi.mjs [cc=au]   → writes docs/PARITY-MATRIX-<CC>.md
 * Status: ok = exists in the country build · partial = exists, parts missing · missing = to build · tr-only = Turkish law, exempt
 *         gated = exists in Türkiye, off in this country on purpose (reason given) · check = not yet looked at
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, sep } from 'node:path'

const cc = (process.argv[2] ?? 'au').toLowerCase()
const gez = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? gez(p) : [p] })
const rotalar = gez('app').filter((p) => /[\\/]page\.tsx$/.test(p)).map((p) => '/' + p.split(sep).slice(1, -1).join('/')).sort()

// Türkiye doctor page → [country route or tool, status, note]
const SAYFA = {
  '/dashboard/doktor': ['/today', 'ok', 'home'],
  '/dashboard/doktor/ayarlar': ['/settings', 'partial', 'tiles missing: Communication, Integrations, Staff link'],
  '/dashboard/doktor/ayarlar/ayse-hafizasi': [null, 'gated', 'assistant memory: live assistant is opt-in (NOTYA_AU_ASSISTANT_ENABLED)'],
  '/dashboard/doktor/ayarlar/erecete': [null, 'tr-only', 'e-Reçete'],
  '/dashboard/doktor/ayarlar/gelen-belgeler': [null, 'gated', 'image/document reading is off (TGA boundary)'],
  '/dashboard/doktor/ayarlar/iletisim': [null, 'missing', 'communication preference (email/WhatsApp from own account)'],
  '/dashboard/doktor/ayarlar/ses-profili': [null, 'gated', 'voice profile: assistant off'],
  '/dashboard/doktor/belgeler': [null, 'missing', 'Documents upload page'],
  '/dashboard/doktor/entegrasyonlar': [null, 'missing', 'Integrations'],
  '/dashboard/doktor/gelen-belgeler': [null, 'gated', 'Incoming documents: image/document reading is off'],
  '/dashboard/doktor/goruntuleme': [null, 'gated', 'Imaging review: image reading is off'],
  '/dashboard/doktor/hasta-ekle': ['/patients/new', 'ok', ''],
  '/dashboard/doktor/hastalar': ['/patients', 'ok', ''],
  '/dashboard/doktor/hastalar/[id]': ['/patient', 'partial', 'patient-file cards missing'],
  '/dashboard/doktor/hastalar/[id]/asi-karnesi': ['/tools?arac=au-immunisation-schedule', 'check', 'vaccination record'],
  '/dashboard/doktor/hastalar/[id]/belgeler/[belgeId]': [null, 'missing', 'document viewer'],
  '/dashboard/doktor/hastalar/[id]/belgeler/[belgeId]/lab': [null, 'missing', 'lab result view'],
  '/dashboard/doktor/hastalar/[id]/gebelik/yazdir': [null, 'check', 'pregnancy print (obstetrics only)'],
  '/dashboard/doktor/hastalar/[id]/konsultasyon/[kid]/yazdir': [null, 'missing', 'consultation print form'],
  '/dashboard/doktor/hesap': ['/account', 'ok', 'built 2026-10-24'],
  '/dashboard/doktor/ilaclar': [null, 'check', 'medications list'],
  '/dashboard/doktor/inceleme': [null, 'check', 'review queue'],
  '/dashboard/doktor/mesajlar': ['/messages', 'ok', ''],
  '/dashboard/doktor/notlar/[id]': ['/visit', 'ok', 'note page'],
  '/dashboard/doktor/notlar/[id]/recete': [null, 'check', 'prescription (AU: PBS prescription tool)'],
  '/dashboard/doktor/notlar/[id]/tetkikler': [null, 'check', 'investigations'],
  '/dashboard/doktor/notlar/[id]/yazdir': [null, 'check', 'note print'],
  '/dashboard/doktor/onam/yazdir': [null, 'check', 'consent print'],
  '/dashboard/doktor/personel': [null, 'missing', 'Staff'],
  '/dashboard/doktor/randevular': ['/calendar', 'partial', 'appointment detail page missing'],
  '/dashboard/doktor/raporlar': ['/reports', 'ok', 'built 2026-10-24 (counts only; Türkiye has charts)'],
  '/dashboard/klinik': ['/clinic', 'check', ''],
  '/dashboard/klinik/ayarlar': ['/clinic', 'check', ''],
  '/dashboard/klinik/hastalar': ['/clinic', 'check', ''],
  '/dashboard/klinik/hastalar/[id]': ['/clinic', 'check', ''],
  '/dashboard/klinik/kullanicilar': ['/clinic', 'check', ''],
  '/dashboard/klinik/pabau': [null, 'tr-only', 'Pabau integration'],
  '/dashboard/klinik/randevular': ['/desk', 'check', ''],
  '/dashboard/klinik/seans': ['/clinic', 'check', ''],
}
const TR_YASAL = /(^|-)(sgk|sut|enabiz|medula|erecete|mbys|gop)(-|$)/
const AU_ARAC = new Set(['hasta-portali', 'konsultasyonlar', 'takip-paneli', 'sablonlarim', 'hedef-boy', 'pedi-buyume', 'pedi-asi', 'psik-phq-gad', 'epikriz', 'tetkik'])

const satir = []
const say = { ok: 0, partial: 0, missing: 0, gated: 0, 'tr-only': 0, check: 0, UNMAPPED: 0 }
const doktor = rotalar.filter((r) => /^\/dashboard\/(doktor|klinik)/.test(r))
for (const r of doktor) {
  const [hedef, durum, not] = SAYFA[r] ?? [null, 'UNMAPPED', 'new Türkiye page: map it in scripts/ulke-sayfa-matrisi.mjs']
  say[durum]++; satir.push(`| \`${r}\` | ${hedef ? `\`${hedef}\`` : '—'} | ${durum} | ${not} |`)
}
const araclar = rotalar.filter((r) => r.startsWith('/doktor-tools/')).map((r) => r.slice('/doktor-tools/'.length))
const trYasal = araclar.filter((a) => TR_YASAL.test(a) || a.startsWith('enabiz'))
const ortak = araclar.filter((a) => AU_ARAC.has(a))
const dal = araclar.filter((a) => !trYasal.includes(a) && !AU_ARAC.has(a))
const portal = rotalar.filter((r) => /^\/portal\/hasta\//.test(r))

const md = `# Page parity matrix — Türkiye (gold) vs ${cc.toUpperCase()}\n\nGenerated by \`node scripts/ulke-sayfa-matrisi.mjs ${cc}\` from the live route list. Status: ok · partial (exists, parts missing) · missing (to build) · gated (off on purpose, reason given) · tr-only (Turkish law, exempt) · check (not yet looked at) · UNMAPPED (new Türkiye page nobody mapped).\n\n## Summary — doctor and clinic pages (${doktor.length})\n${Object.entries(say).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n## Doctor and clinic pages\n| Türkiye page | ${cc.toUpperCase()} page | Status | Note |\n|---|---|---|---|\n${satir.join('\n')}\n\n## Tools (${araclar.length} Türkiye tool pages)\n- Turkish-law tools, exempt: ${trYasal.length}\n- Shared tools the ${cc.toUpperCase()} build lists too: ${ortak.length}\n- Specialty tools to compare against the country's own list (the country lists its own by law): ${dal.length}\n\n## Patient portal (${portal.length} Türkiye pages under /portal/hasta)\nThe country builds draw one portal page from shared views; the per-specialty modules (heart, lungs, skin, hair, …) still need a page-by-page check.\n`
writeFileSync(`docs/PARITY-MATRIX-${cc.toUpperCase()}.md`, md)
console.log(Object.entries(say).map(([k, v]) => `${k}=${v}`).join(' '), `| tools ${araclar.length} (tr-only ${trYasal.length}, shared ${ortak.length}, specialty ${dal.length}) | portal ${portal.length}`)
