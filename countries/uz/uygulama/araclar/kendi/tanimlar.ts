/**
 * NOTYA-ULKE-UYGULA-UZ — Uzbekistan: THE MECHANISMS OF THE TOOLS ONLY UZBEKISTAN HAS. Three tools, proposed by the
 * tools audit of 2026-10-10 (docs/araclar-denetim/UZ.md, "The proposals and the core set") and built for this
 * country alone: no other country's build holds them (wall rule D7; countries/yasak-araclar.json lists the keys).
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * WRITTEN BY A MACHINE FROM SOURCES OPENED ON 2026-10-10. NO CLINICIAN OF UZBEKISTAN HAS READ A LINE OF THIS FILE.
 * The three tools are SWITCHED ON by the owner's order of 2026-10-10 ("Bring on all the tools built for the new 6
 * countries now. We will test as we go."), without a clinician's sign-off: ./onay.ts lists them and says what a
 * clinician has to confirm for each. Nothing here was written from memory: every number below stands beside the
 * place of the source it was read in, and ./kendi.test.ts holds the code to the same numbers. AT MOST ONE SHORT
 * PHRASE OF A SOURCE IS QUOTED; everything else is said in this file's own words.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * THE SOURCES, each opened on 2026-10-10 through a reader that returns the text of the page or of the file:
 *
 *   [ANC]   «Сборник национальных клинических протоколов по антенатальному уходу», protocol «Нормальная беременность».
 *           Cover: Ministry of Health of the Republic of Uzbekistan and the Republican Specialised Scientific-Practical
 *           Medical Centre; created 24.07.2021; approved by the Scientific Council of the Republican Specialised
 *           Scientific-Practical Medical Centre of Obstetrics and Gynaecology on 29.07.2021, minutes No. 7. The copy
 *           read carries NO ORDER NUMBER of the Ministry. Planned revision: 2024 "or as new key evidence appears";
 *           whether a newer edition is in force was not found.
 *           https://uzbekistan.unfpa.org/sites/default/files/submissions/protokoly_anu_1_2_3_4_5_6_12_13_rus.pdf
 *   [WHO]   World Health Organization, Nutrition Landscape Information System, "Malnutrition in women" (the page
 *           that defines the body mass index and cites WHO Technical Report Series No. 854, 1995).
 *           https://www.who.int/data/nutrition/nlis/info/malnutrition-in-women
 *   [CDC1]  Centers for Disease Control and Prevention, "Calculating BMI" (18.06.2024).
 *           https://www.cdc.gov/growth-chart-training/hcp/using-bmi/calculating-bmi.html
 *   [CDC2]  Centers for Disease Control and Prevention, "Adult BMI Categories" (19.03.2024).
 *           https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html
 *   [NHS]   NHS Grampian, Healthy Weight Grampian, the page that works one body mass index out.
 *           https://www.healthyweightgrampian.scot.nhs.uk/?p=3519
 *   [ACOG]  American College of Obstetricians and Gynecologists, Committee Opinion No. 700, "Methods for Estimating
 *           the Due Date", May 2017 (a university's copy of the opinion).
 *           https://www.healthcare.uiowa.edu/familymedicine/fpinfo/OB/OB2017/ACOG redating gestational age.pdf
 *   [JE]    Government of Jersey, "Due date calculator". https://gov.je/Health/PregnancyAndBirth/YourPregnancy/Pages/DueDateCalculator.aspx
 *   [IMM]   SanQvaM 0239-07/3, "Oʻzbekiston Respublikasida yuqumli kasalliklar immunoprofilaktikasi", approved by the
 *           Chief State Sanitary Doctor on 15.03.2015; amendment of 19.07.2021 the latest shown.
 *           https://lex.uz/uz/acts/-5524039 — opened for its title and status ONLY. NOTHING OF ITS CALENDAR IS IN THE PRODUCT.
 *
 * LICENCE, as read (./metinler.ts states it per tool): the arithmetic and the limits are taken from official
 * documents of the state and from pages of public bodies; no wording of any of them is reproduced. Law of the
 * Republic of Uzbekistan No. OʻRQ-42 of 20.07.2006 "Mualliflik huquqi va turdosh huquqlar toʻgʻrisida"
 * (https://lex.uz/en/acts/-1022944, read 2026-10-10): article 8, official documents are not objects of copyright
 * ("rasmiy hujjatlar (qonunlar, qarorlar, toʻxtamlar va shu kabilar)"); article 5, copyright covers the form of
 * expression and not ideas, principles, methods or processes. CDC's own notice ("Use of Agency Materials",
 * https://cdc.gov/other/agencymaterials.html, read 2026-10-10): most information on its sites "is in the public
 * domain". This is a machine's reading of those texts, not a lawyer's.
 */
