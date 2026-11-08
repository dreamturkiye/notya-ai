/**
 * ULKE-BRANS-DERINLIK-03 / -12 (Kaan, 2026-11-08: "build the Uzbek ones as high as you can get them") — UZBEKISTAN'S
 * PRACTICE SOURCES AND REFERENCE BOOKS, per role, for the live assistant (./canli.ts → kaynakBlogu).
 *
 * EVERY ENTRY BELOW WAS OPENED ON THE WEB ON 2026-11-08 (no title from memory). CITATIONS ONLY: no text of any protocol
 * or book is copied, and no recommendation, dose or threshold from them is written here.
 *
 *   NATIONAL (binding, first): national clinical protocols ("milliy klinik protokol") of the Ministry of Health of the
 *   Republic of Uzbekistan, approved by the Minister's orders and published on the government portal (gov.uz/ssv,
 *   files on api-portal.gov.uz). Opened: order No. 195 of 14.06.2024 (its annex lists eleven protocols), order No. 107 of
 *   29.03.2024 (annex 1), order No. 401 of 25.12.2024 (protocols opened one by one, named below), order No. 180 of
 *   23.06.2025 (annex 7 and the acne protocol). Also the Law "On the protection of the health of citizens" (lex.uz/docs/26013,
 *   read in the earlier wave), the specialty nomenclature (order No. 6 of 12.05.2021, ./rolListesi.ts) and the essential
 *   medicines list (order No. 34 of 21.08.2023, ../referans/asosiyDorilar.json).
 *
 *   BOOKS (depth, after the national sources): the Russian-language "Национальные руководства" series (GEOTAR-Media,
 *   Moscow). They are Russian Federation texts, widely used in Russian-language teaching; they are NOT Uzbek national
 *   documents and are labelled so in the prompt. Each was confirmed on the publisher's page, a bookseller's record or a
 *   medical university library list opened 2026-11-08 (geotar.ru, labirint.ru, mmbook.ru, kirovgma.ru, dgmu.ru, igma.ru,
 *   rsmu.ru). No Uzbek-language textbook could be confirmed per specialty this session: none is listed (OPEN-COMMITMENTS
 *   ULKE-BRANS-DERINLIK-12).
 *
 * NOT FOUND (left out, logged): the Ministry's order approving outpatient medical record forms (form 025) could not be
 * opened on lex.uz or gov.uz in three searches — no form 025 structure or citation is in the product (DERINLIK-11).
 *
 * MACHINE-ASSEMBLED, AWAITS AN UZBEK CLINICIAN'S REVIEW (ULKE-BRANS-KLINISYEN-01). AU assistant untouched.
 */

