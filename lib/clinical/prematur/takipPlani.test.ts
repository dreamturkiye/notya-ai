import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { planKapsami, takipPlani, type PlanGirdisi, type TakipOgesi } from './takipPlani'
import { PROTOKOL_TR, prematurProtokolu } from './protokolTR'
import { profilTemizle, type PrematurProtokol } from './protokol'

const g = (h: number, d = 0) => h * 7 + d
const plan = (o: Partial<PlanGirdisi> & Pick<PlanGirdisi, 'dogumIso' | 'bugunIso'>) =>
  takipPlani({ gestasyonGun: null, dogumKiloGr: null, profil: {}, ...o }, PROTOKOL_TR)
const oge = (p: { ogeler: TakipOgesi[] }, id: string) => p.ogeler.find((o) => o.id === id)

describe('takip planı — kapsam', () => {
  it('term bebek: plan yok, öğe yok', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(39), dogumKiloGr: 3200 })
    assert.equal(p.kapsamda, false)
    assert.deepEqual(p.ogeler, [])
    assert.equal(p.yas.buyume.duzeltilmis, false)
  })
  it('gestasyon ve ağırlık yok: kapsam dışı, eksik veri listelenir', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-02-01' })
    assert.equal(p.kapsamda, false)
    assert.deepEqual(p.eksikVeri, ['Doğumdaki gestasyon haftası', 'Doğum ağırlığı'])
  })
  it('SGA term bebek ≤ 1500 g kapsamda: ROP kriteri karşılanır, düzeltme uygulanmaz, kraniyal USG kriter dışı', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-10', gestasyonGun: g(38), dogumKiloGr: 1400 })
    assert.equal(p.kapsamda, true)
    assert.equal(p.yas.buyume.duzeltilmis, false)
    assert.equal(oge(p, 'rop:ilk-4hf')?.kriter.durum, 'karsilandi')
    assert.equal(oge(p, 'kraniyal-usg:ilk')?.durum, 'kriter-disi')
  })
  it('kapsam: 36+6 içeride, 37+0 dışarıda (kilo yok)', () => {
    assert.equal(planKapsami(g(36, 6), null, PROTOKOL_TR).kapsamda, true)
    assert.equal(planKapsami(g(37), null, PROTOKOL_TR).kapsamda, false)
    assert.equal(planKapsami(g(37), 1500, PROTOKOL_TR).kapsamda, true)
    assert.equal(planKapsami(g(37), 1501, PROTOKOL_TR).kapsamda, false)
  })
  it('kronolojik 36. aydan sonra plan gösterilmez', () => {
    assert.equal(plan({ dogumIso: '2023-01-01', bugunIso: '2026-01-01', gestasyonGun: g(28) }).kapsamda, false)
  })
})

