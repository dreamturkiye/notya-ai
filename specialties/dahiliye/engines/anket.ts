/**
 * NOTYA-DAH-WOW W2.7 — Muayene öncesi hasta anketi (portal). Ölçümler dahiliye_ev_kayitlari'na (kaynak=portal),
 * geri kalanı dahiliye_anketler'e. Aktif karta göre semptom listesi; SOAP Subjektif taslağı; alarm semptomları şeride.
 * Hastaya tanı/yorum gösterilmez; alarm semptomda "acil durumda 112" metni.
 */
export type AnketKart = 'ht' | 'dm' | 'lipid' | 'tiroid' | 'ckd' | 'hf' | 'antikoagulan' | 'pulm' | 'gi'
export interface AnketSablon { kartlar: AnketKart[]; semptomlar: { kod: string; ad: string; alarm?: boolean }[]; olcumler: ('kb' | 'glukoz' | 'kilo')[] }

const SEMPTOM: Record<AnketKart | 'genel', { kod: string; ad: string; alarm?: boolean }[]> = {
  genel: [{ kod: 'yorgunluk', ad: 'Halsizlik / yorgunluk' }, { kod: 'uyku', ad: 'Uyku sorunu' }, { kod: 'gogus_agrisi', ad: 'Göğüs ağrısı veya baskı hissi', alarm: true }, { kod: 'nefes', ad: 'Nefes darlığı' }],
  ht: [{ kod: 'bas_agrisi', ad: 'Baş ağrısı' }, { kod: 'bas_donmesi', ad: 'Baş dönmesi / ayağa kalkınca kararma' }, { kod: 'ayak_sisligi', ad: 'Ayak / bacak şişliği' }],
  dm: [{ kod: 'hipo', ad: 'Titreme, terleme, açlık hissi (düşük şeker belirtisi)', alarm: true }, { kod: 'poliuri', ad: 'Sık idrara çıkma / aşırı susama' }, { kod: 'ayak_yara', ad: 'Ayakta yara, uyuşma veya yanma' }, { kod: 'gorme', ad: 'Bulanık görme' }],
  lipid: [{ kod: 'kas_agrisi', ad: 'Kas ağrısı / güçsüzlük' }],
  tiroid: [{ kod: 'carpinti', ad: 'Çarpıntı' }, { kod: 'kilo_degisimi', ad: 'İstemsiz kilo değişimi' }],
  ckd: [{ kod: 'idrar_azalma', ad: 'İdrar miktarında azalma' }],
  hf: [{ kod: 'gece_nefes', ad: 'Gece nefes darlığıyla uyanma / düz yatamama', alarm: true }, { kod: 'hizli_kilo', ad: '3 günde 2 kg\'dan fazla kilo artışı' }],
  antikoagulan: [{ kod: 'kanama', ad: 'Morarma, diş eti / burun kanaması' }, { kod: 'siyah_diski', ad: 'Siyah (katran renkli) dışkı veya kanlı idrar', alarm: true }],
  pulm: [{ kod: 'oksuruk', ad: 'Öksürük / balgam artışı' }, { kod: 'hisilti', ad: 'Hışıltı, kurtarıcı inhaler kullanımında artış' }],
  gi: [{ kod: 'yutma', ad: 'Yutma güçlüğü', alarm: true }, { kod: 'kilo_kaybi', ad: 'İstemsiz kilo kaybı' }, { kod: 'reflu', ad: 'Göğüste yanma / ekşime' }],
}

export function anketSablonu(kartlar: AnketKart[]): AnketSablon {
  const semptomlar = [...SEMPTOM.genel, ...kartlar.flatMap((k) => SEMPTOM[k] || [])]
  const tekil = semptomlar.filter((s, i) => semptomlar.findIndex((x) => x.kod === s.kod) === i)
  const olcumler: AnketSablon['olcumler'] = ['kb', 'kilo']
  if (kartlar.includes('dm')) olcumler.push('glukoz')
  return { kartlar, semptomlar: tekil, olcumler }
}

export interface AnketGirdi {
  kb?: { sbp: number; dbp: number; olcumAt?: string }[]; glukoz?: { deger: number; aclik?: boolean; olcumAt?: string }[]; kilo?: number | null
  kacirilanDoz?: '0' | '1-2' | '3+' | null; yanEtki?: string | null; semptomlar?: string[]; sorular?: string | null
}
export interface AnketTemiz { girdi: AnketGirdi; hatalar: string[]; alarmlar: string[] }

