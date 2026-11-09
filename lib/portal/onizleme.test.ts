/**
 * TR-PARITE-01 — hasta portalı önizlemesi: 40 branşın her biri yalnız kendi modülleriyle ve kendi örnek dilimiyle;
 * başka branşın dilimi yok (iki yön); Pediatri'ye özgü modüller başka branşta yok; çocuk branşları dışında örnek hasta
 * yetişkin (veli dili yok); branş URL'den değil hekimin profilinden; üretilmiş dilim kurucusu canlı rotayla aynı.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { onizlemePaketi, onizlemeBransi, ORNEK_GOREV_KODLARI } from './onizleme'
import { ONIZLEME_GOREV_MODULLERI } from './onizlemeDilimleri'
import { portalModulleri } from './moduller'
import { emptyPortalBundle } from './emptyBundle'
import { SPECIALTIES } from '@/lib/doktor/specialties'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'

const BUGUN = '2026-11-09'
const TUS = SPECIALTIES.map((s) => s.key)
const KIRK: string[] = [...TUS, ...KLINIK_YENI_SLUGS]
const KOK = process.cwd()
const DILIM_ANAHTARLARI = Object.keys(emptyPortalBundle()).filter((k) => !['summary', 'messages', 'visits', 'results', 'medications', 'medicationHistory', 'history', 'tracking', 'yonlendirmeler', 'hekim', 'hasta', 'portal'].includes(k))

/** module id → bundle slice key, read from the live route itself (every `bundle.X = {` inside that module's block). */
function rotaDilimHaritasi(): Record<string, string> {
  const src = readFileSync(join(KOK, 'app/api/portal/hasta/[token]/route.ts'), 'utf8')
  const out: Record<string, string> = {}
  const re = /if \(modulAktif\('([^']+)'\)[^\n]*\n([\s\S]*?)\n  \} catch/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) { const k = /bundle\.(\w+) = \{/.exec(m[2]); if (k) out[m[1]] = k[1] }
  return out
}

describe('portal önizlemesi — 40 branş', () => {
  it('her branş için paket var, "ornek" işaretli, modüller canlı çözücüyle aynı', () => {
    for (const b of KIRK) {
      const p = onizlemePaketi(b, BUGUN)
      assert.ok(p, b)
      assert.equal(p!.ornek, true)
      assert.equal(p!.hasta.adSoyad, 'Örnek Hasta', b)
      const cocuk = b === 'pediatri' || b === 'cocuk-cerrahisi'
      const beklenen = portalModulleri({ doktorBransi: b, hastaYasYil: cocuk ? 6 : 46, gebelikAktif: b === 'kadin-hastaliklari-dogum', kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false })
      assert.deepEqual(p!.portal, beklenen, b)
    }
  })

  it('her branşın kendi dilimi dolu, başka hiçbir branşın dilimi yok (iki yön)', () => {
    const harita: Record<string, string> = { ...rotaDilimHaritasi(), dermatoloji: 'deri', dahiliye: 'kronik', gozlerim: 'goz', gebelik: 'gebelik', jinekoloji: 'jinekoloji' }
    for (const b of KIRK) {
      const p = onizlemePaketi(b, BUGUN)! as unknown as Record<string, unknown>
      const izinli = new Set<string>()
      if ((KLINIK_YENI_SLUGS as readonly string[]).includes(b)) izinli.add('ozelPlan')
      for (const m of (p.portal as { moduller: string[] }).moduller) if (harita[m]) izinli.add(harita[m])
      if (b === 'pediatri') izinli.add('buyume')
      for (const k of DILIM_ANAHTARLARI) if (p[k] != null) assert.ok(izinli.has(k), `${b}: başka branşın dilimi "${k}"`)
      // the branch's own module has content
      assert.ok([...izinli].some((k) => p[k] != null), `${b}: kendi dilimi boş`)
    }
  })

  it('Pediatriye özgü modüller (büyüme, aşı onamı) yalnız Pediatride; çocuk cerrahisi bile almaz', () => {
    for (const b of KIRK) {
      const m = onizlemePaketi(b, BUGUN)!.portal.moduller as string[]
      assert.equal(m.includes('asi-onam'), b === 'pediatri', b)
      assert.equal(m.includes('buyume'), b === 'pediatri', b)
    }
  })

  it('çocuk branşları dışında örnek hasta yetişkin: hiçbir metinde veli / Neyzi / hedef boy yok', () => {
    for (const b of KIRK.filter((x) => x !== 'pediatri' && x !== 'cocuk-cerrahisi')) {
      const metin = JSON.stringify(onizlemePaketi(b, BUGUN))
      assert.doesNotMatch(metin, /\bveli\b|Neyzi|hedef boy|baş çevresi|aşı onam/i, b)
    }
  })

  it('görev kodlu her modülün örnekleri motorunda ayrı başlıklara düşer; kod ekranda görünmez', () => {
    assert.deepEqual(Object.keys(ORNEK_GOREV_KODLARI).sort(), [...ONIZLEME_GOREV_MODULLERI].sort())
    const harita = rotaDilimHaritasi()
    for (const b of TUS) {
      const p = onizlemePaketi(b, BUGUN)! as unknown as Record<string, { hatirlatmalar?: Array<{ ad: string }> } | null>
      for (const m of ONIZLEME_GOREV_MODULLERI) {
        const k = harita[m]
        const d = p[k]
        if (!d?.hatirlatmalar) continue
        const adlar = d.hatirlatmalar.map((h) => h.ad)
        for (const kod of ORNEK_GOREV_KODLARI[m]) assert.ok(!adlar.includes(kod), `${m}: kod "${kod}" başlık olarak görünüyor`)
        assert.ok(new Set(adlar).size >= 2, `${b}/${m}: örnek başlıklar`)
      }
    }
  })

  it('bilinmeyen / boş branş → önizleme yok (asla pediatri); eski değerler doğru branşa', () => {
    for (const h of ['', null, undefined, 'yok-boyle', 'genel']) assert.equal(onizlemePaketi(h as string, BUGUN), null, String(h))
    assert.equal(onizlemeBransi('kadin-dogum')?.anahtar, 'kadin-hastaliklari-dogum')
    assert.equal(onizlemeBransi('Dermatoloji')?.anahtar, 'dermatoloji')
  })
})

