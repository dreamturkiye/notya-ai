/**
 * ULKE-BRANS-DERINLIK-11 (Kaan, 2026-11-08) — Australia: TWO MEDICARE PLAN RECORDS for general practice, built only from the
 * official texts opened on 2026-11-08. Each records what the plan or referral must contain; it fills nothing in, claims
 * nothing, sends nothing, and is printed on the practitioner's letterhead with the document number (BELGE-NO-01).
 *
 *   au-gpccmp   GP chronic condition management plan (GPCCMP). From 1 July 2025 one GPCCMP replaces the GP management plan
 *               (item 721), team care arrangements (723) and their review (732), which ceased on that day. Items: prepare
 *               965 (GP) / 392 (prescribed medical practitioner), review 967 / 393; by video 92029 / 92060 and 92030 / 92061.
 *               Content: the chronic condition(s) and needs; goals set by shared decision-making; the patient's actions;
 *               treatment and services likely needed; referrals and why where multidisciplinary care helps; review
 *               arrangements with a timeframe. Consent and agreement recorded; a copy offered. Source: Department of Health,
 *               Disability and Ageing, MBS Online, "Upcoming Changes to Chronic Disease Management Framework – GPCCMPs".
 *               (The brief named GPMP/TCA: those items no longer exist, so the record follows the GPCCMP.)
 *   au-mhtp     GP mental health treatment plan and the Better Access referral. From 1 November 2025 the preparation items
 *               2700, 2701, 2715, 2717 (video 92112, 92113, 92116, 92117) remain; the review item 2712 ceased (reviews use
 *               time-tiered general attendance items). A referral states the symptoms or diagnosis, the current medicines, the
 *               number of services referred and whether a plan was prepared; the initial course is up to six individual
 *               services. Source: RACGP, "Changes to Medicare Benefits Schedule (MBS) mental health items from 1 November
 *               2025 – General practitioners".
 *
 * CLASSIFIED: specialty-only — general practice (`family-medicine`). Switched on without an Australian GP's sign-off
 * (owner's order 2026-11-08), listed in ../onaysizAciklar.ts. Medicare eligibility is the practitioner's judgement.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, isaret, metin, puan, secim, tarih } from '@/lib/ulke/araclar/yardimci'

const D = 'en-AU'
const m = (x: string) => ({ [D]: x })
const dolu = (v: unknown) => typeof v === 'string' && v.trim().length > 0

const GPCCMP_KAYNAK = 'Department of Health, Disability and Ageing, MBS Online: Upcoming Changes to Chronic Disease Management Framework – GPCCMPs (items 965, 967, 392, 393, 92029, 92030, 92060, 92061 from 1 July 2025; items 721, 723 and 732 ceased), read 2026-11-08.'
const MHTP_KAYNAK = 'RACGP: Changes to Medicare Benefits Schedule (MBS) mental health items from 1 November 2025 – General practitioners (MHTP items 2700, 2701, 2715, 2717 and video 92112, 92113, 92116, 92117 remain; review item 2712 ceased; Better Access referral content; initial course up to six individual services), read 2026-11-08.'

const GPCCMP_ICERIK = ['kosul', 'ihtiyac', 'hedef', 'eylem', 'tedavi', 'gozden_gecirme'] as const
export const AU_GPCCMP: AracTanimi = {
  anahtar: 'au-gpccmp',
  tur: 'liste',
  alanlar: [
    secim('kalem', ['p965', 'p392', 'r967', 'r393', 'p92029', 'p92060', 'r92030', 'r92061']),
    metin('kosul', { uzun: true }), metin('ihtiyac', { uzun: true }), metin('hedef', { uzun: true }), metin('eylem', { uzun: true }),
    metin('tedavi', { uzun: true }), metin('sevk', { uzun: true }), metin('gozden_gecirme', { enCok: 200 }), tarih('gozden_gecirme_tarihi', true),
    isaret('onay'), isaret('paylasim_onayi'), isaret('kopya'),
  ],
  cikti: { sayilar: ['bolum'], bantlar: [], uyarilar: ['onay_yok', 'icerik_eksik', 'tarih_yok'], tarihler: ['gozden_gecirme_tarihi'] },
  kaynak: GPCCMP_KAYNAK,
  yazdirilir: true,
  hesapla: (g) => {
    if (typeof g.kalem !== 'string') return BOS_SONUC
    const n = GPCCMP_ICERIK.filter((k) => dolu(g[k])).length
    const uyarilar = [...(g.onay === true ? [] : ['onay_yok']), ...(n < GPCCMP_ICERIK.length ? ['icerik_eksik'] : []), ...(typeof g.gozden_gecirme_tarihi === 'string' ? [] : ['tarih_yok'])]
    return { tamam: true, sayilar: [{ anahtar: 'bolum', deger: n, ondalik: 0, enCok: GPCCMP_ICERIK.length }], bant: null, uyarilar, tarihler: typeof g.gozden_gecirme_tarihi === 'string' ? [{ anahtar: 'gozden_gecirme_tarihi', tarih: g.gozden_gecirme_tarihi }] : [] }
  },
}

const MHTP_SEVK = ['belirti', 'ilaclar', 'hizmet', 'plan_beyani'] as const
export const AU_MHTP: AracTanimi = {
  anahtar: 'au-mhtp',
  tur: 'liste',
  alanlar: [
    secim('kalem', ['i2700', 'i2701', 'i2715', 'i2717', 'v92112', 'v92113', 'v92116', 'v92117']),
    metin('degerlendirme', { uzun: true }), metin('hedef', { uzun: true }), metin('tedavi', { uzun: true }), metin('kriz', { uzun: true }),
    isaret('belirti'), isaret('ilaclar'), isaret('plan_beyani'), puan('hizmet', 1, 10, { istege: true }), isaret('hizmet_yazildi'),
    isaret('onay'),
  ],
  cikti: { sayilar: ['sevk'], bantlar: [], uyarilar: ['onay_yok', 'sevk_eksik', 'ilk_kurs'], tarihler: [] },
  kaynak: MHTP_KAYNAK,
  yazdirilir: true,
  hesapla: (g) => {
    if (typeof g.kalem !== 'string') return BOS_SONUC
    const hizmetVar = g.hizmet_yazildi === true && typeof g.hizmet === 'number'
    const n = [g.belirti === true, g.ilaclar === true, hizmetVar, g.plan_beyani === true].filter(Boolean).length
    const uyarilar = [...(g.onay === true ? [] : ['onay_yok']), ...(n < MHTP_SEVK.length ? ['sevk_eksik'] : []), ...(typeof g.hizmet === 'number' && g.hizmet > 6 ? ['ilk_kurs'] : [])]
    return { tamam: true, sayilar: [{ anahtar: 'sevk', deger: n, ondalik: 0, enCok: MHTP_SEVK.length }], bant: null, uyarilar, tarihler: [] }
  },
}

export const AU_MBS_TANIMLAR: readonly AracTanimi[] = [AU_GPCCMP, AU_MHTP]
export const AU_MBS_ANAHTARLARI: readonly string[] = AU_MBS_TANIMLAR.map((t) => t.anahtar)

export const auMbsAraclari = (): readonly PaketAraci[] => [
  {
    anahtar: 'au-gpccmp',
    roller: ['family-medicine'],
    metin: {
      ad: m('GP chronic condition management plan (GPCCMP) record'),
      aciklama: m('Records what a GPCCMP must contain since 1 July 2025 (it replaced the GPMP and TCA): conditions and needs, goals, the patient\'s actions, treatment and services, referrals, and the review arrangements — with consent. Printable for the patient and the record. Nothing is claimed or sent.'),
      alanlar: {
        kalem: m('MBS item'), kosul: m('Chronic condition(s)'), ihtiyac: m('Health care needs related to the condition(s)'), hedef: m('Health and lifestyle goals (shared decision-making)'),
        eylem: m('Actions the patient will take'), tedavi: m('Treatment and services likely to be needed'), sevk: m('Referrals to the care team, and why (optional)'),
        gozden_gecirme: m('Review arrangements'), gozden_gecirme_tarihi: m('Planned review date (optional)'),
        onay: m('Patient\'s consent and agreement to the plan recorded'), paylasim_onayi: m('Consent to share relevant parts with the team members referred to'), kopya: m('Copy offered to the patient (and carer, if the patient agrees)'),
      },
      secenekler: { kalem: { p965: m('965 — prepare (GP)'), p392: m('392 — prepare (prescribed medical practitioner)'), r967: m('967 — review (GP)'), r393: m('393 — review (prescribed medical practitioner)'), p92029: m('92029 — prepare by video (GP)'), p92060: m('92060 — prepare by video (prescribed medical practitioner)'), r92030: m('92030 — review by video (GP)'), r92061: m('92061 — review by video (prescribed medical practitioner)') } },
      sayilar: { bolum: m('Required parts written') },
      uyarilar: { onay_yok: m('The patient\'s consent and agreement are not recorded.'), icerik_eksik: m('Not every required part of the plan is written yet.'), tarih_yok: m('No review date is set.') },
      tarihler: { gozden_gecirme_tarihi: m('Planned review') },
      not: m('A record of the plan in your words. Eligibility and the claim are your judgement under the MBS rules in force.'),
    },
    lisans: { durum: 'serbest', hakSahibi: 'Notya', kaynak: GPCCMP_KAYNAK, bildirim: m('Structure from the MBS GPCCMP requirements; the words are the practitioner\'s.') },
  },
  {
    anahtar: 'au-mhtp',
    roller: ['family-medicine'],
    metin: {
      ad: m('GP mental health treatment plan and Better Access referral record'),
      aciklama: m('Records the mental health treatment plan and checks the Better Access referral holds what it must since 1 November 2025: symptoms or diagnosis, current medicines, the number of services, and whether a plan was prepared. Printable. Nothing is claimed or sent.'),
      alanlar: {
        kalem: m('MBS item'), degerlendirme: m('Assessment'), hedef: m('Goals agreed with the patient'), tedavi: m('Treatment and referral options'), kriz: m('Crisis and relapse plan'),
        belirti: m('Referral states the symptoms or diagnosis'), ilaclar: m('Referral lists the current medicines'), plan_beyani: m('Referral states whether an MHTP or psychiatrist plan was prepared'),
        hizmet: m('Number of individual services referred (optional)'), hizmet_yazildi: m('Referral states the number of services'), onay: m('Patient\'s agreement recorded'),
      },
      secenekler: { kalem: { i2700: m('2700'), i2701: m('2701'), i2715: m('2715'), i2717: m('2717'), v92112: m('92112 (video)'), v92113: m('92113 (video)'), v92116: m('92116 (video)'), v92117: m('92117 (video)') } },
      sayilar: { sevk: m('Referral requirements met') },
      uyarilar: { onay_yok: m('The patient\'s agreement is not recorded.'), sevk_eksik: m('The referral does not yet state everything Better Access requires.'), ilk_kurs: m('More than six individual services: the initial course on a referral is up to six.') },
      not: m('A record and a checklist. Eligibility, the item and the claim are your judgement under the MBS rules in force. Review item 2712 ceased on 1 November 2025.'),
    },
    lisans: { durum: 'serbest', hakSahibi: 'Notya', kaynak: MHTP_KAYNAK, bildirim: m('Structure from the published MBS requirements; the words are the practitioner\'s.') },
  },
]
