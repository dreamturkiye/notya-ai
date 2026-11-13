/**
 * PREMATUR-ULKE-01 (Kaan, 2026-11-13) — Uzbekistan: THE PREMATURITY MODULE. Three tiles (the preterm baby's follow-up plan and the doctor's
 * list of such babies: paediatrics only; the early-birth record: obstetrics and gynaecology only), the follow-up table, the early-birth
 * thresholds, and the words of both screens (../prematurMetinleri.ts).
 *
 * EVERY ITEM IS "FOLLOW YOUR LOCAL PROTOCOL". No national source of Uzbekistan (a protocol, an order of the Ministry of Health, a clinical
 * guideline) was found and read for retinopathy of prematurity screening, cranial ultrasound, hearing, RSV, iron, bronchopulmonary
 * dysplasia or bone health of the preterm baby, for the cervical length, or for antenatal corticosteroids; a criterion or a date taken from
 * another country's document would be an invented one. So the table states no criterion and no date, lists no source, and says so in words;
 * the engine still counts the corrected age, the postmenstrual age and the term date, which need no source (the definition of the product).
 * The cervical-length record, its trend and the doctor's own facts are kept. A source is added here by a clinician of Uzbekistan, with the
 * page it was read on, in the same change as the number it gives (lib/ulke/prematur/dogrulama.ts holds the table to that).
 *
 * MACHINE-WRITTEN. AWAITS NATIVE AND CLINICAL REVIEW (see ./index.ts). Uzbek in Latin script was written by a machine; the Cyrillic form is
 * derived from it by rule (scripts/uz-kiril.mjs). NO RUSSIAN TEXT WAS WRITTEN FOR THIS MODULE: the Russian form shows the Uzbek Latin text.
 * No dose anywhere.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { PrematurPaketi } from '@/lib/ulke/prematur/paket'
import type { ErkenDogumProtokolu } from '@/lib/ulke/prematur/erkenDogum'
import { URUN_PARAMETRELERI, type KuralKategori, type PrematurKural, type PrematurProtokol } from '@/lib/ulke/prematur/tipler'
import { UZ_PREMATUR_METINLERI } from '../prematurMetinleri'
import { u, type Uc } from './yardimci'

const PEDI = ['pediatri']
const KD = ['kadin-hastaliklari-dogum']

const NOT = u('Shifokor tasdiqlaydigan roʻyxat: hech narsa buyurilmaydi, yoʻllanmaydi, retseptga yozilmaydi yoki yuborilmaydi va doza yoʻq.', 'Шифокор тасдиқлайдиган рўйхат: ҳеч нарса буюрилмайди, йўлланмайди, рецептга ёзилмайди ёки юборилмайди ва доза йўқ.', 'Shifokor tasdiqlaydigan roʻyxat: hech narsa buyurilmaydi, yoʻllanmaydi, retseptga yozilmaydi yoki yuborilmaydi va doza yoʻq.')

export const UZ_PREMATUR_ARACLARI: readonly PaketAraci[] = [
  {
    anahtar: 'prematur-takip', roller: PEDI,
    metin: {
      ad: u('Muddatidan oldin tugʻilgan chaqaloqni kuzatish rejasi', 'Муддатидан олдин туғилган чақалоқни кузатиш режаси', 'Muddatidan oldin tugʻilgan chaqaloqni kuzatish rejasi'),
      aciklama: u('Muddatidan oldin tugʻilgan yoki tugʻilish vazni juda kam chaqaloqning gestatsiya muddati va vazni asosida: kuzatuv bandlari (koʻz, bosh miya, eshitish, oʻpka, qon, suyaklar, infeksiya). Manbasi oʻqilgan band mezoni va sanasi bilan koʻrsatiladi; qolganlari uchun «Mahalliy protokolga amal qiling». Oylikdagi yosh yonida tuzatilgan yosh.', 'Муддатидан олдин туғилган ёки туғилиш вазни жуда кам чақалоқнинг гестация муддати ва вазни асосида: кузатув бандлари (кўз, бош мия, эшитиш, ўпка, қон, суяклар, инфекция). Манбаси ўқилган банд мезони ва санаси билан кўрсатилади; қолганлари учун «Маҳаллий протоколга амал қилинг». Ойликдаги ёш ёнида тузатилган ёш.', 'Muddatidan oldin tugʻilgan yoki tugʻilish vazni juda kam chaqaloqning gestatsiya muddati va vazni asosida: kuzatuv bandlari (koʻz, bosh miya, eshitish, oʻpka, qon, suyaklar, infeksiya). Manbasi oʻqilgan band mezoni va sanasi bilan koʻrsatiladi; qolganlari uchun «Mahalliy protokolga amal qiling». Oylikdagi yosh yonida tuzatilgan yosh.'),
      alanlar: {},
      not: NOT,
    },
  },
  {
    anahtar: 'prematur-kohort', roller: PEDI,
    metin: {
      ad: u('Muddatidan oldin tugʻilgan chaqaloqlar roʻyxati', 'Муддатидан олдин туғилган чақалоқлар рўйхати', 'Muddatidan oldin tugʻilgan chaqaloqlar roʻyxati'),
      aciklama: u('Oʻz bemorlaringiz orasidagi muddatidan oldin tugʻilgan va tugʻilish vazni juda kam chaqaloqlar, eng shoshilinchlari birinchi: muddati oʻtgan va vaqti kelgan bandlar bir qarashda.', 'Ўз беморларингиз орасидаги муддатидан олдин туғилган ва туғилиш вазни жуда кам чақалоқлар, энг шошилинчлари биринчи: муддати ўтган ва вақти келган бандлар бир қарашда.', 'Oʻz bemorlaringiz orasidagi muddatidan oldin tugʻilgan va tugʻilish vazni juda kam chaqaloqlar, eng shoshilinchlari birinchi: muddati oʻtgan va vaqti kelgan bandlar bir qarashda.'),
      alanlar: {},
      not: NOT,
    },
  },
  {
    anahtar: 'erken-dogum', roller: KD,
    metin: {
      ad: u('Erta tugʻruq yozuvi', 'Эрта туғруқ ёзуви', 'Erta tugʻruq yozuvi'),
      aciklama: u('Homiladorlikda bachadon boʻyni uzunligi jurnali va dinamikasi, oldingi erta tugʻruq, koʻp homilalilik, pardalarning yorilishi hamda siz kiritgan antenatal steroid va magniy maʼlumotlari. Chegaralar koʻrsatilmagan: ularni mahalliy protokol belgilaydi.', 'Ҳомиладорликда бачадон бўйни узунлиги журнали ва динамикаси, олдинги эрта туғруқ, кўп ҳомилалилик, пардаларнинг ёрилиши ҳамда сиз киритган антенатал стероид ва магний маълумотлари. Чегаралар кўрсатилмаган: уларни маҳаллий протокол белгилайди.', 'Homiladorlikda bachadon boʻyni uzunligi jurnali va dinamikasi, oldingi erta tugʻruq, koʻp homilalilik, pardalarning yorilishi hamda siz kiritgan antenatal steroid va magniy maʼlumotlari. Chegaralar koʻrsatilmagan: ularni mahalliy protokol belgilaydi.'),
      alanlar: {},
      not: u('Yozuv va qarorga yordam: hech narsa buyurilmaydi, retseptga yozilmaydi yoki yuborilmaydi; doza, muolaja yoki serklaj taklif qilinmaydi.', 'Ёзув ва қарорга ёрдам: ҳеч нарса буюрилмайди, рецептга ёзилмайди ёки юборилмайди; доза, муолажа ёки серклаж таклиф қилинмайди.', 'Yozuv va qarorga yordam: hech narsa buyurilmaydi, retseptga yozilmaydi yoki yuborilmaydi; doza, muolaja yoki serklaj taklif qilinmaydi.'),
    },
  },
]

/** The follow-up items every country's table names, in the order the plan shows them (the module's own list: lib/ulke/prematur/tipler.ts). */
const KALEMLER: ReadonlyArray<{ kod: string; kategori: KuralKategori; baslik: Uc; aciklama: Uc }> = [
  { kod: 'rop', kategori: 'goz',
    baslik: u('Chala tugʻilganlar retinopatiyasi (ROP) boʻyicha koʻz skrining', 'Чала туғилганлар ретинопатияси (РОП) бўйича кўз скрининг', 'Chala tugʻilganlar retinopatiyasi (ROP) boʻyicha koʻz skrining'),
    aciklama: u('Muddatidan oldin tugʻilgan chaqaloqlarda koʻz toʻr pardasini oftalmolog tomonidan koʻrikdan oʻtkazish.', 'Муддатидан олдин туғилган чақалоқларда кўз тўр пардасини офталмолог томонидан кўрикдан ўтказиш.', 'Muddatidan oldin tugʻilgan chaqaloqlarda koʻz toʻr pardasini oftalmolog tomonidan koʻrikdan oʻtkazish.') },
  { kod: 'cranial-us', kategori: 'beyin',
    baslik: u('Bosh miya ultratovush tekshiruvi', 'Бош мия ультратовуш текшируви', 'Bosh miya ultratovush tekshiruvi'),
    aciklama: u('Muddatidan oldin tugʻilgan chaqaloqda bosh miyaning rejali ultratovush tekshiruvlari.', 'Муддатидан олдин туғилган чақалоқда бош миянинг режали ультратовуш текширувлари.', 'Muddatidan oldin tugʻilgan chaqaloqda bosh miyaning rejali ultratovush tekshiruvlari.') },
  { kod: 'hearing-9m', kategori: 'isitme',
    baslik: u('Eshitish: xavf omillari boʻyicha kuzatuv', 'Эшитиш: хавф омиллари бўйича кузатув', 'Eshitish: xavf omillari boʻyicha kuzatuv'),
    aciklama: u('Eshitish pasayishi xavfi omili boʻlgan chaqaloqda, yangi tugʻilgan davrdagi skrining oʻtgan boʻlsa ham, eshitishning tashxisiy baholanishi.', 'Эшитиш пасайиши хавфи омили бўлган чақалоқда, янги туғилган даврдаги скрининг ўтган бўлса ҳам, эшитишнинг ташхисий баҳоланиши.', 'Eshitish pasayishi xavfi omili boʻlgan chaqaloqda, yangi tugʻilgan davrdagi skrining oʻtgan boʻlsa ham, eshitishning tashxisiy baholanishi.') },
  { kod: 'hearing-ecmo', kategori: 'isitme',
    baslik: u('Ekstrakorporal membrana oksigenatsiyasidan keyin eshitish', 'Экстракорпорал мембрана оксигенациясидан кейин эшитиш', 'Ekstrakorporal membrana oksigenatsiyasidan keyin eshitish'),
    aciklama: u('Ekstrakorporal membrana oksigenatsiyasidan keyin eshitishni baholash.', 'Экстракорпорал мембрана оксигенациясидан кейин эшитишни баҳолаш.', 'Ekstrakorporal membrana oksigenatsiyasidan keyin eshitishni baholash.') },
  { kod: 'bpd', kategori: 'akciger',
    baslik: u('Surunkali oʻpka kasalligi (bronxopulmonal displaziya)', 'Сурункали ўпка касаллиги (бронхопулмонал дисплазия)', 'Surunkali oʻpka kasalligi (bronxopulmonal displaziya)'),
    aciklama: u('Muddatidan oldin tugʻilishga bogʻliq surunkali oʻpka kasalligi boʻlgan chaqaloqni kuzatish.', 'Муддатидан олдин туғилишга боғлиқ сурункали ўпка касаллиги бўлган чақалоқни кузатиш.', 'Muddatidan oldin tugʻilishga bogʻliq surunkali oʻpka kasalligi boʻlgan chaqaloqni kuzatish.') },
  { kod: 'rsv', kategori: 'enfeksiyon',
    baslik: u('Respirator sinsitial virusdan himoya', 'Респиратор синситиал вирусдан ҳимоя', 'Respirator sinsitial virusdan himoya'),
    aciklama: u('Chaqaloq respirator sinsitial virusdan himoya qilinishi kerak boʻlgan chaqaloqlar qatoriga kirishi-kirmasligi.', 'Чақалоқ респиратор синситиал вирусдан ҳимоя қилиниши керак бўлган чақалоқлар қаторига кириши-кирмаслиги.', 'Chaqaloq respirator sinsitial virusdan himoya qilinishi kerak boʻlgan chaqaloqlar qatoriga kirishi-kirmasligi.') },
  { kod: 'iron', kategori: 'kan',
    baslik: u('Temir preparati bilan taʼminlash', 'Темир препарати билан таъминлаш', 'Temir preparati bilan taʼminlash'),
    aciklama: u('Muddatidan oldin tugʻilgan chaqaloqqa temir preparati qachon boshlanishi. Dori va uning dozasi sizniki.', 'Муддатидан олдин туғилган чақалоққа темир препарати қачон бошланиши. Дори ва унинг дозаси сизники.', 'Muddatidan oldin tugʻilgan chaqaloqqa temir preparati qachon boshlanishi. Dori va uning dozasi sizniki.') },
  { kod: 'bone', kategori: 'kemik',
    baslik: u('Suyak salomatligi (chala tugʻilganlarning metabolik suyak kasalligi)', 'Суяк саломатлиги (чала туғилганларнинг метаболик суяк касаллиги)', 'Suyak salomatligi (chala tugʻilganlarning metabolik suyak kasalligi)'),
    aciklama: u('Muddatidan oldin tugʻilgan chaqaloqda suyak salomatligini tekshirish.', 'Муддатидан олдин туғилган чақалоқда суяк саломатлигини текшириш.', 'Muddatidan oldin tugʻilgan chaqaloqda suyak salomatligini tekshirish.') },
]