import type { AracSayisi, AracTanimi } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, gunEkle, gunFarki, gunMu, sayi, sayiMi, secim, tarih } from '@/lib/ulke/araclar/yardimci'

// ───────────────────────── 1. body mass index ─────────────────────────

/**
 * THE LIMITS OF THE FOUR CLASSES, as [ANC] prints them in its Table 1 (the column of the index before pregnancy):
 * below 18,5; from 18,5 to 24,9; from 25,0 to 29,9; 30 and above, in kg/m2.
 * [WHO] prints the same limits for adults (underweight below 18.5, normal weight 18.5 to 24.9, overweight from 25.0,
 * obesity from 30.0) and says they do not depend on age in adults and are the same for both sexes; [CDC2] prints
 * them as below 18.5, 18.5 to below 25, 25 to below 30, and 30 or greater.
 * Table 1 states its limits to ONE DECIMAL PLACE, so the index is held against them as it is written on the screen:
 * rounded to one place. 24,96 is written 25,0 and falls in the class that begins at 25,0.
 */
export const UZ_TVI_CHEGARALARI = { kam: 18.5, meyor: 24.9, ortiqcha: 29.9 } as const

/**
 * FOR WHOM THE CLASSES ARE: adults. The one source read that states an age is [CDC2]: "For adults 20 and older", the
 * categories follow from the index whatever the age, sex or race; for children and teenagers the page defines
 * obesity by a percentile for sex and age instead. A tool cannot show its number and hold back its class, so the
 * whole tool is for a patient of this age or older (the pack's gate, ./metinler.ts).
 * No source of Uzbekistan that states the age was found.
 */
export const UZ_TVI_ENG_KICHIK_YOSH = 20

const birOnlik = (x: number) => Math.round(x * 10) / 10

/**
 * BODY MASS INDEX. [CDC1] prints the formula: "BMI = weight (kg) / [height (m)]2". [ANC], recommendation 5C, tells the
 * clinician to work the index out the same way (body mass in kilograms over height in metres squared), and [WHO]
 * defines it in the same words.
 * WORKED EXAMPLE of a source, and the test of this function: [NHS], a person of 89 kg and 1.62 m: 89 divided by
 * (1.62 x 1.62) "= 33.9 kg/m2".
 * Waist circumference is a field that is only recorded: the tool holds no limit for it.
 * The two ranges below are limits of what can be typed, not clinical limits.
 */
