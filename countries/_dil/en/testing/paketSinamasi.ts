/**
 * NOTYA-ULKE-EN-01 — THE TESTS EVERY ENGLISH-SPEAKING PACK RUNS ON ITSELF. TESTS ONLY.
 *
 * One function, called from each country's own test file (countries/<code>/<code>.test.ts) with that country's pack.
 * It names no country: what a country must NOT show (the other English-speaking countries' words) is handed in.
 *
 *   1. SPELLING      every text the pack shows, and every instruction it gives the model, is written in the pack's
 *                    own form of English: no spelling of another form
 *   2. WALLS         nothing of another English-speaking country, of Türkiye or of Uzbekistan in any text — the
 *                    sentences of the empty slots included (they are never shown, but they are part of the pack)
 *   3. NO CLAIMS     no compliance, approval, certification, endorsement or integration claim; no law or regulator
 *                    named; no testimonial; no price; no free trial; hidden from search; sign-up by invitation
 *   4. IDENTITY      the patient identifier is optional free text, never validated; nothing asks for a Social
 *                    Security number
 *   5. UNITS         every numeric field of every switched-on tool that is measured in a unit shows that unit, in
 *                    the pack's own units; typed in the pack's units, each tool gives the kit's reference result
 *                    (the same arithmetic on the exactly converted values)
 *   6. TOOLS         which tools are switched on and which are slots, as the country's record says; roles are the
 *                    shared key set; the follow-up list is given to exactly the roles that have a tool
 *   7. STATUS        every set says "machine-written, read by no clinician"; no consent wording is marked as read
 *                    by a lawyer; the source file of the country carries the "not read by a lawyer" mark; the
 *                    country's record under docs/ is what the pack says today
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { alanBirimi, INC_CM, LAB_BIRIMLERI, LB_KG, type BirimOrtami } from '@/lib/ulke/araclar/birimler'
import { girdiyiCoz, type HamGirdi } from '@/lib/ulke/araclar/girdi'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import type { AracAlani, AracGirdisi, AracTanimi } from '@/lib/ulke/araclar/tipler'
import type { UlkeArayuzu } from '@/lib/ulke/arayuz/tipler'
import { paketiDenetle } from '@/lib/ulke/paketDenetimi'
import { ornekGirdiler, ornekOrtam } from '@/lib/ulke/testing/aracOrnekleri'
import type { UlkeKlinigi, UlkePaketi } from '@/lib/ulke/tipler'
import { EN_ROL_ARACLARI } from '../araclar'
import { EN_ROLLER } from '../klinik/roller'
import type { EnBicim } from '../varyant'
import { bicimYazimSorunlari, tumMetinler } from './yazimDenetimi'

export type EnPaketSinamasi = {
  paket: UlkePaketi
  arayuz: UlkeArayuzu
  klinik: UlkeKlinigi
  bicim: EnBicim
  /** The source of the country's own statement file (countries/<code>/ayarlar.ts), for the marks a person must see. */
  ayarlarKaynagi: string
  /** Words that belong to the OTHER English-speaking countries: none may be shown here. */
  yabanci: RegExp
  /** The kit tools this country keeps as slots, as its record states them. */
  kapaliAraclar: readonly string[]
  /** The country's units, as its record states them. */
  birimler: { agirlik: 'kg' | 'lb'; boy: 'cm' | 'in'; sicaklik: 'C' | 'F' }
  /** The unit each laboratory value is reported in, as its record states it. */
  labBirimleri: Readonly<Record<string, string>>
  /** The country's word for a senior doctor, as its record states it. */
  kidemliHekim: string
  /** The shape of the example phone number: a range the country reserves for fiction, or a shape that is no number at all. */
  ornekTelefon: RegExp
}

const TURKIYE_OZBEKISTAN = /Türkiye|Turkey|Turkish|Uzbek|Tashkent|\bSGK\b|MEDULA|e-Nabız|\bKVKK\b|JSHSHIR|PINFL|[çğıöşüİĞŞÇÖÜʻўқғҳЎҚҒҲ]/
const IDDIA = /\b(HIPAA|GDPR|PIPEDA|FDA|TGA|MHRA|Medsafe|Health Canada|ISO ?\d+|SOC ?2|CE[- ]mark\w*|compliant|compliance|certified|certification|accredited|accreditation|endorsed|clinically proven|cleared|integrat\w*|trusted by|award\w*|guarantee\w*|free trial|discount\w*)\b/i
const KIMLIK = /social security|\bSSN\b/i
const PARA = /\d[\d,.]*\s*(USD|GBP|CAD|AUD|NZD|dollars?|pounds?)\b|[$£€]\s*\d/