const YEREL_ACIKLAMA = u('Bu mahsulot bu mamlakat uchun bu bandga mezon va sana koʻrsatmaydi: uning manbasi oʻqilib, bu yerda havola qilinmadi. Mahalliy protokolga amal qiling.', 'Бу маҳсулот бу мамлакат учун бу бандга мезон ва сана кўрсатмайди: унинг манбаси ўқилиб, бу ерда ҳавола қилинмади. Маҳаллий протоколга амал қилинг.', 'Bu mahsulot bu mamlakat uchun bu bandga mezon va sana koʻrsatmaydi: uning manbasi oʻqilib, bu yerda havola qilinmadi. Mahalliy protokolga amal qiling.')
const birlestir = (a: Uc, b: Uc): Uc => ({ 'uz-Latn': `${a['uz-Latn']} ${b['uz-Latn']}`, 'uz-Cyrl': `${a['uz-Cyrl']} ${b['uz-Cyrl']}`, ru: `${a.ru} ${b.ru}` })

/** FOLLOW YOUR LOCAL PROTOCOL: no criterion, no date and — here — no source. */
const yerel = (k: (typeof KALEMLER)[number]): PrematurKural => ({
  kod: k.kod, kategori: k.kategori, baslik: k.baslik, aciklama: birlestir(k.aciklama, YEREL_ACIKLAMA), yerel: true, kriter: null, zamanlamalar: [], kaynaklar: [],
})