export const UZ_TANA_VAZNI_INDEKSI: AracTanimi = {
  anahtar: 'uz-tana-vazni-indeksi',
  tur: 'hesap',
  alanlar: [sayi('vazn', 20, 400, { olcu: 'agirlik' }), sayi('boy', 100, 250, { olcu: 'boy' }), sayi('bel', 30, 250, { olcu: 'boy', istege: true })],
  cikti: { sayilar: ['tvi'], bantlar: ['kam', 'meyor', 'ortiqcha', 'semizlik'], uyarilar: [], tarihler: [] },
  sonucBirimleri: ['kg/m2'],
  kaynak: 'Ministry of Health of the Republic of Uzbekistan, national clinical protocols on antenatal care (2021), "Normal pregnancy", recommendation 5C and Table 1; WHO, Physical status: the use and interpretation of anthropometry, Technical Report Series 854 (1995).',
  hesapla: (g) => {
    if (!sayiMi(g.vazn) || !sayiMi(g.boy) || g.boy <= 0) return BOS_SONUC
    const metr = g.boy / 100
    const tvi = birOnlik(g.vazn / (metr * metr))
    const bant = tvi < UZ_TVI_CHEGARALARI.kam ? 'kam' : tvi <= UZ_TVI_CHEGARALARI.meyor ? 'meyor' : tvi <= UZ_TVI_CHEGARALARI.ortiqcha ? 'ortiqcha' : 'semizlik'
    return { tamam: true, sayilar: [{ anahtar: 'tvi', deger: tvi, ondalik: 1, birim: 'kg/m2' }], bant, uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── 2. gestational age and the expected date of birth ─────────────────────────

/**
 * THE FOUR NUMBERS OF THE RULE, each as [ANC] states it (protocol "Normal pregnancy", how the term is determined):
 *   280   by the date of the last menstrual period the clinician is to «прибавить 280 дней (40 недель)» to its first
 *         day, for a menstrual cycle of 28 days. [ACOG] and [JE] state the same 280 days from the same day.
 *   266   for a pregnancy after assisted reproduction the date is counted from the day of the embryo transfer: that
 *         day plus 266 days (38 weeks) minus the number of days the embryo was cultured.
 *         WORKED NUMBERS of a source: [ACOG] gives "261 days" from the transfer for a day-5 embryo and 263 days for a
 *         day-3 embryo — 266 minus 5, and 266 minus 3.
 *   5     where the term by the last period and by the ultrasound of 11 to 14 weeks differ by MORE THAN 5 days, the
 *         term and the date of birth are set by the ultrasound.
 *   28    the cycle the 280 days are stated for. For a cycle of another length the protocol asks for a correction
 *         AND PRINTS NO NUMBER FOR IT. The tool therefore corrects nothing: it says so in a warning and shows the
 *         uncorrected date.
 * [ANC] PRINTS NO WORKED EXAMPLE WITH CALENDAR DATES, and no official calculator page that prints one was found. The
 * tests hold the code to the printed numbers themselves: 280 days and 40 weeks, 266 days and 38 weeks, 261 and 263.
 */
export const UZ_HOMILADORLIK_QOIDASI = { hayzdanKun: 280, kochirishdanKun: 266, uziFarqiKun: 5, hafta: 40 } as const

/**
 * GESTATIONAL AGE AND THE EXPECTED DATE OF BIRTH — date arithmetic by the rule above and nothing else. The doctor
 * chooses what the count starts from: the first day of the last menstrual period, or the day of an embryo transfer.
 *   - from the last period: the date is that day plus 280 days. Where the doctor also types the expected date the
 *     ultrasound of 11 to 14 weeks gave, the two are compared, and when they differ BY MORE THAN 5 DAYS the
 *     ultrasound's date is the result (exactly 5 days: the last period's date stands).
 *   - after an embryo transfer: the date is the transfer day plus 266 days minus the days the embryo was cultured.
 * THE GESTATIONAL AGE TODAY is counted back from the result with the protocol's own equivalence, 280 days = 40
 * weeks: (280 − the days left until the expected date), in whole weeks and days. For a count from the last period
 * that is the days since its first day. FOR A DATE SET BY ULTRASOUND OR BY A TRANSFER THE PROTOCOL STATES THE
 * EXPECTED DATE ONLY: the age shown is derived from it this way, which ./onay.ts lists for the clinician.
 * No result while today is before the start of the count. A date after the expected date raises a warning.
 * NOT HERE: the schedule of antenatal visits and examinations, any risk, any advice.
 * The range of the culture days is a limit of what can be typed, not a clinical limit.
 */
export const UZ_HOMILADORLIK_MUDDATI: AracTanimi = {
  anahtar: 'uz-homiladorlik-muddati',
  tur: 'takvim',
  alanlar: [
    secim('usul', ['hayz', 'yrt']),
    { ...tarih('oxirgi_hayz'), kosul: { alan: 'usul', degerler: ['hayz'] } },
    { ...secim('sikl', ['yigirma_sakkiz', 'boshqa']), kosul: { alan: 'usul', degerler: ['hayz'] } },
    { ...tarih('uzi_tugish', true), kosul: { alan: 'usul', degerler: ['hayz'] } },
    { ...tarih('kochirish'), kosul: { alan: 'usul', degerler: ['yrt'] } },
    { ...sayi('kultivatsiya', 0, 30, { tam: true, birim: 'gun' }), kosul: { alan: 'usul', degerler: ['yrt'] } },
  ],
  cikti: { sayilar: ['hafta', 'kun', 'farq'], bantlar: ['hayz_boyicha', 'uzi_boyicha', 'yrt_boyicha'], uyarilar: ['sikl_tuzatilmagan', 'muddat_otgan'], tarihler: ['tugish'] },
  sonucBirimleri: ['hafta', 'gun'],
  kaynak: 'Ministry of Health of the Republic of Uzbekistan, national clinical protocols on antenatal care (2021), "Normal pregnancy": how the gestational age and the expected date of birth are determined.',
  hesapla: (g, { bugun }) => {
    const q = UZ_HOMILADORLIK_QOIDASI
    let tugish: string, bant: string
    const sayilar: AracSayisi[] = []
    const uyarilar: string[] = []
    if (g.usul === 'hayz') {
      if (!gunMu(g.oxirgi_hayz) || (g.sikl !== 'yigirma_sakkiz' && g.sikl !== 'boshqa')) return BOS_SONUC
      tugish = gunEkle(g.oxirgi_hayz, q.hayzdanKun)
      bant = 'hayz_boyicha'
      if (gunMu(g.uzi_tugish)) {
        const farq = Math.abs(gunFarki(tugish, g.uzi_tugish))
        sayilar.push({ anahtar: 'farq', deger: farq, ondalik: 0, birim: 'gun' })
        // MORE THAN 5 DAYS: the ultrasound's date. Exactly 5: the date by the last period stands.
        if (farq > q.uziFarqiKun) { tugish = g.uzi_tugish; bant = 'uzi_boyicha' }
      }
      // the 280 days are stated for a 28-day cycle; the protocol prints no number for another length
      if (g.sikl === 'boshqa') uyarilar.push('sikl_tuzatilmagan')
    } else if (g.usul === 'yrt') {
      if (!gunMu(g.kochirish) || !sayiMi(g.kultivatsiya) || !Number.isInteger(g.kultivatsiya) || g.kultivatsiya < 0) return BOS_SONUC
      tugish = gunEkle(g.kochirish, q.kochirishdanKun - g.kultivatsiya)
      bant = 'yrt_boyicha'
    } else return BOS_SONUC
    // 280 days = 40 weeks: the age today is what is left of them, counted back from the expected date
    const gun = q.hayzdanKun - gunFarki(bugun, tugish)
    if (gun < 0) return BOS_SONUC
    if (gunFarki(tugish, bugun) > 0) uyarilar.push('muddat_otgan')
    return {
      tamam: true,
      sayilar: [{ anahtar: 'hafta', deger: Math.floor(gun / 7), ondalik: 0, birim: 'hafta' }, { anahtar: 'kun', deger: gun % 7, ondalik: 0, birim: 'gun' }, ...sayilar],
      bant, uyarilar, tarihler: [{ anahtar: 'tugish', tarih: tugish }],
    }
  },
}

// ───────────────────────── 3. a vaccination, recorded ─────────────────────────

/**
 * ONE VACCINATION AS THE DOCTOR ENTERS IT: the name of the vaccine in the doctor's own words, the number of the
 * dose, the day it was given, where the fact comes from (the vaccination document, or what the patient or a parent
 * said), and — if the doctor sets one — a next day.
 * THE TOOL KNOWS NO VACCINE, NO AGE AND NO INTERVAL. The national calendar of preventive vaccinations ([IMM]) is an
 * act of the Chief State Sanitary Doctor and is NOT in the product: nothing of it was copied, the tool proposes no
 * vaccine and no date, and it never says that a vaccination is due, late or missing. It only repeats what was typed.
 * A vaccination with a day after today is not a vaccination that was given: no result.
 * The range of the dose number is a limit of what can be typed, not a clinical limit.
 */
export const UZ_EMLASH_QAYDI: AracTanimi = {
  anahtar: 'uz-emlash-qaydi',
  tur: 'liste',
  alanlar: [{ anahtar: 'vaksina', tur: 'metin' }, sayi('doza', 1, 20, { tam: true, istege: true }), tarih('sana'), secim('manba', ['hujjat', 'ogzaki']), tarih('keyingi', true)],
  cikti: { sayilar: ['doza'], bantlar: ['hujjat', 'ogzaki'], uyarilar: ['keyingi_otgan'], tarihler: ['sana', 'keyingi'] },
  kaynak: null,
  hesapla: (g, { bugun }) => {
    if (typeof g.vaksina !== 'string' || !g.vaksina.trim() || !gunMu(g.sana) || (g.manba !== 'hujjat' && g.manba !== 'ogzaki')) return BOS_SONUC
    if (gunFarki(g.sana, bugun) < 0) return BOS_SONUC
    const keyingi = gunMu(g.keyingi) ? g.keyingi : null
    return {
      tamam: true,
      sayilar: sayiMi(g.doza) ? [{ anahtar: 'doza', deger: g.doza, ondalik: 0 }] : [],
      bant: g.manba,
      uyarilar: keyingi && gunFarki(keyingi, bugun) > 0 ? ['keyingi_otgan'] : [],
      tarihler: [{ anahtar: 'sana', tarih: g.sana }, ...(keyingi ? [{ anahtar: 'keyingi', tarih: keyingi }] : [])],
    }
  },
}

/** The mechanisms of the pack's own tools: `UlkeAraclari.kendiAraclari`. */
export const UZ_KENDI_TANIMLAR: readonly AracTanimi[] = [UZ_TANA_VAZNI_INDEKSI, UZ_HOMILADORLIK_MUDDATI, UZ_EMLASH_QAYDI]