/** Every text a pack shows or hands the model, with its place. */
export function paketMetinleri(s: Pick<EnPaketSinamasi, 'paket' | 'arayuz' | 'klinik' | 'bicim'>): { yer: string; metin: string }[] {
  const { paket, arayuz, klinik, bicim } = s
  const talimatlar = Object.fromEntries(klinik.sablonlar.map((sablon) => [sablon, klinik.notTalimati(bicim, sablon) ?? '']))
  return tumMetinler({
    paket: { kabuk: paket.kabuk, metinler: paket.metinler, dilAdlari: paket.dilAdlari },
    arayuz: { ...arayuz, asistan: undefined, acilis: arayuz.acilis ? { ...arayuz.acilis, capalar: undefined, fontHref: undefined } : null },
    klinik: { talimatlar, ozet: klinik.hastaOzetiTalimati?.(bicim) ?? '', form: klinik.hastaFormu },
  }).filter((x) => !/(^|\.)(anahtar|tur|kime|cinsiyet|olcu|capa|id|rol|no|saat|taraf|bolum|surum|kimden|genelSablon)$/.test(x.yer) && !/\.(rolAlanlari|cocukRolleri|roller)\b/.test(x.yer) && !/\.yuvalar\[/.test(x.yer))
}

/** A canonical value as a person of the country would type it: in the pack's unit, to two decimals. */
function yazilan(a: AracAlani, kanonik: number, o: BirimOrtami): { metin: string; kanonik: number } {
  const carpan = a.olcu === 'boy' ? (o.birimler.boy === 'in' ? INC_CM : 1) : a.olcu === 'agirlik' ? (o.birimler.agirlik === 'lb' ? LB_KG : 1) : a.lab ? LAB_BIRIMLERI[a.lab].birimler[o.lab[a.lab] ?? ''] : 1
  assert.ok(typeof carpan === 'number' && carpan > 0, `${a.anahtar}: the pack's unit is one the kit converts`)
  const alt = (a.enAz ?? -Infinity) / carpan, ust = (a.enCok ?? Infinity) / carpan
  // typed to two decimals, and kept inside the range the screen states for the field in this unit
  let n = Math.round((kanonik / carpan) * 100) / 100
  if (n < Math.ceil(alt * 100) / 100) n = Math.ceil(alt * 100) / 100
  if (n > Math.floor(ust * 100) / 100) n = Math.floor(ust * 100) / 100
  return { metin: String(n), kanonik: n * carpan }
}

export function ingilizcePaketSinamasi(s: EnPaketSinamasi): void {
  const { paket, arayuz, klinik, bicim } = s
  const kod = paket.kod
  const metinler = paketMetinleri(s)
  const a = arayuz.araclar!
  const o: BirimOrtami = { birimler: paket.uygulama!.birimler, lab: a.labBirimleri, sayi: paket.bicim }

  describe(`${kod}: an English-speaking pack — the pack check`, () => {
    it('the pack is complete: the kit\'s pack check finds nothing', () => {
      assert.deepEqual(paketiDenetle(paket, arayuz, klinik), [])
    })
    it('one language form, the pack\'s own; one catalogue of each kind, keyed by it', () => {
      assert.deepEqual([...paket.diller], [bicim])
      assert.deepEqual([...paket.uygulama!.diller], [bicim])
      for (const k of [arayuz.metinler, arayuz.randevuMetinleri, arayuz.portalMetinleri, arayuz.formMetinleri, a.metinler, arayuz.acilis!.icerik]) assert.deepEqual(Object.keys(k ?? {}), [bicim])
      assert.equal(paket.bicim.yerel, bicim)
    })
  })

  describe(`${kod}: spelling — every text is written in ${bicim}`, () => {
    it('there is a body of text', () => assert.ok(metinler.length > 1500, `${metinler.length} texts`))
    it('no text shows the spelling of another form of English', () => {
      // field keys in an instruction are the contract with the code ("prior_anesthesia"), not text
      const temiz = (m: string) => m.replace(/^- [a-z_]+ — /gm, '- ').replace(/"[a-z_]+": /g, '')
      assert.deepEqual(metinler.flatMap((x) => bicimYazimSorunlari(temiz(x.metin), bicim).map((sorun) => `${x.yer}: ${sorun}`)), [])
    })
  })

  describe(`${kod}: walls — nothing of another country`, () => {
    it('nothing of another English-speaking country is shown', () => {
      assert.deepEqual(metinler.filter((x) => s.yabanci.test(x.metin)).map((x) => `${x.yer}: ${s.yabanci.exec(x.metin)?.[0]}`), [])
    })
    it('nothing of Türkiye or of Uzbekistan is shown, and no letter of their alphabets', () => {
      assert.deepEqual(metinler.filter((x) => TURKIYE_OZBEKISTAN.test(x.metin)).map((x) => `${x.yer}: ${TURKIYE_OZBEKISTAN.exec(x.metin)?.[0]}`), [])
    })
    it('THE SLOTS TOO: never shown on a screen, but part of the pack — nothing of another country, no claim, no price, no identity number', () => {
      // a slot's sentences are written for documents and reviewers and stay in the set's base spelling, so the
      // spelling check does not read them; every other rule of the pack holds for them as for a screen
      const yuvaMetinleri = a.yuvalar.flatMap((y) => [{ yer: `slot ${y.anahtar}: what is missing`, metin: y.eksik }, { yer: `slot ${y.anahtar}: who supplies it`, metin: y.kimden }])
      assert.ok(yuvaMetinleri.length >= 2 * s.kapaliAraclar.length && yuvaMetinleri.length > 0)
      for (const desen of [s.yabanci, TURKIYE_OZBEKISTAN, IDDIA, KIMLIK, PARA]) {
        assert.deepEqual(yuvaMetinleri.filter((x) => desen.test(x.metin)).map((x) => `${x.yer}: ${desen.exec(x.metin)?.[0]}`), [])
      }
    })
    it('the role keys are the shared English set, in its order', () => {
      assert.deepEqual([...(paket.uygulama!.roller ?? [])], [...EN_ROLLER])
      assert.deepEqual(arayuz.roller.map((r) => r.anahtar), [...EN_ROLLER])
      for (const r of arayuz.roller) assert.ok(r.ad[bicim]?.trim(), r.anahtar)
    })
  })

  describe(`${kod}: no claim, no price, hidden, by invitation`, () => {
    it('no compliance, approval, certification, endorsement or integration claim; no law or regulator named; no trial or discount', () => {
      assert.deepEqual(metinler.filter((x) => IDDIA.test(x.metin)).map((x) => `${x.yer}: ${IDDIA.exec(x.metin)?.[0]}`), [])
    })
    it('no price: every plan is by quote, and no amount of money is written into any text', () => {
      const f = arayuz.acilis!.fiyatlar
      assert.ok(Object.keys(f).length >= 1)
      for (const [plan, v] of Object.entries(f)) { assert.equal(v.aylik, null, plan); assert.equal(v.oneCikan, false, plan) }
      assert.deepEqual(metinler.filter((x) => PARA.test(x.metin)).map((x) => x.yer), [])
      const n = arayuz.acilis!.icerik[bicim]!.narx
      assert.deepEqual(n.gruplar.flatMap((g) => g.rejalar.map((r) => r.id)).sort(), Object.keys(f).sort())
    })
    it('no assistant is named: every role shows the neutral line', () => {
      for (const r of EN_ROLLER) assert.equal(arayuz.asistan(r, bicim), null, r)
    })
    it('hidden from search; sign-up by invitation code only', () => {
      assert.equal(paket.aramaMotorlarinaGizli, true)
      assert.equal(paket.uygulama!.kayitAcik, false)
    })
    it('only what the country kit has built is switched on', () => {
      assert.deepEqual(Object.keys(paket.ozellikler).sort(), ['acilisSayfasi', 'araclar', 'bekletmeSayfasi', 'cekirdekGiris', 'cekirdekMuayene', 'davetliKayit', 'hastaFormu', 'hastaPortali', 'randevu'])
      assert.deepEqual([...paket.araclar], [])
    })
  })

  describe(`${kod}: the patient identifier`, () => {
    it('optional free text, never validated; nothing asks for a Social Security number', () => {
      assert.equal(paket.uygulama!.kimlikNumarasi.dogrula, false)
      assert.deepEqual(metinler.filter((x) => KIMLIK.test(x.metin)).map((x) => x.yer), [])
      if (paket.ulusalKimlik) {
        assert.equal(paket.ulusalKimlik.hane, 0, 'no length is assumed')
        assert.equal(arayuz.metinler[bicim]!.yeniHasta.ulusalKimlik, paket.ulusalKimlik.ad)
        assert.doesNotMatch(paket.ulusalKimlik.ad, KIMLIK)
      }
      // the intake form asks for no identity, policy or insurance number
      const sorular = [...klinik.hastaFormu!.cekirdek.bolumler.flatMap((b) => b.sorular), ...Object.values(klinik.hastaFormu!.roller).flatMap((r) => r.sorular)]
      for (const q of sorular) assert.doesNotMatch(q.metin[bicim], /\b(insurance|policy|identity|passport)\b|\bnumber of your\b/i, q.anahtar)
    })
  })

  describe(`${kod}: UNITS — a clinical-safety matter`, () => {
    it('the pack measures in the units its record states', () => {
      assert.deepEqual(paket.uygulama!.birimler, s.birimler)
      assert.deepEqual({ ...a.labBirimleri }, s.labBirimleri)
      for (const [olcu, birim] of Object.entries(a.labBirimleri)) assert.ok(birim! in LAB_BIRIMLERI[olcu as keyof typeof LAB_BIRIMLERI].birimler, `${olcu}: ${birim}`)
    })

    const acik = a.araclar.map((p) => ({ p, t: kitAraci(p.anahtar)! })).filter((x) => x.t.tur !== 'ekran')

    it('NEVER A FIELD WITHOUT ITS UNIT: every measured field of every switched-on tool shows a unit the pack names', () => {
      for (const { t } of acik) for (const alan of t.alanlar) {
        if (!(alan.olcu || alan.lab || alan.birim)) continue
        const birim = alanBirimi(alan, o)
        assert.ok(birim, `${t.anahtar}.${alan.anahtar}: a measured field without a unit`)
        assert.ok(a.birimler[birim]?.[bicim]?.trim(), `${t.anahtar}.${alan.anahtar}: the unit "${birim}" has no name`)
        if (alan.olcu === 'boy') assert.equal(birim, s.birimler.boy, `${t.anahtar}.${alan.anahtar}`)
        if (alan.olcu === 'agirlik') assert.equal(birim, s.birimler.agirlik, `${t.anahtar}.${alan.anahtar}`)
        if (alan.lab) assert.equal(birim, s.labBirimleri[alan.lab], `${t.anahtar}.${alan.anahtar}`)
      }
      for (const { t } of acik) for (const k of t.sonucBirimleri ?? []) assert.ok(a.birimler[k]?.[bicim]?.trim(), `${t.anahtar}: the result unit "${k}" has no name`)
      for (const { t } of acik) for (const olcu of t.sonucOlculeri ?? []) assert.ok(a.birimler[s.birimler[olcu]]?.[bicim]?.trim(), `${t.anahtar}: the result is written in ${s.birimler[olcu]}, which has no name`)
    })

    it('no label of a measured field writes another unit into its words', () => {
      const BASKA: Readonly<Record<string, RegExp>> = { cm: /\b(inch(es)?|feet|ft)\b/i, in: /\b(cm|centimet(re|er)s?)\b/i, kg: /\b(lb|lbs|pounds?|stone)\b/i, lb: /\b(kg|kilograms?)\b/i }
      for (const { p, t } of acik) for (const alan of t.alanlar) {
        if (!alan.olcu) continue
        const etiket = p.metin.alanlar[alan.anahtar]?.[bicim] ?? ''
        assert.doesNotMatch(etiket, BASKA[s.birimler[alan.olcu]], `${t.anahtar}.${alan.anahtar}: "${etiket}"`)
      }
    })

    for (const { t } of acik) {
      it(`${t.anahtar}: typed in this country's units, the tool gives the kit's reference result`, () => {
        let sayilan = 0
        for (const ornek of ornekGirdiler(t)) {
          // what a person of this country types, and — worked out here, with the exact defined factors — the
          // canonical input the kit's arithmetic must end up with
          const ham: Record<string, string | boolean> = {}
          const beklenenGirdi: Record<string, number | string | boolean | null> = { ...ornek }
          for (const alan of t.alanlar) {
            const v = ornek[alan.anahtar]
            if (alan.tur === 'isaret') { if (v === true) ham[alan.anahtar] = true; continue }
            if (v === null || v === undefined) continue
            if (typeof v === 'number' && (alan.olcu || alan.lab)) { const y = yazilan(alan, v, o); ham[alan.anahtar] = y.metin; beklenenGirdi[alan.anahtar] = y.kanonik }
            else ham[alan.anahtar] = String(v)
          }
          const ortam = ornekOrtam(t)
          const referans = t.hesapla(beklenenGirdi as AracGirdisi, ortam)
          const sonuc = t.hesapla(girdiyiCoz(t.alanlar, ham as HamGirdi, o), ortam)
          assert.equal(sonuc.tamam, referans.tamam, `${t.anahtar}: ${JSON.stringify(ham)}`)
          assert.equal(sonuc.bant, referans.bant, `${t.anahtar}: ${JSON.stringify(ham)}`)
          assert.deepEqual(sonuc.uyarilar, referans.uyarilar, `${t.anahtar}: ${JSON.stringify(ham)}`)
          assert.deepEqual(sonuc.tarihler, referans.tarihler)
          assert.equal(sonuc.sayilar.length, referans.sayilar.length)
          sonuc.sayilar.forEach((x, i) => {
            const r = referans.sayilar[i]
            assert.equal(x.anahtar, r.anahtar)
            assert.ok(Math.abs(x.deger - r.deger) <= 1e-9 * Math.max(1, Math.abs(r.deger)), `${t.anahtar}.${x.anahtar}: ${x.deger} is not the reference ${r.deger} for ${JSON.stringify(ham)}`)
          })
          if (referans.tamam) sayilan++
        }
        assert.ok(sayilan > 0, `${t.anahtar}: no sample gave a result, so nothing was compared`)
      })
    }

    it('the conversion factors are the exact defined ones', () => {
      assert.equal(INC_CM, 2.54)
      assert.equal(LB_KG, 0.45359237)
      assert.equal(LAB_BIRIMLERI.hemoglobin.birimler['g/L'], 0.1)
      assert.equal(LAB_BIRIMLERI.albuminKreatinin.birimler['mg/mmol'], 1 / 0.113)
    })
  })

  describe(`${kod}: the tools this country has, and the ones it keeps as slots`, () => {
    const anahtarlar = a.araclar.map((p) => p.anahtar)
    it('the tools the record says are kept as slots are slots; every other tool of the set is switched on', () => {
      const yuvalar = a.yuvalar.map((y) => y.anahtar)
      for (const k of s.kapaliAraclar) { assert.ok(!anahtarlar.includes(k), `${k} is switched on`); assert.ok(yuvalar.includes(k), `${k} is not a slot`); assert.equal(a.yuvalar.find((y) => y.anahtar === k)?.mekanizmaHazir, true) }
      assert.deepEqual(EN_ROL_ARACLARI.map((x) => x.anahtar).filter((k) => !anahtarlar.includes(k)).sort(), [...s.kapaliAraclar].sort())
      assert.equal(anahtarlar.length, EN_ROL_ARACLARI.length - s.kapaliAraclar.length + 2, 'the role tools, the patient page and the follow-up list')
    })
    it('every slot is empty and off, and says what is missing and who supplies it; none is also switched on', () => {
      for (const y of a.yuvalar) { assert.equal(y.acik, false); assert.equal(y.icerik, null); assert.ok(y.eksik.trim() && y.kimden.trim(), y.anahtar); assert.ok(!anahtarlar.includes(y.anahtar), y.anahtar) }
      assert.equal(new Set(a.yuvalar.map((y) => y.anahtar)).size, a.yuvalar.length)
    })
    it('no tool with numbers a country must decide is switched on', () => {
      for (const p of a.araclar) assert.equal((kitAraci(p.anahtar) as AracTanimi).parametreler?.length ?? 0, 0, p.anahtar)
    })
    it('the follow-up list is given to exactly the roles that have a tool of their own', () => {
      const rolluler = EN_ROLLER.filter((r) => a.araclar.some((p) => p.anahtar !== 'takip-paneli' && p.roller?.includes(r)))
      assert.deepEqual([...(a.araclar.find((p) => p.anahtar === 'takip-paneli')?.roller ?? [])], rolluler)
    })
    it('AN ALLIED PROFESSION IS NEVER ADDRESSED AS A SENIOR DOCTOR: its instruction opens with the profession and "not a doctor"', () => {
      const muttefikler = arayuz.roller.filter((r) => r.taraf === 'klinik-muttefik')
      assert.equal(muttefikler.length, 5)
      for (const r of arayuz.roller) {
        const talimat = klinik.notTalimati(bicim, r.anahtar) ?? ''
        const ilkCumle = talimat.split('\n')[0]
        if (r.taraf === 'klinik-muttefik') {
          assert.ok(ilkCumle.startsWith(`Your colleague is a health professional and not a doctor: their profession is "${r.ad[bicim]}".`), `${r.anahtar}: ${ilkCumle}`)
          assert.ok(!talimat.includes(s.kidemliHekim) && !/You are an experienced/.test(talimat), `${r.anahtar}: the senior-doctor line is in an allied profession's instruction`)
          assert.match(talimat, /Make no medical diagnosis/, r.anahtar)
        } else assert.ok(ilkCumle.startsWith(`You are an experienced ${s.kidemliHekim}.`), `${r.anahtar}: ${ilkCumle}`)
      }
      assert.ok((klinik.notTalimati(bicim, arayuz.notSablonlari.genelSablon) ?? '').startsWith(`You are an experienced ${s.kidemliHekim}.`))
    })
    it('who wrote the tool texts: a machine; which clinician read them: nobody yet', () => {
      assert.deepEqual(a.inceleme, { makineYazimi: true, klinisyen: null })
    })
  })

  describe(`${kod}: status — machine-written, unread`, () => {
    it('no consent wording is marked as read by a lawyer, and the country\'s file carries the mark where the sentence is written', () => {
      assert.equal(klinik.riza.hukukcuInceledi, false)
      assert.equal(klinik.hastaFormu!.riza.hukukcuInceledi, false)
      assert.match(s.ayarlarKaynagi, /NOT READ BY A LAWYER[^\n]*\n(\s*\/\/[^\n]*\n)*\s*kayitRizasi:/)
      assert.match(s.ayarlarKaynagi, /MACHINE-WRITTEN AND UNVERIFIED/)
      assert.match(s.ayarlarKaynagi, /PRICES: EMPTY, SWITCHED OFF\. WAITING ON KAAN/)
    })
    it('every question set says: written by a machine, read by no clinician', () => {
      const f = klinik.hastaFormu!
      assert.deepEqual(f.cekirdek.inceleme, { makineYazimi: true, klinisyen: null })
      for (const [rol, r] of Object.entries(f.roller)) assert.deepEqual(r.inceleme, { makineYazimi: true, klinisyen: null }, rol)
      assert.match(f.surum, new RegExp(`^${kod}-draft-`))
      assert.match(klinik.riza.surum, new RegExp(`^${kod}-draft-`))
    })
    it('the country\'s record under docs/ is what the pack says today (scripts/ulke-en-kayit.mts)', () => {
      const r = spawnSync('npx', ['--yes', 'tsx', 'scripts/ulke-en-kayit.mts', '--ulke', kod, '--denetle'], { encoding: 'utf8' })
      assert.equal(r.status, 0, r.stderr || r.stdout)
    })
    it('THE EXAMPLE PHONE NUMBER CANNOT BE A PERSON\'S: a number of a range reserved for fiction, or a shape that is no number', () => {
      assert.match(paket.telefon.ornek, s.ornekTelefon)
      assert.equal(arayuz.acilis!.icerik[bicim]!.sorov.form.telefonOrnek, paket.telefon.ornek, 'one example, on the landing page and in the application')
      assert.match(s.ayarlarKaynagi, /EXAMPLE PHONE NUMBER[^\n]*UNVERIFIED/)
      assert.doesNotMatch(s.ayarlarKaynagi, /may be somebody's number/)
    })
    it('the patient\'s page names an ambulance number only as the pack\'s setting, never in a sentence', () => {
      const sayfa = arayuz.portalMetinleri![bicim]!.sayfa
      assert.doesNotMatch(sayfa.acil + sayfa.acilNumara, /\d/)
      assert.match(sayfa.acilNumara, /%/)
    })
  })
}

/** For a country's test file: its own statement file as text. */
export const kaynakOku = (yol: string): string => readFileSync(yol, 'utf8')