const KAPSAM_KAYNAGI = u('Mahsulotning oʻz doirasi: 37 haftadan oldin yoki 1500 g va undan kam vaznda tugʻilganlar. Bu yerda har bir band «Mahalliy protokolga amal qiling»: milliy manba oʻqilmadi.', 'Маҳсулотнинг ўз доираси: 37 ҳафтадан олдин ёки 1500 г ва ундан кам вазнда туғилганлар. Бу ерда ҳар бир банд «Маҳаллий протоколга амал қилинг»: миллий манба ўқилмади.', 'Mahsulotning oʻz doirasi: 37 haftadan oldin yoki 1500 g va undan kam vaznda tugʻilganlar. Bu yerda har bir band «Mahalliy protokolga amal qiling»: milliy manba oʻqilmadi.')
const ULKE_ADI = u('Oʻzbekiston', 'Ўзбекистон', 'Oʻzbekiston')

const PROTOKOL: PrematurProtokol = {
  ulke: 'Uzbekistan', ad: ULKE_ADI, surum: '2026-11-13',
  // The product's own definition (the same as the Turkish module's), not taken from a national source.
  duzeltme: { baslangicHafta: 37, buyumeUstAy: 24, gelisimUstAy: 24, kaynak: 'Corrected age: born before 37 weeks, corrected up to 24 months of age. The product\'s own definition (the one the Turkish module uses); not taken from a source of Uzbekistan.' },
  kapsam: { gestasyonHaftaKucuk: 37, dogumKiloGrEnFazla: 1500, kaynak: KAPSAM_KAYNAGI },
  urun: { ...URUN_PARAMETRELERI },
  kurallar: KALEMLER.map(yerel),
}

