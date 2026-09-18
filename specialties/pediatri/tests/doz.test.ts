/**
 * PEDI-ARACLAR-01 — Doz hesaplayıcı: yalnız aritmetik (kurucu kısıtı). İlaç adı / varsayılan mg/kg / doz veritabanı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { dozHesapla, konsantrasyonCoz, dozOzetMetni } from '../engines/doz'

const yakin = (a: number | null | undefined, b: number, e = 1e-9) => assert.ok(a != null && Math.abs(a - b) < e, `${a} ≈ ${b}`)

describe('konsantrasyon biçimleri', () => {
  it('şişe etiketi yazımları', () => {
    yakin(konsantrasyonCoz('250 mg/5 mL')!.mgPerMl, 50)
    yakin(konsantrasyonCoz('250mg/5ml')!.mgPerMl, 50)
    yakin(konsantrasyonCoz('250/5')!.mgPerMl, 50)
    yakin(konsantrasyonCoz('40 mg/mL')!.mgPerMl, 40)
    yakin(konsantrasyonCoz('100 mg / 5 ml')!.mgPerMl, 20)
    yakin(konsantrasyonCoz('125 mg 5 ml')!.mgPerMl, 25)
    yakin(konsantrasyonCoz('156,25 mg/5 mL')!.mgPerMl, 31.25)
    assert.equal(konsantrasyonCoz(''), null)
    assert.equal(konsantrasyonCoz('şurup'), null)
    assert.equal(konsantrasyonCoz('0/5'), null)
  })
})

describe('doz aritmetiği', () => {
  it('mg/kg/gün → doz başına mg ve mL', () => {
    const s = dozHesapla({ kiloKg: 18, mgKg: 40, mod: 'gun', dozSayisi: 3, konsantrasyon: konsantrasyonCoz('250 mg/5 mL') })!
    yakin(s.gunlukMg, 720); yakin(s.dozMg, 240); yakin(s.dozMl, 4.8); yakin(s.dozMlYuvarlak, 4.8, 1e-9); yakin(s.gunlukMl, 14.4)
    assert.equal(s.aralikSaat, 8)
    assert.equal(s.tavanli, null)
    assert.deepEqual(s.uyarilar, [])
  })
  it('mg/kg/doz → günlük toplam', () => {
    const s = dozHesapla({ kiloKg: 10, mgKg: 15, mod: 'doz', dozSayisi: 4 })!
    yakin(s.dozMg, 150); yakin(s.gunlukMg, 600)
    assert.equal(s.dozMl, null)
  })
  it('hekim tavanı: aşım uyarısı + sınırlanmış karşılık, otomatik uygulanmaz', () => {
    const s = dozHesapla({ kiloKg: 30, mgKg: 40, mod: 'gun', dozSayisi: 2, konsantrasyon: konsantrasyonCoz('250 mg/5 mL'), tavanDozMg: 500 })!
    yakin(s.dozMg, 600) // hesap değişmez
    yakin(s.tavanli!.dozMg, 500); yakin(s.tavanli!.dozMl, 10)
    assert.ok(s.uyarilar.some((u) => u.kod === 'tavan_doz'))
    const g = dozHesapla({ kiloKg: 30, mgKg: 40, mod: 'gun', dozSayisi: 3, tavanGunMg: 900 })!
    yakin(g.tavanli!.dozMg, 300); yakin(g.tavanli!.gunlukMg, 900)
    assert.ok(g.uyarilar.some((u) => u.kod === 'tavan_gun'))
    const yok = dozHesapla({ kiloKg: 30, mgKg: 10, mod: 'gun', dozSayisi: 3, tavanDozMg: 500, tavanGunMg: 2000 })!
    assert.equal(yok.tavanli, null)
  })
  it('mL yuvarlama adımı ve küçük hacim uyarısı', () => {
    const s = dozHesapla({ kiloKg: 7.3, mgKg: 15, mod: 'doz', dozSayisi: 4, konsantrasyon: konsantrasyonCoz('120 mg/5 mL'), mlAdim: 0.5 })!
    yakin(s.dozMl, 4.5625); yakin(s.dozMlYuvarlak, 4.5)
    const k = dozHesapla({ kiloKg: 3, mgKg: 1, mod: 'doz', dozSayisi: 1, konsantrasyon: konsantrasyonCoz('100 mg/mL') })!
    assert.ok(k.uyarilar.some((u) => u.kod === 'ml_kucuk'))
  })
  it('eksik veya geçersiz girdi → null (sonuç kartı "girin" der)', () => {
    assert.equal(dozHesapla({ kiloKg: null, mgKg: 40, mod: 'gun', dozSayisi: 3 }), null)
    assert.equal(dozHesapla({ kiloKg: 18, mgKg: null, mod: 'gun', dozSayisi: 3 }), null)
    assert.equal(dozHesapla({ kiloKg: 18, mgKg: 40, mod: 'gun', dozSayisi: 0 }), null)
  })
  it('kopyalanan özet: hekimin girdileri + taslak dili', () => {
    const g = { kiloKg: 18, mgKg: 40, mod: 'gun' as const, dozSayisi: 3, konsantrasyon: konsantrasyonCoz('250 mg/5 mL') }
    const m = dozOzetMetni(g, dozHesapla(g)!)
    assert.match(m, /hekim girdisiyle, taslak — hekim onaylar/)
    assert.match(m, /240 mg\/doz/)
    assert.match(m, /4,8 mL\/doz/)
  })
})

describe('kilit: araç yalnız hesap makinesi — ilaç listesi, varsayılan mg/kg, doz önerisi yok', () => {
  const kok = join(import.meta.dirname, '../../..')
  const dosyalar = ['specialties/pediatri/engines/doz.ts', 'specialties/pediatri/ui/araclar/DozAraci.tsx', 'app/doktor-tools/pedi-doz/page.tsx']
  const kaynak = dosyalar.map((d) => readFileSync(join(kok, d), 'utf8')).join('\n').toLocaleLowerCase('tr-TR')
  it('hiçbir ilaç / etken madde adı yok', () => {
    for (const ad of ['parasetamol', 'asetaminofen', 'ibuprofen', 'amoksisilin', 'amoxicillin', 'klavulan', 'sefiksim', 'sefuroksim', 'sefdinir', 'azitromisin', 'klaritromisin', 'metronidazol', 'trimetoprim', 'setirizin', 'desloratadin', 'ondansetron', 'prednizolon', 'deksametazon', 'salbutamol', 'demir', 'vitamin', 'fosfomisin', 'nistatin', 'domperidon']) {
      assert.ok(!kaynak.includes(ad), `doz aracı "${ad}" içeriyor`)
    }
  })
  it('mg/kg ve konsantrasyon boş başlar; tavan yalnız hekim girerse', () => {
    const ui = readFileSync(join(kok, 'specialties/pediatri/ui/araclar/DozAraci.tsx'), 'utf8')
    assert.match(ui, /const \[mgKgHam, setMgKgHam\] = useState\(''\)/)
    assert.match(ui, /const \[konsHam, setKonsHam\] = useState\(''\)/)
    assert.match(ui, /const \[tavanDozHam, setTavanDozHam\] = useState\(''\)/)
    assert.doesNotMatch(ui, /fetch\([^)]*(ilac|recete|asistan|groq|anthropic)/i, 'doz aracı ilaç/model servisine gitmez')
    const motor = readFileSync(join(kok, 'specialties/pediatri/engines/doz.ts'), 'utf8')
    assert.doesNotMatch(motor, /^import (?!.*\.\/girdi)/m, 'motor yalnız girdi yardımcısını içe aktarır')
  })
})
