/**
 * Dual-column clinic cards. Conflict = two columns, never merged.
 * Cite role only — no textbook dumps. No invented biologic IU doses.
 */
import type { EvalResult } from './eval'
import { evaluatePsoriasis } from './psoriasis-psokid-2025'
import { evaluateBiologic } from './biologics-sut'
import { evaluatePhototherapy } from './phototherapy'
import { evaluateNevus } from './oncology-nevus'
import { evaluateAesthetics } from './aesthetics-legal'
import { evaluateBehcet } from './behcet'
import { evaluateBullous } from './bullous-pemphigus'
import { evaluateBzbh, type BzbhKind } from './endemic-bzbh'
import { acitretinPregnancyBanYears } from '../engines/gop-isotretinoin'
import { euromelanomaMonth, KETEM_IS_NOT_SKIN_CANCER } from '../engines/screening-reminders'
import { TDD_SUT_CODES } from './procedures-sut'
import type { BehcetCard, BullousWorkup } from '../schema'

export type DermKararKart = {
  id: string
  baslik: string
  triage: EvalResult['triage']
  solBaslik: string
  sol: string[]
  sagBaslik: string
  sag: string[]
  conflict: boolean
  goldIpucu: string
}

export type KartGirdi = {
  unit: string
  pasi?: number | null
  dlqi?: number | null
  psa?: boolean
  tbScreen?: boolean
  hbvScreen?: boolean
  photoDevice?: string | null
  uglyDuckling?: boolean
  digitalMap?: boolean
  fitzpatrick?: string
  behcet?: BehcetCard | null
  bullous?: BullousWorkup | null
  bzbhKind?: string | null
  acitretinBan?: boolean
  visitType?: string
  month?: number
}

function kart(
  id: string,
  baslik: string,
  ev: EvalResult,
  solBaslik: string,
  sol: string[],
  sagBaslik: string,
  sag: string[],
  conflict: boolean,
  goldIpucu: string,
): DermKararKart {
  return { id, baslik, triage: ev.triage, solBaslik, sol, sagBaslik, sag, conflict, goldIpucu }
}

