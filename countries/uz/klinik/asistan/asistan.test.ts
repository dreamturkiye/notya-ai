/**
 * NOTYA-ULKE-ASISTAN-01 — Uzbekistan: THE ASSISTANT'S CONTENT as the pack holds it. (That each of the 40 roles gets
 * an instruction with all its parts and nothing of another country is the kit's test, run for every pack:
 * lib/ulke/asistan/talimat.paket.test.ts.) This file holds what is Uzbekistan's own:
 *
 *   1. the persona's wording follows the title the pack's convention gives the role, and never claims more;
 *   2. it stays honest in every form: an assistant, not a person, no licence, decision support;
 *   3. each form is written in its own script, and the Cyrillic form is what the rule gives for the Latin one;
 *   4. the sources say exactly as little as the country's record holds;
 *   5. hearing the answer is OFF, no voice is chosen, and the provider's identifiers are settings of the pack.
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { dosyayiDoldur, kirill } from '../../../../scripts/uz-kiril.mjs'
import { asistanTalimati } from '@/lib/ulke/asistan/talimat'
import { sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import { UZ_ASISTAN_ADLARI } from '../asistanAdlari'
import { uzAsistanKimligi } from '../asistanKimligi'
import { UZ_ROLLER, uzRolAdi } from '../rolAdlari'
import { UZ_ASISTAN, UZ_ASISTAN_HASTA_ETIKETLERI, uzAsistanHastaGirdisi } from './index'
import { UZ_ORTAK_KAYNAKLAR, UZ_ROL_KAYNAKLARI, UZ_VAZIRLIK_QOLLANMALARI } from './kaynaklar'
import { UZ_ASISTAN_SES_CIKISI, UZ_ASISTAN_SES_GIRISI } from './ses'
import { KIMLIK_MUTAXASSIS, KIMLIK_PROFESSOR, KIMLIK_SHIFOKOR, UZ_ASISTAN_TALIMAT_METINLERI, uzAsistanParcalari } from './talimat'

const KOK = resolve(__dirname, '../../../..')
const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
type Form = (typeof FORMLAR)[number]
const talimat = (rol: string, dil: Form): string => {
  const t = asistanTalimati(UZ_ASISTAN, rol, dil, { tamAd: uzAsistanKimligi(rol, dil)!.tamAd, rolAdi: uzRolAdi(rol, dil)! })
  assert.ok(t, `${rol}/${dil}: no instruction`)
  return t
}
/** Every text of the assistant's server half, by name. */
const METINLER: Readonly<Record<string, Readonly<Record<Form, string>>>> = { ...UZ_ASISTAN_TALIMAT_METINLERI, ...UZ_ASISTAN_HASTA_ETIKETLERI, UZ_VAZIRLIK_QOLLANMALARI }