describe('portal önizlemesi — sayfa ve canlı rota ile senkron', () => {
  it('branş hekimin profilinden çözülür, URL\'den değil; canlı sayfaların aynısı çizilir; gönderen sayfalar kapalı', () => {
    const src = readFileSync(join(KOK, 'app/portal/onizleme/[[...yol]]/page.tsx'), 'utf8')
    assert.match(src, /onizlemePaketi\(j\?\.data\?\.specialty/)
    assert.doesNotMatch(src, /onizlemePaketi\(params/)
    assert.match(src, /PortalOnizlemeProvider/)
    assert.match(src, /import\('@\/app\/portal\/hasta\/\[token\]\/kalbim\/page'\)/)
    for (const kapali of ['mesajlar', 'randevu', 'takip', 'on-anket', 'asi-onam', 'asi-karnesi']) assert.doesNotMatch(src, new RegExp(`'${kapali}': dynamic`), kapali)
    assert.match(src, /data-ornek="evet"/)
  })

  it('üretilmiş dilim kurucusu canlı rotanın aynı bloklarını taşır: her modülde aynı dilim anahtarı ve aynı alanlar', () => {
    const rota = readFileSync(join(KOK, 'app/api/portal/hasta/[token]/route.ts'), 'utf8')
    const uretilen = readFileSync(join(KOK, 'lib/portal/onizlemeDilimleri.ts'), 'utf8')
    const alanlar = (src: string, kapi: RegExp, mod: string) => {
      const re = new RegExp(kapi.source.replace('MOD', mod) + "[^\\n]*\\n([\\s\\S]*?)\\n  \\} catch")
      const b = re.exec(src)?.[1] || ''
      const m = /bundle\.(\w+) = \{([\s\S]*?)\n    \}/.exec(b)
      return m ? `${m[1]}:${[...m[2].matchAll(/^\s{6}(\w+):/gm)].map((x) => x[1]).join(',')}` : ''
    }
    for (const mod of ONIZLEME_GOREV_MODULLERI) {
      const a = alanlar(rota, /if \(modulAktif\('MOD'\)\)/, mod)
      assert.ok(a, mod)
      assert.equal(alanlar(uretilen, /if \(aktif\.has\('MOD'\)\)/, mod), a, `${mod}: canlı rota değişti — lib/portal/onizlemeDilimleri.ts yeniden üretilmeli`)
    }
  })

  it('giriş noktaları: Doktor Araçları ve Özel Branşlar hasta portalı ekranında önizleme bağlantısı', () => {
    for (const p of ['app/doktor-tools/hasta-portali/page.tsx', 'components/klinik/KlinikHastaPortaliPaneli.tsx']) assert.match(readFileSync(join(KOK, p), 'utf8'), /href="\/portal\/onizleme"/, p)
  })
})