/** Ministry of Health national clinical protocols that were opened, with the approving order. */
const P = {
  ag: 'MoH national clinical protocol "Arterial gipertenziya bilan kasallangan bemorlarni davolash" (order No. 195, 14.06.2024)',
  yik: 'MoH national clinical protocol on chronic ischaemic heart disease ("Surunkali yurak ishemik kasalligi", order No. 195, 14.06.2024)',
  astma: 'MoH national clinical protocol on bronchial asthma ("Bronxial astma", order No. 195, 14.06.2024)',
  oSok: 'MoH national clinical protocol on COPD ("Oʻpka surunkali obstruktiv kasalligi", order No. 195, 14.06.2024)',
  qd: 'MoH national clinical protocol on diabetes mellitus types 1 and 2 ("Qandli diabet (1 va 2-turlari)", order No. 195, 14.06.2024)',
  qd2: 'MoH national clinical protocols "2-tur qandli diabet" (order No. 180, 23.06.2025, annex 7; RIEIATM)',
  sirroz: 'MoH national clinical protocol on viral liver cirrhosis ("Virus etiologiyali jigar sirrozi", order No. 195, 14.06.2024)',
  hbv: 'MoH national clinical protocols on viral hepatitis B without and with delta agent (order No. 195, 14.06.2024)',
  hcv: 'MoH national clinical protocol on viral hepatitis C ("Virusli gepatit C", order No. 195, 14.06.2024)',
  antenatal: 'MoH national clinical protocol on antenatal care and women at risk ("Antenatal parvarish…", order No. 195, 14.06.2024)',
  oila: 'MoH national clinical guide on family planning and contraception ("Oilani rejalashtirish…", order No. 195, 14.06.2024)',
  gqd: 'MoH national clinical protocol "Gestatsion qandli diabet" (order No. 401, 25.12.2024)',
  sarkoidoz: 'MoH national clinical protocol "Sarkoidoz" (order No. 401, 25.12.2024)',
  gripp: 'MoH national clinical protocols "Gripp va boshqa OʻRVI" (order No. 401, 25.12.2024)',
  ddh: 'MoH national clinical protocols "Sonning patologik chiqishi" (order No. 401, 25.12.2024)',
  tuxumdon: 'MoH national clinical protocol "Tuxumdonlar saratoni" (order No. 401, 25.12.2024)',
  atopik: 'MoH national clinical protocols "Atopik dermatit" (order No. 401, 25.12.2024)',
  husnbuzar: 'MoH national clinical protocol "Husnbuzar kasalligi" (acne; order No. 180, 23.06.2025)',
  xodjkin: 'MoH national clinical protocols "Bolalarda Xodjkin limfomasi" (order No. 107, 29.03.2024, annex 1)',
} as const

const UMUMIY = [
  'Ministry of Health of the Republic of Uzbekistan — national clinical protocols (milliy klinik protokollar) approved by ministerial order; the full texts are published on gov.uz/ssv. Use the protocol in force for the condition; when unsure which one applies, say so and send the clinician to it.',
  'Law of the Republic of Uzbekistan "On the protection of the health of citizens" (lex.uz/docs/26013) — consent and patient rights.',
  'MoH essential medicines list (order No. 34, 21.08.2023, lex.uz/docs/-6590070) — what is on the national list; it is not a dosing source.',
] as const