describe('Uzbekistan — the assistant\'s content', () => {
  it('all 40 roles have parts in the three forms, and nothing else does', () => {
    assert.equal(UZ_ROLLER.length, 40)
    for (const rol of UZ_ROLLER) for (const dil of FORMLAR) assert.ok(uzAsistanParcalari(rol, dil), `${rol}/${dil}`)
    assert.equal(uzAsistanParcalari('no-such-role', 'uz-Latn'), null)
    assert.equal(uzAsistanParcalari('pediatri', 'tr'), null)
  })

  it('PERSONA BY TITLE: a professor only where the name carries the professor\'s title; an allied professional is never called a doctor', () => {
    for (const a of UZ_ASISTAN_ADLARI) {
      const p = uzAsistanParcalari(a.bransAnahtari, 'uz-Latn')!
      const beklenen = a.taraf === 'klinik-muttefik' ? KIMLIK_MUTAXASSIS : a.unvan === 'prof-dr' ? KIMLIK_PROFESSOR : KIMLIK_SHIFOKOR
      assert.equal(p.kimlik, beklenen['uz-Latn'], a.bransAnahtari)
      const t = talimat(a.bransAnahtari, 'uz-Latn')
      assert.equal(t.includes('professor-shifokor'), a.unvan === 'prof-dr' && a.taraf !== 'klinik-muttefik', `${a.bransAnahtari}: professorship and title disagree`)
      if (a.taraf === 'klinik-muttefik') {
        assert.match(t, /shifokor emas/, `${a.bransAnahtari}: an allied role must be told its colleague is not a doctor`)
        assert.match(t, /Tibbiy tashxis qoʻymang va dori tayinlamang/, a.bransAnahtari)
        assert.match(talimat(a.bransAnahtari, 'ru'), /не врач/, a.bransAnahtari)
      }
    }
    // The owner's requirement: more than twenty years of practice in the country, said in every form.
    assert.equal(UZ_ASISTAN.kidemYili, 20)
    assert.match(talimat('pediatri', 'uz-Latn'), /Oʻzbekistonda 20 yildan ortiq amaliyot/)
    assert.match(talimat('pediatri', 'uz-Cyrl'), /Ўзбекистонда 20 йилдан ортиқ амалиёт/)
    assert.match(talimat('pediatri', 'ru'), /более 20 лет практикующего в Узбекистане/)
  })

  it('HONESTY AND SAFETY in every form: an assistant under a name, not a person, no licence; says when it does not know; decision support; nothing for a patient', () => {
    const isaretler: Record<Form, RegExp[]> = {
      'uz-Latn': [/nomi bilan ishlaydigan klinik yordamchisiz/, /odam emassiz, shifokor emassiz, litsenziyangiz yoʻq/, /mahalliy qoidani bilmayman/, /hech qachon oʻylab topmang/, /qaror va javobgarlik suhbatdoshingizning oʻzida qoladi/, /shoshilinch/, /Bemorga qaratilgan koʻrsatma, xat yoki maslahat matni yozmang/, /hech qanday davlat tizimiga yozuv kiritmaysiz/],
      'uz-Cyrl': [/номи билан ишлайдиган клиник ёрдамчисиз/, /одам эмассиз, шифокор эмассиз/, /маҳаллий қоидани билмайман/, /ҳеч қачон ўйлаб топманг/, /қарор ва жавобгарлик суҳбатдошингизнинг ўзида қолади/, /шошилинч/, /Беморга қаратилган кўрсатма, хат ёки маслаҳат матни ёзманг/, /ҳеч қандай давлат тизимига ёзув киритмайсиз/],
      ru: [/работает под именем/, /вы не человек, не врач и у вас нет лицензии/, /местного правила по этому вопросу я не знаю/, /Никогда не выдумывайте источник, протокол, дозу или схему/, /решение и ответственность остаются за вашим собеседником/, /неотложное/, /Не пишите указаний, писем или советов, адресованных пациенту/, /ни в одну государственную систему/],
    }
    for (const rol of UZ_ROLLER) for (const dil of FORMLAR) for (const re of isaretler[dil]) assert.match(talimat(rol, dil), re, `${rol}/${dil}`)
  })

  it('LANGUAGE RULE: each form tells the model to answer in that form, and is itself written in its own script', () => {
    assert.match(talimat('kardiyoloji', 'uz-Latn'), /oʻzbek tilida, lotin yozuvida yozing/)
    assert.match(talimat('kardiyoloji', 'uz-Cyrl'), /ўзбек тилида, кирилл ёзувида ёзинг/)
    assert.match(talimat('kardiyoloji', 'ru'), /Пишите ответ на русском языке/)
    for (const rol of UZ_ROLLER) {
      assert.doesNotMatch(talimat(rol, 'uz-Latn'), /[Ѐ-ӿ]/, `${rol}: Cyrillic letters in the Latin form`)
      assert.doesNotMatch(talimat(rol, 'uz-Cyrl'), /[A-Za-zʻʼ]/, `${rol}: Latin letters in the Cyrillic form`)
      assert.doesNotMatch(talimat(rol, 'ru'), /[A-Za-zʻʼўқғҳЎҚҒҲ]/, `${rol}: Latin or Uzbek-only letters in the Russian form`)
    }
  })

  it('THE CYRILLIC FORM IS THE RULE\'S: every stored Cyrillic text is what scripts/uz-kiril.mjs gives for its Latin text, and none is left empty', () => {
    let sayi = 0
    for (const [ad, m] of Object.entries(METINLER)) {
      sayi++
      assert.equal(m['uz-Cyrl'], kirill(m['uz-Latn']), `${ad}: the stored Cyrillic text is not what the rule gives`)
      assert.ok(m['uz-Latn'].trim() && m['uz-Cyrl'].trim(), `${ad}: an empty text`)
    }
    assert.ok(sayi >= 24, `only ${sayi} texts were compared`)
    const dizin = join(KOK, 'countries/uz/klinik/asistan')
    for (const d of readdirSync(dizin).filter((x) => x.endsWith('.ts') && !x.endsWith('.test.ts'))) assert.equal(dosyayiDoldur(readFileSync(join(dizin, d), 'utf8')).n, 0, `${d} still has a text without its Cyrillic form`)
  })

  it('NOTHING OF ANOTHER COUNTRY in any text of the assistant, and every file says it is machine-written', () => {
    for (const [ad, m] of Object.entries(METINLER)) for (const dil of FORMLAR) assert.deepEqual(sizintiTara(m[dil], { hedefUlke: 'uz', kaynak: `${ad}/${dil}` }), [])
    for (const d of ['talimat.ts', 'kaynaklar.ts']) assert.match(readFileSync(join(KOK, 'countries/uz/klinik/asistan', d), 'utf8'), /MACHINE-WRITTEN/, `${d} does not say it is machine-written`)
    assert.deepEqual(UZ_ASISTAN.inceleme, { makineYazimi: true, klinisyen: null }, 'no clinician has read the personas: the pack must say so')
  })

  it('SOURCES: one authority for every role, unconfirmed; all 40 roles listed, each with NO reference work; the model is told so', () => {
    assert.equal(UZ_ORTAK_KAYNAKLAR.length, 1)
    assert.equal(UZ_ORTAK_KAYNAKLAR[0].tur, 'kurum')
    assert.equal(UZ_ORTAK_KAYNAKLAR[0].dogrulayan, null)
    assert.match(UZ_ORTAK_KAYNAKLAR[0].dayanak, /^https:\/\/gov\.uz\//)
    assert.deepEqual(Object.keys(UZ_ROL_KAYNAKLARI).sort(), [...UZ_ROLLER].sort())
    for (const rol of UZ_ROLLER) {
      assert.deepEqual(UZ_ROL_KAYNAKLARI[rol], [], `${rol}: a reference work is listed that no clinical lead has named`)
      const t = talimat(rol, 'uz-Latn')
      assert.ok(t.includes(UZ_VAZIRLIK_QOLLANMALARI['uz-Latn']))
      assert.match(t, /ularning matni sizga berilmagan/)
      assert.match(t, /hech qanday milliy klinik protokol, qoʻllanma yoki darslik berilmagan/)
    }
  })

  it('PATIENT MESSAGE: age, sex and the approved notes with their day — nothing that names the patient', () => {
    const veri = { dogumTarihi: '2020-03-09', cinsiyet: 'female', bugun: '2026-10-09', notlar: [{ tarih: '2026-10-01', icerik: { s: 'S-GIZLI', o: 'O', a: 'A', p: 'P', alanlar: { history_giver: 'onasi' } } }] }
    const lat = uzAsistanHastaGirdisi('uz-Latn', veri)
    assert.match(lat, /^Yoshi: 6 yosh; Jinsi: ayol\./)
    assert.match(lat, /TASDIQLANGAN QAYD \(2026-10-01\):\n\{"s":"S-GIZLI","o":"O","a":"A","p":"P","fields":\{"history_giver":"onasi"\}\}/)
    assert.match(uzAsistanHastaGirdisi('ru', veri), /^Возраст: 6 лет; Пол: женский\./)
    assert.match(uzAsistanHastaGirdisi('uz-Cyrl', { ...veri, notlar: [] }), /Бу беморнинг тасдиқланган қайди йўқ\./)
    assert.match(uzAsistanHastaGirdisi('uz-Latn', { ...veri, dogumTarihi: '', cinsiyet: '' }), /^Yoshi: koʻrsatilmagan; Jinsi: koʻrsatilmagan\./)
    assert.deepEqual(UZ_ASISTAN.hastaModu, { acik: true, notSayisi: 3, notAzamiKarakter: 6_000 })
  })

  it('VOICE: speaking the question is on; hearing the answer is OFF, no voice is chosen, and the identifiers are settings of the pack', () => {
    assert.equal(UZ_ASISTAN_SES_GIRISI.acik, true)
    assert.equal(UZ_ASISTAN_SES_CIKISI.acik, false, 'voice output is on and the owner has chosen no voice')
    assert.equal(UZ_ASISTAN_SES_CIKISI.sesler.varsayilan, null)
    assert.deepEqual(Object.keys(UZ_ASISTAN_SES_CIKISI.sesler.roller).sort(), [...UZ_ROLLER].sort())
    for (const rol of UZ_ROLLER) assert.equal(UZ_ASISTAN_SES_CIKISI.sesler.roller[rol], null, `${rol}: a voice id that the owner did not choose`)
    assert.equal(UZ_ASISTAN_SES_CIKISI.model, 'eleven_v4_turbo')
    assert.match(UZ_ASISTAN_SES_CIKISI.modelDogrulama?.kaynak ?? '', /^https:\/\/elevenlabs\.io\/docs\//)
    assert.deepEqual(UZ_ASISTAN_SES_CIKISI.dilKodlari, { 'uz-Latn': 'uzb', 'uz-Cyrl': 'uzb', ru: 'rus' })
  })
})
