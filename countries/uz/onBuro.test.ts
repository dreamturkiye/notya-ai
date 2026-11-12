/**
 * WHATSAPP-ONBURO-01 — Uzbekistan's front-desk pack in its three languages (Uzbek Latin, Uzbek Cyrillic, Russian):
 * booking intent with negation / question / cancel guards, day and part-of-day wishes, the medical and emergency guards
 * with the pack's own emergency number, the sheet rules, the language Ayşe answers in (`dilSec`), and the shared answer
 * function run with each language. Pure; synthetic text only. The vocabulary is machine-written and awaits a native
 * reader — these tests pin what the rules do today, not that the wording is right.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bilgiNormalize } from '@/lib/iletisim/onburo/ayar'
import { bilgiYaniti, type ModelIstemi } from '@/lib/iletisim/onburo/bilgi'
import { UZ_PAKETI } from './index'
import { UZ_ON_BURO as dil, uzDilBul, uzKatla } from './onBuro'

const TZ = 'Asia/Tashkent'
/** Thursday 12 November 2026, 14:00 in Tashkent. */
const SIMDI = new Date('2026-11-12T09:00:00Z')

describe('language of the conversation', () => {
  it('script and letters decide; a bare number keeps the language of the open step', () => {
    assert.equal(uzDilBul('qabulga yozilmoqchiman'), 'uz-Latn')
    assert.equal(uzDilBul('қабулга ёзилмоқчиман'), 'uz-Cyrl')
    assert.equal(uzDilBul('хочу записаться на прием'), 'ru')
    assert.equal(uzDilBul('2', 'ru'), 'ru')
    assert.equal(uzDilBul('2', 'uz-Cyrl'), 'uz-Cyrl')
    assert.equal(uzDilBul('2'), 'uz-Latn')
    assert.equal(dil.dilSec!('хочу записаться').kod, 'ru')
    assert.equal(dil.dilSec!('1', 'uz-Cyrl').kod, 'uz-Cyrl')
  })
  it('each language has its own sentences, and no sentence is Turkish or English', () => {
    const [l, c, r] = ['salom', 'қабул', 'запись'].map((m) => dil.dilSec!(m))
    assert.match(l.metin.adSor, /ismingiz/)
    assert.match(c.metin.adSor, /исмингиз/)
    assert.match(r.metin.adSor, /имя и фамилию/)
    for (const p of [l, c, r]) {
      const tum = JSON.stringify([p.metin.acil, p.metin.tibbi, p.metin.bekleme, p.metin.slotYok, p.metin.oneri(['x'], true), p.metin.kimIcin(['A']), p.alanEtiketi])
      assert.ok(!/[çğışİ]|randevu|appointment|clinic\b/i.test(tum), p.kod)
    }
    assert.equal(l.zamanEtiketi('2026-11-20T09:30:00Z', TZ), '20-noyabr, juma, 14:30')
    assert.equal(c.zamanEtiketi('2026-11-20T09:30:00Z', TZ), '20 ноябрь, жума, 14:30')
    assert.equal(r.zamanEtiketi('2026-11-20T09:30:00Z', TZ), '20 ноября, пятница, 14:30')
  })
  it('the emergency number is the pack setting and stands in the fixed sentences of all three languages', () => {
    const n = String(UZ_PAKETI.uygulama?.portal?.acilNumara)
    assert.equal(n, '103')
    assert.equal(dil.acilNumara, n)
    for (const m of ['salom', 'қабул', 'запись']) {
      const p = dil.dilSec!(m)
      assert.ok(p.metin.acil.includes(n) && p.metin.tibbi.includes(n), p.kod)
      for (const baska of ['112', '911', '999', '000', '111']) assert.ok(!p.metin.acil.includes(baska), `${p.kod} names ${baska}`)
    }
  })
  it('folding: the Uzbek apostrophe letters and ё', () => {
    assert.equal(uzKatla('Koʻkragim ogʻriyapti!'), 'kokragim ogriyapti')
    assert.equal(uzKatla("ko'kragim og`riyapti"), 'kokragim ogriyapti')
    assert.equal(uzKatla('Ещё приём'), 'еще прием')
  })
})

