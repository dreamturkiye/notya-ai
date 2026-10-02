import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { takipCoz, baglamKur, baglamOku, baglamBlogu, niyetBul, varliklariCikar, genitif, adCikar, asrOnar, tarihSozuBulanik, niyetSozuBulanik, duzenlemeMesafesi, sonrakiTarihSozu, type KonusmaBaglami, type Niyet } from './konusmaBaglami'

const SIMDI = new Date('2026-09-30T14:00:00-04:00') // Wednesday, New York
const TZ = 'America/New_York'
const sec = { tz: TZ, simdi: SIMDI }

function b(niyet: Niyet, soru: string, cevap: string, varliklar: KonusmaBaglami['sonVarliklar'] = {}, hasta?: { id: string; ad: string }, zaman = SIMDI): KonusmaBaglami {
  return baglamKur({ niyet, soru, cevap, varliklar: { ...varliklariCikar(soru, sec), ...varliklar }, hasta, zaman })
}
const U = { id: 'u1', ad: 'Umutcan Türkoğlu' }
const R = { id: 'r1', ad: 'Rıdvan Dilmen' }
const A = { id: 'a1', ad: 'Ayşe Yeşil' }

describe('NOTYA-KONUSMA-BAGLAMI-01 — genitif / adCikar / niyetBul', () => {
  it('genitif follows vowel harmony', () => {
    assert.equal(genitif('Ali'), "Ali'nin")
    assert.equal(genitif('Ayşe Yeşil'), "Ayşe Yeşil'in")
    assert.equal(genitif('Umutcan Türkoğlu'), "Umutcan Türkoğlu'nun")
    assert.equal(genitif('Rıdvan Dilmen'), "Rıdvan Dilmen'in")
    assert.equal(genitif('Umut'), "Umut'un")
    assert.equal(genitif('Gökçe'), "Gökçe'nin")
  })
  it('adCikar: apostrophe genitive and ASR single token', () => {
    assert.equal(adCikar("peki Rıdvan'ın?"), "Rıdvan'ın")
    assert.equal(adCikar("ya Ayşe Yeşil’in"), "Ayşe Yeşil’in")
    assert.equal(adCikar('peki ridvanin'), 'ridvanin')
    assert.equal(adCikar('peki yarın'), null)
    assert.equal(adCikar('onun dozu'), null)
  })
  it('niyetBul: intent words with and without diacritics', () => {
    assert.equal(niyetBul('Bugün randevum var mı?'), 'takvim')
    assert.equal(niyetBul('yarin kac hastam var'), 'takvim')
    assert.equal(niyetBul('Kaç hastam var?'), 'hasta-sayim')
    assert.equal(niyetBul('aşıları?'), 'asi')
    assert.equal(niyetBul('asilari tam mi'), 'asi')
    assert.equal(niyetBul('CRP kaç?'), 'tahlil')
    assert.equal(niyetBul('dozu?'), null)
    assert.equal(niyetBul('Klacid dozu?'), 'recete')
    assert.equal(niyetBul('kaç kilo?'), 'buyume')
    assert.equal(niyetBul('tanısı?'), 'muayene')
    assert.equal(niyetBul('peki yarın?'), null)
    assert.equal(niyetBul('kimler?'), null)
    assert.equal(niyetBul('eksik olan var mı?'), null)
  })
})

