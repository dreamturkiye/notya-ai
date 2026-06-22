// lib/avukat/strateji-engine.ts
import { groqChat } from './groq'

export interface StratejiItem {
  iddia: string
  kuvvet: 'guclu' | 'orta' | 'zayif'
  dayanak: string
  riskler?: string[]
}
export interface EmsalKarar { mahkeme: string; esas: string; ozet: string; sonuc: string }
export interface SureUyarisi { tur: string; son_tarih: string; kanun: string; kritik: boolean }
export interface DavaAnalizi {
  ozet: string; hukuki_sorunlar: string[]; strateji_onerileri: StratejiItem[]
  emsal_kararlar: EmsalKarar[]; dilekce_turu: string; sure_uyarilari: SureUyarisi[]
  delil_eksikleri: string[]; risk_degerlendirmesi: 'dusuk' | 'orta' | 'yuksek' | 'kritik'; avukat_notu: string
}

export async function generateStratejiAnalizi(complaint: string, transcript: string, branchId: string, personaContext?: string): Promise<DavaAnalizi> {
  const system = ['Sen uzman Turk avukati asistanisin. ' + branchId + ' alaninda uzmansin.', 'Vaka analizini JSON formatinda ver. SADECE JSON don.', personaContext || ''].filter(Boolean).join('
')
  try {
    const raw = await groqChat([{ role: 'system', content: system }, { role: 'user', content: 'Basvuru: ' + complaint + ' Gorusme: ' + transcript }], { temperature: 0.2, maxTokens: 1500, jsonMode: true })
    return JSON.parse(raw) as DavaAnalizi
  } catch {
    return { ozet: complaint, hukuki_sorunlar: [complaint], strateji_onerileri: [], emsal_kararlar: [], dilekce_turu: 'Dava dilekce', sure_uyarilari: [], delil_eksikleri: [], risk_degerlendirmesi: 'orta', avukat_notu: 'Manuel analiz gerekli' }
  }
}

export function getSureUyarilari(branchId: string): Array<{ tur: string; sure: string; kanun: string }> {
  const map: Record<string, Array<{ tur: string; sure: string; kanun: string }>> = {
    ceza: [{ tur: 'Temyiz suresi', sure: '30 gun', kanun: 'CMK Md.291' }, { tur: 'Istinaf suresi', sure: '15 gun', kanun: 'CMK Md.272' }],
    aile_miras: [{ tur: 'Bosanma istinaf', sure: '2 hafta', kanun: 'HMK Md.341' }, { tur: 'Miras ret', sure: '3 ay', kanun: 'TMK Md.605' }],
    ticaret: [{ tur: 'TBK zamanasimi', sure: '5 yil', kanun: 'TBK Md.146' }, { tur: 'Itirazin iptali', sure: '1 yil', kanun: 'IIK Md.67' }],
    is_sgk: [{ tur: 'Ise iade basvurusu', sure: '1 ay', kanun: 'Is K Md.20' }, { tur: 'Kidem zamanasimi', sure: '5 yil', kanun: 'Is K Md.14' }],
    gayrimenkul: [{ tur: 'Tahliye ihtari', sure: '30 gun', kanun: 'TBK Md.315' }, { tur: 'Kira artisi', sure: 'Ocak/Temmuz', kanun: 'TBK Md.344' }],
    icra_iflas: [{ tur: 'Borca itiraz', sure: '7 gun', kanun: 'IIK Md.62' }, { tur: 'Itiraz iptal', sure: '1 yil', kanun: 'IIK Md.67' }],
    idare: [{ tur: 'Iptal davasi', sure: '60 gun', kanun: 'IYUK Md.7' }, { tur: 'AYM basvurusu', sure: '1 yil', kanun: 'Anayasa Md.148' }],
    tuketici: [{ tur: 'Cayma hakki', sure: '14 gun', kanun: '6502 TKHK Md.48' }, { tur: 'Sigorta itiraz', sure: '2 yil', kanun: 'TTK Md.1420' }],
    bilisim: [{ tur: 'KVKK sikayet', sure: '30+60 gun', kanun: '6698 Md.14' }, { tur: 'Icerik kaldir', sure: '24 saat', kanun: '5651 Md.9' }]
  }
  return map[branchId] || []
}

export function getRiskLevel(analiz: DavaAnalizi): string {
  const emojis: Record<string, string> = { kritik: '🔴', yuksek: '🟠', orta: '🟡', dusuk: '🟢' }
  const labels: Record<string, string> = { kritik: 'Kritik Risk', yuksek: 'Yuksek Risk', orta: 'Orta Risk', dusuk: 'Dusuk Risk' }
  const r = analiz.risk_degerlendirmesi || 'orta'
  return (emojis[r] || '🟡') + ' ' + (labels[r] || 'Orta Risk')
}
