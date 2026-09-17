/**
 * NOTYA-DAH-WOW W3.3 — KOAH / astım kartı: spirometri belgesi (Belgeler) değerleri → obstrüksiyon, KOAH GOLD evre + ABE grubu,
 * astım kontrol düzeyi (4 soru), başlangıç inhaler SINIFI, inhaler teknik kontrol listesi, göğüs hastalıkları sevk tetikleyicileri.
 * Tanıyı hekim kilitler; doz yok.
 */
import type { Dipnot } from './dahiliye'

export interface PulmGirdi {
  tani: 'koah' | 'astim' | null
  fev1Fvc: number | null; fev1Yuzde: number | null; bdFev1ArtisYuzde: number | null; bdFev1ArtisMl: number | null
  mmrc: number | null; cat: number | null; ortaAlevlenme12Ay: number; yatisliAlevlenme12Ay: number
  eozinofil: number | null // 10³/µL (onaylı lab) → hücre/µL = ×1000
  spo2: number | null; sigara: boolean
  astimKontrol: { gunduzSemptom: boolean; geceUyanma: boolean; kurtariciIhtiyac: boolean; aktiviteKisit: boolean } | null
  oralSteroidKur12Ay: number; ilacMetinleri: string[]; sonSpirometri: string | null; bugun: string
}
export interface PulmSonuc {
  obstruksiyon: boolean | null; bdYanit: boolean | null; gold: 1 | 2 | 3 | 4 | null; grup: 'A' | 'B' | 'E' | null
  astimKontrol: 'iyi' | 'kismen' | 'kontrolsuz' | null; inhalerSinifi: string[]; teknikListe: string[]; uyarilar: string[]; sevk: string[]; gorevler: { kod: string; ad: string; due: string }[]; dipnotlar: Dipnot[]
}

export const INHALER_TEKNIK = ['Doğru cihaz hazırlığı (kapak, sallama / kapsül yükleme)', 'İnhalasyon öncesi tam ekspirasyon (cihaza değil)', 'Dudakların ağızlığı tam kapatması', 'Cihaza uygun inspirasyon (ÖDİ: yavaş-derin; KTİ: hızlı-güçlü)', '5–10 sn nefes tutma', 'ICS sonrası ağız çalkalama', 'Doz sayacı / boş cihaz kontrolü']
function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }

