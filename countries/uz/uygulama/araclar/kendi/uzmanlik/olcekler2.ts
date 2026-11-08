/**
 * ULKE-BRANS-DERINLIK-01 (Kaan, 2026-11-08) — Uzbekistan: specialty scores and calculators, part 2 (gastroenterology,
 * nephrology, dermatology and cosmetology, surgery, ophthalmology, ENT and surdology, orthopaedics and sport,
 * rheumatology, urology and radiology, rehabilitation and physiotherapy, psychiatry, narcology and clinical psychology,
 * allergology, reproductology, child neurology, dietology, paediatrics, obstetrics). International sources (XALQARO).
 * MACHINE-WRITTEN. AWAITS NATIVE AND CLINICAL REVIEW. Cyrillic derived by rule (scripts/uz-kiril.mjs).
 */
import type { AracAlani } from '@/lib/ulke/araclar/tipler'
import { sayiMi } from '@/lib/ulke/araclar/yardimci'
import { u } from '../../yardimci'
import { b, c, i, t, yuvarla, type UzmanlikSatiri } from './motor'
import { NOT } from './olcekler1'

const s = (anahtar: string, enAz: number, enCok: number, birim?: string, ek: Partial<AracAlani> = {}): AracAlani => ({ anahtar, tur: 'sayi', enAz, enCok, ...(birim ? { birim } : {}), ...ek })
const sec = (anahtar: string, secenekler: string[]): AracAlani => ({ anahtar, tur: 'secim', secenekler })
const nm = (n: number, enAz: number, enCok: number) => Array.from({ length: n }, (_, k) => i(`m${k + 1}`, enAz, enCok))
const sinif = (k: string, n: number, bas = 1) => Array.from({ length: n }, (_, j) => [String(j + bas), u(String(j + bas), '', String(j + bas)), j + bas] as [string, ReturnType<typeof u>, number])
const DARAJA = u('Daraja', '', 'Степень')
const BANDLAR = u('Bandlar shakldan oʻqiladi; savollar matni mualliflarniki va bu yerda takrorlanmaydi.', '', 'Пункты читаются по бланку; формулировки принадлежат авторам и здесь не воспроизводятся.')