describe('takip planı — tarih üretimi (TOD/TND ROP, kraniyal USG)', () => {
  const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-20', gestasyonGun: g(28), dogumKiloGr: 1100 })
  it('ROP: gestasyon ≥ 27 → postnatal 4. hafta (doğum + 28 gün)', () => {
    const r = oge(p, 'rop:ilk-4hf')!
    assert.equal(r.bas, '2026-01-29')
    assert.equal(r.durum, 'yaklasiyor')
    assert.ok(!oge(p, 'rop:ilk-pma'), 'PMA zamanlaması bu bebekte üretilmez')
    assert.ok(r.kaynaklar.length >= 2 && r.kaynaklar.every((k) => k.kisa && k.tam && k.durum))
  })
  it('ROP: gestasyon < 27 → postmenstrüel 30–31. hafta (25+0 → doğum + 35..42 gün)', () => {
    const q = plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-20', gestasyonGun: g(25), dogumKiloGr: 700 })
    const r = oge(q, 'rop:ilk-pma')!
    assert.equal(r.bas, '2026-02-05')
    assert.equal(r.son, '2026-02-12')
    assert.ok(!oge(q, 'rop:ilk-4hf'))
  })
  it('ROP sınırı: 26+6 → PMA, 27+0 → 4. hafta', () => {
    assert.ok(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-05', gestasyonGun: g(26, 6) }), 'rop:ilk-pma'))
    assert.ok(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-05', gestasyonGun: g(27, 0) }), 'rop:ilk-4hf'))
  })
  it('ROP: gestasyon bilinmiyor + ≤ 1500 g → 4. hafta varsayımla gösterilir (not düşer)', () => {
    const q = plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-05', dogumKiloGr: 1200 })
    const r = oge(q, 'rop:ilk-4hf')!
    assert.equal(r.bas, '2026-01-29')
    assert.match(r.not || '', /bilinmiyor/)
  })
  it('kraniyal USG: ≤ 30 hafta; 7–10. gün, 4–6. hafta, PMA 36–40', () => {
    const a = oge(p, 'kraniyal-usg:ilk')!
    assert.equal(a.bas, '2026-01-08'); assert.equal(a.son, '2026-01-11'); assert.equal(a.durum, 'gecikti')
    const b = oge(p, 'kraniyal-usg:tekrar')!
    assert.equal(b.bas, '2026-01-29'); assert.equal(b.son, '2026-02-12')
    const c = oge(p, 'kraniyal-usg:term')!
    assert.equal(c.bas, '2026-02-26') // 36*7 − 196 = 56 gün
    assert.equal(c.son, '2026-03-26') // 40*7 − 196 = 84 gün
  })
  it('kraniyal USG: 31+0 kriter dışı', () => {
    const q = plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-20', gestasyonGun: g(31), dogumKiloGr: 1600 })
    assert.equal(oge(q, 'kraniyal-usg:ilk')?.durum, 'kriter-disi')
  })
  it('demir: preterm → 2. ay penceresi (gün 60–212)', () => {
    const d = oge(p, 'demir:baslangic')!
    assert.equal(d.bas, '2026-03-02'); assert.equal(d.son, '2026-08-01')
  })
  it('tarihler ay sonu / artık yıl sınırlarında doğru', () => {
    const q = plan({ dogumIso: '2024-01-31', bugunIso: '2024-02-10', gestasyonGun: g(28) })
    assert.equal(oge(q, 'isitme-9ay:degerlendirme')?.kriter.durum, 'belirsiz') // nicu günü bilinmiyor
    const r = plan({ dogumIso: '2024-01-31', bugunIso: '2024-02-10', gestasyonGun: g(28), profil: { nicuGun: 40 } })
    assert.equal(oge(r, 'isitme-9ay:degerlendirme')?.son, '2024-10-31')
    assert.equal(oge(r, 'isitme-9ay:izlem-24ay')?.bas, '2026-01-31')
  })
})

describe('takip planı — durum, gürültü, hekim onayı', () => {
  it('geçmiş ve kayıtsız: 180 güne kadar gecikti, sonra kayıt eksik', () => {
    const yeni = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(28) })
    assert.equal(oge(yeni, 'kraniyal-usg:ilk')?.durum, 'gecikti')
    const eski = plan({ dogumIso: '2025-01-01', bugunIso: '2025-12-01', gestasyonGun: g(28) })
    assert.equal(oge(eski, 'kraniyal-usg:ilk')?.durum, 'kayit-eksik')
    assert.equal(eski.ozet.kayitEksik > 0, true)
  })
  it('hekim "yapıldı" ve "uygulanmaz" işaretleri durumu geçersiz kılar; gecikme sayılmaz', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(28), durumlar: { 'kraniyal-usg:ilk': { durum: 'yapildi', tarih: '2026-01-09' }, 'kraniyal-usg:tekrar': { durum: 'uygulanmaz' } } })
    assert.equal(oge(p, 'kraniyal-usg:ilk')?.durum, 'yapildi')
    assert.equal(oge(p, 'kraniyal-usg:tekrar')?.durum, 'uygulanmaz')
    assert.equal(oge(p, 'kraniyal-usg:ilk')?.hekim?.tarih, '2026-01-09')
  })
  it('"plana alındı" durumu tarih durumunu değiştirmez', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(28), durumlar: { 'kraniyal-usg:ilk': { durum: 'plana_alindi' } } })
    assert.equal(oge(p, 'kraniyal-usg:ilk')?.durum, 'gecikti')
    assert.equal(oge(p, 'kraniyal-usg:ilk')?.hekim?.durum, 'plana_alindi')
  })
  it('mevcut ROP kaydı ilk muayeneyi otomatik kapatır', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(28), mevcutKayitlar: { rop: ['2026-02-03'] } })
    assert.equal(oge(p, 'rop:ilk-4hf')?.durum, 'yapildi')
    assert.equal(oge(p, 'rop:ilk-4hf')?.otomatikKayit, '2026-02-03')
  })
  it('hekimin işareti yoksa hiçbir öğe kendiliğinden "yapıldı/onaylandı" olmaz', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(28) })
    assert.ok(p.ogeler.every((o) => o.hekim === null))
    assert.ok(p.ogeler.every((o) => o.durum !== 'yapildi'))
  })
  it('özet yalnız kriteri karşılanan öğeleri sayar', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-01-20', gestasyonGun: g(28), dogumKiloGr: 1100 })
    assert.equal(p.ozet.gecikti, 1) // ilk kraniyal USG
    assert.ok(p.ozet.yaklasiyor >= 2)
  })
})