/** Books that were confirmed (citation only). */
const K = {
  kardio: 'Кардиология: национальное руководство / под ред. Е. В. Шляхто. 2-е изд. М.: ГЭОТАР-Медиа, 2015',
  nevro: 'Неврология: национальное руководство / под ред. Е. И. Гусева и др. 2-е изд. М.: ГЭОТАР-Медиа, 2022',
  psix: 'Психиатрия: национальное руководство. 2-е изд. М.: ГЭОТАР-Медиа, 2022',
  endo: 'Эндокринология: национальное руководство / под ред. И. И. Дедова, Г. А. Мельниченко. 2-е изд. М.: ГЭОТАР-Медиа, 2024',
  gin: 'Гинекология: национальное руководство / под ред. Г. М. Савельевой, Г. Т. Сухих, В. Н. Серова, В. Е. Радзинского, И. Б. Манухина. 2-е изд. М.: ГЭОТАР-Медиа, 2022',
  infek: 'Инфекционные болезни: национальное руководство / под ред. Н. Д. Ющука, Ю. Я. Венгерова. М.: ГЭОТАР-Медиа, 2021',
  nutri: 'Нутрициология и клиническая диетология: национальное руководство / под ред. В. А. Тутельяна, Д. Б. Никитюка. М.: ГЭОТАР-Медиа, 2022',
  lor: 'Оториноларингология: национальное руководство / под ред. В. Т. Пальчуна. 2-е изд. М.: ГЭОТАР-Медиа, 2022',
  oft: 'Офтальмология: национальное руководство / под ред. С. Э. Аветисова и др. 2-е изд. М.: ГЭОТАР-Медиа, 2022',
  intens: 'Интенсивная терапия: национальное руководство / под ред. И. Б. Заболотских, Д. Н. Проценко. 2-е изд. М.: ГЭОТАР-Медиа, 2021',
  anest: 'Анестезиология: национальное руководство / под ред. А. Г. Яворовского, Ю. С. Полушина. 2-е изд. М.: ГЭОТАР-Медиа, 2023',
  gastro: 'Гастроэнтерология: национальное руководство / под ред. В. Т. Ивашкина, Т. Л. Лапиной. М.: ГЭОТАР-Медиа, 2018',
  pedi: 'Педиатрия: национальное руководство / под ред. А. А. Баранова. М.: ГЭОТАР-Медиа, 2009',
  neotlozh: 'Неотложная педиатрия: национальное руководство / под ред. Б. М. Блохина. М.: ГЭОТАР-Медиа, 2017',
  derm: 'Дерматовенерология: национальное руководство. Краткое издание / под ред. Ю. С. Бутова, Ю. К. Скрипкина, О. Л. Иванова. М.: ГЭОТАР-Медиа, 2020',
  nefro: 'Нефрология: национальное руководство / гл. ред. Н. А. Мухин. М.: ГЭОТАР-Медиа, 2009',
  uro: 'Урология: национальное руководство / под ред. Н. А. Лопаткина. М.: ГЭОТАР-Медиа, 2013',
  onko: 'Онкология: национальное руководство / под ред. В. И. Чиссова, М. И. Давыдова. М.: ГЭОТАР-Медиа, 2014',
  pulmo: 'Пульмонология: национальное руководство / гл. ред. А. Г. Чучалин. М.: ГЭОТАР-Медиа, 2009',
  revma: 'Ревматология: национальное руководство / под ред. Е. Л. Насонова, В. А. Насоновой. М.: ГЭОТАР-Медиа, 2010',
  ortop: 'Ортопедия: национальное руководство / под ред. С. П. Миронова, Г. П. Котельникова. М.: ГЭОТАР-Медиа, 2008',
  travma: 'Травматология: национальное руководство / под ред. Г. П. Котельникова, С. П. Миронова. 2-е изд. М.: ГЭОТАР-Медиа, 2011',
  allerg: 'Аллергология и иммунология: национальное руководство. Краткое издание / под ред. Р. М. Хаитова, Н. И. Ильиной. М.: ГЭОТАР-Медиа, 2014',
  luch: 'Основы лучевой диагностики и терапии: национальное руководство / гл. ред. С. К. Терновой. М.: ГЭОТАР-Медиа, 2013',
  dxir: 'Детская хирургия: национальное руководство / под ред. Ю. Ф. Исакова, А. Ф. Дронова. М.: ГЭОТАР-Медиа, 2014',
  xir: 'Клиническая хирургия: национальное руководство (в 3 т.) / под ред. В. С. Савельева, А. И. Кириенко. М.: ГЭОТАР-Медиа, 2008–2013',
  ovp: 'Общая врачебная практика: национальное руководство (в 2 т.) / под ред. И. Н. Денисова, О. М. Лесняк. М.: ГЭОТАР-Медиа, 2017–2019',
  fizio: 'Физиотерапия: национальное руководство / под ред. Г. Н. Пономаренко. М.: ГЭОТАР-Медиа, 2014',
  toks: 'Медицинская токсикология: национальное руководство / под ред. Е. А. Лужникова. М.: ГЭОТАР-Медиа, 2014',
} as const

export type UzRolKaynagi = { readonly milliy: readonly string[]; readonly kitoblar: readonly string[] }

const R = (milliy: readonly string[], kitoblar: readonly string[]): UzRolKaynagi => ({ milliy, kitoblar })

