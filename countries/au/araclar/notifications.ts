/**
 * Mandatory notifications under the Health Practitioner Regulation National Law, as set out in the Queensland Act.
 *
 * READ 2026-10-15 — Health Practitioner Regulation National Law Act 2009 (Qld), Schedule, current as at 10 April 2026,
 *   https://www.legislation.qld.gov.au/view/whole/pdf/inforce/current/act-2009-045
 *   sections 140, 141, 141A, 141B, 141C and 142.
 * LICENCE, the register's own page, read 2026-10-15 — https://www.legislation.qld.gov.au/copyright :
 *   Creative Commons Attribution 4.0 International, including commercial reuse. The words below are a shortened
 *   checklist, so the attribution is the "changed" form that page requires.
 * NOT COPIED: the regulator's guidance page. The four grounds are not one duty for every situation. Section 141
 *   applies to a practitioner who is not providing a health service to the person concerned. Sections 141A and 141B
 *   apply to a treating practitioner, and the impairment, intoxication and standards tests there require a
 *   substantial risk of harm. Section 142 applies to an employer.
 * WHO SEES IT. Medical practitioners, and the allied professions named on the public professions list opened
 *   2026-10-15 (https://www.ahpra.gov.au/Registration/Registers-of-Practitioners/Professions-and-Divisions.aspx,
 *   page reviewed 11/04/2025): physiotherapy, occupational therapy, psychology, podiatry.
 *   NOT dietetics, NOT audiology, NOT speech pathology: they are not on that list. NOT an account with no role.
 * The National Law as it applies outside Queensland was not read. Nothing is sent.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { isaret, secim } from '@/lib/ulke/araclar/yardimci'
import { kosulluListe } from './kosulluListe'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const yol = (deger: string) => ({ kosul: { alan: 'yol', degerler: [deger] } })

const KAYNAK = 'https://www.legislation.qld.gov.au/view/whole/pdf/inforce/current/act-2009-045 (read 2026-10-15): Health Practitioner Regulation National Law Act 2009 (Qld), Schedule, current as at 10 April 2026, sections 140 to 142. Creative Commons Attribution 4.0 International, https://www.legislation.qld.gov.au/copyright.'
const BILDIRIM = 'Based on content from the Queensland Legislation website at 15 October 2026. For the latest information on Queensland Government legislation please go to https://www.legislation.qld.gov.au.'

export const AU_ZORUNLU_BILDIRIM = kosulluListe({
  anahtar: 'au-mandatory-notifications',
  alanlar: [
    secim('yol', ['meslek', 'tedavi', 'isveren']),
    { ...isaret('m_alkol'), ...yol('meslek') },
    { ...isaret('m_cinsel'), ...yol('meslek') },
    { ...isaret('m_bozukluk'), ...yol('meslek') },
    { ...isaret('m_standart'), ...yol('meslek') },
    { ...isaret('m_ogrenci'), ...yol('meslek') },
    { ...isaret('t_cinsel'), ...yol('tedavi') },
    { ...isaret('t_bozukluk'), ...yol('tedavi') },
    { ...isaret('t_alkol'), ...yol('tedavi') },
    { ...isaret('t_standart'), ...yol('tedavi') },
    { ...isaret('t_ogrenci'), ...yol('tedavi') },
    { ...isaret('i_alkol'), ...yol('isveren') },
    { ...isaret('i_cinsel'), ...yol('isveren') },
    { ...isaret('i_bozukluk'), ...yol('isveren') },
    { ...isaret('i_standart'), ...yol('isveren') },
  ],
  uyarilar: ['gonderilmedi', 'istisna'],
  uyari: () => ['gonderilmedi', 'istisna'],
  kaynak: KAYNAK,
})

/** Registered professions only. Not a notification, and not the National Law of any State or Territory but Queensland. */
export function auZorunluBildirim(roller: readonly string[]): PaketAraci {
  return {
    anahtar: 'au-mandatory-notifications',
    roller: [...roller],
    metin: {
      ad: m('Mandatory notification grounds'),
      aciklama: m('Choose where the belief was formed, then tick the ground you are looking at. A practitioner who is providing a health service to the other person is under sections 141A and 141B. Those tests are not section 140. An employer is under section 142.'),
      alanlar: {
        yol: m('Where the belief was formed'),
        m_alkol: m('Another registered practitioner: practising the profession while intoxicated by alcohol or drugs'),
        m_cinsel: m('Another registered practitioner: sexual misconduct in connection with the practice of the profession'),
        m_bozukluk: m('Another registered practitioner: the public at risk of substantial harm in practice because of an impairment'),
        m_standart: m('Another registered practitioner: the public at risk of harm because the practice is a significant departure from accepted professional standards'),
        m_ogrenci: m('A student: an impairment that, during clinical training, may place the public at substantial risk of harm'),
        t_cinsel: m('While treating: the practitioner has engaged, is engaging, or is at risk of engaging, in sexual misconduct in connection with practice'),
        t_bozukluk: m('While treating: placing the public at substantial risk of harm by practising with an impairment'),
        t_alkol: m('While treating: placing the public at substantial risk of harm by practising while intoxicated by alcohol or drugs'),
        t_standart: m('While treating: placing the public at substantial risk of harm by a significant departure from accepted professional standards'),
        t_ogrenci: m('While treating a student: an impairment that, during clinical training, may place the public at substantial risk of harm'),
        i_alkol: m('Employer: practising the profession while intoxicated by alcohol or drugs'),
        i_cinsel: m('Employer: sexual misconduct in connection with the practice of the profession'),
        i_bozukluk: m('Employer: the public at risk of substantial harm in practice because of an impairment'),
        i_standart: m('Employer: the public at risk of harm because the practice is a significant departure from accepted professional standards'),
      },
      secenekler: {
        yol: {
          meslek: m('In the course of practising, and not while providing a health service to that person'),
          tedavi: m('While providing a health service to another registered practitioner or to a student'),
          isveren: m('As the employer of a registered health practitioner'),
        },
      },
      sayilar: { isaretli: m('Grounds ticked') },
      uyarilar: {
        gonderilmedi: m('Nothing was sent. A notification to the National Agency is your own.'),
        istisna: m('Sections 141(4) and 141C set out when a belief is taken not to arise in the course of practice or of providing a health service, including where the National Agency has already been notified. This screen does not decide that an exception applies.'),
      },
      not: m('The Health Practitioner Regulation National Law set out in the Queensland Act, current as at 10 April 2026. The National Law as it applies in another State or Territory was not read for this screen. Section 142\'s employer is an entity that employs the practitioner under a contract of employment or a contract for services. A tick does not decide that a notification is required.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'State of Queensland',
      kaynak: KAYNAK,
      bildirim: m(BILDIRIM),
    },
  }
}
