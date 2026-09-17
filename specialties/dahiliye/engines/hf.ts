/**
 * NOTYA-DAH-WOW W3.1 — Kalp yetersizliği kartı: EF kategorisi, NYHA, GDMT dört sütun kontrol listesi (hasta_ilaclar'dan),
 * güvenlik uyarıları, kardiyoloji sevk tetikleyicileri. Sınıf önerisi; doz titrasyonu hekim/kardiyoloji. Yoğun bakım / cihaz protokolü yok.
 */
import type { Dipnot } from './dahiliye'

export type EfKategori = 'HFrEF' | 'HFmrEF' | 'HFpEF' | null
export interface HfGirdi { ef: number | null; nyha: 1 | 2 | 3 | 4 | null; ilacMetinleri: string[]; sbp: number | null; nabiz: number | null; k: number | null; eGFR: number | null; ntprobnp: number | null; oncekiNtprobnp: number | null; kiloSerisi: { kg: number; tarih: string }[]; yatis12Ay: boolean; ekoTarihi: string | null; bugun: string }
export interface GdmtSutun { kod: 'ras' | 'bb' | 'mra' | 'sglt2'; ad: string; var: boolean; endike: boolean; not: string }
export interface HfSonuc { efKategori: EfKategori; sutunlar: GdmtSutun[]; eksik: string[]; uyarilar: string[]; sevk: string[]; plan: string[]; dipnotlar: Dipnot[] }

const RE = { arni: /sakubitril|entresto/i, acei: /pril\b|ramipril|enalapril|lisinopril|perindopril|kaptopril/i, arb: /sartan/i, bb: /bisoprolol|metoprolol|karvedilol|nebivolol/i, mra: /spironolakton|eplerenon|finerenon/i, sglt2: /dapagliflozin|empagliflozin|gliflozin/i, ndhpKkb: /diltiazem|verapamil/i, nsaii: /ibuprofen|naproksen|diklofenak|etodolak|meloksikam|selekoksib|deksketoprofen/i, tzd: /pioglitazon/i }

export function efKategorisi(ef: number | null): EfKategori { return ef == null ? null : ef <= 40 ? 'HFrEF' : ef < 50 ? 'HFmrEF' : 'HFpEF' }

