/**
 * NOTYA-DAH-WOW W3.4 — Ofis GI mini: GÖRH hızlı kart (alarm → endoskopi sevki, yoksa PPI sınıfı 8 hafta), İBS Roma IV kontrol listesi
 * + alarm bulguları, MASLD FIB-4 (dmLoop.fib4 ortak), H. pylori TR eradikasyonu (bizmutlu dörtlü 14 gün, sınıf düzeyi) ve
 * kontrol testi zamanlaması (tedavi bitiminden ≥4 hafta sonra, PPI testten 2 hafta önce kesilmiş). Doz yok.
 */
import type { Dipnot } from './dahiliye'
import { fib4, fib4Yorum } from './dmLoop'

export interface GiGirdi {
  yas: number | null
  alarm: { disfaji?: boolean; kiloKaybi?: boolean; gisKanama?: boolean; anemi?: boolean; kusma?: boolean; aileGisKanser?: boolean; geceSemptom?: boolean }
  gerd: { tipikSemptom: boolean; ppiYanitsiz8Hafta?: boolean } | null
  ibs: { karinAgrisiHaftada1Gun3Ay: boolean; defekasyonIliskili: boolean; siklikDegisimi: boolean; formDegisimi: boolean; baslangic6AyOnce: boolean } | null
  hp: { test: 'pozitif' | 'negatif' | null; eradikasyonBitis: string | null; ppiKesimTarihi: string | null; kontrolSonuc: 'pozitif' | 'negatif' | null } | null
  masld: { alt: number | null; ast: number | null; plt: number | null } | null
  hb: number | null; bugun: string
}
export interface GiSonuc { alarmVar: boolean; gerd: string[]; ibs: { romaIV: boolean | null; not: string }; hp: { plan: string[]; kontrolTestTarihi: string | null; gorev: { kod: string; ad: string; due: string } | null }; masld: { skor: number | null; aksiyon: string | null }; sevk: string[]; dipnotlar: Dipnot[] }

function gunEkle(t: string, g: number): string { const d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10) }

export function giDegerlendir(g: GiGirdi): GiSonuc {
  const dip: Dipnot[] = [{ ref: 'TIHUD2023', not: 'Dispepsi/GÖRH: alarm bulgusu veya ≥60 yaş yeni semptomda endoskopi; alarmsız GÖRH\'de 8 hafta PPI; H. pylori test-ve-tedavi' }, { ref: 'HARRISON', not: 'H. pylori: yüksek klaritromisin direncinde bizmutlu dörtlü 14 gün; eradikasyon kontrolü üre nefes / gaita antijen testi ile tedavi bitiminden ≥4 hafta sonra, PPI 2 hafta önce kesilmiş' }]
  const anemi = g.alarm.anemi || (g.hb != null && g.hb < 12)
  const alarmVar = !!(g.alarm.disfaji || g.alarm.kiloKaybi || g.alarm.gisKanama || anemi || g.alarm.kusma || g.alarm.aileGisKanser)
  const r: GiSonuc = { alarmVar, gerd: [], ibs: { romaIV: null, not: '' }, hp: { plan: [], kontrolTestTarihi: null, gorev: null }, masld: { skor: null, aksiyon: null }, sevk: [], dipnotlar: dip }
  if (g.gerd?.tipikSemptom) {
    if (alarmVar || (g.yas != null && g.yas >= 60)) r.sevk.push(`Gastroenteroloji: endoskopi — ${alarmVar ? 'alarm bulgusu' : '≥60 yaş yeni başlangıç'}`)
    else if (g.gerd.ppiYanitsiz8Hafta) r.sevk.push('Gastroenteroloji: 8 hafta PPI\'ye yanıtsız GÖRH')
    else r.gerd.push('PPI sınıfı 8 hafta (yemekten 30 dk önce) + yaşam tarzı (kilo, geç yemek, yatak başı) — hekim dozu yazar', 'H. pylori test-ve-tedavi değerlendir (dispepsi baskınsa)')
  }
  if (g.ibs) {
    const ek = [g.ibs.defekasyonIliskili, g.ibs.siklikDegisimi, g.ibs.formDegisimi].filter(Boolean).length
    r.ibs.romaIV = g.ibs.karinAgrisiHaftada1Gun3Ay && g.ibs.baslangic6AyOnce && ek >= 2
    r.ibs.not = r.ibs.romaIV ? (alarmVar || g.alarm.geceSemptom || (g.yas != null && g.yas >= 50) ? 'Roma IV karşılanıyor AMA alarm bulgusu / ≥50 yaş: organik neden dışlanmadan İBS denmez — hemogram, CRP, çölyak serolojisi, fekal kalprotektin; gastro/kolonoskopi' : 'Roma IV karşılanıyor, alarm yok: hemogram, CRP, çölyak serolojisi (ishal baskınsa fekal kalprotektin) sonrası pozitif İBS tanısı (hekim)') : 'Roma IV ölçütleri karşılanmıyor'
    if (r.ibs.romaIV && (alarmVar || g.alarm.geceSemptom || (g.yas != null && g.yas >= 50))) r.sevk.push('Gastroenteroloji: İBS benzeri semptom + alarm/≥50 yaş — kolonoskopi değerlendirmesi')
  }
  if (g.hp) {
    if (g.hp.test === 'pozitif' && !g.hp.eradikasyonBitis) r.hp.plan.push('Eradikasyon: bizmutlu dörtlü 14 gün (PPI + bizmut + tetrasiklin + metronidazol) — sınıf düzeyi taslak; hekim ajan ve dozu yazar, alerji/etkileşim kontrolü')
    if (g.hp.eradikasyonBitis) {
      const dort = gunEkle(g.hp.eradikasyonBitis, 28)
      const ppiOk = g.hp.ppiKesimTarihi ? gunEkle(g.hp.ppiKesimTarihi, 14) : null
      r.hp.kontrolTestTarihi = ppiOk && ppiOk > dort ? ppiOk : dort
      r.hp.plan.push(`Kontrol testi (üre nefes / gaita antijen): en erken ${r.hp.kontrolTestTarihi} — PPI testten 2 hafta önce kesilmiş olmalı${g.hp.ppiKesimTarihi ? '' : ' (PPI kesim tarihini girin)'}`)
      if (!g.hp.kontrolSonuc) r.hp.gorev = { kod: 'hp_kontrol', ad: 'H. pylori eradikasyon kontrol testi', due: r.hp.kontrolTestTarihi }
      if (g.hp.kontrolSonuc === 'pozitif') r.hp.plan.push('Eradikasyon başarısız: ikinci basamak rejim (daha önce kullanılmayan antibiyotik) — hekim; tekrar başarısızlıkta gastro')
      if (g.hp.kontrolSonuc === 'negatif') r.hp.plan.push('Eradikasyon başarılı')
    }
  }
  if (g.masld && g.yas != null && g.masld.alt && g.masld.ast && g.masld.plt) {
    const s = fib4(g.yas, g.masld.ast, g.masld.alt, g.masld.plt)
    if (s != null) { const y = fib4Yorum(s, g.yas); r.masld = { skor: s, aksiyon: y.aksiyon }; if (y.sevk) r.sevk.push(`Gastroenteroloji: ${y.aksiyon}`); dip.push(y.dipnot) }
  }
  if (g.alarm.gisKanama) r.sevk.push('Gastroenteroloji: GİS kanama (aktif/hemodinamik bozuksa acil)')
  r.sevk = Array.from(new Set(r.sevk))
  return r
}
