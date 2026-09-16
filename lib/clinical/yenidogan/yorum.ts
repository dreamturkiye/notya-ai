import type { NtpCanonicalKey, NtpFlag, NtpSatir, NtpYorum } from './types'
import { NTP_DISCLAIMER, NTP_ETIKET, NTP_KEYS } from './constants'

const POZITIF: NtpFlag[] = ['pozitif_suphe']
const SINIR: NtpFlag[] = ['sinir']
const YETERSIZ: NtpFlag[] = ['yetersiz_ornek', 'tekrar']

export function ntpFlagNorm(raw: string | null | undefined): NtpFlag | null {
  const s = String(raw || '').toLocaleLowerCase('tr-TR').trim()
  if (!s) return null
  if (/yetersiz|inadequate|geçersiz|gecersiz|unsat/.test(s)) return 'yetersiz_ornek'
  if (/tekrar|repeat|recollect/.test(s)) return 'tekrar'
  if (/pozitif|positive|şüphe|suphe|suspect|high risk|yüksek risk/.test(s)) return 'pozitif_suphe'
  if (/sınır|sinir|borderline|equivocal/.test(s)) return 'sinir'
  if (/normal|negatif|negative|geçti|gec/.test(s)) return 'normal'
  if (s === 'h' || s === 'hh' || s === 'critical') return 'pozitif_suphe'
  if (s === 'l') return 'sinir'
  if (s === 'n' || s === 'normal') return 'normal'
  return null
}

export function ntpKeyFromRaw(rawName: string): NtpCanonicalKey | null {
  const n = rawName.toLocaleLowerCase('tr-TR')
  for (const k of NTP_KEYS) {
    const etiket = NTP_ETIKET[k].toLocaleLowerCase('tr-TR')
    if (n.includes(k.replace('ntp_', '')) || n.includes(etiket.split(' ')[0].toLocaleLowerCase('tr-TR'))) {
      if (k === 'ntp_tsh' && n === 'tsh') return 'ntp_tsh'
    }
  }
  if (/\bpku\b|fku|fenilketon/.test(n)) return 'ntp_pku'
  if (/\bsma\b|smn1|spinal m/.test(n)) return 'ntp_sma'
  if (/biotinid/.test(n)) return 'ntp_biotinidaz'
  if (/\birt\b|kistik fibroz|\bkf\b/.test(n)) return 'ntp_irt'
  if (/17[\s-]*ohp|kah\b|adrenal hiper/.test(n)) return 'ntp_17ohp'
  if (/kht|konjenital hipotiroid|topuk tsh|yenidoğan tsh|ntp tsh/.test(n)) return 'ntp_tsh'
  if (n === 'tsh' || n.startsWith('tsh ')) return 'ntp_tsh'
  return null
}

export function muhtemelNtpPanel(input: { labAdi?: string | null; satirlar: { raw_name?: string; canonical_key?: string | null }[] }): boolean {
  const ad = String(input.labAdi || '').toLocaleLowerCase('tr-TR')
  if (/yenidoğan tarama|yenidogan tarama|\bntp\b|topuk/.test(ad)) return true
  const hits = input.satirlar.filter((s) => {
    const k = String(s.canonical_key || '')
    if (k.startsWith('ntp_')) return true
    return ntpKeyFromRaw(String(s.raw_name || '')) != null
  }).length
  return hits >= 2
}

/**
 * Deterministic NTP interpretation. Screening ≠ diagnosis.
 * Prior NTP-1 vs NTP-2 is available as satirlar flags; trends stay in the lab engine.
 */