describe('takip planı — kriter: karşılandı / karşılanmadı / belirsiz', () => {
  it('RSV (AAP 2014): < 29 hf ve < 12 ay → karşılandı', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-06-01', gestasyonGun: g(27) })
    assert.equal(oge(p, 'rsv:bilgi')?.kriter.durum, 'karsilandi')
    assert.equal(oge(p, 'rsv:bilgi')?.durum, 'bilgi')
  })
  it('RSV: 28+6 karşılar, 29+0 karşılamaz (KAH / KKH yoksa)', () => {
    const ek = { profil: { oksijen28Gun: false, hsKkh: false } }
    assert.equal(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(28, 6), ...ek }), 'rsv:bilgi')?.kriter.durum, 'karsilandi')
    assert.equal(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(29, 0), ...ek }), 'rsv:bilgi')?.kriter.durum, 'karsilanmadi')
  })
  it('RSV: yaş ≥ 12 ay → < 29 hf kriteri düşer', () => {
    const p = plan({ dogumIso: '2025-01-01', bugunIso: '2026-02-01', gestasyonGun: g(27), profil: { oksijen28Gun: false, hsKkh: false } })
    assert.equal(oge(p, 'rsv:bilgi')?.kriter.durum, 'karsilanmadi')
  })
  it('RSV: KAH (< 32 hf + 28 gün oksijen) karşılar; oksijen bilinmiyorsa ve başka yol yoksa belirsiz', () => {
    const a = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(30), profil: { oksijen28Gun: true, hsKkh: false } })
    assert.equal(oge(a, 'rsv:bilgi')?.kriter.durum, 'karsilandi')
    const b = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(30) })
    assert.equal(oge(b, 'rsv:bilgi')?.kriter.durum, 'belirsiz')
    assert.equal(oge(b, 'rsv:bilgi')?.durum, 'veri-eksik')
  })
  it('BPD/KAH kriteri: < 32 hf + oksijen', () => {
    assert.equal(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29), profil: { oksijen28Gun: true } }), 'bpd-kah:bilgi')?.kriter.durum, 'karsilandi')
    assert.equal(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(32), profil: { oksijen28Gun: true } }), 'bpd-kah:bilgi')?.kriter.durum, 'karsilanmadi')
    assert.equal(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29) }), 'bpd-kah:bilgi')?.kriter.durum, 'belirsiz')
  })
  it('işitme (JCIH 2019): NICU > 5 gün; tam 5 gün karşılamaz; ECMO → 3. ay', () => {
    assert.equal(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(30), profil: { nicuGun: 6 } }), 'isitme-9ay:degerlendirme')?.kriter.durum, 'karsilandi')
    assert.equal(oge(plan({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(30), profil: { nicuGun: 5, ototoksik5Gun: false, degisimTransfuzyonu: false } }), 'isitme-9ay:degerlendirme')?.kriter.durum, 'karsilanmadi')
    const e = plan({ dogumIso: '2026-01-01', bugunIso: '2026-02-01', gestasyonGun: g(30), profil: { ecmo: true } })
    assert.equal(oge(e, 'isitme-ecmo:degerlendirme')?.son, '2026-04-01')
  })
  it('tarihsiz kurallar (BPD, RSV, kemik) tarih üretmez', () => {
    const p = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29), profil: { oksijen28Gun: true } })
    for (const k of ['bpd-kah:bilgi', 'rsv:bilgi', 'kemik:bilgi']) {
      const o = oge(p, k)!
      assert.equal(o.bas, null); assert.equal(o.son, null); assert.equal(o.hedef, null)
    }
  })
  it('hekim notu / kriter girdisi dışındaki KD alanları (steroid, PPROM) kuralı etkilemez', () => {
    const a = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29), profil: { antenatalSteroid: true, pprom: true, magnezyum: true } })
    const b = plan({ dogumIso: '2026-01-01', bugunIso: '2026-03-01', gestasyonGun: g(29), profil: {} })
    assert.deepEqual(a.ogeler.map((o) => [o.id, o.durum, o.kriter.durum]), b.ogeler.map((o) => [o.id, o.durum, o.kriter.durum]))
  })
})