/** Per role: the national protocols that were opened for its field (beyond the general ones), then its books. */
export const UZ_ROL_KAYNAKLARI: Readonly<Record<string, UzRolKaynagi>> = {
  'acil-tip': R([P.gripp, P.atopik], [K.intens, K.toks, K.neotlozh]),
  'aile-hekimligi': R([P.ag, P.qd, P.astma, P.oSok, P.gripp, P.antenatal, P.oila], [K.ovp]),
  anestezi: R([], [K.anest, K.intens]),
  'beyin-cerrahisi': R([], [K.nevro]),
  'cocuk-cerrahisi': R([P.ddh], [K.dxir]),
  dahiliye: R([P.ag, P.yik, P.qd, P.astma, P.oSok, P.sirroz], [K.ovp, K.kardio, K.gastro]),
  dermatoloji: R([P.husnbuzar, P.atopik], [K.derm]),
  endokrinoloji: R([P.qd, P.qd2, P.gqd], [K.endo]),
  'enfeksiyon-hastaliklari': R([P.hbv, P.hcv, P.gripp], [K.infek]),
  gastroenteroloji: R([P.sirroz, P.hbv, P.hcv], [K.gastro]),
  'genel-cerrahi': R([], [K.xir]),
  'gogus-cerrahisi': R([], [K.xir, K.pulmo]),
  'gogus-hastaliklari': R([P.astma, P.oSok, P.sarkoidoz], [K.pulmo]),
  'goz-hastaliklari': R([], [K.oft]),
  'kadin-hastaliklari-dogum': R([P.antenatal, P.oila, P.gqd, P.tuxumdon], [K.gin]),
  'kalp-damar-cerrahisi': R([P.yik], [K.xir, K.kardio]),
  'damar-cerrahisi': R([], [K.xir]),
  kardiyoloji: R([P.ag, P.yik], [K.kardio]),
  'kulak-burun-bogaz': R([], [K.lor]),
  nefroloji: R([P.ag, P.qd], [K.nefro]),
  noroloji: R([], [K.nevro]),
  onkoloji: R([P.tuxumdon, P.xodjkin], [K.onko]),
  ortopedi: R([P.ddh], [K.ortop, K.travma]),
  pediatri: R([P.gripp, P.atopik, P.xodjkin], [K.pedi, K.neotlozh]),
  'plastik-cerrahi': R([], []),
  psikiyatri: R([], [K.psix]),
  radyoloji: R([], [K.luch]),
  romatoloji: R([], [K.revma]),
  uroloji: R([], [K.uro]),
  'spor-hekimligi': R([], [K.fizio]),
  'fizik-tedavi': R([], [K.fizio]),
  'alerji-immunoloji': R([P.atopik, P.astma], [K.allerg]),
  reproduktoloji: R([P.oila, P.antenatal], [K.gin]),
  'cocuk-norolojisi': R([], [K.nevro, K.pedi]),
  narkoloji: R([], [K.psix, K.toks]),
  diyetoloji: R([P.qd, P.gqd], [K.nutri]),
  surdoloji: R([], [K.lor]),
  'estetik-cerrahi': R([], []),
  'medikal-estetik': R([P.husnbuzar], [K.derm]),
  'klinik-dermatoloji': R([P.husnbuzar, P.atopik], [K.derm]),
  fizyoterapi: R([], [K.fizio]),
  'klinik-psikolog': R([], [K.psix]),
}

/** The prompt block for one role, or null for a key that is not one of this pack's roles. */
export function uzKaynakBlogu(rol: string): string | null {
  const k = Object.prototype.hasOwnProperty.call(UZ_ROL_KAYNAKLARI, rol) ? UZ_ROL_KAYNAKLARI[rol] : null
  if (!k) return null
  return [
    '=== UZBEKISTAN PRACTICE SOURCES (BINDING) ===',
    'For clinical decisions, doses, work-up and referral, use the Uzbek national sources first; on a conflict the Uzbek source wins over any other text.',
    'Name a source only when you are sure of it. Never quote a protocol\'s content, a dose or an order number from memory beyond what is listed here: send the clinician to the document.',
    ...[...UMUMIY, ...k.milliy].map((x) => `• ${x}`),
    ...(k.kitoblar.length ? ['', '=== BOOKS (Russian-language reference texts, depth only — not Uzbek practice authority) ===', ...k.kitoblar.map((x) => `• ${x}`)] : []),
  ].join('\n')
}
