import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fusionYap } from './fusion'
import {
  ekoAseDegerlendir,
  ekoDogrulamayiUygula,
  ekoMetniMi,
  ekoMotorRaporu,
  ekoOlcumSatirlari,
  ekoRaporunuZenginlestir,
} from './ekoAse'
import type { BelgeRaporu } from './types'

function kodlar(metin: string, cinsiyet?: 'K' | 'E' | null, yasAy?: number | null) {
  const m = ekoAseDegerlendir({ metin, cinsiyet: cinsiyet ?? null, yasAy: yasAy ?? null, girdi: 'pdf' })
  ekoDogrulamayiUygula(m)
  return m
}

const TTE = `
Transtorasik ekokardiyografi
Sol ventrikül: EF (Simpson) %55-60. IVS 11 mm, PW 10 mm.
Sol atriyum volüm indeksi (LAVI) 38 ml/m2.
Ortalama E/e' 16.
TAPSE 16 mm.
Aort kapak: darlık. Kapak alanı 0.8 cm2. Ortalama gradyan 45 mmHg. Vmax 4.3 m/s.
Mitral yetmezlik: hafif.
Triküspid yetmezlik: ileri.
Perikardiyal efüzyon izlenmedi.
PASP 44 mmHg.
`

describe('eko-ase ölçüm dökümü', () => {
  it('erkek TTE: düşük EF değil, duvar / LAVI / E/e / TAPSE / ileri AS / TY / PASP', () => {
    const m = kodlar(TTE, 'E', 60 * 12)
    const kod = m.labels.map((l) => l.kod).sort()
    assert.deepEqual(kod, ['ECHO.AS_SEVERE', 'ECHO.DIASTOLIK', 'ECHO.LAE', 'ECHO.LVH', 'ECHO.PH', 'ECHO.TAPSE_LOW', 'ECHO.TR_SEVERE'])
    assert.equal(m.dogrulanmis, true)
    assert.ok(ekoOlcumSatirlari(m).some((s) => s.includes('55-60') && s.includes('korunmuş')))
    assert.equal(m.labels.some((l) => l.kod === 'ECHO.EF_LOW' || l.kod === 'ECHO.MR_SEVERE' || l.kod === 'ECHO.EFF'), false)
  })

  it('kadında EF %53 düşük, erkekte %52 korunmuş, cinsiyet yokken %51 düşük denmez', () => {
    assert.ok(kodlar('Ekokardiyografi. EF %53.', 'K').labels.some((l) => l.kod === 'ECHO.EF_LOW'))
    assert.equal(kodlar('Ekokardiyografi. EF %52.', 'E').labels.some((l) => l.kod === 'ECHO.EF_LOW'), false)
    const belirsiz = kodlar('Ekokardiyografi. EF %51.', null)
    assert.equal(belirsiz.labels.some((l) => l.kod === 'ECHO.EF_LOW'), false)
    assert.ok(kodlar('Ekokardiyografi. EF %49.', null).labels.some((l) => l.kod === 'ECHO.EF_LOW'))
  })

  it('EF %28 ileri düşüktür; %40 aort gradyanı sanılmaz', () => {
    const ileri = kodlar('Transtorasik ekokardiyografi. EF %28.', 'E')
    assert.deepEqual(ileri.labels.map((l) => l.kod), ['ECHO.EF_SEVERE'])
    const yalnizEf = kodlar('Ekokardiyografi. EF %40. Mitral kapak doğal.', 'E')
    assert.deepEqual(yalnizEf.labels.map((l) => l.kod), ['ECHO.EF_LOW'])
  })

  it('duvar eşikleri cinsiyete göredir', () => {
    assert.equal(kodlar('Ekokardiyografi. IVS 10 mm.', 'E').labels.some((l) => l.kod === 'ECHO.LVH'), false)
    assert.ok(kodlar('Ekokardiyografi. IVS 11 mm.', 'E').labels.some((l) => l.kod === 'ECHO.LVH'))
    assert.ok(kodlar('Ekokardiyografi. IVS 10 mm.', 'K').labels.some((l) => l.kod === 'ECHO.LVH'))
    assert.equal(kodlar('Ekokardiyografi. PW 0,9 cm.', 'K').labels.some((l) => l.kod === 'ECHO.LVH'), false)
  })

  it('PASP 38 kodsuz, 40 PH; E/e 14 kodsuz, 15 diyastolik; TAPSE 1,6 cm düşük', () => {
    assert.equal(kodlar('Ekokardiyografi. PASP 38 mmHg.').labels.some((l) => l.kod === 'ECHO.PH'), false)
    assert.ok(kodlar('Ekokardiyografi. SPAP: 40 mmHg.').labels.some((l) => l.kod === 'ECHO.PH'))
    assert.equal(kodlar("Ekokardiyografi. Ortalama E/e' 14.").labels.some((l) => l.kod === 'ECHO.DIASTOLIK'), false)
    assert.ok(kodlar("Ekokardiyografi. Ortalama E/e' 15.").labels.some((l) => l.kod === 'ECHO.DIASTOLIK'))
    assert.ok(kodlar('Ekokardiyografi. TAPSE 1,6 cm.').labels.some((l) => l.kod === 'ECHO.TAPSE_LOW'))
    assert.equal(kodlar('Ekokardiyografi. TAPSE 18 mm.').labels.some((l) => l.kod === 'ECHO.TAPSE_LOW'), false)
  })

  it('hafif kapak ve eser efüzyon kod değildir; ileri MY ve tamponad koddur', () => {
    const sakin = kodlar('Ekokardiyografi normal sınırlarda. EF %60. Mitral yetmezlik: hafif. Minimal perikardiyal efüzyon. Tamponad yok.', 'E')
    assert.deepEqual(sakin.labels.map((l) => l.kod), ['ECHO.NORM'])
    const my = kodlar('Ekokardiyografi. İleri mitral yetmezlik.', 'E')
    assert.deepEqual(my.labels.map((l) => l.kod), ['ECHO.MR_SEVERE'])
    const yanlis = kodlar('Ekokardiyografi. İleri derecede sol ventrikül sistolik disfonksiyon. Mitral kapak doğal.', 'E')
    assert.equal(yanlis.labels.some((l) => l.kod === 'ECHO.MR_SEVERE'), false)
    const acil = kodlar('Ekokardiyografi. Perikardiyal efüzyon. Kardiyak tamponad.', 'E')
    assert.ok(acil.labels.some((l) => l.kod === 'ECHO.TAMPONAD'))
    assert.ok(acil.labels.some((l) => l.kod === 'ECHO.EFF'))
    const f = fusionYap([acil], { modalite: 'eko', yasAy: 60 * 12, kalite: 'iyi' })
    assert.equal(f.acilBayrak, true)
    assert.ok(f.capPct >= 85)
  })

  it('16 yaş altında erişkin bant yok; tamponad acil kalır', () => {
    const cocuk = kodlar('Transtorasik ekokardiyografi. EF %25. IVS 11 mm.', 'E', 10 * 12)
    assert.equal(cocuk.labels.some((l) => l.kod.startsWith('ECHO.EF') || l.kod === 'ECHO.LVH'), false)
    assert.equal(cocuk.dogrulanmis, false)
    assert.ok(ekoOlcumSatirlari(cocuk).some((s) => s.includes('16 yaş')))
    const acil = kodlar('Ekokardiyografi. Tamponad.', 'E', 8 * 12)
    assert.equal(acil.dogrulanmis, true)
    const f = fusionYap([acil], { modalite: 'eko', yasAy: 8 * 12, kalite: 'iyi' })
    assert.equal(f.acilBayrak, true)
    assert.equal(f.capPct, 60)
  })

  it('fetal metin ve durağan kare sayı üretmez', () => {
    const fetal = kodlar('Fetal ekokardiyografi. EF %25.', 'E')
    assert.equal(fetal.labels.length, 0)
    assert.equal(fetal.metrikler?.girdi, 'fetal')
    const kare = ekoAseDegerlendir({ girdi: 'goruntu' })
    assert.equal(kare.labels.length, 0)
    assert.match(kare.rapor || '', /PDF/)
    assert.equal(ekoMetniMi('hemogram glukoz 90'), false)
    assert.equal(ekoMetniMi('Transtorasik ekokardiyografi'), true)
  })

  it('düşük kalitede ölçüm satırı ve tanı geri gelir', () => {
    const m = kodlar('Ekokardiyografi. EF %40.', 'E', 50 * 12)
    const bos: BelgeRaporu = {
      modalite: 'Ekokardiyografi', kalite: 'dusuk', ozet: 'bulanık', bulgular: [], tanilar: [],
      acil_bayrak: false, oneri: '', sinirlar: [], hekim_tanisi: [], engines_used: [],
    }
    const rapor = ekoRaporunuZenginlestir(bos, m, 50 * 12)
    assert.equal(rapor.kalite, 'orta')
    assert.ok(rapor.bulgular.some((b) => b.includes('EF %40')))
    assert.equal(rapor.tanilar[0]?.ad, 'Düşük EF izlenimi')
    assert.ok(rapor.tanilar[0]!.guven_pct <= 85)
    assert.equal(rapor.tanilar[0]?.destek.join(' '), 'rapor metnindeki ölçüm')
  })

  it('yazar düşünce ölçüm dökümü taslak olur', () => {
    const m = kodlar('Ekokardiyografi. Perikardiyal efüzyon. Tamponad.', 'E')
    const rapor = ekoMotorRaporu(m, 85)
    assert.equal(rapor.acil_bayrak, true)
    assert.ok(rapor.bulgular.some((b) => b.includes('Tamponad')))
    assert.equal(rapor.hekim_tanisi.length, 0)
  })
})
