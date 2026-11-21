/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — guard: browser code of the doctor application (doctor, secretary, Notya
 * Klinik, Özel Branşlar, all 40 branches) must not build its own `Authorization: Bearer …` header for our /api,
 * nor read the session out of localStorage, nor create a default (persisting, auto-refreshing) Supabase client.
 * Every one of those reintroduces the bug this fixed: a token cached past its hour, or a second refresher that
 * spends the single-use refresh token and gets the whole session revoked. Use doktorFetch / doktorJetonu
 * (lib/doktor/oturumFetch.ts), getDoctorAccessToken for "is anybody signed in", girisIstemcisi / doktorSupabase.
 *
 * Pattern-based (like brans-alan-sizmasi / model-sizmasi): scans app/ (not app/api), components/, core/,
 * specialties/ and lib/, skipping server-only modules that call third-party APIs with their own secrets.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const KOKLER = ['app', 'components', 'core', 'specialties', 'lib']

/** Files allowed to build the header / touch the stored session — each with its reason. */
const IZINLI: Record<string, string> = {
  'lib/doktor/oturumFetch.ts': 'THE shared request path',
  'lib/doktor/clientAuth.ts': 'THE session owner (storage + the one refresher)',
  // FOUNDER LOCK (ses-omurga-kilidi.mdc): not editable without Kaan's written go. Its tokens come from
  // ensureDoctorAccessToken (fixed here); moving its headers to doktorFetch is logged in OPEN-COMMITMENTS.
  'components/asistan/AsistanOturumContext.tsx': 'founder-locked voice path (OTURUM-01 follow-up waits on Kaan)',
  // Other products (müşavir / avukat) keep their own session code; out of the doctor application's scope.
  'lib/portal/toolsUi.ts': 'mali + avukat portal helper',
  'app/dashboard/page.tsx': 'profession router (reads via getDoctorAccessToken only)',
  'app/giris/page.tsx': 'generic login (mali / avukat / doctor) — signs in over REST',
  'app/sifre-sifirla/page.tsx': 'password-recovery page needs the SDK recovery session (signs out after)',
}
const IZINLI_ONEK = [
  'app/api/',
  'app/dashboard/mali', 'app/mali-tools', 'app/asistan/mali', 'app/asistan/avukat', 'app/session/mali',
  'app/dashboard/avukat', 'app/giris/mali', 'app/giris/avukat', 'components/avukat', 'components/mali',
  'lib/mali/', 'lib/avukat/',
  // Server-only modules (third-party APIs with their own secrets, server auth parsing, test harnesses).
  'lib/ai/', 'lib/accounting/', 'lib/iletisim/otomatik/', 'lib/iletisim/whatsapp/graph', 'lib/randevu/v2/google/',
  'lib/demo/calOnay/', 'lib/security/', 'lib/asistan/fish', 'lib/asistan/tests/', 'lib/asistan/ses', 'lib/cronYetki',
  'lib/doktor/serverAuth', 'lib/doktor/pratikOturum', 'lib/doktor/integrations', 'lib/telemetri/kullanim',
  'lib/ulke/', 'lib/sandbox/', 'lib/transcription/',
]

const BEARER = /Authorization['"]?\s*[:,]\s*(`Bearer|['"]Bearer)|setRequestHeader\(\s*['"]Authorization/i
const DEPO = /localStorage\.(getItem|setItem|removeItem)\(\s*['"](auth-token|sb-[^'"]*-auth-token)['"]|k\.includes\(\s*['"]auth-token['"]\s*\)/
const VARSAYILAN_ISTEMCI = /createClient\(\s*(process\.env\.NEXT_PUBLIC_SUPABASE_URL!?\s*,\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!?\s*\)|'https:\/\/[a-z]+\.supabase\.co'\s*,\s*'eyJ[^']+'\s*\))/

function dosyalar(dizin: string, cikti: string[] = []): string[] {
  for (const ad of readdirSync(dizin)) {
    if (ad === 'node_modules' || ad.startsWith('.')) continue
    const yol = join(dizin, ad)
    if (statSync(yol).isDirectory()) dosyalar(yol, cikti)
    else if (/\.(ts|tsx)$/.test(ad) && !/\.test\.tsx?$/.test(ad) && !ad.endsWith('.d.ts')) cikti.push(yol.replace(/\\/g, '/'))
  }
  return cikti
}

const izinli = (d: string) => d in IZINLI || IZINLI_ONEK.some((o) => d.startsWith(o))
const taranan = KOKLER.flatMap((k) => dosyalar(k)).filter((d) => !izinli(d))

function bul(desen: RegExp): string[] {
  const bulunan: string[] = []
  for (const d of taranan) {
    const satirlar = readFileSync(d, 'utf8').split('\n')
    satirlar.forEach((s, i) => {
      const t = s.trim()
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return
      if (desen.test(s)) bulunan.push(`${d}:${i + 1}: ${t.slice(0, 120)}`)
    })
  }
  return bulunan
}

test('guard: the scan really covers the doctor application', () => {
  assert.ok(taranan.length > 500, `only ${taranan.length} files scanned`)
  assert.ok(taranan.includes('app/dashboard/doktor/hastalar/page.tsx'))
  assert.ok(taranan.includes('components/doktor/DoktorChrome.tsx'))
})

test('guard: no hand-built Authorization: Bearer header outside lib/doktor/oturumFetch.ts', () => {
  const b = bul(BEARER)
  assert.deepEqual(b, [], `use doktorFetch (lib/doktor/oturumFetch.ts):\n${b.join('\n')}`)
})

test('guard: no direct read/write of the stored session outside clientAuth', () => {
  const b = bul(DEPO)
  assert.deepEqual(b, [], `use getDoctorAccessToken / saveDoctorSession / doktorOturumuSil (lib/doktor/clientAuth.ts):\n${b.join('\n')}`)
})

test('guard: no default (persisting, auto-refreshing) Supabase client on a doctor screen', () => {
  const b = bul(VARSAYILAN_ISTEMCI)
  assert.deepEqual(b, [], `use girisIstemcisi (sign-in) or doktorSupabase (token-backed):\n${b.join('\n')}`)
})

test('guard: the self-test of the patterns still matches the bug shapes', () => {
  assert.ok(BEARER.test("headers: { Authorization: `Bearer ${t}` }"))
  assert.ok(BEARER.test(`headers: { 'Authorization': 'Bearer ' + token }`))
  assert.ok(BEARER.test('x.setRequestHeader("Authorization", `Bearer ${tok}`)'))
  assert.ok(DEPO.test("const raw = localStorage.getItem('auth-token')"))
  assert.ok(DEPO.test("Object.keys(localStorage).find((k) => k.includes('auth-token'))"))
  assert.ok(VARSAYILAN_ISTEMCI.test('createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)'))
  assert.ok(!VARSAYILAN_ISTEMCI.test("createClient(url, key, { auth: { persistSession: false } })"))
})