describe('booking intent', () => {
  const istek = [
    'Qabulga yozilmoqchiman', 'qabulga yozilsam boʻladimi', 'Navbat olmoqchiman', 'shifokor qabuliga yozilmoqchiman', 'qabul', 'ertaga qabul bormi', 'boʻsh vaqt bormi', 'qachon kelsam boʻladi',
    'Қабулга ёзилмоқчиман', 'навбат олмоқчиман', 'қабул', 'бўш вақт борми', 'эртага қабул борми',
    'Хочу записаться на прием', 'можно записаться к врачу', 'Запишите меня пожалуйста', 'запись', 'нужна запись на завтра', 'есть свободное время на этой неделе', 'когда можно прийти',
  ]
  for (const m of istek) it(`"${m}" → booking wish`, () => assert.equal(dil.randevuNiyeti(m), 'istek'))
  const degil = [
    'qabulga yozilmoqchi emasman', 'qabul kerak emas', 'qabulni bekor qilmoqchiman', 'qabulimni boshqa kunga koʻchiring', 'qabulim qachon', 'qabul qancha turadi', 'balki ertaga yozilarman',
    'қабул керак эмас', 'қабулни бекор қилмоқчиман', 'қабулим қачон',
    'не хочу записываться', 'отмените мою запись', 'можно перенести запись', 'когда моя запись', 'сколько стоит прием', 'я уже записан на прием', 'не смогу прийти на прием',
  ]
  for (const m of degil) it(`"${m}" → NOT a booking wish`, () => assert.notEqual(dil.randevuNiyeti(m), 'istek'))
  it('unrelated and empty messages → nothing', () => {
    for (const m of ['salom', 'rahmat', 'спасибо большое', 'раҳмат', '', '👍']) assert.equal(dil.randevuNiyeti(m), 'yok', m)
  })
})

describe('day / part of day and picks', () => {
  it('tomorrow, weekdays and dates in the three languages', () => {
    for (const m of ['ertaga', 'эртага', 'завтра']) assert.equal(dil.tercih(m, SIMDI, TZ)?.gun, '2026-11-13', m)
    for (const m of ['seshanba kuni', 'сешанба', 'во вторник']) assert.equal(dil.tercih(m, SIMDI, TZ)?.gun, '2026-11-17', m)
    for (const m of ['20-noyabr', '20 ноябрь', '20 ноября', '20.11']) assert.equal(dil.tercih(m, SIMDI, TZ)?.gun, '2026-11-20', m)
    for (const m of ['indinga', 'послезавтра']) assert.equal(dil.tercih(m, SIMDI, TZ)?.gun, '2026-11-14', m)
    assert.equal(dil.tercih('yakshanba', SIMDI, TZ)?.gun, '2026-11-15', 'yakshanba is Sunday, not shanba')
  })
  it('morning / afternoon / another day / later', () => {
    for (const m of ['ertalab', 'эрталаб', 'утром', 'до обеда']) assert.equal(dil.tercih(m, SIMDI, TZ)?.dilim, 'sabah', m)
    for (const m of ['tushdan keyin', 'тушдан кейин', 'после обеда', 'вечером']) assert.equal(dil.tercih(m, SIMDI, TZ)?.dilim, 'ogleden_sonra', m)
    for (const m of ['boshqa kun', 'бошқа кун', 'другой день', 'не подходит']) assert.equal(dil.tercih(m, SIMDI, TZ)?.baskaGun, true, m)
    for (const m of ['keyinroq', 'кейинроқ', 'попозже']) assert.equal(dil.tercih(m, SIMDI, TZ)?.dahaGec, true, m)
    assert.equal(dil.tercih('rahmat', SIMDI, TZ), null)
  })
  it('a pick is a bare 1/2/3', () => {
    assert.equal(dil.secim('1'), 1); assert.equal(dil.secim('2.'), 2); assert.equal(dil.secim('3-chi'), 3); assert.equal(dil.secim('вариант 2'), 2)
    assert.equal(dil.secim('4'), null); assert.equal(dil.secim('12'), null)
  })
})