describe('protokol — ülkeden bağımsız motor, enjekte edilen tablo', () => {
  /** Test için ikinci protokol: AAP 2018 ROP tablosu (Fierson 2018, Tablo 1 — birincil metinden okundu). */
  const AAP_ROP: PrematurProtokol = {
    ...PROTOKOL_TR, ulke: 'xx', ad: 'Test (AAP 2018 ROP)',
    kurallar: [{
      kod: 'rop', kategori: 'goz', baslik: 'ROP', aciklama: 'AAP 2018',
      kriter: { herhangiBiri: [[{ alan: 'gestasyonHafta', op: '<=', deger: 30, etiket: 'GA ≤ 30' }], [{ alan: 'dogumKiloGr', op: '<=', deger: 1500, etiket: 'DA ≤ 1500' }]] },
      zamanlamalar: [
        { kod: 'ilk-24', etiket: '24 hf: PMA 31', kosul: [{ alan: 'gestasyonHafta', op: '<', deger: 27, etiket: '< 27' }], bas: { tur: 'pma-hafta', hafta: 31 } },
        { kod: 'ilk-27', etiket: '27–30 hf: 4. hafta', kosul: [{ alan: 'gestasyonHafta', op: '>=', deger: 27, etiket: '≥ 27' }], bas: { tur: 'dogumdan-hafta', hafta: 4 } },
      ],
      kaynaklar: [{ kisa: 'AAP 2018', tam: 'Fierson 2018', durum: 'birincil-okundu' }],
    }],
  }
  it('aynı motor, başka ülke tablosu: yalnız tablo değişir', () => {
    const girdi: PlanGirdisi = { dogumIso: '2026-01-01', bugunIso: '2026-01-10', gestasyonGun: g(24), dogumKiloGr: 600, profil: {} }
    const p = takipPlani(girdi, AAP_ROP)
    assert.deepEqual(p.ogeler.map((o) => o.id), ['rop:ilk-24'])
    assert.equal(p.ogeler[0].bas, '2026-02-19') // 31*7 − 168 = 49 gün
    const tr = takipPlani(girdi, PROTOKOL_TR)
    assert.notDeepEqual(tr.ogeler.map((o) => o.id), p.ogeler.map((o) => o.id))
  })
  it('motor dosyaları ülkeye özgü sabit / kurum adı içermez', () => {
    for (const f of ['takipPlani.ts', 'duzeltilmisYas.ts', 'protokol.ts']) {
      const s = readFileSync(join(__dirname, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      assert.doesNotMatch(s, /SGK|TND|TOD\b|Sağlık Bakanlığı|Türkiye|KVKK|e-Nabız/, `${f} ülkeye özgü terim içeriyor`)
    }
  })
  it('bilinmeyen ülke Türkiye tablosuna düşer (sessizce başka tablo uydurmaz)', () => {
    assert.equal(prematurProtokolu('zz').ulke, 'tr')
    assert.equal(prematurProtokolu('tr').ulke, 'tr')
  })
})

describe('protokol — kaynak ve içerik denetimi (Türkiye tablosu)', () => {
  it('her kural en az bir kaynak taşır; her kaynağın doğrulama düzeyi yazılı', () => {
    for (const k of PROTOKOL_TR.kurallar) {
      assert.ok(k.kaynaklar.length >= 1, `${k.kod}: kaynak yok`)
      for (const s of k.kaynaklar) {
        assert.ok(s.kisa.length > 3 && s.tam.length > 20, `${k.kod}: kaynak künyesi eksik`)
        assert.ok(['birincil-okundu', 'ikincil-ozet', 'dogrulanmadi'].includes(s.durum))
      }
      for (const z of k.zamanlamalar) assert.ok(z.etiket.length > 5 && z.kod, `${k.kod}/${z.kod}`)
    }
  })
  it('doğrulanmamış kaynaktan tarih/eşik üretilmez: yalnız "dogrulanmadi" kaynaklı kurallar tarihsizdir', () => {
    for (const k of PROTOKOL_TR.kurallar) {
      if (k.kaynaklar.every((s) => s.durum === 'dogrulanmadi')) assert.equal(k.zamanlamalar.length, 0, `${k.kod} doğrulanmamış kaynakla tarih üretiyor`)
    }
  })
  it('ROP kuralı birincil okunmuş iki kaynağa dayanır', () => {
    const rop = PROTOKOL_TR.kurallar.find((k) => k.kod === 'rop')!
    assert.equal(rop.kaynaklar.filter((s) => s.durum === 'birincil-okundu').length, 2)
  })
  it('hiçbir kural metni doz içermez (mg, mg/kg, IU, mL)', () => {
    const metin = JSON.stringify(PROTOKOL_TR)
    assert.doesNotMatch(metin, /\bmg\b|mg\/kg|\bIU\b|\bIÜ\b|\bmL\b|\bmcg\b/i)
  })
  it('hiçbir kural emir / sipariş dili kullanmaz', () => {
    const metin = JSON.stringify(PROTOKOL_TR.kurallar.map((k) => [k.aciklama, k.hekimNotu, k.zamanlamalar.map((z) => z.etiket)]))
    assert.doesNotMatch(metin, /\b(başlayın|verin|uygulayın|isteyin|sipariş)\b/i)
  })
})

describe('profil temizleme', () => {
  it('sınır dışı ve yanlış türleri null yapar', () => {
    const p = profilTemizle({ gestasyonHafta: 19, dogumKiloGr: '1850', nicuGun: -3, ecmo: 'true', hsKkh: 'evet', kaynak: 'x', baska: 1 })
    assert.equal(p.gestasyonHafta, null)
    assert.equal(p.dogumKiloGr, 1850)
    assert.equal(p.nicuGun, null)
    assert.equal(p.ecmo, true)
    assert.equal(p.hsKkh, null)
    assert.equal(p.kaynak, null)
    assert.ok(!('baska' in p))
  })
  it('null / dizi / metin girdisi boş profil verir', () => {
    for (const v of [null, undefined, [], 'x', 5]) assert.equal(profilTemizle(v).gestasyonHafta, null)
  })
})
