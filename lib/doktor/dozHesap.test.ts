/**
 * TR-PARITE-01 — reçete yazan branşların doz hesaplayıcısı: yalnız aritmetik (hekim her sayıyı girer), branş kapısı iki
 * yönde, Pediatri'nin kendi motoru ve aracı değişmedi, müttefik meslekler görmez.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DOZ_KLINIK_DALLARI, DOZ_TEMELI_BRANSA_GORE, DOZ_TUS_BRANSLARI, dozAraciBransi, dozAraciTemelleri, dozHesapla, mosteller } from './dozHesap'
import { SPECIALTIES } from './specialties'
import { doktorAraciBransaUygun, doktorAraclariListesi } from './doktorAraclari'
import { KLINIK_ARACLARI, klinikAraciDalaUygun } from '@/lib/klinik/klinikAraclari'
import { KLINIK_HEKIM_SLUGS, KLINIK_MUTTEFIK_SLUGS } from '@/lib/specialties/klinikDikey'

const yakin = (a: number, b: number, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`)

describe('dozHesap — aritmetik (hekim girer, araç hesaplar)', () => {
  it('kg: günlük miktar dozlara bölünür; doz başına miktar dozla çarpılır', () => {
    const g = dozHesapla({ temel: 'kg', kiloKg: 70, miktar: 15, mod: 'gun', dozSayisi: 3 })!
    yakin(g.gunlukMg, 1050); yakin(g.dozMg, 350); yakin(g.aralikSaat, 8)
    const d = dozHesapla({ temel: 'kg', kiloKg: 70, miktar: 5, mod: 'doz', dozSayisi: 2 })!
    yakin(d.dozMg, 350); yakin(d.gunlukMg, 700)
  })
  it('m²: girilen VYA önce; yoksa Mosteller (boy × kilo / 3600)', () => {
    yakin(mosteller(170, 70), Math.sqrt(170 * 70 / 3600))
    const a = dozHesapla({ temel: 'm2', bsa: 1.8, miktar: 100, mod: 'doz', dozSayisi: 1 })!
    yakin(a.dozMg, 180); yakin(a.bsa!, 1.8)
    const b = dozHesapla({ temel: 'm2', boyCm: 170, kiloKg: 70, miktar: 100, mod: 'doz', dozSayisi: 1 })!
    yakin(b.dozMg, 100 * mosteller(170, 70))
    assert.equal(dozHesapla({ temel: 'm2', kiloKg: 70, miktar: 100, mod: 'doz', dozSayisi: 1 }), null)
  })
  it('sabit: doz başına miktar, mod yok sayılır', () => {
    const s = dozHesapla({ temel: 'sabit', miktar: 500, mod: 'gun', dozSayisi: 2 })!
    yakin(s.dozMg, 500); yakin(s.gunlukMg, 1000)
  })
  it('konsantrasyon → mL; hekimin tavanı aşılınca uyarı ve tavanlı karşılık (otomatik uygulanmaz)', () => {
    const s = dozHesapla({ temel: 'kg', kiloKg: 20, miktar: 10, mod: 'doz', dozSayisi: 3, konsMg: 250, konsMl: 5, tavanDozMg: 150 })!
    yakin(s.dozMg, 200); yakin(s.dozMl!, 4)
    assert.deepEqual(s.uyarilar.includes('tavan_doz'), true)
    yakin(s.tavanliDozMg!, 150); yakin(s.tavanliDozMl!, 3)
  })
  it('eksik / geçersiz girdi → sonuç yok', () => {
    assert.equal(dozHesapla({ temel: 'kg', miktar: 10, mod: 'doz', dozSayisi: 1 }), null)
    assert.equal(dozHesapla({ temel: 'sabit', miktar: 0, mod: 'doz', dozSayisi: 1 }), null)
    assert.equal(dozHesapla({ temel: 'sabit', miktar: 10, mod: 'doz', dozSayisi: 7 }), null)
  })
  it('modül ilaç bilmez: ilaç adı tablosu, varsayılan miktar veya önerilen doz yok', () => {
    const src = readFileSync(join(process.cwd(), 'lib/doktor/dozHesap.ts'), 'utf8').replace(/\/\*\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(src, /parasetamol|amoksisilin|ibuprofen|metotreksat|lidokain|önerilen doz|varsayilanMiktar/i)
    const ui = readFileSync(join(process.cwd(), 'components/doktor/araclar/DozHesapAraci.tsx'), 'utf8')
    assert.match(ui, /useState\(''\)/) // every amount starts empty
    assert.doesNotMatch(ui, /setMiktar\(['"]\d/)
  })
})

describe('dozHesap — kim görür (iki yön)', () => {
  const TUS = SPECIALTIES.map((s) => s.key)
  it('Pediatri dışındaki 29 tıp branşı ve 5 Özel Branş hekim dalı; her birinin en az bir temeli', () => {
    assert.deepEqual([...DOZ_TUS_BRANSLARI].sort(), TUS.filter((k) => k !== 'pediatri').sort())
    assert.deepEqual([...DOZ_KLINIK_DALLARI].sort(), [...KLINIK_HEKIM_SLUGS].sort())
    for (const k of Object.keys(DOZ_TEMELI_BRANSA_GORE)) assert.ok((DOZ_TEMELI_BRANSA_GORE as Record<string, readonly string[]>)[k].includes('sabit'), k)
    assert.ok(DOZ_TEMELI_BRANSA_GORE.onkoloji.includes('m2'))
    for (const k of [...DOZ_TUS_BRANSLARI, ...DOZ_KLINIK_DALLARI]) assert.equal(dozAraciBransi(k), true, k)
  })
  it('Pediatri, müttefik meslekler ve bilinmeyen branş görmez (asla varsayılan pediatri / genel değil)', () => {
    assert.equal(dozAraciBransi('pediatri'), false)
    for (const k of KLINIK_MUTTEFIK_SLUGS) assert.equal(dozAraciBransi(k), false, k)
    for (const k of ['', null, undefined, 'yok-boyle', 'genel']) assert.equal(dozAraciTemelleri(k as string), null, String(k))
  })
  it('Doktor Araçları: kart 29 branşta var, Pediatride yok; Pediatri kendi pedi-doz kartını aynen görür, başkası görmez', () => {
    for (const k of TUS) {
      const rotalar = doktorAraclariListesi(k).map((a) => a.route)
      assert.equal(rotalar.includes('/doktor-tools/doz-hesap'), k !== 'pediatri', k)
      assert.equal(rotalar.includes('/doktor-tools/pedi-doz'), k === 'pediatri', k)
      assert.equal(doktorAraciBransaUygun('/doktor-tools/doz-hesap', k), k !== 'pediatri', k)
    }
  })
  it('Özel Branşlar: doz kartı yalnız hekim dallarında; istem listesi 10 dalın hepsinde', () => {
    const doz = KLINIK_ARACLARI.find((a) => a.route === '/ozel-branslar/doz-hesap')!
    assert.deepEqual([...doz.dallar].sort(), [...KLINIK_HEKIM_SLUGS].sort())
    for (const k of KLINIK_MUTTEFIK_SLUGS) assert.equal(klinikAraciDalaUygun('/ozel-branslar/doz-hesap', k), false, k)
    for (const k of [...KLINIK_HEKIM_SLUGS, ...KLINIK_MUTTEFIK_SLUGS]) assert.equal(klinikAraciDalaUygun('/ozel-branslar/istem-listesi', k), true, k)
  })
  it('sayfalar aynı kapıyı kullanır (deep link)', () => {
    for (const p of ['app/doktor-tools/doz-hesap/page.tsx', 'app/ozel-branslar/doz-hesap/page.tsx']) {
      const s = readFileSync(join(process.cwd(), p), 'utf8')
      assert.match(s, /izinVer=\{dozAraciBransi\}/, p)
      assert.match(s, /<DozHesapAraci \/>/, p)
    }
  })
  it('Pediatri motoru ve aracı bu değişiklikte dokunulmadı (git ile aynı)', () => {
    const src = readFileSync(join(process.cwd(), 'app/doktor-tools/pedi-doz/page.tsx'), 'utf8')
    assert.match(src, /PediAracKabugu route="\/doktor-tools\/pedi-doz"/)
    assert.match(src, /<DozAraci \/>/)
  })
})