export function yorumNtp(input: {
  satirlar: NtpSatir[]
  sample_no?: string | null
}): NtpYorum {
  const sample = (input.sample_no === '2' || input.sample_no === 'tekrar' ? input.sample_no : '1') as NtpYorum['sample_no']
  const satirlar = input.satirlar
  const flags = satirlar.map((s) => ntpFlagNorm(s.flag) || String(s.flag))
  const yetersiz = satirlar.filter((_, i) => YETERSIZ.includes(flags[i] as NtpFlag))
  const pozitif = satirlar.filter((_, i) => POZITIF.includes(flags[i] as NtpFlag))
  const sinir = satirlar.filter((_, i) => SINIR.includes(flags[i] as NtpFlag))
  const flagOf = (key: NtpCanonicalKey) => {
    const i = satirlar.findIndex((s) => s.canonical_key === key)
    return i >= 0 ? flags[i] : null
  }
  const tshPoz = flagOf('ntp_tsh') === 'pozitif_suphe'
  const smaPoz = flagOf('ntp_sma') === 'pozitif_suphe'
  const pkuPoz = flagOf('ntp_pku') === 'pozitif_suphe'
  const kfPoz = flagOf('ntp_irt') === 'pozitif_suphe'
  const kahPoz = flagOf('ntp_17ohp') === 'pozitif_suphe'

  const plan: string[] = []
  let sevk: NtpYorum['sevk'] = 'yok'
  let yorum = ''

  if (yetersiz.length && !pozitif.length && !sinir.length) {
    yorum = 'Yetersiz örnek. Yeni alım görevi açılır — bu bir tanı değildir.'
    plan.push('Tekrar topuk örneği')
  } else if (tshPoz) {
    yorum = 'Konjenital hipotiroidi şüphesi — venöz TFT acil, tedavi gecikmesin. Tarama≠tanı.'
    sevk = 'endokrin'
    plan.push('Venöz TSH / serbest T4 acil')
    plan.push('Tedavi gecikmesin — tarama tanı değildir')
  } else if (smaPoz) {
    yorum = 'SMA tarama pozitif şüphesi. Metabolizma/nöromusküler sevk. Otomatik ilaç veya diyet yok.'
    sevk = 'nöroloji'
    plan.push('Nöromusküler / metabolizma konsültasyonu')
  } else if (pkuPoz) {
    yorum = 'FKU tarama pozitif şüphesi. Metabolizma sevk. Diyet otomatik başlamaz.'
    sevk = 'metabolizma'
    plan.push('Metabolizma konsültasyonu')
    plan.push('Tekrar topuk / konfirmasyon')
  } else if (kfPoz) {
    yorum = 'Kistik fibroz tarama şüphesi (IRT). Göğüs / metabolizma değerlendirmesi. Tarama tanı değildir.'
    sevk = 'göğüs'
    plan.push('Konfirmasyon ve klinik değerlendirme')
  } else if (kahPoz) {
    yorum = 'KAH tarama şüphesi (17-OHP). Endokrin sevk. Tarama tanı değildir.'
    sevk = 'endokrin'
    plan.push('Endokrin konsültasyonu')
  } else if (pozitif.length) {
    yorum = `${NTP_ETIKET[pozitif[0].canonical_key] || pozitif[0].canonical_key} tarama pozitif şüphesi. ${NTP_DISCLAIMER}`
    sevk = pozitif[0].canonical_key === 'ntp_biotinidaz' ? 'metabolizma' : 'yok'
    plan.push('Konfirmasyon ve klinik değerlendirme')
    plan.push('Tekrar topuk')
  } else if (sinir.length === 1 && pozitif.length === 0) {
    yorum = 'Tekrar örnek / konfirmasyon. Tanı koyma.'
    plan.push('Tekrar topuk')
    plan.push('Konfirmasyon ve klinik değerlendirme')
  } else if (sinir.length > 1) {
    yorum = 'Birden fazla sınır değer. Tekrar örnek / konfirmasyon. Tanı koyma.'
    plan.push('Tekrar topuk')
  } else {
    yorum = 'Tarama negatif. Klinik izlem devam.'
  }

  if (!yorum.includes('Tarama') && (pozitif.length || sinir.length || yetersiz.length)) {
    yorum = `${yorum} ${NTP_DISCLAIMER}`
  }

  return {
    panel_type: 'yenidogan_tarama',
    sample_no: sample,
    satirlar,
    yorum: yorum.trim(),
    tanilar: [],
    sevk,
    hekim_tanisi: [],
    plan,
    disclaimer: NTP_DISCLAIMER,
  }
}