export function kararKartlariFromClinic(g: KartGirdi): DermKararKart[] {
  const out: DermKararKart[] = []
  const month = g.month ?? (new Date().getUTCMonth() + 1)

  if (g.unit === 'psoriasis' || (g.pasi != null && g.pasi >= 10) || (g.dlqi != null && g.dlqi >= 10) || g.psa) {
    const ev = evaluatePsoriasis({ pasi: g.pasi ?? 0, dlqi: g.dlqi ?? 0, psa: g.psa })
    const bio = evaluateBiologic({ tb_screen: !!g.tbScreen, hbv_screen: !!g.hbvScreen })
    out.push(kart(
      'psoriyazis-basamak',
      'Psoriazis basamak',
      ev,
      'PSOKİD 2025',
      ev.next,
      'SUT 2026',
      [
        ...bio.next,
        g.tbScreen && g.hbvScreen ? 'TB / HBV tarama işaretli' : 'Biyolojik öncesi TB + HBV taraması',
        'Doz uydurulmaz — yalnızca basamak / rapor kontrolü',
      ],
      true,
      'Bolognia 5 — gold (rol; metin kopyalanmaz)',
    ))
  }

  if (g.acitretinBan) {
    out.push(kart(
      'asitretin-yasak',
      'Asitretin gebelik yasağı',
      { triage: 'urgent', next: [`${acitretinPregnancyBanYears()} yıl gebelik yasağı`], citations: ['gop-kub'], photoPlan: [] },
      'GÖP KÜB',
      [`Asitretin sonrası ${acitretinPregnancyBanYears()} yıl gebelik yasağı — izotretinoinden uzun`],
      'Kadın sağlığı köprüsü',
      ['Gebelik kartına elden teslim CTA', 'Reçete kararı uzmana aittir'],
      false,
      'Bolognia 5 — retinoid güvenliği (rol)',
    ))
  }

  if (g.unit === 'fototerapi' || g.photoDevice) {
    const ev = evaluatePhototherapy(g.photoDevice || 'nb-uvb-311')
    out.push(kart(
      'fototerapi-sut',
      'Fototerapi',
      ev,
      'SUT 2026',
      ['Endikasyon raporu', 'MED testi', 'J/cm² defteri', 'Yıllık TBSE'],
      'Solaryum yasağı 2018',
      ['Solaryum cihaz olarak gösterilmez', 'NB-UVB / PUVA / eksimer / UVA1'],
      true,
      'Andrews / Temel — klinik atlas rolü',
    ))
  }

  if (g.unit === 'nevus-tumor' || g.uglyDuckling || g.visitType === 'onkoloji-nevus') {
    const ev = evaluateNevus({ ugly_duckling: !!g.uglyDuckling, digital_map: !!g.digitalMap })
    out.push(kart(
      'tbse-euromelanoma',
      'TBSE / nevüs',
      ev,
      'Euromelanoma',
      [
        ...ev.next,
        month === euromelanomaMonth() ? 'Mayıs Euromelanoma ayı — tarama vurgusu' : 'Euromelanoma Mayıs ayı ipucu',
      ],
      'KETEM (değil)',
      KETEM_IS_NOT_SKIN_CANCER
        ? ['KETEM deri kanseri tarama programı değildir', 'Yalnız ipucu: meme / serviks / kolon']
        : [],
      true,
      'Bolognia 5 — onkoloji gold (rol)',
    ))
  }

  if (g.unit === 'kozmetik') {
    const ev = evaluateAesthetics({
      modality: 'physician_laser',
      fitzpatrick: g.fitzpatrick || '—',
    })
    out.push(kart(
      'ayakta-teshis-lazer',
      'Kozmetik / Ayakta Teşhis',
      ev,
      'Hekim lazer',
      ['Tıbbi lazer / dolgu / botoks / derin peeling hekime aittir', 'Lot no', 'Test spot', `Fitzpatrick ${g.fitzpatrick || '—'}`],
      'Salon IPL',
      ['Salon IPL 600–1200 nm, diyot ≤ 20 J/cm²', 'Komplikasyon kabulü ayrı'],
      true,
      'Ayakta Teşhis — devlet (rol)',
    ))
  }

  if (g.unit === 'behcet-bagdokusu' && g.behcet) {
    const ev = evaluateBehcet(g.behcet)
    out.push(kart(
      'behcet-isg',
      'Behçet kartı',
      ev,
      'Alpsoy Behçet',
      ev.next,
      'Romatoloji köprüsü',
      ['Göz tutulumu ivedi sevk', 'Genital foto — ek onam'],
      false,
      'Bolognia 5 — vaskülit/Behçet (rol)',
    ))
  }

  if (g.unit === 'bullu' && g.bullous) {
    const ev = evaluateBullous(g.bullous)
    out.push(kart(
      'bullu-dif',
      'Büllü hastalık — DIF',
      ev,
      'Temel Dermatoloji',
      ev.next,
      'Bolognia 5',
      [g.bullous.dif ? 'DIF yapılmış' : 'Biyopsi + DIF zorunlu — tanı DIF olmadan kilitlenmez'],
      true,
      'Bolognia 5 — büllü hastalık gold (rol)',
    ))
  }

  if (g.bzbhKind) {
    const kind = g.bzbhKind as BzbhKind
    const ev = evaluateBzbh(kind)
    out.push(kart(
      'bzbh-014',
      'BZBH Form 014',
      ev,
      'TDD CYBE',
      ev.next,
      'Form 014 / TSİM',
      ['Bildirim CTA — Form 014', 'Şark çıbanı: 3 ayda bir, 1 yıl'],
      false,
      'Ulusal TR / devlet bildirim (rol)',
    ))
  }

  if (g.visitType === 'islem') {
    out.push(kart(
      'sut-islem',
      'SUT işlem kodları',
      { triage: 'routine', next: TDD_SUT_CODES.map((c) => `${c.code} ${c.label}`), citations: ['sut-2026'], photoPlan: ['islem_oncesi', 'islem_sonrasi'] },
      'SUT 2026',
      ['700.100 dermoskopi', '530.070 deri biyopsi', 'İşlem öncesi / sonrası foto'],
      'TDD işlem',
      ['Katalog stub — ücret uydurulmaz'],
      false,
      'SUT 2026 — devlet (rol)',
    ))
  }

  return out
}