describe('NOTYA-KONUSMA-BAGLAMI-01 — calendar follow-ups', () => {
  const bugun = b('takvim', 'Bugün randevum var mı?', '30 Eylül 2026 Çarşamba takviminde randevu yok.')
  it('"Peki yarın?" inherits the calendar intent', () => {
    const t = takipCoz('Peki yarın?', bugun, sec)
    assert.equal(t?.soru, 'yarın randevum var mı?')
    assert.equal(t?.niyet, 'takvim')
    assert.equal(t?.varliklar.tarih, '2026-10-01')
  })
  it('"Ya cuma?" / "Haftaya?" / ASR "peki yarin"', () => {
    assert.equal(takipCoz('Ya cuma?', bugun, sec)?.soru, 'cuma randevum var mı?')
    assert.equal(takipCoz('Haftaya?', bugun, sec)?.soru, 'haftaya randevum var mı?')
    assert.ok(takipCoz('Haftaya?', bugun, sec)?.varliklar.tarihAralik)
    assert.equal(takipCoz('peki yarin', bugun, sec)?.soru, 'yarın randevum var mı?')
    assert.equal(takipCoz('e persembe', bugun, sec)?.soru, 'perşembe randevum var mı?')
  })
  it('"Peki var mı?" after a date-only turn re-asks that date', () => {
    const yarin = b('takvim', 'yarın randevum var mı?', '1 Ekim 2026 Perşembe takviminde randevu yok.')
    const t = takipCoz('Peki var mı?', yarin, sec)
    assert.equal(t?.soru, 'yarın randevum var mı?')
    assert.deepEqual(t?.miras, ['tarih'])
  })
  it('"kaç hastam var bugün?" → "peki yarın?" → "kimler?" keeps the count / who type', () => {
    const kac = b('takvim', 'kaç hastam var bugün?', '30 Eylül 2026 Çarşamba takviminde randevu yok.')
    const t1 = takipCoz('peki yarın?', kac, sec)
    assert.equal(t1?.soru, 'yarın kaç hastam var?')
    const yarin = b('takvim', t1!.soru, '1 Ekim 2026 Perşembe takviminde randevu yok.', t1!.varliklar)
    const t2 = takipCoz('kimler?', yarin, sec)
    assert.equal(t2?.soru, 'yarın kimler geliyor?')
    assert.equal(t2?.varliklar.takvimTipi, 'kimler')
  })
  it('a slot question inherits the clock time', () => {
    const saat = b('takvim', "Bugün saat 3'te yer var mı?", '30 Eylül 2026 Çarşamba takviminde randevu yok. İstediğiniz 15:00 boş.', { saat: '15:00', takvimTipi: 'bosluk' })
    assert.equal(takipCoz('peki yarın?', saat, sec)?.soru, 'yarın saat 15:00 boşluk var mı?')
  })
  it('"peki öğleden sonra?" keeps the day, adds the part of day', () => {
    const sabah = b('takvim', 'yarın sabah boşluk var mı', '1 Ekim 2026 Perşembe takviminde randevu yok.', { takvimTipi: 'bosluk' })
    assert.equal(takipCoz('peki öğleden sonra?', sabah, sec)?.soru, 'yarın öğleden sonra boşluk var mı?')
  })
  it('a full calendar question is not rewritten', () => {
    assert.equal(takipCoz('Peki yarın randevu var mı?', bugun, sec), null)
    assert.equal(takipCoz('Cuma kaç hastam var?', bugun, sec), null)
  })
  it('"Kaç hastam var?" (total) is a new topic, not a calendar follow-up', () => {
    assert.equal(takipCoz('Kaç hastam var?', bugun, sec), null)
  })
})