export function pulmDegerlendir(g: PulmGirdi): PulmSonuc {
  const dip: Dipnot[] = [{ ref: 'HARRISON', not: 'KOAH: bronkodilatör sonrası FEV1/FVC <0,70; GOLD 1–4 FEV1 %80/50/30; ABE grubu alevlenme öyküsü ve semptom (mMRC ≥2 / CAT ≥10); E grubunda eozinofil ≥300 hücre/µL ICS eklenmesi' }, { ref: 'TIHUD2023', not: 'Astım: bronkodilatör yanıtı FEV1 ≥%12 ve ≥200 mL; kontrol düzeyi 4 soru; ICS içeren tedavi, SABA tek başına önerilmez' }]
  const r: PulmSonuc = { obstruksiyon: null, bdYanit: null, gold: null, grup: null, astimKontrol: null, inhalerSinifi: [], teknikListe: INHALER_TEKNIK, uyarilar: [], sevk: [], gorevler: [], dipnotlar: dip }
  if (g.fev1Fvc != null) r.obstruksiyon = g.fev1Fvc < 0.7
  if (g.bdFev1ArtisYuzde != null && g.bdFev1ArtisMl != null) r.bdYanit = g.bdFev1ArtisYuzde >= 12 && g.bdFev1ArtisMl >= 200
  const t = (re: RegExp) => g.ilacMetinleri.some((x) => re.test(x))
  if (g.tani === 'koah') {
    if (r.obstruksiyon === false) r.uyarilar.push('FEV1/FVC ≥0,70: KOAH tanısı spirometri ile desteklenmiyor — hekim tanıyı gözden geçirsin')
    if (r.obstruksiyon == null) r.uyarilar.push('Spirometri değeri yok: KOAH tanısı için bronkodilatör sonrası spirometri gerekli (Belgeler)')
    if (g.fev1Yuzde != null) r.gold = g.fev1Yuzde >= 80 ? 1 : g.fev1Yuzde >= 50 ? 2 : g.fev1Yuzde >= 30 ? 3 : 4
    r.grup = g.ortaAlevlenme12Ay >= 2 || g.yatisliAlevlenme12Ay >= 1 ? 'E' : (g.mmrc != null && g.mmrc >= 2) || (g.cat != null && g.cat >= 10) ? 'B' : g.mmrc != null || g.cat != null ? 'A' : null
    const eos = g.eozinofil != null ? Math.round(g.eozinofil * 1000) : null
    if (r.grup === 'A') r.inhalerSinifi.push('Bronkodilatör (kısa veya uzun etkili) — hekim seçer')
    if (r.grup === 'B') r.inhalerSinifi.push('LAMA + LABA (tercihen tek cihaz)')
    if (r.grup === 'E') r.inhalerSinifi.push(eos != null && eos >= 300 ? `LAMA + LABA + ICS (eozinofil ${eos} ≥300) — hekim` : 'LAMA + LABA (eozinofil ≥300 ise ICS eklenmesi tartışılır)')
    if (t(/salbutamol|terbutalin/) && !t(/tiotropium|glikopironyum|umeklidinyum|aklidinyum|formoterol|salmeterol|indakaterol|olodaterol|vilanterol/)) r.uyarilar.push('Yalnız kısa etkili bronkodilatör: grup B/E ise uzun etkili idame eksik')
    if (g.sigara) r.uyarilar.push('Aktif sigara: bırakma danışmanlığı (ALO 171) — en etkili müdahale')
    if (!g.sonSpirometri || g.sonSpirometri < ekleAy(g.bugun, -12)) r.gorevler.push({ kod: 'pulm_spirometri', ad: 'Yıllık spirometri (Belgeler › yükle)', due: g.sonSpirometri ? ekleAy(g.sonSpirometri, 12) : g.bugun })
    if (g.fev1Yuzde != null && g.fev1Yuzde < 30) r.sevk.push('Göğüs hastalıkları: FEV1 <%30 (GOLD 4)')
    if (g.yatisliAlevlenme12Ay >= 1 || g.ortaAlevlenme12Ay >= 2) r.sevk.push('Göğüs hastalıkları: sık/yatışlı alevlenme')
  }
  if (g.tani === 'astim') {
    if (r.obstruksiyon != null && !r.obstruksiyon && r.bdYanit === false) r.uyarilar.push('Spirometri normal ve BD yanıtı yok: astım tanısı değişken hava yolu kısıtlamasıyla doğrulanmalı (tekrar / PEF değişkenliği)')
    if (g.astimKontrol) {
      const n = Object.values(g.astimKontrol).filter(Boolean).length
      r.astimKontrol = n === 0 ? 'iyi' : n <= 2 ? 'kismen' : 'kontrolsuz'
      r.inhalerSinifi.push(r.astimKontrol === 'iyi' ? 'Mevcut basamak sürdür; 3 ay iyi kontrolse basamak azaltma tartışılır' : 'ICS-formoterol (idame ve/veya gerektiğinde) ile basamak artışı — önce inhaler tekniği ve uyum kontrolü')
    }
    if (t(/salbutamol|terbutalin/) && !t(/budesonid|flutikazon|beklometazon|mometazon|siklesonid/)) r.uyarilar.push('SABA tek başına (ICS yok): astımda önerilmez — ICS içeren tedavi (hekim)')
    if (g.oralSteroidKur12Ay >= 2) r.sevk.push('Göğüs hastalıkları / alerji: yılda ≥2 oral steroid kürü (ağır astım değerlendirmesi)')
  }
  if (g.spo2 != null && g.spo2 <= 88) r.sevk.push(`Göğüs hastalıkları: SpO₂ %${g.spo2} ≤88 — uzun süreli oksijen değerlendirmesi`)
  return r
}
