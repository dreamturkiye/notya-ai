/**
 * ULKE-BRANS-DERINLIK-01 (Kaan, 2026-11-08) — Uzbekistan: specialty scores and calculators, part 3 (orthopaedics, vascular
 * surgery, psychiatry, narcology and clinical psychology, radiology and urology, rheumatology, sports medicine,
 * rehabilitology and physiotherapy, allergology, reproductology, child neurology, dietology). International sources (XALQARO).
 * MACHINE-WRITTEN. AWAITS NATIVE AND CLINICAL REVIEW. Cyrillic derived by rule (./kiril.json).
 */
import type { AracAlani } from '@/lib/ulke/araclar/tipler'
import { sayiMi } from '@/lib/ulke/araclar/yardimci'
import { u, type Uc } from '../../yardimci'
import { b, c, i, t, yuvarla, type UzmanlikSatiri } from './motor'
import { NOT } from './olcekler1'

const s = (anahtar: string, enAz: number, enCok: number, birim?: string, ek: Partial<AracAlani> = {}): AracAlani => ({ anahtar, tur: 'sayi', enAz, enCok, ...(birim ? { birim } : {}), ...ek })
const sec = (anahtar: string, secenekler: string[]): AracAlani => ({ anahtar, tur: 'secim', secenekler })
const isr = (k: string): AracAlani => ({ anahtar: k, tur: 'isaret' })
const nm = (n: number, enAz: number, enCok: number) => Array.from({ length: n }, (_, k) => i(`m${k + 1}`, enAz, enCok))
const hepsi = (n: number, v: number) => Object.fromEntries(Array.from({ length: n }, (_, k) => [`m${k + 1}`, v]))
const DARAJA = u('Daraja', '', 'Степень')
const JINS = u('Jinsi', '', 'Пол')
const ERKEK_AYOL = { erkek: u('Erkak', '', 'Мужской'), kadin: u('Ayol', '', 'Женский') }
const BANDLAR = u('Bandlar shakldan oʻqiladi; savollar matni mualliflarniki va bu yerda takrorlanmaydi.', '', 'Пункты читаются по бланку; формулировки принадлежат авторам и здесь не воспроизводятся.')
const daraja = (n: number, bas = 1): [string, Uc, number][] => Array.from({ length: n }, (_, j) => [String(j + bas), u(String(j + bas), '', String(j + bas)), j + bas])