export function hfDegerlendir(g: HfGirdi): HfSonuc {
  const dip: Dipnot[] = [{ ref: 'HARRISON', not: 'HFrEF (EF ≤40): RAS inhibisyonu (ARNI/ACEi/ARB) + kanıtlı beta bloker + MRA + SGLT2 inhibitörü; HFmrEF/HFpEF: SGLT2 inhibitörü, konjesyonda diüretik' }, { ref: 'TIHUD2023', not: 'KY izlemi: NYHA, volüm durumu, K/Kre, günlük tartı; ileri KY ve cihaz değerlendirmesi kardiyoloji' }]
  const t = (re: RegExp) => g.ilacMetinleri.some((x) => re.test(x))
  const kat = efKategorisi(g.ef)
  const rEF = kat === 'HFrEF'
  const sutunlar: GdmtSutun[] = [
    { kod: 'ras', ad: 'ARNI / ACEi / ARB', var: t(RE.arni) || t(RE.acei) || t(RE.arb), endike: rEF, not: t(RE.arni) ? 'ARNI' : t(RE.acei) ? 'ACEi' : t(RE.arb) ? 'ARB' : '' },
    { kod: 'bb', ad: 'Beta bloker (bisoprolol / metoprolol süksinat / karvedilol / nebivolol)', var: t(RE.bb), endike: rEF, not: '' },
    { kod: 'mra', ad: 'MRA (spironolakton / eplerenon)', var: t(RE.mra), endike: rEF, not: '' },
    { kod: 'sglt2', ad: 'SGLT2 inhibitörü (dapagliflozin / empagliflozin)', var: t(RE.sglt2), endike: kat != null, not: '' },
  ]
  const uyarilar: string[] = [], sevk: string[] = [], plan: string[] = []
  const eksik = sutunlar.filter((x) => x.endike && !x.var).map((x) => x.ad)
  if (kat == null) { plan.push('EF bilinmiyor: ekokardiyografi (Belgeler › EKO) — kategori ve GDMT buna göre'); sevk.push('Kardiyoloji: KY şüphesi / EF bilinmiyor — ekokardiyografi') }
  for (const e of eksik) plan.push(`Eksik GDMT sütunu: ${e} — kontrendikasyon yoksa sınıf ekleme (hekim dozu yazar, titrasyon kardiyoloji ile)`)
  if (kat === 'HFrEF' && t(RE.acei) && !t(RE.arni)) plan.push('ACEi yerine ARNI geçişi tartışılır (36 saat ACEi arası) — hekim/kardiyoloji')
  if (g.k != null && g.k > 5.0) uyarilar.push(`K ${g.k} >5,0: MRA/RAS başlama veya artırma — gözden geçir`)
  if (g.eGFR != null && g.eGFR < 30 && sutunlar[2].var) uyarilar.push(`eGFR ${g.eGFR} <30 + MRA: hiperkalemi riski`)
  if (g.eGFR != null && g.eGFR < 20 && sutunlar[3].endike && !sutunlar[3].var) uyarilar.push('eGFR <20: SGLT2 başlangıcı önerilmez')
  if (g.nabiz != null && g.nabiz < 50 && sutunlar[1].var) uyarilar.push(`Nabız ${g.nabiz} <50 beta bloker altında: doz gözden geçir`)
  if (g.sbp != null && g.sbp < 90) { uyarilar.push(`SBP ${g.sbp} <90: hipotansiyon — titrasyon dur`); sevk.push('Kardiyoloji: KY + semptomatik hipotansiyon') }
  if (rEF && t(RE.ndhpKkb)) uyarilar.push('HFrEF + diltiazem/verapamil: negatif inotrop — kaçın')
  if (t(RE.nsaii)) uyarilar.push('KY + NSAİİ: sıvı retansiyonu / dekompansasyon riski — kaçın')
  if (t(RE.tzd)) uyarilar.push('KY + pioglitazon: sıvı retansiyonu — kaçın')
  const ks = g.kiloSerisi.slice().sort((a, b) => a.tarih.localeCompare(b.tarih))
  const son = ks[ks.length - 1]
  if (son) { const uc = ks.filter((k) => k.tarih >= new Date(Date.parse(son.tarih) - 3 * 86400000).toISOString().slice(0, 10))[0]; if (uc && son.kg - uc.kg > 2) uyarilar.push(`3 günde ${Math.round((son.kg - uc.kg) * 10) / 10} kg artış: konjesyon — diüretik/erken vizit (hekim)`) }
  if (g.nyha != null && g.nyha >= 3) sevk.push(`Kardiyoloji: NYHA ${g.nyha === 3 ? 'III' : 'IV'} — ileri KY değerlendirmesi`)
  if (g.ef != null && g.ef <= 35 && (g.nyha ?? 0) >= 2) sevk.push('Kardiyoloji: EF ≤35 + semptom — optimal tedavi sonrası ICD/CRT değerlendirmesi')
  if (g.yatis12Ay) sevk.push('Kardiyoloji: son 12 ayda KY yatışı')
  if (g.ntprobnp != null && g.oncekiNtprobnp != null && g.ntprobnp > g.oncekiNtprobnp * 1.3) uyarilar.push(`NT-proBNP ${g.oncekiNtprobnp} → ${g.ntprobnp} (>%30 artış): klinik kötüleşme olabilir`)
  if (g.ekoTarihi && g.ekoTarihi < new Date(Date.parse(g.bugun) - 365 * 86400000).toISOString().slice(0, 10) && rEF) plan.push('GDMT 3–6 ay sonrası kontrol ekokardiyografi (EF yeniden değerlendirme)')
  plan.push('Günlük sabah tartı (Ev kayıt), tuz kısıtlaması, aşı (grip/pnömokok), egzersiz rehabilitasyonu')
  return { efKategori: kat, sutunlar, eksik, uyarilar, sevk, plan, dipnotlar: dip }
}