const aralik = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi
export function anketDogrula(ham: unknown, sablon: AnketSablon): AnketTemiz {
  const h = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const hatalar: string[] = []
  const kb = (Array.isArray(h.kb) ? h.kb : []).slice(0, 30).map((x) => x as Record<string, unknown>).map((x) => ({ sbp: Number(x.sbp), dbp: Number(x.dbp), olcumAt: typeof x.olcumAt === 'string' ? x.olcumAt.slice(0, 30) : undefined }))
  const kbGecerli = kb.filter((x) => aralik(x.sbp, 60, 260) && aralik(x.dbp, 30, 160) && x.sbp > x.dbp)
  if (kbGecerli.length < kb.length) hatalar.push('Bazı tansiyon değerleri geçersiz (büyük 60–260, küçük 30–160) ve kaydedilmedi')
  const gl = (Array.isArray(h.glukoz) ? h.glukoz : []).slice(0, 30).map((x) => x as Record<string, unknown>).map((x) => ({ deger: Number(x.deger), aclik: x.aclik !== false, olcumAt: typeof x.olcumAt === 'string' ? x.olcumAt.slice(0, 30) : undefined }))
  const glGecerli = gl.filter((x) => aralik(x.deger, 20, 600))
  if (glGecerli.length < gl.length) hatalar.push('Bazı şeker değerleri geçersiz (20–600) ve kaydedilmedi')
  const kilo = h.kilo == null || h.kilo === '' ? null : Number(h.kilo)
  const kiloOk = kilo == null ? null : aralik(kilo, 20, 350) ? kilo : (hatalar.push('Kilo geçersiz (20–350 kg)'), null)
  const izinli = new Set(sablon.semptomlar.map((s) => s.kod))
  const semptomlar = (Array.isArray(h.semptomlar) ? h.semptomlar : []).map(String).filter((s) => izinli.has(s))
  const kd = ['0', '1-2', '3+'].includes(String(h.kacirilanDoz)) ? (String(h.kacirilanDoz) as AnketGirdi['kacirilanDoz']) : null
  const alarmlar = sablon.semptomlar.filter((s) => s.alarm && semptomlar.includes(s.kod)).map((s) => s.ad)
  for (const g of glGecerli) if (g.deger < 70) { alarmlar.push(`Ev şekeri ${g.deger} mg/dL (<70)`); break }
  for (const k of kbGecerli) if (k.sbp >= 180 || k.dbp >= 110) { alarmlar.push(`Ev tansiyonu ${k.sbp}/${k.dbp} (≥180/110)`); break }
  return { girdi: { kb: kbGecerli, glukoz: glGecerli, kilo: kiloOk, kacirilanDoz: kd, yanEtki: typeof h.yanEtki === 'string' ? h.yanEtki.slice(0, 500) : null, semptomlar, sorular: typeof h.sorular === 'string' ? h.sorular.slice(0, 1000) : null }, hatalar, alarmlar }
}

export function anketiSoapa(a: AnketGirdi, sablon: AnketSablon, tarih: string, alarmlar: string[]): string {
  const ad = (k: string) => sablon.semptomlar.find((s) => s.kod === k)?.ad || k
  const L = [`Hasta ön anketi (portal, ${tarih}):`]
  if (alarmlar.length) L.push(`⚑ Alarm: ${alarmlar.join('; ')}`)
  if (a.kb?.length) { const o = (f: 'sbp' | 'dbp') => Math.round(a.kb!.reduce((s, x) => s + x[f], 0) / a.kb!.length); L.push(`Ev KB: ${a.kb.length} ölçüm, ortalama ${o('sbp')}/${o('dbp')} mmHg`) }
  if (a.glukoz?.length) L.push(`Ev glukoz: ${a.glukoz.map((g) => `${g.deger}${g.aclik ? ' (açlık)' : ''}`).join(', ')} mg/dL`)
  if (a.kilo != null) L.push(`Kilo (ev): ${a.kilo} kg`)
  if (a.kacirilanDoz) L.push(`İlaç uyumu: son 7 günde kaçırılan doz ${a.kacirilanDoz === '0' ? 'yok' : a.kacirilanDoz}`)
  if (a.yanEtki) L.push(`Yan etki bildirimi: ${a.yanEtki}`)
  L.push(`Semptomlar: ${a.semptomlar?.length ? a.semptomlar.map(ad).join(', ') : 'işaretlenmedi'}`)
  if (a.sorular) L.push(`Hekime soruları: ${a.sorular}`)
  return L.join('\n')
}