export const UZ_OLCEKLER_2: readonly UzmanlikSatiri[] = [
  // ── gastroenterology ──
  {
    sekil: 'toplam', k: 'glasgow-blatchford', roller: ['gastroenteroloji', 'acil-tip'],
    ad: u('Glasgow–Blatchford (yuqori GIT qon ketishi)', '', 'Глазго–Блэтчфорд (кровотечение из верхних отделов ЖКТ)'), aciklama: u('Endoskopiyadan oldin aralashuv zarurati xavfi.', '', 'Риск вмешательства до эндоскопии.'),
    not: NOT, kaynak: 'Blatchford O, et al. Lancet 2000;356:1318-21; Stanley AJ, et al. BMJ 2017;356:i6432 (0–1 very low risk).',
    alanlar: [
      c('ure', u('Mochevina (mmol/L)', '', 'Мочевина (ммоль/л)'), [['n', u('<6,5', '', '<6,5'), 0], ['2', u('6,5–7,9', '', '6,5–7,9'), 2], ['3', u('8,0–9,9', '', '8,0–9,9'), 3], ['4', u('10–24,9', '', '10–24,9'), 4], ['6', u('≥25', '', '≥25'), 6]]),
      c('hb', u('Gemoglobin (g/L)', '', 'Гемоглобин (г/л)'), [['en', u('Erkak ≥130 / ayol ≥120', '', 'Муж ≥130 / жен ≥120'), 0], ['e1', u('Erkak 120–129', '', 'Муж 120–129'), 1], ['k1', u('Ayol 100–119', '', 'Жен 100–119'), 1], ['e3', u('Erkak 100–119', '', 'Муж 100–119'), 3], ['6', u('<100', '', '<100'), 6]]),
      c('sta', u('Sistolik bosim', '', 'Систолическое АД'), [['n', u('≥110', '', '≥110'), 0], ['1', u('100–109', '', '100–109'), 1], ['2', u('90–99', '', '90–99'), 2], ['3', u('<90', '', '<90'), 3]]),
      t('nabiz', u('Puls ≥100', '', 'ЧСС ≥100')), t('melena', u('Melena', '', 'Мелена')), t('senkop', u('Hushdan ketish', '', 'Обморок'), 2), t('karaciger', u('Jigar kasalligi', '', 'Болезнь печени'), 2), t('kky', u('Yurak yetishmovchiligi', '', 'Сердечная недостаточность'), 2),
    ],
    bantlar: [b(0, 'cok_dusuk', u('0–1 — juda past xavf', '', '0–1 — очень низкий риск')), b(2, 'dusuk_degil', u('≥2 — past emas', '', '≥2 — не низкий'))],
    ornekler: [{ girdi: { ure: '4', hb: 'e3', sta: '1', nabiz: true, melena: true }, toplam: 10, bant: 'dusuk_degil' }],
  },
  {
    sekil: 'toplam', k: 'child-pugh', roller: ['gastroenteroloji', 'dahiliye'],
    ad: u('Child–Pugh (jigar sirrozi)', '', 'Чайлд–Пью (цирроз печени)'), aciklama: u('Bilirubin, albumin, INR, assit, ensefalopatiya.', '', 'Билирубин, альбумин, МНО, асцит, энцефалопатия.'),
    not: NOT, kaynak: 'Pugh RN, et al. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg 1973;60:646-9.',
    alanlar: [
      c('bilirubin', u('Bilirubin (µmol/L)', '', 'Билирубин (мкмоль/л)'), [['1', u('<34', '', '<34'), 1], ['2', u('34–50', '', '34–50'), 2], ['3', u('>50', '', '>50'), 3]]),
      c('albumin', u('Albumin (g/L)', '', 'Альбумин (г/л)'), [['1', u('>35', '', '>35'), 1], ['2', u('28–35', '', '28–35'), 2], ['3', u('<28', '', '<28'), 3]]),
      c('inr', u('INR', '', 'МНО'), [['1', u('<1,7', '', '<1,7'), 1], ['2', u('1,7–2,3', '', '1,7–2,3'), 2], ['3', u('>2,3', '', '>2,3'), 3]]),
      c('asit', u('Assit', '', 'Асцит'), [['1', u('Yoʻq', '', 'Нет'), 1], ['2', u('Yengil', '', 'Лёгкий'), 2], ['3', u('Oʻrtacha–ogʻir', '', 'Умеренный–тяжёлый'), 3]]),
      c('ensefalopati', u('Ensefalopatiya', '', 'Энцефалопатия'), [['1', u('Yoʻq', '', 'Нет'), 1], ['2', u('1–2 daraja', '', '1–2 ст.'), 2], ['3', u('3–4 daraja', '', '3–4 ст.'), 3]]),
    ],
    bantlar: [b(5, 'a', u('A (5–6)', '', 'A (5–6)')), b(7, 'b', u('B (7–9)', '', 'B (7–9)')), b(10, 'c', u('C (10–15)', '', 'C (10–15)'))],
    ornekler: [{ girdi: { bilirubin: '2', albumin: '2', inr: '2', asit: '2', ensefalopati: '1' }, toplam: 9, bant: 'b' }],
  },
  {
    sekil: 'formul', k: 'meld-na', roller: ['gastroenteroloji'],
    ad: u('MELD va MELD-Na', '', 'MELD и MELD-Na'), aciklama: u('Kreatinin va bilirubin (µmol/L), INR, natriy.', '', 'Креатинин и билирубин (мкмоль/л), МНО, натрий.'),
    not: NOT, kaynak: 'Kamath PS, et al. Hepatology 2001;33:464-70; Kim WR, et al. N Engl J Med 2008;359:1018-26.',
    alanlar: [s('kreatinin', 20, 2000, 'µmol/L'), s('bilirubin', 2, 1000, 'µmol/L'), s('inr', 0.8, 10), s('na', 100, 170, 'mmol/L'), { anahtar: 'diyaliz', tur: 'isaret' }],
    etiketler: { kreatinin: u('Kreatinin', '', 'Креатинин'), bilirubin: u('Bilirubin', '', 'Билирубин'), inr: u('INR', '', 'МНО'), na: u('Natriy', '', 'Натрий'), diyaliz: u('Oxirgi haftada ≥2 marta dializ', '', 'Диализ ≥2 раз за неделю') },
    sayiAdlari: { meld: u('MELD', '', 'MELD'), meld_na: u('MELD-Na', '', 'MELD-Na') },
    hesap: (g) => {
      let cr = Math.max(1, (g.kreatinin as number) / 88.4)
      if (g.diyaliz === true || cr > 4) cr = 4
      const bil = Math.max(1, (g.bilirubin as number) / 17.1), inr = Math.max(1, g.inr as number)
      const meld = 10 * (0.957 * Math.log(cr) + 0.378 * Math.log(bil) + 1.12 * Math.log(inr) + 0.643)
      const na = Math.min(137, Math.max(125, g.na as number))
      const mna = meld > 11 ? meld + 1.32 * (137 - na) - 0.033 * meld * (137 - na) : meld
      return { sayilar: [{ anahtar: 'meld', deger: Math.round(meld), ondalik: 0 }, { anahtar: 'meld_na', deger: Math.round(mna), ondalik: 0 }] }
    },
    ornekler: [{ girdi: { kreatinin: 176.8, bilirubin: 51.3, inr: 1.5, na: 130 }, sayilar: { meld: 22, meld_na: 26 } }],
  },
  {
    sekil: 'formul', k: 'fib-4', roller: ['gastroenteroloji'],
    ad: u('FIB-4 (jigar fibrozi)', '', 'FIB-4 (фиброз печени)'), aciklama: u('Yosh, AST, ALT, trombotsitlar.', '', 'Возраст, АСТ, АЛТ, тромбоциты.'),
    not: NOT, kaynak: 'Sterling RK, et al. Hepatology 2006;43:1317-25; McPherson S, et al. Am J Gastroenterol 2017;112:740-51 (<1.30 [2.0 if ≥65], >2.67).',
    alanlar: [s('yas', 18, 110, undefined, { tam: true }), s('ast', 1, 5000, 'U/L'), s('alt', 1, 5000, 'U/L'), s('trombosit', 5, 1500, '×10⁹/L')],
    etiketler: { yas: u('Yoshi', '', 'Возраст'), ast: u('AST', '', 'АСТ'), alt: u('ALT', '', 'АЛТ'), trombosit: u('Trombotsitlar', '', 'Тромбоциты') },
    sayiAdlari: { fib4: u('FIB-4', '', 'FIB-4') },
    bantlar: [{ k: 'dusuk', e: u('Kuchli fibroz xavfi past', '', 'Низкий риск выраженного фиброза') }, { k: 'ara', e: u('Noaniq', '', 'Неопределённый') }, { k: 'yuksek', e: u('Yuqori xavf', '', 'Высокий риск') }],
    hesap: (g) => {
      const f = ((g.yas as number) * (g.ast as number)) / ((g.trombosit as number) * Math.sqrt(g.alt as number))
      return { sayilar: [{ anahtar: 'fib4', deger: yuvarla(f, 2), ondalik: 2 }], bant: f < ((g.yas as number) >= 65 ? 2.0 : 1.3) ? 'dusuk' : f > 2.67 ? 'yuksek' : 'ara' }
    },
    ornekler: [{ girdi: { yas: 50, ast: 40, alt: 36, trombosit: 200 }, sayilar: { fib4: 1.67 }, bant: 'ara' }],
  },
  // ── nephrology ──
  {
    sekil: 'formul', k: 'dialysis-adequacy', roller: ['nefroloji'],
    ad: u('Gemodializ yetarliligi (spKt/V, URR)', '', 'Адекватность гемодиализа (spKt/V, URR)'), aciklama: u('Daugirdas II formulasi.', '', 'Формула Даугирдаса II.'),
    not: NOT, kaynak: 'Daugirdas JT. J Am Soc Nephrol 1993;4:1205-13; KDOQI haemodialysis adequacy guideline, 2015 update. Am J Kidney Dis 2015;66:884-930 (minimum spKt/V 1.2).',
    alanlar: [s('on', 2, 80, 'mmol/L'), s('son', 0.5, 60, 'mmol/L'), s('saat', 1, 10, 'h'), s('uf', 0, 8, 'L'), s('kilo', 20, 250, 'kg')],
    etiketler: { on: u('Dializdan oldin mochevina', '', 'Мочевина до диализа'), son: u('Dializdan keyin mochevina', '', 'Мочевина после диализа'), saat: u('Seans davomiyligi', '', 'Длительность сеанса'), uf: u('Ultrafiltratsiya', '', 'Ультрафильтрация'), kilo: u('Dializdan keyingi vazn', '', 'Масса после диализа') },
    sayiAdlari: { ktv: u('spKt/V', '', 'spKt/V'), urr: u('URR', '', 'URR') },
    sonucBirimleri: ['%'],
    bantlar: [{ k: 'yetersiz', e: u('<1,2 — minimumdan past', '', '<1,2 — ниже минимума') }, { k: 'yeterli', e: u('≥1,2', '', '≥1,2') }],
    hesap: (g) => {
      const R = (g.son as number) / (g.on as number)
      if (R >= 1) return null
      const ktv = -Math.log(R - 0.008 * (g.saat as number)) + (4 - 3.5 * R) * ((g.uf as number) / (g.kilo as number))
      return { sayilar: [{ anahtar: 'ktv', deger: yuvarla(ktv, 2), ondalik: 2 }, { anahtar: 'urr', deger: yuvarla((1 - R) * 100, 0), ondalik: 0, birim: '%' }], bant: ktv >= 1.2 ? 'yeterli' : 'yetersiz' }
    },
    ornekler: [{ girdi: { on: 25, son: 8, saat: 4, uf: 2.5, kilo: 70 }, sayilar: { ktv: 1.35, urr: 68 }, bant: 'yeterli' }],
  },
  {
    sekil: 'formul', k: 'fena', roller: ['nefroloji'],
    ad: u('Natriyning fraksion ekskretsiyasi', '', 'Фракционная экскреция натрия'), aciklama: u('Siydik kreatinini mmol/L, plazma kreatinini µmol/L.', '', 'Креатинин мочи в ммоль/л, плазмы в мкмоль/л.'),
    not: NOT, kaynak: 'Espinel CH. The FENa test. JAMA 1976;236:579-81 (<1% prerenal; >2% intrinsic).',
    alanlar: [s('idrar_na', 1, 300, 'mmol/L'), s('plazma_na', 100, 180, 'mmol/L'), s('idrar_kr', 0.5, 50, 'mmol/L'), s('plazma_kr', 20, 2000, 'µmol/L')],
    etiketler: { idrar_na: u('Siydikdagi natriy', '', 'Натрий мочи'), plazma_na: u('Plazma natriy', '', 'Натрий плазмы'), idrar_kr: u('Siydikdagi kreatinin', '', 'Креатинин мочи'), plazma_kr: u('Plazma kreatinin', '', 'Креатинин плазмы') },
    sayiAdlari: { fena: u('FENa', '', 'FENa') },
    sonucBirimleri: ['%'],
    bantlar: [{ k: 'prerenal', e: u('<1% — prerenal holatga mos', '', '<1% — соответствует преренальному состоянию') }, { k: 'ara', e: u('1–2%', '', '1–2%') }, { k: 'intrinsik', e: u('>2% — tubulyar shikastlanishga mos', '', '>2% — соответствует тубулярному повреждению') }],
    hesap: (g) => {
      const f = (((g.idrar_na as number) * (g.plazma_kr as number)) / ((g.plazma_na as number) * (g.idrar_kr as number) * 1000)) * 100
      return { sayilar: [{ anahtar: 'fena', deger: yuvarla(f, 2), ondalik: 2, birim: '%' }], bant: f < 1 ? 'prerenal' : f > 2 ? 'intrinsik' : 'ara' }
    },
    ornekler: [{ girdi: { idrar_na: 20, plazma_na: 140, idrar_kr: 10, plazma_kr: 200 }, sayilar: { fena: 0.29 }, bant: 'prerenal' }],
  },
  {
    sekil: 'toplam', k: 'burch-wartofsky', roller: ['endokrinoloji'],
    ad: u('Burch–Wartofsky (tireotoksik kriz)', '', 'Шкала Бёрча–Вартофски (тиреотоксический криз)'), aciklama: u('≥45 — kriz ehtimoli yuqori.', '', '≥45 — криз высоковероятен.'),
    not: NOT, kaynak: 'Burch HB, Wartofsky L. Life-threatening thyrotoxicosis: thyroid storm. Endocrinol Metab Clin North Am 1993;22:263-77.',
    alanlar: [
      c('ates', u('Harorat (°C)', '', 'Температура (°C)'), [['n', u('<37,2', '', '<37,2'), 0], ['5', u('37,2–37,7', '', '37,2–37,7'), 5], ['10', u('37,8–38,2', '', '37,8–38,2'), 10], ['15', u('38,3–38,8', '', '38,3–38,8'), 15], ['20', u('38,9–39,3', '', '38,9–39,3'), 20], ['25', u('39,4–39,9', '', '39,4–39,9'), 25], ['30', u('≥40', '', '≥40'), 30]]),
      c('mss', u('MNS', '', 'ЦНС'), [['0', u('Yoʻq', '', 'Нет'), 0], ['10', u('Qoʻzgʻalish', '', 'Возбуждение'), 10], ['20', u('Delirium, psixoz', '', 'Делирий, психоз'), 20], ['30', u('Talvasa, koma', '', 'Судороги, кома'), 30]]),
      c('gis', u('Meʼda-ichak / jigar', '', 'ЖКТ / печень'), [['0', u('Yoʻq', '', 'Нет'), 0], ['10', u('Diareya, qusish, qorin ogʻrigʻi', '', 'Диарея, рвота, боль в животе'), 10], ['20', u('Sariqlik', '', 'Желтуха'), 20]]),
      c('nabiz', u('Puls', '', 'ЧСС'), [['n', u('<90', '', '<90'), 0], ['5', u('90–109', '', '90–109'), 5], ['10', u('110–119', '', '110–119'), 10], ['15', u('120–129', '', '120–129'), 15], ['20', u('130–139', '', '130–139'), 20], ['25', u('≥140', '', '≥140'), 25]]),
      c('kky', u('Yurak yetishmovchiligi', '', 'Сердечная недостаточность'), [['0', u('Yoʻq', '', 'Нет'), 0], ['5', u('Yengil', '', 'Лёгкая'), 5], ['10', u('Oʻrtacha', '', 'Умеренная'), 10], ['15', u('Ogʻir', '', 'Тяжёлая'), 15]]),
      t('af', u('Boʻlmachalar fibrillyatsiyasi', '', 'Фибрилляция предсердий'), 10), t('tetik', u('Qoʻzgʻatuvchi omil', '', 'Провоцирующий фактор'), 10),
    ],
    bantlar: [b(0, 'olasi_degil', u('<25', '', '<25')), b(25, 'yaklasan', u('25–44 — yaqinlashayotgan kriz', '', '25–44 — угрожающий криз')), b(45, 'olasi', u('≥45 — kriz ehtimoli yuqori', '', '≥45 — криз высоковероятен'))],
    ornekler: [{ girdi: { ates: '15', mss: '10', gis: '10', nabiz: '15', kky: '0', af: true }, toplam: 60, bant: 'olasi' }],
  },
  // ── dermatology and cosmetology ──
  {
    sekil: 'formul', k: 'dermoscopy-tds', roller: ['dermatoloji', 'klinik-dermatoloji'],
    ad: u('Dermatoskopiya ABCD qoidasi (TDS)', '', 'Правило ABCD дерматоскопии (TDS)'), aciklama: u('A×1,3 + B×0,1 + C×0,5 + D×0,5.', '', 'A×1,3 + B×0,1 + C×0,5 + D×0,5.'),
    not: NOT, kaynak: 'Stolz W, et al. ABCD rule of dermatoscopy. Eur J Dermatol 1994;4:521-7 (<4.75 benign; 4.75–5.45 suspicious; >5.45 highly suspicious).',
    alanlar: [s('a', 0, 2, undefined, { tam: true }), s('b', 0, 8, undefined, { tam: true }), s('c', 1, 6, undefined, { tam: true }), s('d', 1, 5, undefined, { tam: true })],
    etiketler: { a: u('Asimmetriya (0–2)', '', 'Асимметрия (0–2)'), b: u('Chegara (0–8)', '', 'Граница (0–8)'), c: u('Ranglar (1–6)', '', 'Цвета (1–6)'), d: u('Tuzilmalar (1–5)', '', 'Структуры (1–5)') },
    sayiAdlari: { tds: u('TDS', '', 'TDS') },
    bantlar: [{ k: 'benign', e: u('<4,75 — xavfsiz oraliq', '', '<4,75 — доброкачественный диапазон') }, { k: 'supheli', e: u('4,75–5,45 — shubhali', '', '4,75–5,45 — подозрительный') }, { k: 'cok_supheli', e: u('>5,45 — juda shubhali', '', '>5,45 — высокоподозрительный') }],
    hesap: (g) => {
      const v = (g.a as number) * 1.3 + (g.b as number) * 0.1 + (g.c as number) * 0.5 + (g.d as number) * 0.5
      return { sayilar: [{ anahtar: 'tds', deger: yuvarla(v, 2), ondalik: 2 }], bant: v < 4.75 ? 'benign' : v <= 5.45 ? 'supheli' : 'cok_supheli' }
    },
    ornekler: [{ girdi: { a: 2, b: 8, c: 4, d: 3 }, sayilar: { tds: 6.9 }, bant: 'cok_supheli' }],
  },
  {
    sekil: 'toplam', k: 'seven-point-checklist', roller: ['dermatoloji', 'klinik-dermatoloji'],
    ad: u('Yetti nuqtali dermatoskopik roʻyxat', '', 'Семибалльный дерматоскопический чек-лист'), aciklama: u('≥3 — shubhali.', '', '≥3 — подозрительно.'),
    not: NOT, kaynak: 'Argenziano G, et al. Arch Dermatol 1998;134:1563-70.',
    alanlar: [t('ag', u('Atipik pigment toʻri', '', 'Атипичная пигментная сеть'), 2), t('ortu', u('Koʻkish-oq parda', '', 'Бело-голубая вуаль'), 2), t('damar', u('Atipik qon tomir naqshi', '', 'Атипичный сосудистый рисунок'), 2), t('cizgi', u('Notekis chiziqlar', '', 'Неравномерные полосы')), t('pigment', u('Notekis pigmentatsiya', '', 'Неравномерная пигментация')), t('nokta', u('Notekis nuqtalar/globulalar', '', 'Неравномерные точки/глобулы')), t('regresyon', u('Regressiya tuzilmalari', '', 'Структуры регрессии'))],
    bantlar: [b(0, 'dusuk', u('0–2', '', '0–2')), b(3, 'supheli', u('≥3 — shubhali', '', '≥3 — подозрительно'))],
    ornekler: [{ girdi: { ag: true, nokta: true }, toplam: 3, bant: 'supheli' }],
  },
  {
    sekil: 'formul', k: 'salt-alopecia', roller: ['dermatoloji', 'klinik-dermatoloji', 'medikal-estetik'],
    ad: u('SALT (oʻchoqli alopesiya)', '', 'SALT (очаговая алопеция)'), aciklama: u('Tepa 40%, yonlar 18%dan, ensa 24%.', '', 'Темя 40%, бока по 18%, затылок 24%.'),
    not: NOT, kaynak: 'Olsen EA, et al. Alopecia areata investigational assessment guidelines, part II. J Am Acad Dermatol 2004;51:440-7.',
    alanlar: [s('tepe', 0, 100, '%'), s('sag', 0, 100, '%'), s('sol', 0, 100, '%'), s('arka', 0, 100, '%')],
    etiketler: { tepe: u('Tepa, % yoʻqotish', '', 'Темя, % потери'), sag: u('Oʻng yon, %', '', 'Правый бок, %'), sol: u('Chap yon, %', '', 'Левый бок, %'), arka: u('Ensa, %', '', 'Затылок, %') },
    sayiAdlari: { salt: u('SALT', '', 'SALT') },
    sonucBirimleri: ['%'],
    hesap: (g) => ({ sayilar: [{ anahtar: 'salt', deger: yuvarla(0.4 * (g.tepe as number) + 0.18 * (g.sag as number) + 0.18 * (g.sol as number) + 0.24 * (g.arka as number), 1), ondalik: 1, birim: '%' }] }),
    ornekler: [{ girdi: { tepe: 50, sag: 20, sol: 20, arka: 10 }, sayilar: { salt: 29.6 } }],
  },
  {
    sekil: 'formul', k: 'uas7', roller: ['alerji-immunoloji', 'dermatoloji', 'klinik-dermatoloji'],
    ad: u('UAS7 (surunkali eshakemi)', '', 'UAS7 (хроническая крапивница)'), aciklama: u('Har kuni pufak (0–3) + qichishish (0–3), 7 kun.', '', 'Ежедневно волдыри (0–3) + зуд (0–3), 7 дней.'),
    not: NOT, kaynak: 'Mlynek A, et al. Allergy 2008;63:777-80; Zuberbier T, et al. Allergy 2022;77:734-66.',
    alanlar: ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'].map((k) => ({ anahtar: k, tur: 'puan' as const, enAz: 0, enCok: 6, tam: true })),
    etiketler: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((n) => [`g${n}`, u(`${n}-kun`, '', `День ${n}`)])),
    sayiAdlari: { uas7: u('UAS7', '', 'UAS7') },
    bantlar: [{ k: 'yok', e: u('0', '', '0') }, { k: 'kontrollu', e: u('1–6 — yaxshi nazorat', '', '1–6 — хорошо контролируется') }, { k: 'hafif', e: u('7–15 — yengil', '', '7–15 — лёгкая') }, { k: 'orta', e: u('16–27 — oʻrtacha', '', '16–27 — средняя') }, { k: 'agir', e: u('28–42 — ogʻir', '', '28–42 — тяжёлая') }],
    hesap: (g) => {
      const v = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'].reduce((x, k) => x + (g[k] as number), 0)
      return { sayilar: [{ anahtar: 'uas7', deger: v, ondalik: 0, enCok: 42 }], bant: v === 0 ? 'yok' : v <= 6 ? 'kontrollu' : v <= 15 ? 'hafif' : v <= 27 ? 'orta' : 'agir' }
    },
    ornekler: [{ girdi: { g1: 3, g2: 3, g3: 2, g4: 2, g5: 3, g6: 2, g7: 3 }, sayilar: { uas7: 18 }, bant: 'orta' }],
  },
  {
    sekil: 'toplam', k: 'fitzpatrick', roller: ['medikal-estetik', 'klinik-dermatoloji', 'dermatoloji'],
    ad: u('Fitzpatrick teri fototipi', '', 'Фототип кожи по Фицпатрику'), aciklama: u('Kuyish va qorayish anamnezi boʻyicha.', '', 'По анамнезу ожогов и загара.'),
    not: NOT, kaynak: 'Fitzpatrick TB. Arch Dermatol 1988;124:869-71.',
    toplamAdi: u('Fototip', '', 'Фототип'),
    alanlar: [c('tip', u('Fototip', '', 'Фототип'), [['1', u('I', '', 'I'), 1], ['2', u('II', '', 'II'), 2], ['3', u('III', '', 'III'), 3], ['4', u('IV', '', 'IV'), 4], ['5', u('V', '', 'V'), 5], ['6', u('VI', '', 'VI'), 6]])],
    ornekler: [{ girdi: { tip: '2' }, toplam: 2 }],
  },
  {
    sekil: 'toplam', k: 'glogau', roller: ['medikal-estetik'],
    ad: u('Glogau fotoqarish tasnifi', '', 'Классификация фотостарения Глогау'), aciklama: u('I–IV guruh.', '', 'Группы I–IV.'),
    not: NOT, kaynak: 'Glogau RG. Semin Cutan Med Surg 1996;15:134-8.',
    toplamAdi: u('Guruh', '', 'Группа'),
    alanlar: [c('grup', u('Guruh', '', 'Группа'), [['1', u('I — ajinlar yoʻq', '', 'I — нет морщин'), 1], ['2', u('II — harakatda ajinlar', '', 'II — морщины в движении'), 2], ['3', u('III — tinch holatda ajinlar', '', 'III — морщины в покое'), 3], ['4', u('IV — faqat ajinlar', '', 'IV — сплошные морщины'), 4]])],
    ornekler: [{ girdi: { grup: '3' }, toplam: 3 }],
  },
  {
    sekil: 'toplam', k: 'hair-loss-pattern', roller: ['medikal-estetik', 'dermatoloji'],
    ad: u('Soch toʻkilishi bosqichi (Norwood / Ludwig)', '', 'Стадия выпадения волос (Норвуд / Людвиг)'), aciklama: u('Erkaklarda Norwood I–VII, ayollarda Ludwig I–III.', '', 'У мужчин Норвуд I–VII, у женщин Людвиг I–III.'),
    not: NOT, kaynak: 'Norwood OT. South Med J 1975;68:1359-65; Ludwig E. Br J Dermatol 1977;97:247-54.',
    toplamAdi: u('Bosqich', '', 'Стадия'),
    alanlar: [c('evre', u('Bosqich', '', 'Стадия'), [...[1, 2, 3, 4, 5, 6, 7].map((n) => [`n${n}`, u(`Norwood ${n}`, '', `Норвуд ${n}`), n] as [string, ReturnType<typeof u>, number]), ...[1, 2, 3].map((n) => [`l${n}`, u(`Ludwig ${n}`, '', `Людвиг ${n}`), 10 + n] as [string, ReturnType<typeof u>, number])])],
    bantlar: [b(1, 'norwood_erken', u('Norwood 1–3', '', 'Норвуд 1–3')), b(4, 'norwood_ileri', u('Norwood 4–7', '', 'Норвуд 4–7')), b(11, 'ludwig', u('Ludwig 1–3', '', 'Людвиг 1–3'))],
    ornekler: [{ girdi: { evre: 'n4' }, bant: 'norwood_ileri' }],
  },
  {
    sekil: 'toplam', k: 'dysmorphic-concern', roller: ['estetik-cerrahi', 'medikal-estetik', 'plastik-cerrahi'],
    ad: u('Dismorfik xavotir soʻrovnomasi (DCQ)', '', 'Опросник дисморфической озабоченности (DCQ)'), aciklama: u('7 band, 0–3; ≥9 — kosmetik muolajadan oldin baholash kerak.', '', '7 пунктов, 0–3; ≥9 — оценка до косметической процедуры.'),
    not: u('Skrining, tashxis emas. Ijobiy natija psixologik baholashni talab qiladi.', '', 'Скрининг, не диагноз. Положительный результат требует психологической оценки.'),
    kaynak: 'Oosthuizen P, Lambert T, Castle DJ. Aust N Z J Psychiatry 1998;32:129-32; Mancuso SG, et al. Aust N Z J Psychiatry 2010;44:535-42 (≥9).',
    toplamAdi: u('DCQ', '', 'DCQ'),
    alanlar: nm(7, 0, 3),
    bantlar: [b(0, 'dusuk', u('<9', '', '<9')), b(9, 'yuksek', u('≥9 — baholash kerak', '', '≥9 — нужна оценка'))],
    ornekler: [{ girdi: { m1: 2, m2: 2, m3: 1, m4: 1, m5: 2, m6: 1, m7: 1 }, toplam: 10, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'vancouver-scar', roller: ['plastik-cerrahi', 'estetik-cerrahi'],
    ad: u('Vankuver chandiq shkalasi', '', 'Ванкуверская шкала рубцов'), aciklama: u('Qon tomirlilik, pigment, elastiklik, balandlik; 0–13.', '', 'Васкуляризация, пигментация, эластичность, высота; 0–13.'),
    not: NOT, kaynak: 'Sullivan T, et al. Rating the burn scar. J Burn Care Rehabil 1990;11:256-60.',
    alanlar: [i('vaskuler', 0, 3, u('Qon tomirlilik (0–3)', '', 'Васкуляризация (0–3)')), i('pigment', 0, 2, u('Pigmentatsiya (0–2)', '', 'Пигментация (0–2)')), i('esneklik', 0, 5, u('Elastiklik (0–5)', '', 'Эластичность (0–5)')), i('yukseklik', 0, 3, u('Balandlik (0–3)', '', 'Высота (0–3)'))],
    ornekler: [{ girdi: { vaskuler: 2, pigment: 1, esneklik: 3, yukseklik: 2 }, toplam: 8 }],
  },
  {
    sekil: 'toplam', k: 'baker-contracture', roller: ['plastik-cerrahi', 'estetik-cerrahi'],
    ad: u('Baker kapsulyar kontraktura darajasi', '', 'Капсулярная контрактура по Бейкеру'), aciklama: u('Koʻkrak implanti.', '', 'Грудной имплант.'),
    not: NOT, kaynak: 'Spear SL, Baker JL Jr. Plast Reconstr Surg 1995;96:1119-23.',
    toplamAdi: DARAJA,
    alanlar: [c('derece', DARAJA, sinif('derece', 4))],
    ornekler: [{ girdi: { derece: '3' }, toplam: 3 }],
  },
  {
    sekil: 'toplam', k: 'regnault-ptosis', roller: ['estetik-cerrahi'],
    ad: u('Regnault koʻkrak ptozi tasnifi', '', 'Классификация птоза груди по Реньо'), aciklama: u('Soʻrgʻich holati submammar burmaga nisbatan.', '', 'Положение соска относительно субмаммарной складки.'),
    not: NOT, kaynak: 'Regnault P. Breast ptosis: definition and treatment. Clin Plast Surg 1976;3:193-203.',
    toplamAdi: DARAJA,
    alanlar: [c('derece', DARAJA, [['0', u('Yoʻq', '', 'Нет'), 0], ['p', u('Psevdoptoz', '', 'Псевдоптоз'), 1], ['1', u('1', '', '1'), 2], ['2', u('2', '', '2'), 3], ['3', u('3', '', '3'), 4]])],
    ornekler: [{ girdi: { derece: '2' }, toplam: 3 }],
  },
  {
    sekil: 'formul', k: 'burns-fluid', roller: ['plastik-cerrahi', 'acil-tip'],
    ad: u('Kuyishda suyuqlik hajmi', '', 'Объём инфузии при ожогах'), aciklama: u('Vazn × kuyish % × protokol koʻpaytiruvchisi; yarmi birinchi 8 soatda.', '', 'Масса × % ожога × коэффициент протокола; половина за первые 8 часов.'),
    not: NOT, kaynak: 'Baxter CR, Shires T. Ann N Y Acad Sci 1968;150:874-94 (Parkland 4 mL/kg/%TBSA).',
    alanlar: [s('kilo', 2, 300, 'kg'), s('tbsa', 1, 100, '%'), sec('katsayi', ['2', '3', '4'])],
    etiketler: { kilo: u('Vazni', '', 'Масса тела'), tbsa: u('Kuyish maydoni, %', '', 'Площадь ожога, %'), katsayi: u('Koʻpaytiruvchi (ml/kg/%)', '', 'Коэффициент (мл/кг/%)') },
    sayiAdlari: { toplam: u('24 soatlik hajm', '', 'Объём за 24 ч'), ilk8: u('Birinchi 8 soat', '', 'Первые 8 ч') },
    sonucBirimleri: ['mL'],
    hesap: (g) => { const v = (g.kilo as number) * (g.tbsa as number) * Number(g.katsayi); return { sayilar: [{ anahtar: 'toplam', deger: Math.round(v), ondalik: 0, birim: 'mL' }, { anahtar: 'ilk8', deger: Math.round(v / 2), ondalik: 0, birim: 'mL' }] } },
    ornekler: [{ girdi: { kilo: 70, tbsa: 30, katsayi: '4' }, sayilar: { toplam: 8400, ilk8: 4200 } }],
  },
  // ── surgery and paediatric surgery ──
  {
    sekil: 'toplam', k: 'alvarado', roller: ['genel-cerrahi', 'cocuk-cerrahisi'],
    ad: u('Alvarado shkalasi (appenditsit)', '', 'Шкала Альварадо (аппендицит)'), aciklama: u('Sakkizta belgi, 0–10.', '', 'Восемь признаков, 0–10.'),
    not: NOT, kaynak: 'Alvarado A. Ann Emerg Med 1986;15:557-64.',
    alanlar: [t('goc', u('Ogʻriqning oʻng yonbosh sohaga koʻchishi', '', 'Миграция боли в правую подвздошную область')), t('anoreksi', u('Ishtaha yoʻqligi', '', 'Анорексия')), t('bulanti', u('Koʻngil aynishi/qusish', '', 'Тошнота/рвота')), t('hassasiyet', u('Oʻng yonbosh sohada ogʻriq', '', 'Болезненность справа'), 2), t('rebound', u('Shchetkin–Blumberg belgisi', '', 'Симптом Щёткина–Блюмберга')), t('ates', u('Harorat ≥37,3', '', 'Температура ≥37,3')), t('lokosit', u('Leykotsitoz >10', '', 'Лейкоцитоз >10'), 2), t('sola_kayma', u('Chapga siljish', '', 'Сдвиг влево'))],
    bantlar: [b(0, 'olasi_degil', u('0–4', '', '0–4')), b(5, 'olasi', u('5–6 — mumkin', '', '5–6 — возможен')), b(7, 'muhtemel', u('7–8 — ehtimolli', '', '7–8 — вероятен')), b(9, 'cok_muhtemel', u('9–10 — juda ehtimolli', '', '9–10 — очень вероятен'))],
    ornekler: [{ girdi: { goc: true, anoreksi: true, hassasiyet: true, lokosit: true, sola_kayma: true }, toplam: 7, bant: 'muhtemel' }],
  },
  {
    sekil: 'toplam', k: 'bisap', roller: ['genel-cerrahi', 'gastroenteroloji'],
    ad: u('BISAP (oʻtkir pankreatit)', '', 'BISAP (острый панкреатит)'), aciklama: u('Birinchi 24 soat.', '', 'Первые 24 часа.'),
    not: NOT, kaynak: 'Wu BU, et al. Gut 2008;57:1698-703 (≥3 higher mortality).',
    alanlar: [t('ure', u('Mochevina >8,9 mmol/L', '', 'Мочевина >8,9 ммоль/л')), t('bilinc', u('Ongning buzilishi', '', 'Нарушение сознания')), t('sirs', u('SIRS', '', 'SIRS')), t('yas', u('Yoshi >60', '', 'Возраст >60')), t('plevral', u('Plevral suyuqlik', '', 'Плевральный выпот'))],
    bantlar: [b(0, 'dusuk', u('0–2', '', '0–2')), b(3, 'yuksek', u('≥3 — yuqori xavf', '', '≥3 — высокий риск'))],
    ornekler: [{ girdi: { ure: true, sirs: true, yas: true }, toplam: 3, bant: 'yuksek' }],
  },
  {
    sekil: 'toplam', k: 'glasgow-imrie', roller: ['genel-cerrahi'],
    ad: u('Glasgow (Imrie) mezonlari (pankreatit)', '', 'Критерии Глазго (Имри) (панкреатит)'), aciklama: u('≥3 — ogʻir kechish bashorati.', '', '≥3 — прогноз тяжёлого течения.'),
    not: NOT, kaynak: 'Blamey SL, et al. Prognostic factors in acute pancreatitis. Gut 1984;25:1340-6.',
    toplamAdi: u('Mezonlar', '', 'Критериев'),
    alanlar: [t('pao2', u('PaO2 <8 kPa', '', 'PaO2 <8 кПа')), t('yas', u('Yoshi >55', '', 'Возраст >55')), t('notrofil', u('Leykotsitlar >15', '', 'Лейкоциты >15')), t('kalsiyum', u('Kalsiy <2 mmol/L', '', 'Кальций <2 ммоль/л')), t('ure', u('Mochevina >16 mmol/L', '', 'Мочевина >16 ммоль/л')), t('enzim', u('LDG >600 yoki AST >200', '', 'ЛДГ >600 или АСТ >200')), t('albumin', u('Albumin <32 g/L', '', 'Альбумин <32 г/л')), t('glukoz', u('Glyukoza >10 mmol/L', '', 'Глюкоза >10 ммоль/л'))],
    bantlar: [b(0, 'hafif', u('0–2', '', '0–2')), b(3, 'agir', u('≥3 — ogʻir', '', '≥3 — тяжёлый'))],
    ornekler: [{ girdi: { yas: true, ure: true, glukoz: true }, toplam: 3, bant: 'agir' }],
  },
  {
    sekil: 'toplam', k: 'boey', roller: ['genel-cerrahi'],
    ad: u('Boey shkalasi (teshilgan yara)', '', 'Шкала Боуи (перфоративная язва)'), aciklama: u('Ogʻir hamroh kasallik, shok, >24 soat.', '', 'Тяжёлая сопутствующая патология, шок, >24 ч.'),
    not: NOT, kaynak: 'Boey J, et al. Ann Surg 1987;205:22-6.',
    alanlar: [t('hastalik', u('Ogʻir hamroh kasallik', '', 'Тяжёлая сопутствующая болезнь')), t('sok', u('Operatsiyadan oldin shok', '', 'Шок до операции')), t('sure', u('Teshilishdan >24 soat', '', '>24 ч от перфорации'))],
    ornekler: [{ girdi: { sok: true, sure: true }, toplam: 2 }],
  },
  {
    sekil: 'toplam', k: 'paediatric-appendicitis', roller: ['cocuk-cerrahisi', 'pediatri'],
    ad: u('Pediatrik appenditsit shkalasi', '', 'Педиатрическая шкала аппендицита'), aciklama: u('Bolalarda appenditsitga shubha.', '', 'Подозрение на аппендицит у детей.'),
    not: NOT, kaynak: 'Samuel M. J Pediatr Surg 2002;37:877-81 (≤3 low, 4–6 intermediate, ≥7 high).',
    alanlar: [t('oksuruk', u('Yoʻtalish/sakrashda oʻng pastki ogʻriq', '', 'Боль справа внизу при кашле/прыжке'), 2), t('anoreksi', u('Ishtaha yoʻqligi', '', 'Анорексия')), t('ates', u('Harorat ≥38', '', 'Температура ≥38')), t('bulanti', u('Koʻngil aynishi/qusish', '', 'Тошнота/рвота')), t('hassasiyet', u('Oʻng pastki kvadrantda ogʻriq', '', 'Болезненность справа внизу'), 2), t('lokosit', u('Leykotsitoz >10', '', 'Лейкоцитоз >10')), t('notrofil', u('Neytrofilyoz >7,5', '', 'Нейтрофилёз >7,5')), t('goc', u('Ogʻriq koʻchishi', '', 'Миграция боли'))],
    bantlar: [b(0, 'dusuk', u('0–3', '', '0–3')), b(4, 'orta', u('4–6', '', '4–6')), b(7, 'yuksek', u('7–10', '', '7–10'))],
    ornekler: [{ girdi: { oksuruk: true, hassasiyet: true, lokosit: true, goc: true }, toplam: 6, bant: 'orta' }],
  },
  {
    sekil: 'toplam', k: 'twist', roller: ['uroloji', 'cocuk-cerrahisi'],
    ad: u('TWIST (moyak buralishi)', '', 'TWIST (перекрут яичка)'), aciklama: u('≥5 — yuqori xavf.', '', '≥5 — высокий риск.'),
    not: NOT, kaynak: 'Barbosa JA, et al. J Urol 2013;189:1859-64.',
    alanlar: [t('sislik', u('Moyak shishi', '', 'Отёк яичка'), 2), t('sert', u('Qattiq moyak', '', 'Плотное яичко'), 2), t('kremaster', u('Kremaster refleksi yoʻq', '', 'Нет кремастерного рефлекса')), t('bulanti', u('Koʻngil aynishi/qusish', '', 'Тошнота/рвота')), t('yuksek', u('Moyak baland joylashgan', '', 'Высокое стояние яичка'))],
    bantlar: [b(0, 'dusuk', u('0–2', '', '0–2')), b(3, 'orta', u('3–4', '', '3–4')), b(5, 'yuksek', u('5–7', '', '5–7'))],
    ornekler: [{ girdi: { sislik: true, sert: true, kremaster: true }, toplam: 5, bant: 'yuksek' }],
  },
  {
    sekil: 'formul', k: 'maintenance-fluids', roller: ['pediatri', 'cocuk-cerrahisi'],
    ad: u('Saqlovchi suyuqlik hajmi (Holliday–Segar)', '', 'Поддерживающий объём жидкости (Холлидей–Сегар)'), aciklama: u('100, 50 va 20 ml/kg qoidasi.', '', 'Правило 100, 50 и 20 мл/кг.'),
    not: NOT, kaynak: 'Holliday MA, Segar WE. The maintenance need for water in parenteral fluid therapy. Pediatr 1957;19:823-32.',
    alanlar: [s('kilo', 1, 150, 'kg')],
    etiketler: { kilo: u('Vazni', '', 'Масса тела') },
    sayiAdlari: { gunluk: u('Sutkalik hajm', '', 'Суточный объём'), saatlik: u('Soatlik tezlik', '', 'Скорость в час') },
    sonucBirimleri: ['mL', 'mL/h'],
    hesap: (g) => { const w = g.kilo as number; const gun = Math.min(w, 10) * 100 + Math.max(0, Math.min(w, 20) - 10) * 50 + Math.max(0, w - 20) * 20; return { sayilar: [{ anahtar: 'gunluk', deger: Math.round(gun), ondalik: 0, birim: 'mL' }, { anahtar: 'saatlik', deger: Math.round(gun / 24), ondalik: 0, birim: 'mL/h' }] } },
    ornekler: [{ girdi: { kilo: 25 }, sayilar: { gunluk: 1600, saatlik: 67 } }],
  },
  {
    sekil: 'toplam', k: 'westley-croup', roller: ['pediatri'],
    ad: u('Westley shkalasi (krup)', '', 'Шкала Уэстли (круп)'), aciklama: u('Hush, sianoz, stridor, havo kirishi, tortilishlar.', '', 'Сознание, цианоз, стридор, проведение воздуха, втяжения.'),
    not: NOT, kaynak: 'Westley CR, Cotton EK, Brooks JG. Am J Dis Child 1978;132:484-7.',
    alanlar: [c('bilinc', u('Hush', '', 'Сознание'), [['0', u('Normal', '', 'Норма'), 0], ['5', u('Dezoriyentatsiya', '', 'Дезориентация'), 5]]), c('siyanoz', u('Sianoz', '', 'Цианоз'), [['0', u('Yoʻq', '', 'Нет'), 0], ['4', u('Bezovtalikda', '', 'При беспокойстве'), 4], ['5', u('Tinch holatda', '', 'В покое'), 5]]), c('stridor', u('Stridor', '', 'Стридор'), [['0', u('Yoʻq', '', 'Нет'), 0], ['1', u('Bezovtalikda', '', 'При беспокойстве'), 1], ['2', u('Tinch holatda', '', 'В покое'), 2]]), c('hava', u('Havo kirishi', '', 'Проведение воздуха'), [['0', u('Normal', '', 'Норма'), 0], ['1', u('Kamaygan', '', 'Снижено'), 1], ['2', u('Keskin kamaygan', '', 'Резко снижено'), 2]]), c('cekilme', u('Tortilishlar', '', 'Втяжения'), [['0', u('Yoʻq', '', 'Нет'), 0], ['1', u('Yengil', '', 'Лёгкие'), 1], ['2', u('Oʻrtacha', '', 'Умеренные'), 2], ['3', u('Ogʻir', '', 'Выраженные'), 3]])],
    bantlar: [b(0, 'hafif', u('≤2 — yengil', '', '≤2 — лёгкий')), b(3, 'orta', u('3–7 — oʻrtacha', '', '3–7 — средний')), b(8, 'agir', u('8–11 — ogʻir', '', '8–11 — тяжёлый')), b(12, 'yetmezlik', u('≥12 — nafas yetishmovchiligi xavfi', '', '≥12 — угроза дыхательной недостаточности'))],
    ornekler: [{ girdi: { bilinc: '0', siyanoz: '0', stridor: '2', hava: '1', cekilme: '2' }, toplam: 5, bant: 'orta' }],
  },
  {
    sekil: 'formul', k: 'pecarn-head', roller: ['pediatri', 'cocuk-norolojisi', 'cocuk-cerrahisi'],
    ad: u('PECARN bosh jarohati qoidasi (bolalar)', '', 'Правило PECARN при травме головы (дети)'), aciklama: u('GCS 14–15; <2 yosh va ≥2 yosh uchun alohida.', '', 'GCS 14–15; отдельно для <2 и ≥2 лет.'),
    not: NOT, kaynak: 'Kuppermann N, et al. Lancet 2009;374:1160-70.',
    alanlar: [sec('yas', ['alt2', 'ust2']), ...['gcs_ams', 'kirik', 'hematom', 'bilinc_kaybi', 'mekanizma', 'davranis', 'kusma', 'bas_agrisi'].map((k) => ({ anahtar: k, tur: 'isaret' as const }))],
    etiketler: { yas: u('Yosh guruhi', '', 'Возрастная группа'), gcs_ams: u('GCS 14 yoki ong oʻzgarishi', '', 'GCS 14 или изменение сознания'), kirik: u('Paypaslanadigan yoki asos sinishi belgilari', '', 'Пальпируемый перелом или признаки перелома основания'), hematom: u('Ensa/tepa/chakka gematomasi (<2)', '', 'Гематома затылка/темени/виска (<2)'), bilinc_kaybi: u('Hushdan ketish', '', 'Потеря сознания'), mekanizma: u('Ogʻir mexanizm', '', 'Тяжёлый механизм'), davranis: u('Ota-ona fikricha odatdagidek emas (<2)', '', 'Ведёт себя необычно со слов родителей (<2)'), kusma: u('Qusish (≥2)', '', 'Рвота (≥2)'), bas_agrisi: u('Kuchli bosh ogʻrigʻi (≥2)', '', 'Сильная головная боль (≥2)') },
    secenekEtiketleri: { yas: { alt2: u('<2 yosh', '', '<2 лет'), ust2: u('≥2 yosh', '', '≥2 лет') } },
    sayiAdlari: { bulgu: u('Belgilar', '', 'Признаков') },
    bantlar: [{ k: 'ct_onerilir', e: u('KT tavsiya etiladi', '', 'КТ рекомендована') }, { k: 'gozlem', e: u('Kuzatuv yoki KT — klinik qaror', '', 'Наблюдение или КТ — клиническое решение') }, { k: 'ct_gerekmez', e: u('KT tavsiya etilmaydi', '', 'КТ не рекомендована') }],
    hesap: (g) => {
      const y = ['gcs_ams', 'kirik'].filter((k) => g[k] === true).length
      const a = (g.yas === 'alt2' ? ['hematom', 'bilinc_kaybi', 'mekanizma', 'davranis'] : ['bilinc_kaybi', 'mekanizma', 'kusma', 'bas_agrisi']).filter((k) => g[k] === true).length
      return { sayilar: [{ anahtar: 'bulgu', deger: y + a, ondalik: 0 }], bant: y ? 'ct_onerilir' : a ? 'gozlem' : 'ct_gerekmez' }
    },
    ornekler: [{ girdi: { yas: 'alt2', hematom: true }, bant: 'gozlem' }, { girdi: { yas: 'ust2' }, bant: 'ct_gerekmez' }],
  },
  // ── ophthalmology, ENT, surdology ──
  {
    sekil: 'formul', k: 'areds-simple', roller: ['goz-hastaliklari'],
    ad: u('AREDS soddalashtirilgan shkala (YoMD)', '', 'Упрощённая шкала AREDS (ВМД)'), aciklama: u('Har bir koʻz: katta druzlar va pigment oʻzgarishi.', '', 'Каждый глаз: крупные друзы и пигментные изменения.'),
    not: NOT, kaynak: 'Ferris FL, et al. AREDS report no. 18. Arch Ophthalmol 2005;123:1570-4.',
    alanlar: ['druzen_sag', 'druzen_sol', 'pigment_sag', 'pigment_sol', 'orta_iki'].map((k) => ({ anahtar: k, tur: 'isaret' as const })),
    etiketler: { druzen_sag: u('Oʻng koʻz: katta druzlar', '', 'Правый глаз: крупные друзы'), druzen_sol: u('Chap koʻz: katta druzlar', '', 'Левый глаз: крупные друзы'), pigment_sag: u('Oʻng koʻz: pigment oʻzgarishi', '', 'Правый глаз: пигментные изменения'), pigment_sol: u('Chap koʻz: pigment oʻzgarishi', '', 'Левый глаз: пигментные изменения'), orta_iki: u('Ikkala koʻzda oʻrta druzlar, katta yoʻq', '', 'Средние друзы в обоих глазах, крупных нет') },
    sayiAdlari: { skor: u('Ball', '', 'Балл') },
    bantlar: [0, 1, 2, 3, 4].map((n) => ({ k: `s${n}`, e: u(`${n} ball — 5 yillik xavf ${['~0,5%', '~3%', '~12%', '~25%', '~50%'][n]}`, '', `${n} балл — 5-летний риск ${['~0,5%', '~3%', '~12%', '~25%', '~50%'][n]}`) })),
    hesap: (g) => {
      const bk = ['druzen_sag', 'druzen_sol'].filter((k) => g[k] === true).length
      let n = bk + ['pigment_sag', 'pigment_sol'].filter((k) => g[k] === true).length
      if (g.orta_iki === true && bk === 0) n += 1
      n = Math.min(4, n)
      return { sayilar: [{ anahtar: 'skor', deger: n, ondalik: 0, enCok: 4 }], bant: `s${n}` }
    },
    ornekler: [{ girdi: { druzen_sag: true, pigment_sag: true }, bant: 's2' }],
  },
  {
    sekil: 'toplam', k: 'dr-severity', roller: ['goz-hastaliklari', 'endokrinoloji'],
    ad: u('Diabetik retinopatiya ogʻirligi', '', 'Тяжесть диабетической ретинопатии'), aciklama: u('Xalqaro klinik shkala.', '', 'Международная клиническая шкала.'),
    not: NOT, kaynak: 'Wilkinson CP, et al. Ophthalmology 2003;110:1677-82.',
    toplamAdi: DARAJA,
    alanlar: [c('duzey', DARAJA, [['0', u('Retinopatiya yoʻq', '', 'Нет ретинопатии'), 0], ['1', u('Yengil NPDR', '', 'Лёгкая НПДР'), 1], ['2', u('Oʻrtacha NPDR', '', 'Умеренная НПДР'), 2], ['3', u('Ogʻir NPDR', '', 'Тяжёлая НПДР'), 3], ['4', u('Proliferativ', '', 'Пролиферативная'), 4]])],
    ornekler: [{ girdi: { duzey: '2' }, toplam: 2 }],
  },
  {
    sekil: 'toplam', k: 'ocular-trauma-score', roller: ['goz-hastaliklari'],
    ad: u('Koʻz jarohati bali (OTS)', '', 'Шкала травмы глаза (OTS)'), aciklama: u('Boshlangʻich koʻrish oʻtkirligi minus asoratlar.', '', 'Исходная острота зрения минус осложнения.'),
    not: NOT, kaynak: 'Kuhn F, et al. The Ocular Trauma Score (OTS). Ophthalmol Clin North Am 2002;15:163-5.',
    toplamAdi: u('OTS xom ball', '', 'Сырой балл OTS'),
    alanlar: [c('gk', u('Boshlangʻich koʻrish oʻtkirligi', '', 'Исходная острота зрения'), [['nlp', u('Yorugʻlik sezmaydi', '', 'Нет светоощущения'), 60], ['lp', u('Yorugʻlik / qoʻl harakati', '', 'Светоощущение / движение руки'), 70], ['d1', u('1/200 dan 19/200 gacha', '', 'от 1/200 до 19/200'), 80], ['d2', u('0,1–0,4', '', '0,1–0,4'), 90], ['d3', u('≥0,5', '', '≥0,5'), 100]]), t('ruptur', u('Koʻz olmasi yorilishi', '', 'Разрыв глазного яблока'), -23), t('endoftalmi', u('Endoftalmit', '', 'Эндофтальмит'), -17), t('perforan', u('Teshib oʻtuvchi jarohat', '', 'Сквозное ранение'), -14), t('rd', u('Toʻr parda koʻchishi', '', 'Отслойка сетчатки'), -11), t('rapd', u('Afferent pupil nuqsoni', '', 'Афферентный зрачковый дефект'), -10)],
    bantlar: [b(-1000, 'k1', u('1-toifa (0–44)', '', 'Категория 1 (0–44)')), b(45, 'k2', u('2-toifa (45–65)', '', 'Категория 2 (45–65)')), b(66, 'k3', u('3-toifa (66–80)', '', 'Категория 3 (66–80)')), b(81, 'k4', u('4-toifa (81–91)', '', 'Категория 4 (81–91)')), b(92, 'k5', u('5-toifa (92–100)', '', 'Категория 5 (92–100)'))],
    ornekler: [{ girdi: { gk: 'lp', ruptur: true, rapd: true }, toplam: 37, bant: 'k1' }],
  },
  {
    sekil: 'toplam', k: 'house-brackmann', roller: ['kulak-burun-bogaz', 'noroloji'],
    ad: u('House–Brackmann (yuz nervi)', '', 'Хаус–Бракманн (лицевой нерв)'), aciklama: u('I–VI daraja.', '', 'Степени I–VI.'),
    not: NOT, kaynak: 'House JW, Brackmann DE. Facial nerve grading system. Otolaryngol Head Neck Surg 1985;93:146-7.',
    toplamAdi: DARAJA,
    alanlar: [c('derece', DARAJA, sinif('derece', 6))],
    ornekler: [{ girdi: { derece: '4' }, toplam: 4 }],
  },
  {
    sekil: 'toplam', k: 'lund-mackay', roller: ['kulak-burun-bogaz', 'radyoloji'],
    ad: u('Lund–Mackay KT bali (rinosinusit)', '', 'Балл Лунда–Маккея по КТ (риносинусит)'), aciklama: u('Har bir sinus 0–2, OMK 0 yoki 2; ikki tomon, 0–24.', '', 'Каждая пазуха 0–2, ОМК 0 или 2; обе стороны, 0–24.'),
    not: NOT, kaynak: 'Lund VJ, Mackay IS. Staging in rhinosinusitis. Rhinology 1993;31:183-4.',
    alanlar: ['sag', 'sol'].flatMap((y) => { const yl = y === 'sag' ? u('oʻng', '', 'справа') : u('chap', '', 'слева'); const e = (lat: string, ru: string) => u(`${lat} (${yl['uz-Latn']})`, '', `${ru} (${yl.ru})`); return [i(`maksiller_${y}`, 0, 2, e('Haymor', 'Верхнечелюстная')), i(`on_etmoid_${y}`, 0, 2, e('Old gʻalvirsimon', 'Передние решётчатые')), i(`arka_etmoid_${y}`, 0, 2, e('Orqa gʻalvirsimon', 'Задние решётчатые')), i(`sfenoid_${y}`, 0, 2, e('Ponasimon', 'Клиновидная')), i(`frontal_${y}`, 0, 2, e('Peshona', 'Лобная')), c(`omk_${y}`, e('Ostiomeatal kompleks', 'Остиомеатальный комплекс'), [['0', u('Ochiq', '', 'Проходим'), 0], ['2', u('Yopiq', '', 'Окклюзия'), 2]])] }),
    ornekler: [{ girdi: { maksiller_sag: 2, on_etmoid_sag: 1, arka_etmoid_sag: 1, sfenoid_sag: 0, frontal_sag: 1, omk_sag: '2', maksiller_sol: 1, on_etmoid_sol: 1, arka_etmoid_sol: 0, sfenoid_sol: 0, frontal_sol: 0, omk_sol: '0' }, toplam: 9 }],
  },
  {
    sekil: 'toplam', k: 'mcisaac', roller: ['aile-hekimligi', 'kulak-burun-bogaz', 'pediatri'],
    ad: u('Centor–McIsaac (tomoq ogʻrigʻi)', '', 'Сентор–МакАйзек (боль в горле)'), aciklama: u('Isitma, yoʻtal yoʻqligi, limfa tugunlari, bodomcha, yosh.', '', 'Лихорадка, нет кашля, лимфоузлы, миндалины, возраст.'),
    not: NOT, kaynak: 'McIsaac WJ, et al. A clinical score to reduce unnecessary antibiotic use in patients with sore throat. CMAJ 1998;158:75-83.',
    alanlar: [t('ates', u('Harorat >38', '', 'Температура >38')), t('oksuruk_yok', u('Yoʻtal yoʻq', '', 'Нет кашля')), t('lenf', u('Old boʻyin limfa tugunlari kattalashgan', '', 'Увеличены передние шейные лимфоузлы')), t('tonsil', u('Bodomcha shishi yoki karashi', '', 'Отёк или налёт миндалин')), c('yas', u('Yoshi', '', 'Возраст'), [['3_14', u('3–14', '', '3–14'), 1], ['15_44', u('15–44', '', '15–44'), 0], ['45', u('≥45', '', '≥45'), -1]])],
    bantlar: [b(-1, 'dusuk', u('≤0', '', '≤0')), b(1, 'orta', u('1–3', '', '1–3')), b(4, 'yuksek', u('≥4', '', '≥4'))],
    ornekler: [{ girdi: { ates: true, oksuruk_yok: true, lenf: true, tonsil: true, yas: '3_14' }, toplam: 5, bant: 'yuksek' }],
  },
  {
    sekil: 'formul', k: 'tympanogram-type', roller: ['surdoloji', 'kulak-burun-bogaz'],
    ad: u('Timpanogramma turi (Jerger)', '', 'Тип тимпанограммы (Джергер)'), aciklama: u('Choʻqqi bosimi va statik admitans boʻyicha.', '', 'По давлению пика и статическому адмитансу.'),
    not: NOT, kaynak: 'Jerger J. Clinical experience with impedance audiometry. Arch Otolaryngol 1970;92:311-24 (adult admittance 0.3–1.6 mL; pressure above −100 daPa).',
    alanlar: [{ anahtar: 'duz', tur: 'isaret' }, s('basinc', -600, 400, 'daPa', { istege: true }), s('admitans', 0, 10, 'mL', { istege: true })],
    etiketler: { duz: u('Tekis egri chiziq (choʻqqi yoʻq)', '', 'Плоская кривая (нет пика)'), basinc: u('Choʻqqi bosimi', '', 'Давление пика'), admitans: u('Statik admitans', '', 'Статический адмитанс') },
    sayiAdlari: { admitans: u('Admitans', '', 'Адмитанс') },
    sonucBirimleri: ['mL'],
    bantlar: ['a', 'as', 'ad', 'b', 'c'].map((k) => ({ k, e: u(`${k === 'as' ? 'As' : k === 'ad' ? 'Ad' : k.toUpperCase()} turi`, '', `Тип ${k === 'as' ? 'As' : k === 'ad' ? 'Ad' : k.toUpperCase()}`) })),
    hesap: (g) => {
      if (g.duz === true) return { sayilar: [], bant: 'b' }
      if (!sayiMi(g.basinc) || !sayiMi(g.admitans)) return null
      const a = g.admitans as number
      return { sayilar: [{ anahtar: 'admitans', deger: yuvarla(a, 2), ondalik: 2, birim: 'mL' }], bant: (g.basinc as number) < -100 ? 'c' : a < 0.3 ? 'as' : a > 1.6 ? 'ad' : 'a' }
    },
    ornekler: [{ girdi: { duz: true }, bant: 'b' }, { girdi: { basinc: -250, admitans: 0.5 }, bant: 'c' }],
  },
  {
    sekil: 'formul', k: 'hearing-grade-who', roller: ['surdoloji', 'kulak-burun-bogaz'],
    ad: u('4 chastota oʻrtachasi va JSST eshitish darajasi', '', 'Среднее по 4 частотам и степень слуха ВОЗ'), aciklama: u('0,5/1/2/4 kHz, yaxshi quloq boʻyicha.', '', '0,5/1/2/4 кГц, по лучше слышащему уху.'),
    not: NOT, kaynak: 'WHO. World report on hearing. Geneva: WHO; 2021.',
    alanlar: ['sag', 'sol'].flatMap((y) => ['500', '1000', '2000', '4000'].map((f) => s(`${y}_${f}`, -10, 130, 'dB'))),
    etiketler: Object.fromEntries(['sag', 'sol'].flatMap((y) => ['500', '1000', '2000', '4000'].map((f) => [`${y}_${f}`, u(`${y === 'sag' ? 'Oʻng' : 'Chap'} ${String(Number(f) / 1000).replace('.', ',')} kHz`, '', `${y === 'sag' ? 'Правое' : 'Левое'} ${String(Number(f) / 1000).replace('.', ',')} кГц`)]))),
    sayiAdlari: { sag_4fa: u('Oʻng 4FA', '', 'Правое 4FA'), sol_4fa: u('Chap 4FA', '', 'Левое 4FA') },
    sonucBirimleri: ['dB'],
    bantlar: [['normal', 'Normal', 'Норма'], ['hafif', 'Yengil', 'Лёгкая'], ['orta', 'Oʻrtacha', 'Умеренная'], ['orta_agir', 'Oʻrtacha ogʻir', 'Умеренно тяжёлая'], ['agir', 'Ogʻir', 'Тяжёлая'], ['derin', 'Chuqur', 'Глубокая'], ['tam', 'Toʻliq', 'Полная']].map(([k, l, r]) => ({ k, e: u(l, '', r) })),
    hesap: (g) => {
      const o = (y: string) => ['500', '1000', '2000', '4000'].reduce((x, f) => x + (g[`${y}_${f}`] as number), 0) / 4
      const s4 = o('sag'), l4 = o('sol'), iyi = Math.min(s4, l4)
      const bant = iyi < 20 ? 'normal' : iyi < 35 ? 'hafif' : iyi < 50 ? 'orta' : iyi < 65 ? 'orta_agir' : iyi < 80 ? 'agir' : iyi < 95 ? 'derin' : 'tam'
      return { sayilar: [{ anahtar: 'sag_4fa', deger: yuvarla(s4, 1), ondalik: 1, birim: 'dB' }, { anahtar: 'sol_4fa', deger: yuvarla(l4, 1), ondalik: 1, birim: 'dB' }], bant }
    },
    ornekler: [{ girdi: { sag_500: 20, sag_1000: 25, sag_2000: 35, sag_4000: 60, sol_500: 30, sol_1000: 40, sol_2000: 50, sol_4000: 70 }, sayilar: { sag_4fa: 35, sol_4fa: 47.5 }, bant: 'orta' }],
  },
  {
    sekil: 'toplam', k: 'thi', roller: ['surdoloji', 'kulak-burun-bogaz'],
    ad: u('Quloq shangʻillashi nogironlik indeksi (THI)', '', 'Индекс тяжести шума в ушах (THI)'), aciklama: u('25 band: 0/2/4; 0–100.', '', '25 пунктов: 0/2/4; 0–100.'),
    not: BANDLAR, kaynak: 'Newman CW, et al. Arch Otolaryngol Head Neck Surg 1996;122:143-8; McCombe A, et al. Clin Otolaryngol 2001;26:388-93.',
    toplamAdi: u('THI', '', 'THI'),
    alanlar: Array.from({ length: 25 }, (_, k) => c(`m${k + 1}`, u(`${k + 1}-band`, '', `Пункт ${k + 1}`), [['0', u('Yoʻq (0)', '', 'Нет (0)'), 0], ['2', u('Baʼzan (2)', '', 'Иногда (2)'), 2], ['4', u('Ha (4)', '', 'Да (4)'), 4]])),
    bantlar: [b(0, 'cok_hafif', u('0–16', '', '0–16')), b(18, 'hafif', u('18–36', '', '18–36')), b(38, 'orta', u('38–56', '', '38–56')), b(58, 'agir', u('58–76', '', '58–76')), b(78, 'felaket', u('78–100', '', '78–100'))],
    ornekler: [{ girdi: Object.fromEntries(Array.from({ length: 25 }, (_, k) => [`m${k + 1}`, k < 10 ? '2' : '0'])), toplam: 20, bant: 'hafif' }],
  },
  {
    sekil: 'toplam', k: 'hhie-s', roller: ['surdoloji'],
    ad: u('HHIE-S (keksalarda eshitish nogironligi)', '', 'HHIE-S (нарушение слуха у пожилых)'), aciklama: u('10 band: 0/2/4; 0–40.', '', '10 пунктов: 0/2/4; 0–40.'),
    not: BANDLAR, kaynak: 'Ventry IM, Weinstein BE. ASHA 1983;25:37-42.',
    toplamAdi: u('HHIE-S', '', 'HHIE-S'),
    alanlar: Array.from({ length: 10 }, (_, k) => c(`m${k + 1}`, u(`${k + 1}-band`, '', `Пункт ${k + 1}`), [['0', u('Yoʻq (0)', '', 'Нет (0)'), 0], ['2', u('Baʼzan (2)', '', 'Иногда (2)'), 2], ['4', u('Ha (4)', '', 'Да (4)'), 4]])),
    bantlar: [b(0, 'yok', u('0–8', '', '0–8')), b(10, 'hafif', u('10–24', '', '10–24')), b(26, 'belirgin', u('26–40', '', '26–40'))],
    ornekler: [{ girdi: Object.fromEntries(Array.from({ length: 10 }, (_, k) => [`m${k + 1}`, k < 3 ? '4' : k < 6 ? '2' : '0'])), toplam: 18, bant: 'hafif' }],
  },
]