export const UZ_OLCEKLER_3: readonly UzmanlikSatiri[] = [
  // ── orthopaedics and sport ──
  {
    sekil: 'formul', k: 'ottawa-knee', roller: ['ortopedi', 'acil-tip', 'spor-hekimligi'],
    ad: u('Ottava tizza qoidasi', '', 'Оттавское правило для колена'), aciklama: u('Biror mezon boʻlsa — rentgen koʻrsatilgan.', '', 'При любом критерии показан рентген.'),
    not: NOT, kaynak: 'Stiell IG, et al. Prospective validation of a decision rule for the use of radiography in acute knee injuries. JAMA 1996;275:611-5.',
    alanlar: ['yas', 'patella', 'fibula', 'fleksiyon', 'yuk'].map(isr),
    etiketler: { yas: u('Yoshi ≥55', '', 'Возраст ≥55'), patella: u('Faqat tizza qopqogʻi ogʻrigʻi', '', 'Изолированная болезненность надколенника'), fibula: u('Kichik boldir suyagi boshida ogʻriq', '', 'Болезненность головки малоберцовой кости'), fleksiyon: u('90° bukolmaydi', '', 'Не сгибает до 90°'), yuk: u('4 qadam bosa olmaydi', '', 'Не может сделать 4 шага') },
    sayiAdlari: { bulgu: u('Mezonlar', '', 'Критериев') },
    bantlar: [{ k: 'gerekmez', e: u('Rentgen koʻrsatilmagan', '', 'Рентген не показан') }, { k: 'gerekli', e: u('Rentgen koʻrsatilgan', '', 'Рентген показан') }],
    hesap: (g) => { const n = ['yas', 'patella', 'fibula', 'fleksiyon', 'yuk'].filter((k) => g[k] === true).length; return { sayilar: [{ anahtar: 'bulgu', deger: n, ondalik: 0, enCok: 5 }], bant: n ? 'gerekli' : 'gerekmez' } },
    ornekler: [{ girdi: { fibula: true }, bant: 'gerekli' }, { girdi: { hicbiri: true }, bant: 'gerekmez' }],
  },
  {
    sekil: 'toplam', k: 'kellgren-lawrence', roller: ['ortopedi', 'romatoloji'],
    ad: u('Kellgren–Lawrence rentgenologik darajasi (osteoartrit)', '', 'Рентгенологическая стадия Келлгрена–Лоуренса (остеоартрит)'), aciklama: u('0–4 daraja.', '', 'Стадии 0–4.'),
    not: NOT, kaynak: 'Kellgren JH, Lawrence JS. Radiological assessment of osteo-arthrosis. Ann Rheum Dis 1957;16:494-502.',
    toplamAdi: DARAJA, alanlar: [c('derece', DARAJA, daraja(5, 0))],
    ornekler: [{ girdi: { derece: '3' }, toplam: 3 }],
  },
  {
    sekil: 'toplam', k: 'gustilo-anderson', roller: ['ortopedi'],
    ad: u('Gustilo–Anderson (ochiq sinishlar)', '', 'Густило–Андерсон (открытые переломы)'), aciklama: u('Yakuniy tur birlamchi ishlovda aniqlanadi.', '', 'Окончательный тип — при первичной обработке.'),
    not: NOT, kaynak: 'Gustilo RB, Anderson JT. J Bone Joint Surg Am 1976;58:453-8; Gustilo RB, et al. J Trauma 1984;24:742-6.',
    toplamAdi: u('Tur', '', 'Тип'),
    alanlar: [c('tip', u('Tur', '', 'Тип'), [['1', u('I — yara <1 sm, toza', '', 'I — рана <1 см, чистая'), 1], ['2', u('II — yara 1–10 sm', '', 'II — рана 1–10 см'), 2], ['3a', u('IIIA — yumshoq toʻqima yopishi yetarli', '', 'IIIA — достаточное покрытие'), 3], ['3b', u('IIIB — loskut kerak', '', 'IIIB — нужен лоскут'), 4], ['3c', u('IIIC — arteriya shikasti', '', 'IIIC — повреждение артерии'), 5]])],
    ornekler: [{ girdi: { tip: '3b' }, toplam: 4 }],
  },
  {
    sekil: 'toplam', k: 'beighton', roller: ['ortopedi', 'spor-hekimligi', 'fizyoterapi'],
    ad: u('Beighton shkalasi (boʻgʻim gipermobilligi)', '', 'Шкала Бейтона (гипермобильность суставов)'), aciklama: u('9 ball.', '', '9 баллов.'),
    not: NOT, kaynak: 'Beighton P, et al. Ann Rheum Dis 1973;32:413-8; Malfait F, et al. Am J Med Genet C 2017;175:8-26 (≥5 to age 50).',
    alanlar: [t('serce_sag', u('Oʻng jimjiloq >90°', '', 'Правый мизинец >90°')), t('serce_sol', u('Chap jimjiloq >90°', '', 'Левый мизинец >90°')), t('bas_sag', u('Oʻng bosh barmoq bilakka', '', 'Правый большой палец к предплечью')), t('bas_sol', u('Chap bosh barmoq bilakka', '', 'Левый большой палец к предплечью')), t('dirsek_sag', u('Oʻng tirsak >10°', '', 'Правый локоть >10°')), t('dirsek_sol', u('Chap tirsak >10°', '', 'Левый локоть >10°')), t('diz_sag', u('Oʻng tizza >10°', '', 'Правое колено >10°')), t('diz_sol', u('Chap tizza >10°', '', 'Левое колено >10°')), t('govde', u('Kaftlar polga', '', 'Ладони на пол'))],
    ornekler: [{ girdi: { serce_sag: true, serce_sol: true, dirsek_sag: true, dirsek_sol: true, govde: true }, toplam: 5 }],
  },
  {
    sekil: 'formul', k: 'acwr', roller: ['spor-hekimligi'],
    ad: u('Oʻtkir:surunkali yuklama nisbati', '', 'Отношение острой и хронической нагрузки'), aciklama: u('Shu hafta yuklamasi ÷ oxirgi 4 hafta oʻrtachasi.', '', 'Нагрузка недели ÷ среднее за 4 недели.'),
    not: NOT, kaynak: 'Gabbett TJ. Br J Sports Med 2016;50:273-80.',
    alanlar: [s('akut', 0, 100000), s('h1', 0, 100000), s('h2', 0, 100000), s('h3', 0, 100000), s('h4', 0, 100000)],
    etiketler: { akut: u('Shu hafta', '', 'Эта неделя'), h1: u('1-hafta', '', 'Неделя 1'), h2: u('2-hafta', '', 'Неделя 2'), h3: u('3-hafta', '', 'Неделя 3'), h4: u('4-hafta', '', 'Неделя 4') },
    sayiAdlari: { oran: u('Nisbat', '', 'Отношение') },
    bantlar: [{ k: 'dusuk', e: u('<0,8', '', '<0,8') }, { k: 'hedef', e: u('0,8–1,3', '', '0,8–1,3') }, { k: 'artmis', e: u('1,3–1,5', '', '1,3–1,5') }, { k: 'yuksek', e: u('>1,5 — keskin oshish', '', '>1,5 — резкий рост') }],
    hesap: (g) => { const kr = ((g.h1 as number) + (g.h2 as number) + (g.h3 as number) + (g.h4 as number)) / 4; if (kr <= 0) return null; const o = (g.akut as number) / kr; return { sayilar: [{ anahtar: 'oran', deger: yuvarla(o, 2), ondalik: 2 }], bant: o < 0.8 ? 'dusuk' : o <= 1.3 ? 'hedef' : o <= 1.5 ? 'artmis' : 'yuksek' } },
    ornekler: [{ girdi: { akut: 1500, h1: 1000, h2: 1000, h3: 900, h4: 1100 }, sayilar: { oran: 1.5 }, bant: 'artmis' }],
  },
  {
    sekil: 'formul', k: 'cooper-vo2', roller: ['spor-hekimligi'],
    ad: u('Cooper testi boʻyicha VO2max', '', 'VO2max по тесту Купера'), aciklama: u('(masofa m − 504,9) / 44,73.', '', '(дистанция м − 504,9) / 44,73.'),
    not: NOT, kaynak: 'Cooper KH. JAMA 1968;203:201-4.',
    alanlar: [s('mesafe', 600, 5000, 'm')], etiketler: { mesafe: u('12 daqiqadagi masofa', '', 'Дистанция за 12 минут') },
    sayiAdlari: { vo2: u('VO2max', '', 'VO2max') }, sonucBirimleri: ['mL/kg/min'],
    hesap: (g) => ({ sayilar: [{ anahtar: 'vo2', deger: yuvarla(((g.mesafe as number) - 504.9) / 44.73, 1), ondalik: 1, birim: 'mL/kg/min' }] }),
    ornekler: [{ girdi: { mesafe: 2800 }, sayilar: { vo2: 51.3 } }],
  },
  // ── vascular ──
  {
    sekil: 'formul', k: 'abpi-tbi', roller: ['damar-cerrahisi', 'endokrinoloji'],
    ad: u('Toʻpiq–yelka va barmoq–yelka indeksi', '', 'Лодыжечно-плечевой и пальце-плечевой индекс'), aciklama: u('Yelka, toʻpiq va (ixtiyoriy) barmoq bosimi.', '', 'Давление на плече, лодыжке и (необязательно) пальце.'),
    not: NOT, kaynak: 'IWGDF 2023 guideline on peripheral artery disease in diabetes (Fitridge R, et al. Diabetes Metab Res Rev 2024;40:e3686): PAD less likely with ABI 0.9–1.3 and TBI ≥0.75; urgent imaging with ankle pressure <50 mmHg, ABI <0.5 or toe pressure <30 mmHg.',
    alanlar: [s('brakiyal', 50, 300, 'mmHg'), s('ayak_bilegi', 0, 350, 'mmHg'), s('ayak_parmagi', 0, 300, 'mmHg', { istege: true })],
    etiketler: { brakiyal: u('Yelka sistolik bosimi', '', 'Систолическое давление на плече'), ayak_bilegi: u('Toʻpiq sistolik bosimi', '', 'Систолическое давление на лодыжке'), ayak_parmagi: u('Barmoq bosimi (ixtiyoriy)', '', 'Давление на пальце (необязательно)') },
    sayiAdlari: { abpi: u('TYI', '', 'ЛПИ'), tbi: u('BYI', '', 'ППИ') },
    bantlar: [{ k: 'olasi_degil', e: u('PAK ehtimoli past', '', 'ЗПА маловероятно') }, { k: 'pad', e: u('PAKga shubha', '', 'Подозрение на ЗПА') }, { k: 'sikistirilamaz', e: u('TYI >1,3 — siqilmaydigan tomirlar', '', 'ЛПИ >1,3 — несжимаемые сосуды') }],
    uyarilar: [{ k: 'kritik', e: u('Shoshilinch tomir tekshiruvi kerak', '', 'Нужна срочная сосудистая оценка') }],
    hesap: (g) => {
      const br = g.brakiyal as number, abpi = yuvarla((g.ayak_bilegi as number) / br, 2)
      const tp = sayiMi(g.ayak_parmagi) ? (g.ayak_parmagi as number) : null, tbi = tp === null ? null : yuvarla(tp / br, 2)
      let bant = abpi > 1.3 ? 'sikistirilamaz' : abpi < 0.9 ? 'pad' : 'olasi_degil'
      if (bant !== 'pad' && tbi !== null && tbi < 0.75) bant = 'pad'
      return { sayilar: [{ anahtar: 'abpi', deger: abpi, ondalik: 2 }, ...(tbi === null ? [] : [{ anahtar: 'tbi', deger: tbi, ondalik: 2 }])], bant, uyarilar: (tp !== null && tp < 30) || abpi < 0.5 || (g.ayak_bilegi as number) < 50 ? ['kritik'] : [] }
    },
    ornekler: [{ girdi: { brakiyal: 140, ayak_bilegi: 105, ayak_parmagi: 70 }, sayilar: { abpi: 0.75, tbi: 0.5 }, bant: 'pad' }],
  },
  {
    sekil: 'toplam', k: 'rutherford-class', roller: ['damar-cerrahisi'],
    ad: u('Rutherford toifasi (surunkali ishemiya)', '', 'Категория Резерфорда (хроническая ишемия)'), aciklama: u('0–6.', '', '0–6.'),
    not: NOT, kaynak: 'Rutherford RB, et al. J Vasc Surg 1997;26:517-38.',
    toplamAdi: u('Toifa', '', 'Категория'), alanlar: [c('kategori', u('Toifa', '', 'Категория'), daraja(7, 0))],
    bantlar: [b(0, 'asemptomatik', u('0 — belgisiz', '', '0 — бессимптомно')), b(1, 'kladikasyo', u('1–3 — oqsoqlanish', '', '1–3 — перемежающаяся хромота')), b(4, 'klti', u('4–6 — oyoqqa xavfli ishemiya', '', '4–6 — угрожающая ишемия'))],
    ornekler: [{ girdi: { kategori: '5' }, bant: 'klti' }],
  },
  {
    sekil: 'toplam', k: 'ceap-clinical', roller: ['damar-cerrahisi'],
    ad: u('CEAP klinik sinfi', '', 'Клинический класс CEAP'), aciklama: u('C0–C6.', '', 'C0–C6.'),
    not: NOT, kaynak: 'Lurie F, et al. The 2020 update of the CEAP classification system. J Vasc Surg Venous Lymphat Disord 2020;8:342-52.',
    toplamAdi: u('Sinf', '', 'Класс'), alanlar: [c('sinif', u('Sinf', '', 'Класс'), daraja(7, 0))],
    ornekler: [{ girdi: { sinif: '4' }, toplam: 4 }],
  },
  // ── mental health ──
  {
    sekil: 'toplam', k: 'audit', roller: ['psikiyatri', 'narkoloji', 'klinik-psikolog'],
    ad: u('AUDIT (alkogol isteʼmoli testi)', '', 'AUDIT (тест употребления алкоголя)'), aciklama: u('10 band, JSST zonalari.', '', '10 пунктов, зоны ВОЗ.'),
    not: BANDLAR, kaynak: 'Babor TF, et al. AUDIT. Guidelines for use in primary care. 2nd ed. Geneva: WHO; 2001.',
    toplamAdi: u('AUDIT', '', 'AUDIT'), alanlar: nm(10, 0, 4),
    bantlar: [b(0, 'z1', u('I zona (0–7)', '', 'Зона I (0–7)')), b(8, 'z2', u('II zona (8–15)', '', 'Зона II (8–15)')), b(16, 'z3', u('III zona (16–19)', '', 'Зона III (16–19)')), b(20, 'z4', u('IV zona (20–40)', '', 'Зона IV (20–40)'))],
    ornekler: [{ girdi: { ...hepsi(8, 1), m9: 0, m10: 0 }, toplam: 8, bant: 'z2' }],
  },
  {
    sekil: 'toplam', k: 'ciwa-ar', roller: ['narkoloji', 'psikiyatri'],
    ad: u('CIWA-Ar (alkogol abstinensiyasi)', '', 'CIWA-Ar (алкогольная абстиненция)'), aciklama: u('10 band, 0–67.', '', '10 пунктов, 0–67.'),
    not: NOT, kaynak: 'Sullivan JT, et al. Br J Addict 1989;84:1353-7 (below 10 usually needs no additional medication).',
    toplamAdi: u('CIWA-Ar', '', 'CIWA-Ar'), alanlar: [...Array.from({ length: 9 }, (_, k) => i(`m${k + 1}`, 0, 7)), i('m10', 0, 4)],
    bantlar: [b(0, 'minimal', u('<10', '', '<10')), b(10, 'belirgin', u('≥10 — klinik ahamiyatli', '', '≥10 — клинически значимая'))],
    ornekler: [{ girdi: { ...hepsi(9, 1), m10: 3 }, toplam: 12, bant: 'belirgin' }],
  },
  {
    sekil: 'toplam', k: 'cows', roller: ['narkoloji', 'psikiyatri'],
    ad: u('COWS (opiat abstinensiyasi)', '', 'COWS (опиатная абстиненция)'), aciklama: u('11 belgi, 0–48.', '', '11 признаков, 0–48.'),
    not: NOT, kaynak: 'Wesson DR, Ling W. J Psychoactive Drugs 2003;35:253-9.',
    toplamAdi: u('COWS', '', 'COWS'), alanlar: [i('m1', 0, 4), i('m2', 0, 4), i('m3', 0, 5), i('m4', 0, 5), i('m5', 0, 4), i('m6', 0, 4), i('m7', 0, 5), i('m8', 0, 4), i('m9', 0, 4), i('m10', 0, 4), i('m11', 0, 5)],
    bantlar: [b(0, 'yok', u('0–4', '', '0–4')), b(5, 'hafif', u('5–12 — yengil', '', '5–12 — лёгкая')), b(13, 'orta', u('13–24 — oʻrtacha', '', '13–24 — умеренная')), b(25, 'orta_agir', u('25–36 — oʻrtacha ogʻir', '', '25–36 — умеренно тяжёлая')), b(37, 'agir', u('>36 — ogʻir', '', '>36 — тяжёлая'))],
    ornekler: [{ girdi: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1, m7: 2, m8: 1, m9: 1, m10: 2, m11: 3 }, toplam: 15, bant: 'orta' }],
  },
  {
    sekil: 'toplam', k: 'epds', roller: ['kadin-hastaliklari-dogum', 'psikiyatri', 'aile-hekimligi'],
    ad: u('Edinburg tugʻruqdan keyingi depressiya shkalasi', '', 'Эдинбургская шкала послеродовой депрессии'), aciklama: u('10 band, 0–3; 10-band oʻz-oʻziga zarar haqida.', '', '10 пунктов, 0–3; пункт 10 о самоповреждении.'),
    not: BANDLAR, kaynak: 'Cox JL, Holden JM, Sagovsky R. Br J Psychiatry 1987;150:782-6 (≥10 possible, ≥13 probable depression).',
    toplamAdi: u('EPDS', '', 'EPDS'), alanlar: nm(10, 0, 3),
    bantlar: [b(0, 'dusuk', u('<10', '', '<10')), b(10, 'ara', u('10–12 — ehtimolli', '', '10–12 — возможна')), b(13, 'yuksek', u('≥13 — yuqori ehtimol', '', '≥13 — вероятна'))],
    uyarilar: [{ k: 'madde10', e: u('10-band noldan katta — bugun xavfsizlik baholansin', '', 'Пункт 10 не ноль — оценить безопасность сегодня'), kosul: (_x, g) => sayiMi(g.m10) && (g.m10 as number) > 0 }],
    ornekler: [{ girdi: { ...hepsi(9, 2), m10: 1 }, toplam: 19, bant: 'yuksek', uyarilar: ['madde10'] }],
  },
  {
    sekil: 'toplam', k: 'pcl-5', roller: ['klinik-psikolog', 'psikiyatri'],
    ad: u('PCL-5 (TSSB nazorat roʻyxati)', '', 'PCL-5 (контрольный список ПТСР)'), aciklama: u('20 band, 0–80.', '', '20 пунктов, 0–80.'),
    not: BANDLAR, kaynak: 'Weathers FW, et al. The PTSD Checklist for DSM-5 (PCL-5). US Department of Veterans Affairs, 2013 (public domain); Bovin MJ, et al. Psychol Assess 2016;28:1379-91.',
    toplamAdi: u('PCL-5', '', 'PCL-5'), alanlar: nm(20, 0, 4),
    bantlar: [b(0, 'dusuk', u('<31', '', '<31')), b(31, 'olasi', u('≥31 — klinik baholash kerak', '', '≥31 — нужна клиническая оценка'))],
    ornekler: [{ girdi: hepsi(20, 2), toplam: 40, bant: 'olasi' }],
  },
  {
    sekil: 'formul', k: 'dass-21', roller: ['klinik-psikolog', 'psikiyatri'],
    ad: u('DASS-21 (depressiya, xavotir, stress)', '', 'DASS-21 (депрессия, тревога, стресс)'), aciklama: u('21 band, har bir kichik shkala ×2.', '', '21 пункт, каждая подшкала ×2.'),
    not: BANDLAR, kaynak: 'Lovibond SH, Lovibond PF. Manual for the Depression Anxiety Stress Scales. 2nd ed. Sydney: Psychology Foundation; 1995 (public domain).',
    alanlar: Array.from({ length: 21 }, (_, k) => ({ anahtar: `m${k + 1}`, tur: 'puan' as const, enAz: 0, enCok: 3, tam: true, numarali: true as const })),
    etiketler: {},
    sayiAdlari: { depresyon: u('Depressiya', '', 'Депрессия'), anksiyete: u('Xavotir', '', 'Тревога'), stres: u('Stress', '', 'Стресс') },
    uyarilar: (['d', 'a', 's'] as const).flatMap((alt) => (['orta', 'agir', 'cok_agir'] as const).map((d) => ({ k: `${alt}_${d}`, e: u(`${{ d: 'Depressiya', a: 'Xavotir', s: 'Stress' }[alt]}: ${{ orta: 'oʻrtacha', agir: 'ogʻir', cok_agir: 'juda ogʻir' }[d]}`, '', `${{ d: 'Депрессия', a: 'Тревога', s: 'Стресс' }[alt]}: ${{ orta: 'умеренная', agir: 'тяжёлая', cok_agir: 'крайне тяжёлая' }[d]}`) }))),
    hesap: (g) => {
      const top = (m: number[]) => 2 * m.reduce((x, k) => x + (g[`m${k}`] as number), 0)
      const d = top([3, 5, 10, 13, 16, 17, 21]), a = top([2, 4, 7, 9, 15, 19, 20]), st = top([1, 6, 8, 11, 12, 14, 18])
      const ag = (v: number, l: [number, number, number]) => (v >= l[2] ? 'cok_agir' : v >= l[1] ? 'agir' : v >= l[0] ? 'orta' : null)
      const uy = [['d', ag(d, [14, 21, 28])], ['a', ag(a, [10, 15, 20])], ['s', ag(st, [19, 26, 34])]].filter(([, x]) => x).map(([k, x]) => `${k}_${x}`)
      return { sayilar: [{ anahtar: 'depresyon', deger: d, ondalik: 0, enCok: 42 }, { anahtar: 'anksiyete', deger: a, ondalik: 0, enCok: 42 }, { anahtar: 'stres', deger: st, ondalik: 0, enCok: 42 }], uyarilar: uy }
    },
    ornekler: [{ girdi: hepsi(21, 1), sayilar: { depresyon: 14, anksiyete: 14, stres: 14 } }],
  },
  {
    sekil: 'formul', k: 'reliable-change', roller: ['klinik-psikolog'],
    ad: u('Ishonchli oʻzgarish indeksi (Jacobson–Truax)', '', 'Индекс надёжного изменения (Якобсон–Труакс)'), aciklama: u('Ikki ball orasidagi farq oʻlchov xatosidan oshadimi.', '', 'Превышает ли разница двух баллов ошибку измерения.'),
    not: NOT, kaynak: 'Jacobson NS, Truax P. J Consult Clin Psychol 1991;59:12-9 (|RCI| > 1.96).',
    alanlar: [s('once', -1000, 1000), s('sonra', -1000, 1000), s('sd', 0.01, 1000), s('r', 0, 0.99)],
    etiketler: { once: u('Boshlangʻich ball', '', 'Исходный балл'), sonra: u('Hozirgi ball', '', 'Текущий балл'), sd: u('Standart ogʻish', '', 'Стандартное отклонение'), r: u('Test-retest ishonchliligi', '', 'Тест-ретестовая надёжность') },
    sayiAdlari: { rci: u('RCI', '', 'RCI') },
    bantlar: [{ k: 'guvenilir_degisim', e: u('Ishonchli oʻzgarish', '', 'Надёжное изменение') }, { k: 'degisim_yok', e: u('Oʻlchov xatosi doirasida', '', 'В пределах ошибки измерения') }],
    hesap: (g) => { const rci = ((g.sonra as number) - (g.once as number)) / (Math.SQRT2 * (g.sd as number) * Math.sqrt(1 - (g.r as number))); return { sayilar: [{ anahtar: 'rci', deger: yuvarla(rci, 2), ondalik: 2 }], bant: Math.abs(rci) > 1.96 ? 'guvenilir_degisim' : 'degisim_yok' } },
    ornekler: [{ girdi: { once: 30, sonra: 18, sd: 8, r: 0.9 }, sayilar: { rci: -3.35 }, bant: 'guvenilir_degisim' }],
  },
  // ── radiology and urology ──
  {
    sekil: 'formul', k: 'adrenal-washout', roller: ['radyoloji', 'endokrinoloji'],
    ad: u('Buyrak usti bezi yuvilishi (KT)', '', 'Вымывание контраста надпочечника (КТ)'), aciklama: u('Absolyut va nisbiy yuvilish, HU.', '', 'Абсолютное и относительное вымывание, HU.'),
    not: NOT, kaynak: 'Caoili EM, et al. Radiology 2002;222:629-33 (absolute ≥60% or relative ≥40% consistent with adenoma).',
    alanlar: [s('kontrastsiz', -100, 200, undefined, { istege: true }), s('kontrastli', -100, 400), s('gec', -100, 400)],
    etiketler: { kontrastsiz: u('Kontrastsiz zichlik (ixtiyoriy)', '', 'Нативная плотность (необязательно)'), kontrastli: u('Kontrastli zichlik (60–70 s)', '', 'Плотность в фазе 60–70 с'), gec: u('Kechikkan zichlik (15 daq)', '', 'Отсроченная плотность (15 мин)') },
    sayiAdlari: { mutlak: u('Absolyut yuvilish', '', 'Абсолютное вымывание'), goreli: u('Nisbiy yuvilish', '', 'Относительное вымывание') }, sonucBirimleri: ['%'],
    bantlar: [{ k: 'adenom', e: u('Adenomaga mos', '', 'Соответствует аденоме') }, { k: 'belirsiz', e: u('Adenoma oraligʻida emas', '', 'Вне диапазона аденомы') }],
    hesap: (g) => {
      const E = g.kontrastli as number, D = g.gec as number
      if (E === 0) return null
      const gr = ((E - D) / E) * 100
      const sy = [{ anahtar: 'goreli', deger: yuvarla(gr, 0), ondalik: 0, birim: '%' }]
      let mt: number | null = null
      if (sayiMi(g.kontrastsiz) && E !== g.kontrastsiz) { mt = ((E - D) / (E - (g.kontrastsiz as number))) * 100; sy.unshift({ anahtar: 'mutlak', deger: yuvarla(mt, 0), ondalik: 0, birim: '%' }) }
      return { sayilar: sy, bant: (mt !== null && mt >= 60) || gr >= 40 ? 'adenom' : 'belirsiz' }
    },
    ornekler: [{ girdi: { kontrastsiz: 20, kontrastli: 80, gec: 40 }, sayilar: { mutlak: 67, goreli: 50 }, bant: 'adenom' }],
  },
  {
    sekil: 'formul', k: 'ct-effective-dose', roller: ['radyoloji'],
    ad: u('KT samarali dozasi (DLP boʻyicha)', '', 'Эффективная доза КТ (по DLP)'), aciklama: u('DLP × soha koʻpaytiruvchisi (kattalar).', '', 'DLP × коэффициент области (взрослые).'),
    not: NOT, kaynak: 'American Association of Physicists in Medicine. AAPM Report No. 96 (2008): head 0.0021, neck 0.0059, chest 0.014, abdomen-pelvis 0.015 mSv/(mGy·cm).',
    alanlar: [s('dlp', 1, 20000), sec('bolge', ['bas', 'boyun', 'gogus', 'karin'])],
    etiketler: { dlp: u('DLP (mGy·sm)', '', 'DLP (мГр·см)'), bolge: u('Soha', '', 'Область') },
    secenekEtiketleri: { bolge: { bas: u('Bosh', '', 'Голова'), boyun: u('Boʻyin', '', 'Шея'), gogus: u('Koʻkrak qafasi', '', 'Грудная клетка'), karin: u('Qorin va kichik chanoq', '', 'Живот и таз') } },
    sayiAdlari: { doz: u('Samarali doza (mZv)', '', 'Эффективная доза (мЗв)') },
    hesap: (g) => ({ sayilar: [{ anahtar: 'doz', deger: yuvarla((g.dlp as number) * ({ bas: 0.0021, boyun: 0.0059, gogus: 0.014, karin: 0.015 } as Record<string, number>)[g.bolge as string], 1), ondalik: 1 }] }),
    ornekler: [{ girdi: { dlp: 500, bolge: 'karin' }, sayilar: { doz: 7.5 } }],
  },
  {
    sekil: 'toplam', k: 'bosniak', roller: ['radyoloji', 'uroloji'],
    ad: u('Bosniak tasnifi (buyrak kistalari, 2019)', '', 'Классификация Босняка (кисты почек, 2019)'), aciklama: u('KT yoki MRT belgilari boʻyicha.', '', 'По признакам КТ или МРТ.'),
    not: NOT, kaynak: 'Silverman SG, et al. Bosniak classification of cystic renal masses, version 2019. Radiology 2019;292:475-88.',
    toplamAdi: u('Sinf', '', 'Класс'),
    alanlar: [c('sinif', u('Sinf', '', 'Класс'), [['1', u('I', '', 'I'), 1], ['2', u('II', '', 'II'), 2], ['2f', u('IIF', '', 'IIF'), 3], ['3', u('III', '', 'III'), 4], ['4', u('IV', '', 'IV'), 5]])],
    ornekler: [{ girdi: { sinif: '2f' }, toplam: 3 }],
  },
  {
    sekil: 'formul', k: 'prostate-volume-psad', roller: ['uroloji', 'radyoloji'],
    ad: u('Prostata hajmi va PSA zichligi', '', 'Объём простаты и плотность ПСА'), aciklama: u('U × K × B × 0,52 (sm); PSA kiritilsa — zichlik.', '', 'Д × Ш × В × 0,52 (см); при вводе ПСА — плотность.'),
    not: NOT, kaynak: 'Terris MK, Stamey TA. J Urol 1991;145:984-7; Benson MC, et al. J Urol 1992;147:815-6 (0.15).',
    alanlar: [s('uzunluk', 1, 15, 'cm'), s('genislik', 1, 15, 'cm'), s('yukseklik', 1, 15, 'cm'), s('psa', 0.01, 1000, 'ng/mL', { istege: true })],
    etiketler: { uzunluk: u('Uzunlik', '', 'Длина'), genislik: u('Kenglik', '', 'Ширина'), yukseklik: u('Balandlik', '', 'Высота'), psa: u('PSA (ixtiyoriy)', '', 'ПСА (необязательно)') },
    sayiAdlari: { hacim: u('Hajm', '', 'Объём'), psad: u('PSA zichligi', '', 'Плотность ПСА') }, sonucBirimleri: ['mL'],
    bantlar: [{ k: 'alt', e: u('<0,15', '', '<0,15') }, { k: 'ust', e: u('≥0,15', '', '≥0,15') }],
    hesap: (g) => { const v = (g.uzunluk as number) * (g.genislik as number) * (g.yukseklik as number) * 0.52; const sy = [{ anahtar: 'hacim', deger: yuvarla(v, 0), ondalik: 0, birim: 'mL' }]; if (!sayiMi(g.psa)) return { sayilar: sy }; const d = (g.psa as number) / v; return { sayilar: [...sy, { anahtar: 'psad', deger: yuvarla(d, 2), ondalik: 2 }], bant: d >= 0.15 ? 'ust' : 'alt' } },
    ornekler: [{ girdi: { uzunluk: 4, genislik: 4, yukseklik: 3, psa: 6 }, sayilar: { hacim: 25, psad: 0.24 }, bant: 'ust' }],
  },
  {
    sekil: 'toplam', k: 'guys-stone', roller: ['uroloji'],
    ad: u('Guy tosh shkalasi (PNL)', '', 'Шкала камней Гая (ПНЛ)'), aciklama: u('I–IV daraja.', '', 'Степени I–IV.'),
    not: NOT, kaynak: 'Thomas K, et al. The Guy\'s stone score. Urology 2011;78:277-81.',
    toplamAdi: DARAJA, alanlar: [c('derece', DARAJA, daraja(4))],
    ornekler: [{ girdi: { derece: '4' }, toplam: 4 }],
  },
  // ── rheumatology ──
  {
    sekil: 'formul', k: 'cdai', roller: ['romatoloji'],
    ad: u('CDAI (revmatoid artrit faolligi)', '', 'CDAI (активность ревматоидного артрита)'), aciklama: u('Shishgan va ogʻriqli boʻgʻimlar (28) + ikki global baho.', '', 'Припухшие и болезненные суставы (28) + две глобальные оценки.'),
    not: NOT, kaynak: 'Aletaha D, et al. Arthritis Res Ther 2005;7:R796-806 (≤2.8, ≤10, ≤22, >22).',
    alanlar: [s('sjc', 0, 28, undefined, { tam: true }), s('tjc', 0, 28, undefined, { tam: true }), s('hasta', 0, 10), s('hekim', 0, 10)],
    etiketler: { sjc: u('Shishgan boʻgʻimlar (28)', '', 'Припухшие суставы (28)'), tjc: u('Ogʻriqli boʻgʻimlar (28)', '', 'Болезненные суставы (28)'), hasta: u('Bemor global bahosi (0–10)', '', 'Оценка пациента (0–10)'), hekim: u('Shifokor global bahosi (0–10)', '', 'Оценка врача (0–10)') },
    sayiAdlari: { cdai: u('CDAI', '', 'CDAI') },
    bantlar: [{ k: 'remisyon', e: u('Remissiya', '', 'Ремиссия') }, { k: 'dusuk', e: u('Past faollik', '', 'Низкая активность') }, { k: 'orta', e: u('Oʻrtacha faollik', '', 'Умеренная активность') }, { k: 'yuksek', e: u('Yuqori faollik', '', 'Высокая активность') }],
    hesap: (g) => { const v = (g.sjc as number) + (g.tjc as number) + (g.hasta as number) + (g.hekim as number); return { sayilar: [{ anahtar: 'cdai', deger: yuvarla(v, 1), ondalik: 1 }], bant: v <= 2.8 ? 'remisyon' : v <= 10 ? 'dusuk' : v <= 22 ? 'orta' : 'yuksek' } },
    ornekler: [{ girdi: { sjc: 4, tjc: 6, hasta: 5, hekim: 4 }, sayilar: { cdai: 19 }, bant: 'orta' }],
  },
  {
    sekil: 'formul', k: 'basdai', roller: ['romatoloji'],
    ad: u('BASDAI', '', 'BASDAI'), aciklama: u('6 ta baho 0–10.', '', '6 оценок 0–10.'),
    not: NOT, kaynak: 'Garrett S, et al. J Rheumatol 1994;21:2286-91 (≥4 active).',
    alanlar: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map((k) => s(k, 0, 10)),
    etiketler: { q1: u('1 Charchoq', '', '1 Утомляемость'), q2: u('2 Umurtqa ogʻrigʻi', '', '2 Боль в позвоночнике'), q3: u('3 Periferik boʻgʻimlar', '', '3 Периферические суставы'), q4: u('4 Bosganda ogʻriqli joylar', '', '4 Болезненные при давлении зоны'), q5: u('5 Ertalabki qotishlik kuchi', '', '5 Выраженность утренней скованности'), q6: u('6 Ertalabki qotishlik davomiyligi', '', '6 Длительность утренней скованности') },
    sayiAdlari: { basdai: u('BASDAI', '', 'BASDAI') },
    bantlar: [{ k: 'aktif_degil', e: u('<4', '', '<4') }, { k: 'aktif', e: u('≥4 — faol', '', '≥4 — активный') }],
    hesap: (g) => { const v = ((g.q1 as number) + (g.q2 as number) + (g.q3 as number) + (g.q4 as number) + ((g.q5 as number) + (g.q6 as number)) / 2) / 5; return { sayilar: [{ anahtar: 'basdai', deger: yuvarla(v, 1), ondalik: 1 }], bant: v >= 4 ? 'aktif' : 'aktif_degil' } },
    ornekler: [{ girdi: { q1: 6, q2: 7, q3: 3, q4: 4, q5: 6, q6: 4 }, sayilar: { basdai: 5 }, bant: 'aktif' }],
  },
  {
    sekil: 'toplam', k: 'acr-eular-ra-2010', roller: ['romatoloji'],
    ad: u('ACR/EULAR 2010 revmatoid artrit mezonlari', '', 'Критерии РА ACR/EULAR 2010'), aciklama: u('≥6 — RA deb tasniflanadi.', '', '≥6 — классифицируется как РА.'),
    not: NOT, kaynak: 'Aletaha D, et al. 2010 rheumatoid arthritis classification criteria. Ann Rheum Dis 2010;69:1580-8.',
    alanlar: [c('eklem', u('Boʻgʻimlar', '', 'Суставы'), [['0', u('1 yirik', '', '1 крупный'), 0], ['1', u('2–10 yirik', '', '2–10 крупных'), 1], ['2', u('1–3 mayda', '', '1–3 мелких'), 2], ['3', u('4–10 mayda', '', '4–10 мелких'), 3], ['5', u('>10 (≥1 mayda)', '', '>10 (≥1 мелкий)'), 5]]), c('seroloji', u('RF / ACPA', '', 'РФ / АЦЦП'), [['0', u('Manfiy', '', 'Отрицательные'), 0], ['2', u('Past musbat', '', 'Низкоположительные'), 2], ['3', u('Yuqori musbat', '', 'Высокоположительные'), 3]]), t('akut_faz', u('SRO yoki EChT oshgan', '', 'СРБ или СОЭ повышены')), t('sure', u('Belgilar ≥6 hafta', '', 'Симптомы ≥6 недель'))],
    bantlar: [b(0, 'degil', u('<6', '', '<6')), b(6, 'ra', u('≥6 — RA', '', '≥6 — РА'))],
    ornekler: [{ girdi: { eklem: '3', seroloji: '2', sure: true }, toplam: 6, bant: 'ra' }],
  },
  // ── rehabilitation and physiotherapy ──
  {
    sekil: 'toplam', k: 'barthel', roller: ['fizik-tedavi', 'fizyoterapi', 'noroloji'],
    ad: u('Barthel kundalik faollik indeksi', '', 'Индекс повседневной активности Бартел'), aciklama: u('10 faoliyat, 0–100.', '', '10 видов активности, 0–100.'),
    not: NOT, kaynak: 'Mahoney FI, Barthel DW. Md State Med J 1965;14:61-5.',
    alanlar: [['beslenme', 'Ovqatlanish', 'Приём пищи', [0, 5, 10]], ['banyo', 'Yuvinish', 'Мытьё', [0, 5]], ['bakim', 'Shaxsiy gigiyena', 'Личная гигиена', [0, 5]], ['giyinme', 'Kiyinish', 'Одевание', [0, 5, 10]], ['bagirsak', 'Ichak', 'Кишечник', [0, 5, 10]], ['mesane', 'Siydik pufagi', 'Мочевой пузырь', [0, 5, 10]], ['tuvalet', 'Hojatxona', 'Туалет', [0, 5, 10]], ['transfer', 'Koʻchish', 'Перемещение', [0, 5, 10, 15]], ['mobilite', 'Yurish', 'Ходьба', [0, 5, 10, 15]], ['merdiven', 'Zinapoya', 'Лестница', [0, 5, 10]]].map(([k, l, r, p]) => c(k as string, u(l as string, '', r as string), (p as number[]).map((v) => [String(v), u(String(v), '', String(v)), v] as [string, Uc, number]))),
    ornekler: [{ girdi: { beslenme: '10', banyo: '5', bakim: '5', giyinme: '10', bagirsak: '10', mesane: '10', tuvalet: '10', transfer: '15', mobilite: '15', merdiven: '10' }, toplam: 100 }],
  },
  {
    sekil: 'toplam', k: 'berg-balance', roller: ['fizik-tedavi', 'fizyoterapi'],
    ad: u('Berg muvozanat shkalasi', '', 'Шкала баланса Берг'), aciklama: u('14 band, 0–4.', '', '14 пунктов, 0–4.'),
    not: BANDLAR, kaynak: 'Berg KO, et al. Can J Public Health 1992;83 Suppl 2:S7-11 (<45 greater fall risk).',
    toplamAdi: u('Berg', '', 'Берг'), alanlar: nm(14, 0, 4),
    bantlar: [b(0, 'yuksek', u('<45 — yiqilish xavfi yuqori', '', '<45 — высокий риск падений')), b(45, 'dusuk', u('45–56', '', '45–56'))],
    ornekler: [{ girdi: hepsi(14, 3), toplam: 42, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'modified-ashworth', roller: ['fizik-tedavi', 'fizyoterapi', 'cocuk-norolojisi'],
    ad: u('Modifikatsiyalangan Ashworth shkalasi', '', 'Модифицированная шкала Ашворта'), aciklama: u('Spastiklik darajasi (1+ = 1,5).', '', 'Степень спастичности (1+ = 1,5).'),
    not: NOT, kaynak: 'Bohannon RW, Smith MB. Phys Ther 1987;67:206-7.',
    toplamAdi: DARAJA,
    alanlar: [c('derece', DARAJA, [['0', u('0', '', '0'), 0], ['1', u('1', '', '1'), 2], ['1p', u('1+', '', '1+'), 3], ['2', u('2', '', '2'), 4], ['3', u('3', '', '3'), 6], ['4', u('4', '', '4'), 8]])],
    donustur: { f: (x) => (x <= 4 ? [0, 0, 1, 1.5, 2][x] ?? x : x / 2), ondalik: 1, enCok: 4 },
    ornekler: [{ girdi: { derece: '1p' }, toplam: 1.5 }],
  },
  {
    sekil: 'toplam', k: 'fac', roller: ['fizik-tedavi'],
    ad: u('Funksional yurish toifasi (FAC)', '', 'Функциональная категория ходьбы (FAC)'), aciklama: u('0–5.', '', '0–5.'),
    not: NOT, kaynak: 'Holden MK, et al. Phys Ther 1984;64:35-40.',
    toplamAdi: u('FAC', '', 'FAC'), alanlar: [c('duzey', DARAJA, daraja(6, 0))],
    ornekler: [{ girdi: { duzey: '3' }, toplam: 3 }],
  },
  {
    sekil: 'formul', k: 'psfs', roller: ['fizyoterapi'],
    ad: u('Bemorga xos funksional shkala (PSFS)', '', 'Пациент-специфическая функциональная шкала (PSFS)'), aciklama: u('5 tagacha faoliyat 0–10; oʻrtacha.', '', 'До 5 видов активности 0–10; среднее.'),
    not: NOT, kaynak: 'Stratford P, et al. Physiother Can 1995;47:258-63.',
    alanlar: [1, 2, 3, 4, 5].map((n) => ({ anahtar: `a${n}`, tur: 'puan' as const, enAz: 0, enCok: 10, tam: true, ...(n > 1 ? { istege: true } : {}) })),
    etiketler: Object.fromEntries([1, 2, 3, 4, 5].map((n) => [`a${n}`, u(`${n}-faoliyat (0–10)`, '', `Активность ${n} (0–10)`)])),
    sayiAdlari: { ortalama: u('PSFS oʻrtachasi', '', 'Среднее PSFS') },
    hesap: (g) => { const v = [1, 2, 3, 4, 5].map((n) => g[`a${n}`]).filter(sayiMi) as number[]; return { sayilar: [{ anahtar: 'ortalama', deger: yuvarla(v.reduce((x, y) => x + y, 0) / v.length, 1), ondalik: 1, enCok: 10 }] } },
    ornekler: [{ girdi: { a1: 3, a2: 5, a3: 4 }, sayilar: { ortalama: 4 } }],
  },
  {
    sekil: 'formul', k: 'tug', roller: ['fizyoterapi', 'fizik-tedavi'],
    ad: u('Turib yurish testi (TUG)', '', 'Тест «Встань и иди» (TUG)'), aciklama: u('Soniyalar.', '', 'Секунды.'),
    not: NOT, kaynak: 'Podsiadlo D, Richardson S. J Am Geriatr Soc 1991;39:142-8; Shumway-Cook A, et al. Phys Ther 2000;80:896-903 (≥13.5 s).',
    alanlar: [s('sure', 1, 300)], etiketler: { sure: u('Vaqt (s)', '', 'Время (с)') },
    sayiAdlari: { sure: u('TUG vaqti (s)', '', 'Время TUG (с)') },
    bantlar: [{ k: 'dusuk', e: u('<13,5 s', '', '<13,5 с') }, { k: 'yuksek', e: u('≥13,5 s — yiqilish xavfi yuqori', '', '≥13,5 с — высокий риск падений') }],
    hesap: (g) => ({ sayilar: [{ anahtar: 'sure', deger: yuvarla(g.sure as number, 1), ondalik: 1 }], bant: (g.sure as number) >= 13.5 ? 'yuksek' : 'dusuk' }),
    ornekler: [{ girdi: { sure: 15.2 }, bant: 'yuksek' }],
  },
  {
    sekil: 'formul', k: 'six-minute-walk', roller: ['fizyoterapi', 'gogus-hastaliklari'],
    ad: u('6 daqiqalik yurish masofasi (kutilgan)', '', '6-минутная ходьба (должная)'), aciklama: u('Enright–Sherrill tenglamalari.', '', 'Уравнения Энрайта–Шеррилла.'),
    not: NOT, kaynak: 'Enright PL, Sherrill DL. Am J Respir Crit Care Med 1998;158:1384-7.',
    alanlar: [s('mesafe', 0, 1500, 'm'), s('yas', 18, 100, undefined, { tam: true }), s('boy', 100, 230, 'cm'), s('kilo', 25, 300, 'kg'), sec('cinsiyet', ['erkek', 'kadin'])],
    etiketler: { mesafe: u('Yurilgan masofa', '', 'Пройденное расстояние'), yas: u('Yoshi', '', 'Возраст'), boy: u('Boʻyi', '', 'Рост'), kilo: u('Vazni', '', 'Масса тела'), cinsiyet: JINS },
    secenekEtiketleri: { cinsiyet: ERKEK_AYOL },
    sayiAdlari: { beklenen: u('Kutilgan masofa', '', 'Должное расстояние'), yuzde: u('% kutilgan', '', '% должного') }, sonucBirimleri: ['m', '%'],
    hesap: (g) => { const E = g.cinsiyet === 'erkek'; const p = E ? 7.57 * (g.boy as number) - 5.02 * (g.yas as number) - 1.76 * (g.kilo as number) - 309 : 2.11 * (g.boy as number) - 2.29 * (g.kilo as number) - 5.78 * (g.yas as number) + 667; if (p <= 0) return null; return { sayilar: [{ anahtar: 'beklenen', deger: Math.round(p), ondalik: 0, birim: 'm' }, { anahtar: 'yuzde', deger: Math.round(((g.mesafe as number) / p) * 100), ondalik: 0, birim: '%' }] } },
    ornekler: [{ girdi: { mesafe: 400, yas: 65, boy: 175, kilo: 80, cinsiyet: 'erkek' }, sayilar: { beklenen: 549, yuzde: 73 } }],
  },
  // ── allergology ──
  {
    sekil: 'toplam', k: 'pen-fast', roller: ['alerji-immunoloji', 'enfeksiyon-hastaliklari'],
    ad: u('PEN-FAST (penitsillin allergiyasi)', '', 'PEN-FAST (аллергия на пенициллин)'), aciklama: u('<3 — past xavf.', '', '<3 — низкий риск.'),
    not: NOT, kaynak: 'Trubiano JA, et al. Development and validation of a penicillin allergy clinical decision rule. JAMA Intern Med 2020;180:745-52.',
    alanlar: [t('bes_yil', u('Reaksiyadan ≤5 yil oʻtgan', '', 'С реакции прошло ≤5 лет'), 2), t('anafilaksi', u('Anafilaksiya/angioshish yoki ogʻir teri reaksiyasi', '', 'Анафилаксия/ангиоотёк или тяжёлая кожная реакция'), 2), t('tedavi', u('Reaksiya davolashni talab qilgan', '', 'Реакция потребовала лечения'))],
    bantlar: [b(0, 'cok_dusuk', u('0 — juda past', '', '0 — очень низкий')), b(1, 'dusuk', u('1–2 — past', '', '1–2 — низкий')), b(3, 'orta', u('3 — oʻrtacha', '', '3 — средний')), b(4, 'yuksek', u('4–5 — yuqori', '', '4–5 — высокий'))],
    ornekler: [{ girdi: { bes_yil: true, anafilaksi: true, tedavi: true }, toplam: 5, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'anaphylaxis-grade', roller: ['alerji-immunoloji', 'acil-tip'],
    ad: u('Anafilaksiya ogʻirligi (Brown)', '', 'Тяжесть анафилаксии (Браун)'), aciklama: u('Yengil, oʻrtacha, ogʻir.', '', 'Лёгкая, средняя, тяжёлая.'),
    not: NOT, kaynak: 'Brown SGA. Clinical features and severity grading of anaphylaxis. J Allergy Clin Immunol 2004;114:371-6.',
    toplamAdi: DARAJA,
    alanlar: [c('derece', DARAJA, [['1', u('Yengil — faqat teri', '', 'Лёгкая — только кожа'), 1], ['2', u('Oʻrtacha — nafas, yurak-qon tomir yoki meʼda-ichak belgilari', '', 'Средняя — дыхательные, сердечно-сосудистые или ЖКТ признаки'), 2], ['3', u('Ogʻir — gipoksiya, gipotenziya yoki hush buzilishi', '', 'Тяжёлая — гипоксия, гипотензия или нарушение сознания'), 3]])],
    ornekler: [{ girdi: { derece: '3' }, toplam: 3 }],
  },
  {
    sekil: 'formul', k: 'tryptase-rule', roller: ['alerji-immunoloji'],
    ad: u('Triptaza: 20% + 2 qoidasi', '', 'Триптаза: правило 20% + 2'), aciklama: u('Oʻtkir > 1,2 × bazal + 2 µg/L.', '', 'Острая > 1,2 × базальная + 2 мкг/л.'),
    not: NOT, kaynak: 'Valent P, et al. Int Arch Allergy Immunol 2012;157:215-25.',
    alanlar: [s('akut', 0.5, 500), s('bazal', 0.5, 200)],
    etiketler: { akut: u('Oʻtkir triptaza (µg/L)', '', 'Острая триптаза (мкг/л)'), bazal: u('Bazal triptaza (µg/L)', '', 'Базальная триптаза (мкг/л)') },
    sayiAdlari: { esik: u('Chegara', '', 'Порог') },
    bantlar: [{ k: 'destekler', e: u('Mast hujayra faollashuvini quvvatlaydi', '', 'Поддерживает активацию тучных клеток') }, { k: 'desteklemez', e: u('Chegaradan oshmaydi', '', 'Не превышает порог') }],
    hesap: (g) => { const e = 1.2 * (g.bazal as number) + 2; return { sayilar: [{ anahtar: 'esik', deger: yuvarla(e, 1), ondalik: 1 }], bant: (g.akut as number) > e ? 'destekler' : 'desteklemez' } },
    ornekler: [{ girdi: { akut: 12, bazal: 5 }, sayilar: { esik: 8 }, bant: 'destekler' }],
  },
  // ── reproductology ──
  {
    sekil: 'toplam', k: 'ferriman-gallwey', roller: ['reproduktoloji', 'endokrinoloji', 'kadin-hastaliklari-dogum'],
    ad: u('Ferriman–Gallwey (girsutizm, modifikatsiyalangan)', '', 'Ферримана–Галлвея (гирсутизм, модифицированная)'), aciklama: u('9 soha, har biri 0–4.', '', '9 зон, каждая 0–4.'),
    not: NOT, kaynak: 'Ferriman D, Gallwey JD. J Clin Endocrinol Metab 1961;21:1440-7; Hatch R, et al. Am J Obstet Gynecol 1981;140:815-30 (modified score; ≥8 hirsutism).',
    toplamAdi: u('mFG', '', 'mFG'),
    alanlar: [['lab', 'Ustki lab', 'Верхняя губа'], ['iyak', 'Iyak', 'Подбородок'], ['kokrak', 'Koʻkrak', 'Грудь'], ['ust_qorin', 'Qorinning yuqori qismi', 'Верх живота'], ['past_qorin', 'Qorinning pastki qismi', 'Низ живота'], ['yelka', 'Yelka', 'Плечо'], ['son', 'Son', 'Бедро'], ['ust_bel', 'Belning yuqori qismi', 'Верх спины'], ['past_bel', 'Belning pastki qismi', 'Поясница']].map(([k, l, r]) => i(k, 0, 4, u(`${l} (0–4)`, '', `${r} (0–4)`))),
    bantlar: [b(0, 'yok', u('<8', '', '<8')), b(8, 'hirsutizm', u('≥8 — girsutizm', '', '≥8 — гирсутизм'))],
    ornekler: [{ girdi: { lab: 2, iyak: 2, kokrak: 1, ust_qorin: 1, past_qorin: 2, yelka: 0, son: 1, ust_bel: 0, past_bel: 1 }, toplam: 10, bant: 'hirsutizm' }],
  },
  {
    sekil: 'formul', k: 'rotterdam-pcos', roller: ['reproduktoloji', 'kadin-hastaliklari-dogum'],
    ad: u('Rotterdam mezonlari (PKTS)', '', 'Роттердамские критерии (СПКЯ)'), aciklama: u('3 dan 2 mezon, boshqa sabablar istisno qilingandan keyin.', '', '2 из 3 критериев после исключения других причин.'),
    not: NOT, kaynak: 'Rotterdam ESHRE/ASRM-Sponsored PCOS Consensus Workshop Group. Revised 2003 consensus on diagnostic criteria for polycystic ovary syndrome. Hum Reprod 2004;19:41-7.',
    alanlar: ['ovulyatsiya', 'giperandrogeniya', 'usg', 'istisno'].map(isr),
    etiketler: { ovulyatsiya: u('Oligo- yoki anovulyatsiya', '', 'Олиго- или ановуляция'), giperandrogeniya: u('Klinik yoki biokimyoviy giperandrogeniya', '', 'Клиническая или биохимическая гиперандрогения'), usg: u('UTTda polikistoz tuxumdonlar', '', 'Поликистозные яичники на УЗИ'), istisno: u('Boshqa sabablar istisno qilingan', '', 'Другие причины исключены') },
    sayiAdlari: { mezon: u('Mezonlar', '', 'Критериев') },
    bantlar: [{ k: 'uygun', e: u('Mezonlarga mos', '', 'Соответствует критериям') }, { k: 'uygun_degil', e: u('Mos emas yoki istisno qilinmagan', '', 'Не соответствует или не исключены другие причины') }],
    hesap: (g) => { const n = ['ovulyatsiya', 'giperandrogeniya', 'usg'].filter((k) => g[k] === true).length; return { sayilar: [{ anahtar: 'mezon', deger: n, ondalik: 0, enCok: 3 }], bant: n >= 2 && g.istisno === true ? 'uygun' : 'uygun_degil' } },
    ornekler: [{ girdi: { ovulyatsiya: true, usg: true, istisno: true }, bant: 'uygun' }, { girdi: { ovulyatsiya: true, usg: true }, bant: 'uygun_degil' }],
  },
  {
    sekil: 'formul', k: 'semen-who', roller: ['reproduktoloji', 'uroloji'],
    ad: u('Spermogramma: JSST 2021 pastki chegaralari', '', 'Спермограмма: нижние границы ВОЗ 2021'), aciklama: u('Har bir koʻrsatkich JSST 6-nashr pastki referens chegarasi bilan solishtiriladi.', '', 'Каждый показатель сравнивается с нижней референсной границей ВОЗ, 6-е изд.'),
    not: NOT, kaynak: 'WHO laboratory manual for the examination and processing of human semen. 6th ed. Geneva: WHO; 2021 (lower reference limits: volume 1.4 mL, concentration 16 ×10⁶/mL, total 39 ×10⁶, total motility 42%, progressive 30%, vitality 54%, normal forms 4%).',
    alanlar: [s('hajm', 0, 20, 'mL'), s('konsentratsiya', 0, 500), s('umumiy_harakat', 0, 100, '%'), s('progressiv', 0, 100, '%'), s('morfologiya', 0, 100, '%')],
    etiketler: { hajm: u('Hajm', '', 'Объём'), konsentratsiya: u('1 ml dagi soni (×10⁶)', '', 'Концентрация (×10⁶/мл)'), umumiy_harakat: u('Umumiy harakatchanlik', '', 'Общая подвижность'), progressiv: u('Progressiv harakatchanlik', '', 'Прогрессивная подвижность'), morfologiya: u('Normal shakllar', '', 'Нормальные формы') },
    sayiAdlari: { umumiy_soni: u('Umumiy soni (×10⁶)', '', 'Общее количество (×10⁶)'), past: u('Chegaradan past koʻrsatkichlar', '', 'Показателей ниже границы') },
    bantlar: [{ k: 'normal', e: u('Hammasi pastki chegaradan yuqori', '', 'Все выше нижних границ') }, { k: 'past', e: u('Kamida bittasi chegaradan past', '', 'Хотя бы один ниже границы') }],
    hesap: (g) => {
      const tot = (g.hajm as number) * (g.konsentratsiya as number)
      const past = [(g.hajm as number) < 1.4, (g.konsentratsiya as number) < 16, tot < 39, (g.umumiy_harakat as number) < 42, (g.progressiv as number) < 30, (g.morfologiya as number) < 4].filter(Boolean).length
      return { sayilar: [{ anahtar: 'umumiy_soni', deger: yuvarla(tot, 0), ondalik: 0 }, { anahtar: 'past', deger: past, ondalik: 0, enCok: 6 }], bant: past ? 'past' : 'normal' }
    },
    ornekler: [{ girdi: { hajm: 3, konsentratsiya: 20, umumiy_harakat: 50, progressiv: 35, morfologiya: 5 }, sayilar: { umumiy_soni: 60, past: 0 }, bant: 'normal' }, { girdi: { hajm: 1, konsentratsiya: 10, umumiy_harakat: 30, progressiv: 20, morfologiya: 2 }, sayilar: { past: 6 }, bant: 'past' }],
  },
  // ── child neurology ──
  {
    sekil: 'toplam', k: 'paediatric-gcs', roller: ['cocuk-norolojisi', 'pediatri', 'cocuk-cerrahisi'],
    ad: u('Bolalar Glazgo koma shkalasi', '', 'Детская шкала комы Глазго'), aciklama: u('Goʻdak va kichik yoshdagi bolalar uchun moslangan nutq javobi.', '', 'Речевой ответ, адаптированный для младенцев и детей раннего возраста.'),
    not: NOT, kaynak: 'James HE. Neurologic evaluation and support in the child with an acute brain insult. Pediatr Ann 1986;15:16-22.',
    alanlar: [c('goz', u('Koʻz ochish', '', 'Открывание глаз'), [['4', u('4 — oʻz-oʻzidan', '', '4 — спонтанно'), 4], ['3', u('3 — tovushga', '', '3 — на звук'), 3], ['2', u('2 — ogʻriqqa', '', '2 — на боль'), 2], ['1', u('1 — yoʻq', '', '1 — нет'), 1]]), c('sozel', u('Nutq javobi', '', 'Речевая реакция'), [['5', u('5 — gʻuldiraydi, jilmayadi', '', '5 — гулит, улыбается'), 5], ['4', u('4 — taskin topmaydigan yigʻi', '', '4 — плач, успокаивается'), 4], ['3', u('3 — ogʻriqqa yigʻlaydi', '', '3 — плач на боль'), 3], ['2', u('2 — ogʻriqqa ingraydi', '', '2 — стонет на боль'), 2], ['1', u('1 — yoʻq', '', '1 — нет'), 1]]), c('motor', u('Harakat javobi', '', 'Двигательная реакция'), [['6', u('6 — oʻz-oʻzidan harakat', '', '6 — спонтанные движения'), 6], ['5', u('5 — tegishdan qochadi', '', '5 — отдёргивает при касании'), 5], ['4', u('4 — ogʻriqdan qochadi', '', '4 — отдёргивает на боль'), 4], ['3', u('3 — gʻayritabiiy bukilish', '', '3 — патологическое сгибание'), 3], ['2', u('2 — yozilish', '', '2 — разгибание'), 2], ['1', u('1 — yoʻq', '', '1 — нет'), 1]])],
    bantlar: [b(3, 'agir', u('3–8 — ogʻir', '', '3–8 — тяжёлая')), b(9, 'orta', u('9–12 — oʻrtacha', '', '9–12 — средняя')), b(13, 'hafif', u('13–15 — yengil', '', '13–15 — лёгкая'))],
    ornekler: [{ girdi: { goz: '3', sozel: '4', motor: '5' }, toplam: 12, bant: 'orta' }],
  },
  {
    sekil: 'formul', k: 'febrile-seizure', roller: ['cocuk-norolojisi', 'pediatri'],
    ad: u('Febril tutqanoq: oddiy yoki murakkab', '', 'Фебрильные судороги: простые или сложные'), aciklama: u('6–60 oylik bolada isitma bilan tutqanoq.', '', 'Судороги на фоне лихорадки у ребёнка 6–60 месяцев.'),
    not: NOT, kaynak: 'Subcommittee on Febrile Seizures. Febrile seizures: guideline for the neurodiagnostic evaluation of the child with a simple febrile seizure. Pediatr 2011;127:389-94 (simple: generalised, under 15 minutes, not recurring within 24 hours).',
    alanlar: [s('yas_oy', 1, 216, undefined, { tam: true }), s('sure_daq', 0, 240), isr('fokal'), isr('takror')],
    etiketler: { yas_oy: u('Yoshi (oy)', '', 'Возраст (мес.)'), sure_daq: u('Davomiyligi (daqiqa)', '', 'Длительность (мин)'), fokal: u('Oʻchoqli belgilar', '', 'Очаговые признаки'), takror: u('24 soat ichida takrorlangan', '', 'Повтор в течение 24 ч') },
    sayiAdlari: { yas_oy: u('Yoshi (oy)', '', 'Возраст (мес.)') },
    bantlar: [{ k: 'oddiy', e: u('Oddiy febril tutqanoq mezonlariga mos', '', 'Соответствует простым фебрильным судорогам') }, { k: 'murakkab', e: u('Murakkab febril tutqanoq', '', 'Сложные фебрильные судороги') }, { k: 'yosh_tashqari', e: u('Yosh 6–60 oydan tashqari — mezon qoʻllanmaydi', '', 'Возраст вне 6–60 мес. — критерий неприменим') }],
    hesap: (g) => { const y = g.yas_oy as number; if (y < 6 || y > 60) return { sayilar: [{ anahtar: 'yas_oy', deger: y, ondalik: 0 }], bant: 'yosh_tashqari' }; return { sayilar: [{ anahtar: 'yas_oy', deger: y, ondalik: 0 }], bant: (g.sure_daq as number) < 15 && g.fokal !== true && g.takror !== true ? 'oddiy' : 'murakkab' } },
    ornekler: [{ girdi: { yas_oy: 18, sure_daq: 3 }, bant: 'oddiy' }, { girdi: { yas_oy: 18, sure_daq: 20 }, bant: 'murakkab' }],
  },
  // ── dietology ──
  {
    sekil: 'toplam', k: 'nrs-2002', roller: ['diyetoloji', 'dahiliye', 'genel-cerrahi'],
    ad: u('NRS-2002 (ovqatlanish xavfi skriningi)', '', 'NRS-2002 (скрининг нутритивного риска)'), aciklama: u('≥3 — ovqatlanish xavfi.', '', '≥3 — нутритивный риск.'),
    not: NOT, kaynak: 'Kondrup J, et al. Nutritional risk screening (NRS 2002). Clin Nutr 2003;22:321-36.',
    alanlar: [c('holat', u('Ovqatlanish holati buzilishi', '', 'Нарушение нутритивного статуса'), [['0', u('0 — yoʻq', '', '0 — нет'), 0], ['1', u('1 — yengil', '', '1 — лёгкое'), 1], ['2', u('2 — oʻrtacha', '', '2 — умеренное'), 2], ['3', u('3 — ogʻir', '', '3 — тяжёлое'), 3]]), c('kasallik', u('Kasallik ogʻirligi', '', 'Тяжесть заболевания'), [['0', u('0 — yoʻq', '', '0 — нет'), 0], ['1', u('1 — yengil', '', '1 — лёгкая'), 1], ['2', u('2 — oʻrtacha', '', '2 — умеренная'), 2], ['3', u('3 — ogʻir', '', '3 — тяжёлая'), 3]]), t('yas70', u('Yoshi ≥70', '', 'Возраст ≥70'))],
    bantlar: [b(0, 'dusuk', u('<3', '', '<3')), b(3, 'risk', u('≥3 — ovqatlanish xavfi', '', '≥3 — нутритивный риск'))],
    ornekler: [{ girdi: { holat: '2', kasallik: '1', yas70: true }, toplam: 4, bant: 'risk' }],
  },
  {
    sekil: 'formul', k: 'mifflin', roller: ['diyetoloji', 'endokrinoloji'],
    ad: u('Asosiy almashinuv (Mifflin–St Jeor)', '', 'Основной обмен (Миффлин–Сан Жеор)'), aciklama: u('Erkak: 10V + 6,25B − 5Y + 5; ayol: … − 161.', '', 'Муж: 10М + 6,25Р − 5В + 5; жен: … − 161.'),
    not: NOT, kaynak: 'Mifflin MD, et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr 1990;51:241-7.',
    alanlar: [s('kilo', 20, 300, 'kg'), s('boy', 100, 230, 'cm'), s('yas', 18, 110, undefined, { tam: true }), sec('cinsiyet', ['erkek', 'kadin'])],
    etiketler: { kilo: u('Vazni', '', 'Масса тела'), boy: u('Boʻyi', '', 'Рост'), yas: u('Yoshi', '', 'Возраст'), cinsiyet: JINS },
    secenekEtiketleri: { cinsiyet: ERKEK_AYOL },
    sayiAdlari: { ree: u('Asosiy almashinuv', '', 'Основной обмен') }, sonucBirimleri: ['kcal'],
    hesap: (g) => ({ sayilar: [{ anahtar: 'ree', deger: Math.round(10 * (g.kilo as number) + 6.25 * (g.boy as number) - 5 * (g.yas as number) + (g.cinsiyet === 'erkek' ? 5 : -161)), ondalik: 0, birim: 'kcal' }] }),
    ornekler: [{ girdi: { kilo: 70, boy: 175, yas: 40, cinsiyet: 'erkek' }, sayilar: { ree: 1599 } }, { girdi: { kilo: 60, boy: 165, yas: 30, cinsiyet: 'kadin' }, sayilar: { ree: 1320 } }],
  },
  {
    sekil: 'formul', k: 'weight-change', roller: ['diyetoloji'],
    ad: u('Vazn oʻzgarishi, %', '', 'Изменение массы, %'), aciklama: u('(hozirgi − odatiy) / odatiy × 100.', '', '(текущая − обычная) / обычная × 100.'),
    not: NOT, kaynak: 'Percentage weight change; 5% and 10% loss bands as used in malnutrition criteria (Cederholm T, et al. GLIM criteria. Clin Nutr 2019;38:1-9).',
    alanlar: [s('onceki', 20, 300, 'kg'), s('simdi', 20, 300, 'kg')],
    etiketler: { onceki: u('Odatiy vazn', '', 'Обычная масса'), simdi: u('Hozirgi vazn', '', 'Текущая масса') },
    sayiAdlari: { yuzde: u('Oʻzgarish, %', '', 'Изменение, %') }, sonucBirimleri: ['%'],
    bantlar: [{ k: 'ayni', e: u('±5% ichida', '', 'В пределах ±5%') }, { k: 'azaldi_5', e: u('5–10% kamaygan', '', 'Снижение на 5–10%') }, { k: 'azaldi_10', e: u('>10% kamaygan', '', 'Снижение более 10%') }, { k: 'artti', e: u('>5% oshgan', '', 'Рост более 5%') }],
    hesap: (g) => { const y = yuvarla((((g.simdi as number) - (g.onceki as number)) / (g.onceki as number)) * 100, 1); return { sayilar: [{ anahtar: 'yuzde', deger: y, ondalik: 1, birim: '%' }], bant: y <= -10 ? 'azaldi_10' : y <= -5 ? 'azaldi_5' : y > 5 ? 'artti' : 'ayni' } },
    ornekler: [{ girdi: { onceki: 70, simdi: 63 }, sayilar: { yuzde: -10 }, bant: 'azaldi_10' }],
  },
]
