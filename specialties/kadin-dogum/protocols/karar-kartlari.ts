/**
 * GDM / PE / Rh / GBS decision cards — wire existing engines, do not invent medicine.
 * Doctor-facing Turkish only. Williams is a depth tooltip (role cite), never copyrighted prose.
 */
import {
  evaluateGDM,
  evaluatePE,
  evaluateRh,
  evaluateGBS,
  type EvalResult,
} from './risk-pe-gdm-rh'
import { citeProtocol } from './sources'

export const WILLIAMS_DERINLIK =
  'Ders kitabı derinliği: Williams Obstetrik 26 (rol: obstetrik_ders_kitabi). Telif metin kopyalanmaz.'

export type KararKart = {
  id: 'gdm' | 'pe' | 'rh' | 'gbs'
  baslik: string
  acog: string[]
  dobyr: string[]
  williams: string
  conflict: boolean
  triage: EvalResult['triage']
  citations: string[]
}

function trNext(items: string[]): string[] {
  const map: Record<string, string> = {
    'diet counseling if screen pending': 'Tarama bekliyorsa diyet danışmanlığı',
    '75g OGTT or 50+100 at 24–28w (DÖBYR/SUT)': '24–28. hafta 75 g OGTT veya 50+100 (DÖBYR / SUT) — yasal zorunlu tarama',
    'GDM screening per current ACOG PB (verify number at implement time)': 'GDM taraması güncel ACOG Practice Bulletin’a göre (klinik öneri)',
    diet: 'Diyet',
    'insulin titration': 'İnsülin titrasyonu',
    'trial of diet': 'Diyet denemesi',
    'growth USG / delivery plan': 'Büyüme USG / doğum planı',
    'fetal growth watch': 'Fetal büyüme izlemi',
    'MgSO4 flag': 'MgSO₄ değerlendirmesi',
    'delivery flags': 'Doğum endikasyonu gözden geçir',
    'stabilize BP': 'Kan basıncını stabilize et',
    sevk: 'Sevk',
    'repeat BP': 'Tansiyonu tekrarla',
    'spot/24h protein': 'Spot / 24 saat protein',
    labs: 'Laboratuvar',
    'fetal surveillance': 'Fetal iyilik hali izlemi',
    'routine BP each visit': 'Her izlemde tansiyon',
    'Anti-D not indicated on this Rh/IDC pair': 'Bu Rh / İDC çiftinde Anti-D endike değil',
    'Anti-D 300 µg now': 'Anti-D 300 µg şimdi',
    'plan Anti-D ~28w': 'Anti-D ~28. hafta planı',
    'postpartum if neonate Rh+': 'Yenidoğan Rh(+) ise postpartum Anti-D',
    'intrapartum penicillin path': 'Doğum eyleminde penisilin yolu',
    'newborn handoff GBS+': 'Yenidoğan tesliminde GBS(+)',
    'GBS culture this window': 'Bu pencerede GBS kültürü',
    'plan GBS culture 35–37w': '35–37. hafta GBS kültürü planı',
    '35–37w GBS if protocol (DÖBYR)': 'DÖBYR: 35–37. hafta GBS — protokole göre yasal taban',
    'universal culture-based screen ~36–37w (ACOG CO 797)': 'ACOG CO 797: evrensel kültür taraması ~36–37. hafta',
  }
  return items.map((s) => map[s] || s)
}

export function gdmKarti(input: { ogtt_positive: boolean; on_insulin?: boolean; macrosomia?: boolean }): KararKart {
  const ev = evaluateGDM(input)
  return {
    id: 'gdm',
    baslik: 'Gestasyonel diyabet',
    acog: trNext(ev.acog_recommended?.next ?? ev.next),
    dobyr: trNext(ev.sb_required?.next ?? ['DÖBYR: 24–28. hafta glukoz taraması yasal taban']),
    williams: WILLIAMS_DERINLIK,
    conflict: Boolean(ev.conflict),
    triage: ev.triage,
    citations: ev.citations.length ? ev.citations : citeProtocol('obstetrik'),
  }
}

export function peKarti(input: Parameters<typeof evaluatePE>[0]): KararKart {
  const ev = evaluatePE(input)
  const zorunlu = ev.triage === 'emergency'
    ? ['DÖBYR / Riskli Gebelikler: ağır özellikli PE — stabilize et, sevk']
    : ev.triage === 'urgent'
      ? ['DÖBYR: 140/90 veya proteinüri — tekrar ölç, tetkik, fetal izlem']
      : ['DÖBYR: her izlemde tansiyon (yasal asgari)']
  return {
    id: 'pe',
    baslik: 'Preeklampsi',
    acog: trNext(ev.next),
    dobyr: zorunlu,
    williams: WILLIAMS_DERINLIK,
    conflict: Boolean(ev.conflict),
    triage: ev.triage,
    citations: ev.citations,
  }
}

export function rhKarti(input: Parameters<typeof evaluateRh>[0]): KararKart {
  const ev = evaluateRh(input)
  const zorunlu = input.rh === 'D-'
    ? ['DÖBYR: Rh(−) gebede İDC + 28. hafta Anti-D değerlendirmesi yasal taban']
    : ['DÖBYR: Rh(+) — rutin Anti-D yok']
  return {
    id: 'rh',
    baslik: 'Rh / Anti-D',
    acog: trNext(ev.next),
    dobyr: zorunlu,
    williams: WILLIAMS_DERINLIK,
    conflict: Boolean(ev.conflict),
    triage: ev.triage,
    citations: ev.citations,
  }
}

export function gbsKarti(input: Parameters<typeof evaluateGBS>[0]): KararKart {
  const ev = evaluateGBS(input)
  return {
    id: 'gbs',
    baslik: 'GBS',
    acog: trNext(ev.acog_recommended?.next ?? ev.next),
    dobyr: trNext(ev.sb_required?.next ?? ev.next),
    williams: WILLIAMS_DERINLIK,
    conflict: Boolean(ev.conflict),
    triage: ev.triage,
    citations: ev.citations,
  }
}
