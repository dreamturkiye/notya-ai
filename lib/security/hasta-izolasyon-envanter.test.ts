/**
 * HASTA-IZOLASYON-01 — statik bekçiler (mock gerektirmez).
 *
 * 1. Hasta verisine dokunabilen her API dosyası lib/security/hastaIzolasyonEnvanteri.ts'te sınıflanmış
 *    olmalı; 'test' diye işaretlenenler lib/security/hasta-izolasyon.test.ts'te gerçekten koşmalı.
 *    Yeni bir rota sınıflanmadan (ve sahiplik kontrolü gözden geçirilmeden) birleşemez.
 * 2. Migration'larda doktor/hasta kolonu taşıyan her tablo için RLS açılmış olmalı (veritabanı katmanı
 *    ikinci savunma hattı — birincisi uygulama kodundaki sahiplik kontrolü).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { HASTA_IZOLASYON_ENVANTERI } from './hastaIzolasyonEnvanteri'

const KOK = resolve(__dirname, '../..')
const oku = (p: string) => readFileSync(join(KOK, p), 'utf8')

function tsDosyalari(dizin: string): string[] {
  const tam = join(KOK, dizin)
  if (!existsSync(tam)) return []
  const out: string[] = []
  for (const ad of readdirSync(tam)) {
    const yol = join(tam, ad)
    if (statSync(yol).isDirectory()) out.push(...tsDosyalari(relative(KOK, yol)))
    else if (ad.endsWith('.ts') && !ad.endsWith('.test.ts')) out.push(relative(KOK, yol).split('\\').join('/'))
  }
  return out
}

/** Trees where every file must be classified, whatever it contains. */
const HASTA_AGACLARI = ['app/api/doktor', 'app/api/notes', 'app/api/sessions', 'app/api/portal', 'app/api/asistan', 'app/api/intake', 'app/api/entegrasyon', 'app/api/cron']
/** Anywhere else under app/api, touching one of these makes a file patient-facing. */
const HASTA_IZI = /patient_id|patientId|hastaId|hasta_id|bebekId|anneId|from\(\s*['"](patients|notes|sessions)['"]\s*\)/

describe('HASTA-İZOLASYON envanteri: her hasta rotası sınıflı ve sınanıyor', () => {
  const agacDosyalari = HASTA_AGACLARI.flatMap(tsDosyalari)
  const izliDosyalar = tsDosyalari('app/api').filter((f) => HASTA_IZI.test(oku(f)))
  const gerekli = [...new Set([...agacDosyalari, ...izliDosyalar])].sort()

  it('hasta verisine dokunan her API dosyası envanterde', () => {
    const eksik = gerekli.filter((f) => !(f in HASTA_IZOLASYON_ENVANTERI))
    assert.deepEqual(eksik, [], `Sınıflanmamış rota(lar) — sahiplik kontrolünü ekleyin, hasta-izolasyon.test.ts'e vaka ekleyin ve lib/security/hastaIzolasyonEnvanteri.ts'e yazın (bkz. .cursor/skills/hasta-izolasyon/SKILL.md):\n${eksik.join('\n')}`)
  })

  it('envanterdeki her dosya gerçekten var', () => {
    const olmayan = Object.keys(HASTA_IZOLASYON_ENVANTERI).filter((f) => !existsSync(join(KOK, f)))
    assert.deepEqual(olmayan, [], `Silinmiş/taşınmış dosya envanterde kalmış:\n${olmayan.join('\n')}`)
  })

  it("'test' işaretli her rota çapraz-doktor paketinde koşuyor", () => {
    const paket = oku('lib/security/hasta-izolasyon.test.ts')
    const kosmayan = Object.entries(HASTA_IZOLASYON_ENVANTERI)
      .filter(([, s]) => s.durum === 'test')
      .map(([f]) => f)
      .filter((f) => !paket.includes(`ice('${f.replace(/\.ts$/, '')}')`))
    assert.deepEqual(kosmayan, [], `'test' denmiş ama paket bu rotayı yüklemiyor:\n${kosmayan.join('\n')}`)
  })

  it("'incelendi' kayıtları kapsamı açıkça yazıyor", () => {
    for (const [f, s] of Object.entries(HASTA_IZOLASYON_ENVANTERI)) {
      if (s.durum === 'incelendi') assert.ok(s.kapsam.trim().length >= 12, `${f}: kapsam açıklaması yok`)
    }
  })
})

describe('HASTA-İZOLASYON veritabanı katmanı: hasta tablolarında RLS açık', () => {
  const dosyalar = [
    ...readdirSync(join(KOK, 'lib/db/migrations')).filter((f) => f.endsWith('.sql') && !f.includes('tidb')).map((f) => `lib/db/migrations/${f}`),
    'lib/db/schema.sql', 'lib/db/asistan_schema.sql',
  ]
  const metin = dosyalar.map(oku).join('\n')

  const tablolar = new Map<string, string>()
  for (const m of metin.matchAll(/create table (?:if not exists )?(?:public\.)?(\w+)\s*\(([\s\S]*?)\n\);/gi)) {
    if (!tablolar.has(m[1].toLowerCase())) tablolar.set(m[1].toLowerCase(), m[2])
  }

  const rlsAcik = new Set<string>()
  for (const m of metin.matchAll(/alter table (?:if exists )?(?:public\.)?(\w+) enable row level security/gi)) rlsAcik.add(m[1].toLowerCase())
  // DO blocks that loop over an array literal and `execute format('alter table %I enable row level security', t)`
  for (const blok of metin.matchAll(/do \$\$([\s\S]*?)\$\$;/gi)) {
    if (!/enable row level security/i.test(blok[1])) continue
    for (const dizi of blok[1].matchAll(/array\[([\s\S]*?)\]/gi)) {
      for (const s of dizi[1].matchAll(/'([a-z_0-9]+)(?::[a-z_]+)?'/gi)) rlsAcik.add(s[1].toLowerCase())
    }
  }

  it('doktor/hasta kolonu olan her tabloda RLS bir migration ile açılıyor', () => {
    const kolonlu = [...tablolar].filter(([, govde]) => /\b(patient_id|doctor_id|doktor_id|hasta_derm_id|konu_id)\b/i.test(govde)).map(([ad]) => ad)
    assert.ok(kolonlu.length > 80, `beklenenden az tablo ayrıştırıldı (${kolonlu.length}) — ayrıştırıcı bozulmuş olabilir`)
    const acik = kolonlu.filter((t) => !rlsAcik.has(t))
    assert.deepEqual(acik, [], `RLS açılmamış hasta/doktor tablosu — yeni migration'da 'enable row level security' + doktor politikası ekleyin (bkz. 052_hasta_izolasyon_rls.sql):\n${acik.join('\n')}`)
  })

  it('patient_id için restrictive hasta sahipliği politikası migration setinde duruyor', () => {
    assert.match(metin, /hasta_izolasyon_hasta_sahipligi[\s\S]*as restrictive/i)
  })
})