const ERKEN_DOGUM: ErkenDogumProtokolu = {
  ulke: 'Uzbekistan', surum: '2026-11-13', serviks: null, steroid: null, kaynaklar: [], serviksKaynaklari: [], steroidKaynaklari: [],
  kapsam: u('Oʻzbekiston uchun hech qanday chegara koʻrsatilmagan: bachadon boʻyni uzunligi va antenatal kortikosteroidlar boʻyicha milliy manba oʻqilmadi. Yozuv va dinamika saqlanadi; mahalliy protokolga amal qiling.', 'Ўзбекистон учун ҳеч қандай чегара кўрсатилмаган: бачадон бўйни узунлиги ва антенатал кортикостероидлар бўйича миллий манба ўқилмади. Ёзув ва динамика сақланади; маҳаллий протоколга амал қилинг.', 'Oʻzbekiston uchun hech qanday chegara koʻrsatilmagan: bachadon boʻyni uzunligi va antenatal kortikosteroidlar boʻyicha milliy manba oʻqilmadi. Yozuv va dinamika saqlanadi; mahalliy protokolga amal qiling.'),
}

export const UZ_PREMATUR: PrematurPaketi = {
  protokol: PROTOKOL,
  erkenDogum: ERKEN_DOGUM,
  roller: { bebek: PEDI, gebelik: KD },
  metinler: UZ_PREMATUR_METINLERI,
}
