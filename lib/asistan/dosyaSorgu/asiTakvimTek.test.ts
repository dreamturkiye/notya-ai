/**
 * ASI-TAKVIM-TEK-01 (2026-11-20, demo pediatri patient "Elif Yılmaz", born 2026-10-21, Hep B dose 1 on 2026-10-21) —
 * Ayşe answered "no missing or due dose" and claimed medication / allergy information "exists in documents" although the
 * patient has no documents. Locked here, deterministic layer (no model, no database):
 *
 *   1. Current T.C. SB schedule (lib/asi/ulusalAsiTakvimi.ts, 6'lı karma, 2025 GBP): a term baby has NO separate 1. ay
 *      Hep B dose (Hep B is inside the 2/4/6/18. ay karma doses). The answer must still name the next visit with its
 *      date (21.12.2026) — "nothing due" alone is not the answer.
 *   2. A next-dose date the doctor wrote on the aşı kartı (asilar.sonraki_doz_tarihi — the reminder list's source) is
 *      reported: 2026-11-20 → "1 gün sonra", 2026-11-21 → "bugün", in Soru 4 and in Soru 9's "Bugün" bucket.
 *   3. < 2000 g baby (bebek kartı): the TND 2026 1. ay tekli Hep B dose is due on 2026-11-21 — Ayşe gets the birth
 *      weight now (it did not), so she agrees with the öneriler cohort.
 *   4. Grounding: no documents / medication / allergy on file → the evidence says so, never "yüklenen belgeler"; the
 *      answer guard replaces a "belgelerde var" sentence.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kanitBlogu } from './kanit'
import { asiKaniti, asiKanitSatirlari, asiOzetSatirlari, asiSonucu } from './asiKaniti'
import { parametreSec } from './parametreler'
import { belgeYokMu, kayitsizKaynakGuvencesi } from './kayitSiniri'
import { olaylariKur, hastaKur, type HamDosya } from '@/lib/doktor/dosyaOlaylari'
import { acikIsleriBul } from '@/lib/doktor/acikIsler'

const ELIF_DOGUM = '2026-10-21'

function elif(ek: { plan?: string | null; kiloGram?: number | null; belge?: boolean; ilac?: boolean; alerji?: string } = {}): HamDosya {
  return {
    hasta: { ad: 'Elif Yılmaz', dogumIso: ELIF_DOGUM, cinsiyet: 'Kadın' },
    brans: 'pediatri',
    intake: ek.alerji ? { alerji: ek.alerji } : {},
    vizitler: [],
    asilar: [{ id: 'asi-hepb-1', asi_adi: 'Hepatit B', doz_no: 1, uygulama_tarihi: ELIF_DOGUM, kaynak: 'klinik', sonraki_doz_tarihi: ek.plan ?? null }],
    ilaclar: ek.ilac ? [{ id: 'i1', ilac_adi: 'D vitamini damla', doz: '3 damla', kullanim_sikli: 'günde 1', baslangic_tarihi: ELIF_DOGUM, aktif: true }] : [],
    belgeler: ek.belge ? [{ id: 'b1', modality_final: 'lab', hekim_ozet: 'Topuk kanı normal.', onaylandi_at: '2026-10-25' }] : [],
    bebekKarti: ek.kiloGram != null ? { gebelik_haftasi: 34, kilo_gram: ek.kiloGram } : null,
  }
}
function dosya(ham: HamDosya, bugun: string) {
  const olaylar = olaylariKur(ham, bugun)
  const hasta = hastaKur(ham, bugun)
  const p = parametreSec(hasta.brans, hasta.dogumIso, hasta.bugunIso)
  const k = asiKaniti(olaylar, hasta, p)
  assert.ok(k, 'pediatri vaccine evidence')
  return { olaylar, hasta, k: k!, kanit: kanitBlogu('asi', olaylar, hasta, { mesaj: "Elif Yılmaz'ın aşı durumu nedir?" }) }
}

describe('Elif — term baby, current 6\'lı karma schedule (no separate 1. ay Hep B dose)', () => {
  for (const bugun of ['2026-11-20', '2026-11-21']) {
    it(`${bugun}: nothing open, but the next visit (2. ay, 21.12.2026) is named with its date`, () => {
      const { k, kanit } = dosya(elif(), bugun)
      assert.equal(k.eksik.length, 0, 'no schedule dose is due at 1 month under the 2025 GBP')
      assert.ok(!k.eksik.some((d) => d.seri === 'hepb'))
      assert.deepEqual(k.siradaki.map((d) => d.seri).sort(), ['bcg', 'karma', 'kpa'])
      assert.equal(k.siradaki[0].onerilen, '2026-12-21')
      assert.match(asiSonucu(k), /Sıradaki takvim dozları: .*önerilen 21\.12\.2026/)
      assert.match(kanit, /SIRADAKİ TAKVİM DOZLARI .*21\.12\.2026/)
      assert.ok(asiOzetSatirlari(k).some((s) => /21\.12\.2026/.test(s)), 'Soru 1 summary names the next visit too')
    })
  }

  it('the "yaklaşan" window boundary: 31 days → planlı (still named as sıradaki), 30 days → yaklaşan', () => {
    assert.equal(dosya(elif(), '2026-11-20').k.yaklasan.length, 0)
    assert.deepEqual(dosya(elif(), '2026-11-21').k.yaklasan.map((d) => d.seri).sort(), ['bcg', 'karma', 'kpa'])
  })
})

describe("Elif — the doctor's next-dose date on the aşı kartı (same source as the reminder list)", () => {
  it('2026-11-20: Hep B next dose 21.11.2026 is reported ("1 gün sonra"), and in Soru 9', () => {
    const { olaylar, hasta, k, kanit } = dosya(elif({ plan: '2026-11-21' }), '2026-11-20')
    assert.equal(k.hekimPlani.length, 1)
    assert.equal(k.hekimPlani[0].durum, 'yaklasiyor')
    assert.match(asiSonucu(k), /Hekimin aşı kartına yazdığı sonraki doz tarihi: Hepatit B 21\.11\.2026 \(1 gün sonra\)/i)
    assert.match(kanit, /HEKİMİN AŞI KARTINA YAZDIĞI SONRAKİ DOZ TARİHİ/)
    assert.doesNotMatch(asiSonucu(k), /eksik ya da zamanı gelmiş doz saptanmadı\.$/)
    const isler = acikIsleriBul(olaylar, null, hasta.brans, hasta)
    assert.ok(isler.yakinda.some((i) => /21\.11\.2026/.test(i.metin)), 'Soru 9 "Yakın zamanda"')
  })

  it('2026-11-21: the planned dose is due today — Soru 9 "Bugün"', () => {
    const { olaylar, hasta, k } = dosya(elif({ plan: '2026-11-21' }), '2026-11-21')
    assert.equal(k.hekimPlani[0].durum, 'bugun')
    assert.match(asiSonucu(k), /21\.11\.2026 \(bugün\)/)
    const isler = acikIsleriBul(olaylar, null, hasta.brans, hasta)
    assert.ok(isler.bugun.some((i) => /21\.11\.2026/.test(i.metin)))
  })

  it('a later Hep B dose on the card closes the plan (no stale reminder)', () => {
    const ham = elif({ plan: '2026-11-21' })
    ham.asilar!.push({ id: 'asi-karma-1', asi_adi: "6'lı Karma (DaBT-İPA-Hib-HepB)", doz_no: 1, uygulama_tarihi: '2026-12-21', kaynak: 'klinik', sonraki_doz_tarihi: null })
    ham.asilar!.push({ id: 'asi-hepb-2', asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-11-21', kaynak: 'klinik', sonraki_doz_tarihi: null })
    assert.equal(dosya(ham, '2026-12-22').k.hekimPlani.length, 0)
  })
})

describe('Elif — < 2000 g on the bebek kartı (TND 2026: 1. ay tekli Hep B)', () => {
  it('2026-11-20: tekli Hep B yaklaşıyor (önerilen 21.11.2026); 2026-11-21: due', () => {
    const once = dosya(elif({ kiloGram: 1800 }), '2026-11-20').k
    assert.ok(once.yaklasan.some((d) => d.seri === 'hepb' && d.onerilen === '2026-11-21'), JSON.stringify(once.yaklasan))
    assert.ok(!once.eksik.some((d) => d.seri === 'hepb'))
    const gun = dosya(elif({ kiloGram: 1800 }), '2026-11-21').k
    assert.ok(gun.eksik.some((d) => d.seri === 'hepb' && d.onerilen === '2026-11-21'), JSON.stringify(gun.eksik))
    assert.match(asiSonucu(gun), /1 takvim dozu için uygulandığına dair kayıt yok/)
  })
  it('birth weight from the intake form ("1,8" kg) is read the same way', () => {
    const ham = elif()
    ham.intake = { dogumKilosuPed: '1,8' }
    assert.equal(hastaKur(ham, '2026-11-21').dogumKiloGr, 1800)
    assert.ok(dosya(ham, '2026-11-21').k.eksik.some((d) => d.seri === 'hepb'))
  })
})

describe('Grounding — no documents / medication / allergy on file', () => {
  it('the evidence names what is NOT on file and never lists "yüklenen belgeler"', () => {
    const { kanit, k } = dosya(elif(), '2026-11-20')
    assert.match(kanit, /KAYIT SINIRI: .*Bu hastada kayıtlı OLMAYANLAR: onaylı belge değerlendirmesi, ilaç \/ reçete kaydı, alerji kaydı/)
    assert.doesNotMatch(kanit, /yüklenen belgeler/i)
    assert.ok(asiKanitSatirlari(k).some((s) => /Onaylı belge değerlendirmesi YOK/.test(s)))
  })
  it('with a document, medication and allergy on file nothing is listed as missing', () => {
    const { kanit } = dosya(elif({ belge: true, ilac: true, alerji: 'Penisilin' }), '2026-11-20')
    assert.doesNotMatch(kanit, /kayıtlı OLMAYANLAR/)
    assert.match(kanit, /1 onaylı belge değerlendirmesi/)
  })

  const BOS_DOSYA = '## HIZLI KART (yalnız bu dosya — uydurma yasak)\n- Alerji: kayıt yok\n- Sürekli ilaç: kayıtlı ilaç yok\n\n## BELGELER (en yeni üstte)\n- Kayıtlı belge yok.'
  it('answer guard: "belgelerde var" is replaced with the true sentence', () => {
    assert.equal(belgeYokMu(BOS_DOSYA), true)
    const r = kayitsizKaynakGuvencesi('Elif Yılmaz — eksik ya da zamanı gelmiş doz yok. İlaç ve alerji bilgileri belgelerde mevcut.', BOS_DOSYA)
    assert.equal(r.degisti, true)
    assert.equal(r.metin, 'Elif Yılmaz — eksik ya da zamanı gelmiş doz yok. Dosyada yüklenen belge yok; ilaç ve alerji bilgisi de kayıtlı değil.')
    assert.doesNotMatch(r.metin, /belgelerde/)
  })
  it('answer guard keeps true sentences ("belge yok", "uygulandığı belgelenmiş") and a list marker', () => {
    const metin = 'Hepatit B 1. doz uygulandığı belgelenmiş (21.10.2026). Yüklenen belge yok.\n- **Dayanak:** Belgelerde ilaç kaydı var.'
    const r = kayitsizKaynakGuvencesi(metin, BOS_DOSYA)
    assert.equal(r.metin, 'Hepatit B 1. doz uygulandığı belgelenmiş (21.10.2026). Yüklenen belge yok.\n- **Dayanak:** Dosyada yüklenen belge yok; ilaç bilgisi de kayıtlı değil.')
  })
  it('answer guard does nothing when the chart has documents or no chart is known', () => {
    const belgeli = '## BELGELER (en yeni üstte)\n- Hemogram — 01.11.2026'
    const metin = 'Alerji bilgisi belgelerde mevcut.'
    assert.deepEqual(kayitsizKaynakGuvencesi(metin, belgeli), { metin, degisti: false })
    assert.deepEqual(kayitsizKaynakGuvencesi(metin, ''), { metin, degisti: false })
  })
})