describe('NOTYA-KONUSMA-BAGLAMI-01 — chart follow-ups', () => {
  it('tahlil: "CRP kaç?" → "Peki hemogram?" → "bir önceki?"', () => {
    const t0 = b('tahlil', "Umutcan Türkoğlu'nun son tahlili ne?", 'Umutcan Türkoğlu son hemogramı 15.05.2026 …', {}, U)
    const t1 = takipCoz('CRP kaç?', t0, sec)
    assert.equal(t1?.soru, "Umutcan Türkoğlu'nun son tahlilinde CRP kaç?")
    assert.deepEqual(t1?.miras, ['hasta'])
    const b1 = b('tahlil', t1!.soru, 'Umutcan Türkoğlu dosyasında CRP sonucu yok.', t1!.varliklar, U)
    const t2 = takipCoz('Peki hemogram?', b1, sec)
    assert.equal(t2?.soru, "Umutcan Türkoğlu'nun son hemogram sonucu ne?")
    const b2 = b('tahlil', t2!.soru, 'Hb 12,4 …', t2!.varliklar, U)
    const t3 = takipCoz('bir önceki?', b2, sec)
    assert.equal(t3?.soru, "Umutcan Türkoğlu'nun bir önceki hemogram sonucu ne?")
    assert.ok(t3?.miras.includes('tahlil'))
  })
  it('reçete: "dozu?" → "kaç gün?" and a named drug', () => {
    const r0 = b('recete', "Ayşe Yeşil'in reçetesi?", 'Ayşe Yeşil — dosyada son reçete: Klacid süspansiyon, Calpol şurup', {}, A)
    assert.equal(takipCoz('dozu?', r0, sec)?.soru, "Ayşe Yeşil'in reçetesindeki ilaçların dozları neler?")
    assert.equal(takipCoz('kaç gün?', r0, sec)?.soru, "Ayşe Yeşil'in reçetesindeki ilaçlar kaç gün yazılmış?")
    assert.equal(takipCoz('Klacid dozu?', r0, sec)?.soru, "Ayşe Yeşil'in reçetesinde klacid dozu ne?")
    assert.equal(takipCoz('kac gun verdik', r0, sec)?.soru, "Ayşe Yeşil'in reçetesindeki ilaçlar kaç gün yazılmış?")
  })
  it('aşı: "aşıları?" → "eksik olan var mı?" → "peki Rıdvan\'ın?" (patient switch keeps the frame)', () => {
    const d0 = b('hasta-dosya', 'Umutcan Türkoğlu dosyasını aç', 'Umutcan Türkoğlu dosyası açık Hocam.', {}, U)
    const t1 = takipCoz('aşıları?', d0, sec)
    assert.equal(t1?.soru, "Umutcan Türkoğlu'nun aşıları tam mı?")
    assert.equal(t1?.niyet, 'asi')
    const a1 = b('asi', t1!.soru, 'Umutcan Türkoğlu aşıları …', t1!.varliklar, U)
    const t2 = takipCoz('eksik olan var mı?', a1, sec)
    assert.equal(t2?.soru, "Umutcan Türkoğlu'nun aşılarında eksik olan var mı?")
    const a2 = b('asi', t2!.soru, 'Umutcan Türkoğlu aşılarında eksik: …', t2!.varliklar, U)
    const t3 = takipCoz("peki Rıdvan'ın?", a2, sec)
    assert.equal(t3?.soru, "Rıdvan'ın aşılarında eksik olan var mı?")
    assert.equal(t3?.niyet, 'asi')
    assert.equal(t3?.varliklar.hastaAd, 'Rıdvan')
    assert.equal(t3?.varliklar.hastaId, null)
  })
  it('aşı entity: "KKK ne zaman?" → "peki Hepatit B?" → "kaç doz?"', () => {
    const k0 = b('asi', "Umutcan Türkoğlu'nun KKK aşısını ne zaman yaptık?", 'KKK 15 Mayıs 2025', {}, U)
    const t1 = takipCoz('peki Hepatit B?', k0, sec)
    assert.equal(t1?.soru, "Umutcan Türkoğlu'nun hepatit b aşısı ne zaman yapılmış?")
    const k1 = b('asi', t1!.soru, 'Hepatit B 2 doz', t1!.varliklar, U)
    assert.equal(takipCoz('kaç doz?', k1, sec)?.soru, "Umutcan Türkoğlu'nun hepatit b aşısı kaç doz yapılmış?")
  })
  it('büyüme: "kilosu?" / "boyu?" / "persentili?" / ASR "bas cevresi"', () => {
    const g0 = b('buyume', "Rıdvan Dilmen'in büyümesi nasıl?", '…', {}, R)
    assert.equal(takipCoz('kilosu?', g0, sec)?.soru, "Rıdvan Dilmen'in kilosu kaç?")
    assert.equal(takipCoz('boyu', g0, sec)?.soru, "Rıdvan Dilmen'in boyu kaç?")
    assert.equal(takipCoz('persentili nasıl', g0, sec)?.soru, "Rıdvan Dilmen'in persentili kaç?")
    assert.equal(takipCoz('bas cevresi', g0, sec)?.soru, "Rıdvan Dilmen'in baş çevresi kaç?")
  })
  it('muayene / not / belge', () => {
    const m0 = b('muayene', "Rıdvan Dilmen'in son muayenesinde ateşi kaçtı", '39 °C', {}, R)
    assert.equal(takipCoz('tanısı?', m0, sec)?.soru, "Rıdvan Dilmen'in son tanısı neydi?")
    // NOTYA-AYSE-100 #8: past-comparison question after a chart turn keeps its words, inherits only the patient
    assert.equal(takipCoz('Daha önce aynı şikayetle geldi mi?', m0, sec)?.soru, 'Rıdvan Dilmen Daha önce aynı şikayetle geldi mi?')
    assert.equal(takipCoz('daha önce bu şikayetle geldi mi', m0, sec)?.soru, 'Rıdvan Dilmen daha önce bu şikayetle geldi mi')
    const n0 = b('not', "Umutcan Türkoğlu'nun son vizitte ne not düşmüşüm?", '…', {}, U)
    assert.equal(takipCoz('peki bir öncekinde?', n0, sec)?.soru, "Umutcan Türkoğlu'nun bir önceki vizitte ne not düşmüşüm?")
    const b0 = b('mesaj-belge', 'Ayşe Yeşil gelen belgeler kutusunda bir şey var mı?', '…', {}, A)
    assert.equal(takipCoz("peki Umutcan'ın?", b0, sec)?.soru, "Umutcan'ın gelen belgeler kutusunda bir şey var mı?")
  })
  it('hasta-dosya attribute question keeps its words: "peki Rıdvan\'ın?" after "kaç yaşında"', () => {
    const y0 = b('hasta-dosya', 'Ayşe Yeşil kaç yaşında?', 'Ayşe Yeşil — dosyada yaş: 5 yaşında.', {}, A)
    assert.equal(takipCoz("peki Rıdvan'ın?", y0, sec)?.soru, "Rıdvan'ın kaç yaşında?")
    assert.equal(takipCoz('kan grubu?', y0, sec)?.soru, "Ayşe Yeşil'in kan grubu?")
    assert.equal(takipCoz('alerjisi var mı', y0, sec)?.soru, "Ayşe Yeşil'in alerjisi var mı?")
  })
  it('follow-up markers "ya" / "e" / "o zaman" / "kendisinin"', () => {
    const t0 = b('muayene', 'Ayşe Yeşil son tanısı?', 'Atipik pnömoni', {}, A)
    assert.equal(takipCoz('ya ilaçları?', t0, sec)?.soru, "Ayşe Yeşil'in ilaçları neler?")
    assert.equal(takipCoz('e dozu?', b('recete', "Ayşe Yeşil'in ilaçları neler?", '…', {}, A), sec)?.soru, "Ayşe Yeşil'in reçetesindeki ilaçların dozları neler?")
    assert.equal(takipCoz('o zaman aşıları?', t0, sec)?.soru, "Ayşe Yeşil'in aşıları tam mı?")
    assert.equal(takipCoz('kendisinin kilosu', t0, sec)?.soru, "Ayşe Yeşil'in kilosu kaç?")
  })
  it('a named patient overrides the inherited one; a new intent overrides the inherited intent', () => {
    const f0 = b('tahlil', "Umutcan Türkoğlu'nun ferritin kaç?", '32 ng/mL', {}, U)
    const t = takipCoz("peki Rıdvan'ın?", f0, sec)
    assert.equal(t?.soru, "Rıdvan'ın ferritin kaç?")
    assert.equal(t?.varliklar.tahlil, 'ferritin')
    assert.equal(takipCoz('peki aşıları?', f0, sec)?.niyet, 'asi')
  })
  it('a full question or an open/record request is never rewritten', () => {
    const f0 = b('tahlil', "Umutcan Türkoğlu'nun ferritin kaç?", '32', {}, U)
    assert.equal(takipCoz("Rıdvan Dilmen'in aşıları tam mı?", f0, sec), null)
    assert.equal(takipCoz('Ayşe Yeşil dosyasını aç', f0, sec), null)
    assert.equal(takipCoz('Hastalarımı listele', f0, sec), null)
    assert.equal(takipCoz('...', f0, sec), null)
    // free text with a marker is a new (model) question, not a slot fill — the open-patient rule carries the chart
    assert.equal(takipCoz('Peki öksürüğü için ne önerirsin?', f0, sec), null)
    assert.equal(takipCoz('ya annesine ne söyleyeyim', f0, sec), null)
  })
  it('date-only after a chart question is left to the model', () => {
    const f0 = b('asi', "Umutcan Türkoğlu'nun aşıları tam mı?", '…', {}, U)
    assert.equal(takipCoz('peki yarın?', f0, sec), null)
  })
  it('nothing to inherit → null (no patient in context)', () => {
    const g = b('genel', 'nasılsın', 'İyiyim Hocam.')
    assert.equal(takipCoz('dozu?', g, sec), null)
  })
})