describe('medical and emergency guards', () => {
  const acil = [
    'koʻkragim ogʻriyapti', 'nafas ololmayapman', 'bolam nafas olmayapti', 'qon toʻxtamayapti', 'oʻzimni oʻldirmoqchiman', 'tutqanoq tutyapti', 'hushidan ketdi', 'tez yordam kerak',
    'кўкрагим оғрияпти', 'нафас ололмаяпман', 'қон тўхтамаяпти', 'ҳушидан кетди', 'тез ёрдам керак',
    'сильная боль в груди', 'не могу дышать', 'ребенок не дышит', 'сильное кровотечение', 'хочу покончить с собой', 'у него судороги', 'потерял сознание', 'нужна скорая помощь', 'СРОЧНО',
  ]
  for (const m of acil) it(`emergency: "${m}"`, () => assert.equal(dil.acilMi(m), true))
  const tibbi = [
    'bolamning isitmasi bor nima qilay', 'dorini och qoringa ichsam boʻladimi', 'tahlil natijam normalmi', 'antibiotikni davom ettiraymi', 'homiladorman bu dorini ichsam boʻladimi', 'boshim ogʻriyapti',
    'боламнинг иситмаси бор', 'таҳлил натижам нормалми', 'дорини ичсам бўладими',
    'у ребенка температура что делать', 'можно ли принимать это лекарство', 'какая дозировка', 'результаты анализов нормальные', 'я беременна', 'болит голова', 'появилась сыпь',
  ]
  for (const m of tibbi) it(`medical: "${m}"`, () => assert.equal(dil.tibbiMi(m), true))
  const hicbiri = ['manzilingiz qayerda', 'avtoturargoh bormi', 'қабулга ёзилмоқчиман', 'ish vaqtingiz qanday', 'какой у вас адрес', 'есть ли парковка', 'спасибо', 'rahmat']
  for (const m of hicbiri) it(`neither: "${m}"`, () => { assert.equal(dil.tibbiMi(m), false); assert.equal(dil.acilMi(m), false) })
})

describe('sheet rules, names and answers', () => {
  it('obvious questions go to the right field in each language', () => {
    for (const m of ['manzilingiz qayerda', 'манзилингиз қаерда', 'какой у вас адрес']) assert.deepEqual(dil.bilgiAlanlari(m), ['adres'], m)
    for (const m of ['avtoturargoh bormi', 'парковка борми', 'есть ли парковка']) assert.deepEqual(dil.bilgiAlanlari(m), ['otopark'], m)
    for (const m of ['qabul qancha turadi', 'қабул қанча туради', 'сколько стоит прием']) assert.deepEqual(dil.bilgiAlanlari(m), ['ucretler'], m)
    for (const m of ['ish vaqtingiz qanday', 'иш вақтингиз қандай', 'какой у вас режим работы']) assert.deepEqual(dil.bilgiAlanlari(m), ['calismaSaatleri'], m)
    assert.deepEqual(dil.bilgiAlanlari('salom'), [])
  })
  it('question or chatter', () => {
    for (const m of ['wifi bormi', 'lift bormi?', 'есть ли у вас лифт', 'подскажите, есть ли пандус']) assert.equal(dil.soruMu(m), true, m)
    for (const m of ['rahmat', 'спасибо', 'хорошо, с детьми', 'xoʻp']) assert.equal(dil.soruMu(m), false, m)
  })
  it('a full name in either script; a greeting or a wish is not a name', () => {
    assert.equal(dil.adSoyad('aziz karimov'), 'Aziz Karimov')
    assert.equal(dil.adSoyad('Меня зовут Азиз Каримов'), 'Азиз Каримов')
    for (const m of ['Aziz', 'katta rahmat', 'спасибо большое', 'qabulga yozilmoqchiman', 'добрый день']) assert.equal(dil.adSoyad(m), null, m)
  })
  it('the shared answer function with Uzbek and Russian text: rule answer, holding reply, guards before the model', async () => {
    const bilgi = bilgiNormalize({ adres: 'QA koʻchasi 12, 3-qavat', otopark: 'Bino ostida pullik avtoturargoh bor.' })
    const istemler: ModelIstemi[] = []
    const model = async (i: ModelIstemi) => { istemler.push(i); return '{"alanlar":[],"yanit":null}' }
    const lat = dil.dilSec!('avtoturargoh bormi')
    assert.equal((await bilgiYaniti({ soru: 'avtoturargoh bormi', bilgi, dil: lat, model })).metin, 'Avtoturargoh: Bino ostida pullik avtoturargoh bor.')
    const ru = dil.dilSec!('сколько стоит прием')
    const ucret = await bilgiYaniti({ soru: 'сколько стоит прием', bilgi, dil: ru, model })
    assert.equal(ucret.neden, 'alan_bos'); assert.equal(ucret.metin, ru.metin.bekleme)
    assert.equal((await bilgiYaniti({ soru: 'у ребенка температура, что делать?', bilgi, dil: ru, model })).metin, ru.metin.tibbi)
    const kir = dil.dilSec!('нафас ололмаяпман')
    assert.equal((await bilgiYaniti({ soru: 'нафас ололмаяпман', bilgi, dil: kir, model })).metin, kir.metin.acil)
    assert.equal(istemler.length, 0, 'no model call for a rule answer, a missing field or a guard')
    const yok = await bilgiYaniti({ soru: 'lift bormi?', bilgi, dil: lat, model })
    assert.equal(yok.neden, 'model_cevapsiz'); assert.equal(istemler.length, 1)
  })
})