describe('NOTYA-KONUSMA-BAGLAMI-01 — hasta-sayım frame substitution, expiry, prompt block', () => {
  it('"bu hafta kaç hasta muayene ettim" → "peki son 30 gün?"', () => {
    const s0 = b('hasta-sayim', 'bu hafta kaç hasta muayene ettim?', 'Bu hafta 1 hasta.')
    assert.equal(takipCoz('peki son 30 gün?', s0, sec)?.soru, 'son 30 gün kaç hasta muayene ettim?')
    assert.equal(takipCoz('ya geçen hafta', s0, sec)?.soru, 'geçen hafta kaç hasta muayene ettim?')
  })
  it('context expires after 10 minutes', () => {
    const eski = b('takvim', 'Bugün randevum var mı?', 'takviminde randevu yok', {}, undefined, new Date(SIMDI.getTime() - 11 * 60_000))
    assert.equal(baglamOku(eski, SIMDI), null)
    assert.equal(takipCoz('peki yarın?', eski, sec), null)
    assert.equal(baglamBlogu(eski, SIMDI), '')
    const taze = b('takvim', 'Bugün randevum var mı?', 'takviminde randevu yok', {}, undefined, new Date(SIMDI.getTime() - 9 * 60_000))
    assert.ok(takipCoz('peki yarın?', taze, sec))
  })
  it('malformed stored record is ignored', () => {
    assert.equal(baglamOku({ sonNiyet: 'takvim' }, SIMDI), null)
    assert.equal(baglamOku('x', SIMDI), null)
    assert.equal(takipCoz('peki yarın?', null, sec), null)
  })
  it('prompt block is compact and names the slots', () => {
    const t0 = b('tahlil', "Umutcan Türkoğlu'nun son tahlilinde CRP kaç?", 'Umutcan Türkoğlu dosyasında CRP sonucu yok.\n\n**Kayıt:** …', {}, U)
    const blok = baglamBlogu(t0, SIMDI)
    assert.match(blok, /KONUŞMA BAĞLAMI/)
    assert.match(blok, /Hasta: Umutcan Türkoğlu/)
    assert.match(blok, /Tahlil: crp/)
    assert.match(blok, /Son cevap: Umutcan Türkoğlu dosyasında CRP sonucu yok\./)
    assert.ok(blok.length < 1000, String(blok.length))
  })
  it('summary is one line, ≤ 160 chars, markdown stripped', () => {
    const k = baglamKur({ niyet: 'genel', soru: 'x', cevap: `**${'a'.repeat(200)}**\nikinci satır` })
    assert.ok(k.sonCevapOzeti.length <= 160 && k.sonCevapOzeti.endsWith('…'))
    assert.ok(!k.sonCevapOzeti.includes('*'))
  })
})

describe('NOTYA-KONUSMA-BAGLAMI-06 — ASR-corrupted calendar follow-ups (Kaan live, 2026-09-30)', () => {
  const T = b('takvim', 'Bugün hiçbir randevumuz var mı?', '30 Eylül 2026 Çarşamba takviminde randevu yok.')
  const takvimSoru = (s: string) => takipCoz(s, T, sec)

  it('duzenlemeMesafesi', () => {
    assert.equal(duzenlemeMesafesi('yanim', 'yarin'), 2)
    assert.equal(duzenlemeMesafesi('bugum', 'bugun'), 1)
    assert.equal(duzenlemeMesafesi('cuma', 'cuma'), 0)
  })
  it('tarihSozuBulanik: Fish forms → closed list', () => {
    assert.equal(tarihSozuBulanik('yanim'), 'yarin')
    assert.equal(tarihSozuBulanik('yarim'), 'yarin')
    assert.equal(tarihSozuBulanik('bugum'), 'bugun')
    assert.equal(tarihSozuBulanik('cumaya'), 'cuma')
    assert.equal(tarihSozuBulanik('persembeye'), 'persembe')
    assert.equal(tarihSozuBulanik('carsanba'), 'carsamba')
  })
  it('tarihSozuBulanik: slot / marker / short words are never dates', () => {
    for (const k of ['gun', 'bunun', 'var', 'yok', 'kim', 'saat', 'bos', 'sabah', 'peki', 'onun', 'sonra', 'hasta']) assert.equal(tarihSozuBulanik(k), null, k)
  })
  it('niyetSozuBulanik: randevu / reçete / tahlil mis-hearings, suffix kept', () => {
    assert.equal(niyetSozuBulanik('randevo'), 'randevu')
    assert.equal(niyetSozuBulanik('randevom'), 'randevum')
    assert.equal(niyetSozuBulanik('resete'), 'recete')
    assert.equal(niyetSozuBulanik('recetasi'), 'recetesi')
    assert.equal(niyetSozuBulanik('tahril'), 'tahlil')
    assert.equal(niyetSozuBulanik('randevum'), null)
    assert.equal(niyetSozuBulanik('takvim'), null)
  })
  it('asrOnar: date words only in calendar context, intent stems always', () => {
    assert.equal(asrOnar('Peki yanım var mı?', true).mesaj, 'Peki yarin var mı?')
    assert.equal(asrOnar('Peki yanım var mı?', false).mesaj, 'Peki yanım var mı?')
    assert.equal(asrOnar('yarın randevo var mı', false).mesaj, 'yarın randevu var mı')
    assert.deepEqual(asrOnar('Peki yarın?', true).onarilan, [])
  })
  it('NOTYA-KORPUS-KALAN-01 (Y-080, T-025): a patient name is never repaired into a date word', () => {
    const adlar = new Set(['tarik', 'ozdemir'])
    // "tarik" is two edits from "yarin": with the doctor's patient names known, the word is left alone.
    assert.equal(duzenlemeMesafesi('tarik', 'yarin'), 2)
    assert.deepEqual(asrOnar('peki Tarık Özdemir randevusu ne zaman?', true, adlar), { mesaj: 'peki Tarık Özdemir randevusu ne zaman?', onarilan: [] })
    assert.deepEqual(asrOnar('Tarıkın randevusu ne zaman', true, adlar).onarilan, [])
    // A case ending after an apostrophe marks a name even when the lookup knows nothing.
    assert.deepEqual(asrOnar("Yasin'in randevusu ne zaman?", true).onarilan, [])
    assert.deepEqual(asrOnar("Tarık'ın randevusu ne zaman?", true).onarilan, [])
    // The repair itself is untouched: a mis-heard date next to a name is still repaired.
    assert.equal(asrOnar('Peki yanım var mı?', true, adlar).mesaj, 'Peki yarin var mı?')
    assert.equal(asrOnar('Tarık yanım geliyor mu', true, adlar).mesaj, 'Tarık yarin geliyor mu')
  })
  it('NOTYA-KORPUS-KALAN-01: after a calendar turn a question that names a patient is not rewritten into a calendar question', () => {
    const adlar = new Set(['tarik', 'ozdemir'])
    assert.equal(takipCoz('peki Tarık Özdemir randevusu ne zaman?', T, { ...sec, adParcalari: adlar }), null)
    assert.equal(takipCoz("Tarık Özdemir'in randevusu ne zaman?", T, { ...sec, adParcalari: adlar }), null)
    assert.equal(takipCoz("Tarık Özdemir'in randevusu ne zaman?", T, sec), null, 'the apostrophe alone is enough')
  })
  it('"Peki yanım var mı?" after "Bugün … randevumuz var mı?" → tomorrow', () => {
    const r = takvimSoru('Peki yanım var mı?')
    assert.ok(r)
    assert.equal(r.niyet, 'takvim')
    assert.equal(r.soru, 'Peki yarin var mı?') // a full (bare-date) calendar question after repair — the matcher reads it
    assert.equal(r.varliklar.tarih, '2026-10-01')
    assert.ok(r.miras.some((m) => m.startsWith('asr:yanim→yarin')))
  })
  it('"peki yarim?" / "bugum var mı" / "ya cumaya?" repair to the day', () => {
    assert.equal(takvimSoru('peki yarim?')?.varliklar.tarih, '2026-10-01')
    assert.equal(takvimSoru('peki bugum var mı')?.varliklar.tarih, '2026-09-30')
    assert.equal(takvimSoru('ya cumaya?')?.varliklar.tarih, '2026-10-02')
  })
  it('one unreadable token in "peki … var mı" after a calendar turn → next natural day', () => {
    const r = takvimSoru('Peki xqzt var mı?')
    assert.ok(r)
    assert.equal(r.soru, 'yarın randevum var mı?')
    assert.ok(r.miras.includes('tarih-sonraki'))
    const Y = b('takvim', 'Yarın randevum var mı?', '1 Ekim 2026 Perşembe takviminde randevu yok.')
    assert.equal(takipCoz('peki xqzt var mı', Y, sec)?.soru, 'öbür gün randevum var mı?')
  })
  it('sonrakiTarihSozu', () => {
    assert.equal(sonrakiTarihSozu('bugun'), 'yarin')
    assert.equal(sonrakiTarihSozu('cuma'), 'pazartesi')
    assert.equal(sonrakiTarihSozu(null), null)
  })
  it('an unreadable token without a calendar turn is not rewritten', () => {
    const R = b('recete', "Umutcan'ın son reçetesi ne?", 'Umutcan Türkoğlu — reçete: Augmentin', {}, U)
    assert.equal(takipCoz('Peki xqzt var mı?', R, sec), null)
    assert.equal(takipCoz('Peki yanım var mı?', R, sec), null)
  })
  it('two unreadable tokens are free text, not a calendar slot', () => {
    assert.equal(takvimSoru('peki xqzt wvb var mı'), null)
  })
  it('"Peki var mı?" without any slot still inherits the same day', () => {
    const r = takvimSoru('Peki var mı?')
    assert.equal(r?.soru, 'bugün randevum var mı?')
    assert.ok(!r?.miras.includes('tarih-sonraki'))
  })
  it('a full calendar question with a garbled noun is repaired, not inherited', () => {
    const r = takvimSoru('yarın randevo var mı?')
    assert.equal(r?.soru, 'yarın randevu var mı?')
    assert.equal(r?.niyet, 'takvim')
    assert.deepEqual(r?.miras, ['asr:randevo→randevu'])
    assert.equal(takvimSoru('yarın randevu var mı?'), null) // nothing to repair → a full question resets by itself
  })
  it('garbled entity words after a chart turn: "reşetesi" / "tahril"', () => {
    const D = b('hasta-dosya', "Umutcan'ın dosyasını özetle", 'Umutcan Türkoğlu — özet', {}, U)
    assert.equal(takipCoz('resetesi?', D, sec)?.niyet, 'recete')
    assert.equal(takipCoz('son tahrili ne?', D, sec)?.niyet, 'tahlil')
  })
})
