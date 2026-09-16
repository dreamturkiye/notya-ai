/**
 * NOTYA-JINE-01 — Office gynecology spine engine (kadın-doğum only; non-pregnant home).
 * Pure rules: due engine (serviks/HPV/MG/DXA/GGK/RİA/HRT), HPV+Pap action tree (HSGM style), STI entities + partner rule,
 * HSV card + pregnancy hooks, PCOS Rotterdam counter (TJOD 2023 post-menarche rule), IUD schedule, HRT pre-check, red flags.
 * Locked: AI drafts only — the doctor locks tanı, Pap action, HRT start, C/S for HSV. Screening ≠ diagnosis. No IVF lab.
 */
export type Tarih = string // YYYY-MM-DD

function ekleAy(t: Tarih, ay: number): Tarih { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }
function yas(dob: Tarih | null, bugun: Tarih): number | null { if (!dob) return null; const a = new Date(bugun), b = new Date(dob); let y = a.getUTCFullYear() - b.getUTCFullYear(); if (a.getUTCMonth() < b.getUTCMonth() || (a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() < b.getUTCDate())) y--; return y }

// ---------- Due engine ----------
export type DueGirdi = { dob: Tarih | null; bugun: Tarih; sonPap?: Tarih | null; sonHpv?: Tarih | null; sonCoTest?: Tarih | null; sonMamografi?: Tarih | null; sonDxa?: Tarih | null; sonGgk?: Tarih | null; hrt?: boolean; riaTakildi?: Tarih | null; riaTipi?: 'cu5' | 'cu10' | 'lng5' | 'lng8' | null; hrtBaslangic?: Tarih | null; histerektomi?: boolean; gebe?: boolean }
export type Due = { kod: string; ad: string; due: Tarih | null; durum: 'gecikti' | 'yaklasiyor' | 'planli' | 'uygun_degil'; not: string; takvim: 'SB' | 'ofis' | 'her_ikisi' }

export function dueHesapla(g: DueGirdi): Due[] {
  const y = yas(g.dob, g.bugun); const out: Due[] = []
  const durum = (due: Tarih | null): Due['durum'] => (!due ? 'planli' : due < g.bugun ? 'gecikti' : due <= ekleAy(g.bugun, 3) ? 'yaklasiyor' : 'planli')
  if (y != null && !g.histerektomi) {
    if (y >= 21 && y < 30) { const due = g.sonPap ? ekleAy(g.sonPap, 36) : g.bugun; out.push({ kod: 'pap', ad: 'Pap smear (21–29: 3 yılda bir)', due, durum: durum(due), not: 'Ofis takvimi; SB HPV-DNA 30 yaşında başlar.', takvim: 'ofis' }) }
    if (y >= 30 && y <= 65) { const son = g.sonCoTest || g.sonHpv || g.sonPap; const due = son ? ekleAy(son, 60) : g.bugun; out.push({ kod: 'hpv', ad: 'HPV-DNA / ko-test (30–65: 5 yılda bir)', due, durum: durum(due), not: 'SB KETEM 30–65 HPV-DNA q5y; ofis ko-test q5y.', takvim: 'her_ikisi' }) }
  }
  if (y != null && y >= 40 && y <= 69) { const aralik = g.hrt ? 12 : 24; const due = g.sonMamografi ? ekleAy(g.sonMamografi, aralik) : g.bugun; out.push({ kod: 'mamografi', ad: g.hrt ? 'Mamografi (HRT: yıllık)' : 'Mamografi (40–69: 2 yılda bir)', due, durum: durum(due), not: 'Ulusal program 40–69 q2y; HRT kullanıcısı yıllık.', takvim: 'her_ikisi' }) }
  if (y != null && y >= 50 && y <= 70) { const due = g.sonGgk ? ekleAy(g.sonGgk, 24) : g.bugun; out.push({ kod: 'ggk', ad: 'Kolon GGK (50–70: 2 yılda bir)', due, durum: durum(due), not: 'Yalnız çip; KETEM.', takvim: 'SB' }) }
  if (y != null && y >= 65) { const due = g.sonDxa ? ekleAy(g.sonDxa, 24) : g.bugun; out.push({ kod: 'dxa', ad: 'DXA (65+ veya risk)', due, durum: durum(due), not: 'Risk faktörü varsa daha erken — hekim kararı.', takvim: 'ofis' }) }
  if (g.riaTakildi && g.riaTipi) { const yil = { cu5: 5, cu10: 10, lng5: 5, lng8: 8 }[g.riaTipi]; const due = ekleAy(g.riaTakildi, yil * 12); out.push({ kod: 'ria', ad: `RİA süresi (${g.riaTipi.toUpperCase()}, ${yil} yıl)`, due, durum: durum(due), not: 'Son kullanım tarihi; değişim/çıkarım planı.', takvim: 'ofis' }) }
  if (g.hrt && g.hrtBaslangic) { const due = ekleAy(g.hrtBaslangic, 12); const yilDonumu = due < g.bugun ? ekleAy(g.bugun, 0) : due; out.push({ kod: 'hrt_yillik', ad: 'HRT yıllık güvenlik kontrolü (MG, TVUS ET, TA, VTE)', due: yilDonumu, durum: durum(yilDonumu), not: 'HRT devam ederken her yıl.', takvim: 'ofis' }) }
  if (y != null && y >= 9 && y <= 26) out.push({ kod: 'hpv_asi', ad: 'HPV aşısı (9–14 ideal, 26\'ya kadar yakalama)', due: null, durum: 'planli', not: 'Öneri; 2026\'da ulusal programa tam alınmadı — zorunlu olarak işaretlenmez.', takvim: 'ofis' })
  return out
}

// ---------- HPV + Pap action tree (HSGM style) ----------
export type PapSonuc = 'NILM' | 'ASC-US' | 'ASC-H' | 'LSIL' | 'HSIL' | 'AGC' | 'CA' | 'yetersiz' | null
export type HpvSonuc = 'neg' | '16' | '18' | 'other_hr' | 'low_risk' | null
export type Aksiyon = { adim: string; sonrakiAy: number | null; guven: number; gerekce: string; kolposkopi: boolean }

export function serviksAksiyonu(pap: PapSonuc, hpv: HpvSonuc, yasDeger: number | null): Aksiyon {
  if (pap === 'CA') return { adim: 'Onkolojik jinekoloji sevk (biyopsi ile doğrulama)', sonrakiAy: 0, guven: 95, gerekce: 'Sitolojide karsinom', kolposkopi: true }
  if (pap === 'HSIL' || pap === 'ASC-H' || pap === 'AGC') return { adim: 'Kolposkopi şimdi (AGC: endoservikal ± endometriyal örnekleme)', sonrakiAy: 0, guven: 92, gerekce: `${pap} — HSGM/ASCCP: hemen kolposkopi`, kolposkopi: true }
  if (pap === 'yetersiz') return { adim: 'Sitoloji tekrarı 3 ay', sonrakiAy: 3, guven: 90, gerekce: 'Yetersiz örnek', kolposkopi: false }
  if (hpv === '16' || hpv === '18') return { adim: 'Sitoloji + kolposkopi görevi', sonrakiAy: 0, guven: 90, gerekce: 'HPV 16/18 pozitif — sitolojiden bağımsız kolposkopi', kolposkopi: true }
  if (pap === 'LSIL') return hpv === 'neg' ? { adim: 'Ko-test 12 ay', sonrakiAy: 12, guven: 80, gerekce: 'LSIL, HPV negatif', kolposkopi: false } : { adim: 'Kolposkopi', sonrakiAy: 0, guven: 85, gerekce: 'LSIL (HPV pozitif/bilinmiyor)', kolposkopi: true }
  if (pap === 'ASC-US') { if (hpv === 'neg') return { adim: 'Ko-test 3 yıl', sonrakiAy: 36, guven: 85, gerekce: 'ASC-US, HPV negatif', kolposkopi: false }; if (hpv === 'other_hr') return { adim: 'Kolposkopi', sonrakiAy: 0, guven: 82, gerekce: 'ASC-US, HR-HPV pozitif', kolposkopi: true }; if (yasDeger != null && yasDeger < 25) return { adim: 'Sitoloji tekrarı 12 ay', sonrakiAy: 12, guven: 78, gerekce: 'ASC-US, <25 yaş, HPV bilinmiyor', kolposkopi: false }; return { adim: 'HPV refleks testi (yoksa sitoloji 12 ay)', sonrakiAy: 12, guven: 75, gerekce: 'ASC-US, HPV bilinmiyor', kolposkopi: false } }
  if (hpv === 'other_hr') return { adim: 'Tekrar ko-test 12 ay', sonrakiAy: 12, guven: 88, gerekce: 'Diğer HR-HPV pozitif, sitoloji normal', kolposkopi: false }
  if (hpv === 'neg') return { adim: 'Rutin tarama +5 yıl', sonrakiAy: 60, guven: 92, gerekce: 'HPV negatif', kolposkopi: false }
  if (pap === 'NILM') return { adim: yasDeger != null && yasDeger < 30 ? 'Rutin Pap +3 yıl' : 'HPV testi ekle / ko-test +5 yıl', sonrakiAy: yasDeger != null && yasDeger < 30 ? 36 : 60, guven: 85, gerekce: 'NILM', kolposkopi: false }
  return { adim: 'Sonuç eksik — sitoloji ve HPV girilmeli', sonrakiAy: null, guven: 0, gerekce: '', kolposkopi: false }
}

// ---------- STI / vajinit ----------
export const CYBH_ETKENLERI = ['candida', 'bv', 'trichomonas', 'chlamydia', 'gonorrhea', 'm_genitalium', 'hsv1', 'hsv2', 'hpv_wart', 'syphilis', 'hiv', 'hbv'] as const
export type Etken = (typeof CYBH_ETKENLERI)[number]
const BAKTERIYEL_STI: Etken[] = ['trichomonas', 'chlamydia', 'gonorrhea', 'm_genitalium', 'syphilis']
export function partnerTedaviGerekli(etkenler: Etken[]): boolean { return etkenler.some((e) => BAKTERIYEL_STI.includes(e)) }
export function ilkUlserKontrolListesi(ilkGenitalUlser: boolean): string[] { return ilkGenitalUlser ? ['HIV testi (zorunlu kontrol listesi)', 'RPR/VDRL (sifiliz)', 'HSV PCR/kültür'] : [] }
export function akintiOnTani(m: { ph?: number | null; whiff?: boolean | null; clueCell?: boolean | null; hif?: boolean | null; hareketliTrichomonas?: boolean | null }): { etken: Etken | null; guven: number; gerekce: string } {
  if (m.hareketliTrichomonas) return { etken: 'trichomonas', guven: 85, gerekce: 'Islak yaymada hareketli trikomonas' }
  if (m.clueCell && (m.whiff || (m.ph != null && m.ph > 4.5))) return { etken: 'bv', guven: 80, gerekce: 'Amsel: clue cell + pH>4,5 / whiff' }
  if (m.hif && (m.ph == null || m.ph <= 4.5)) return { etken: 'candida', guven: 78, gerekce: 'Hif/spor, pH normal' }
  return { etken: null, guven: 0, gerekce: 'Ofis bulguları yeterli değil — PCR/kültür' }
}
export type HsvKarti = { tip: 'hsv1' | 'hsv2'; ilkAtak: boolean; atakYil: number; supresyon: boolean }
export function hsvGebelikGorevleri(k: HsvKarti, gebe: boolean): string[] { return gebe ? ['36. haftada asiklovir/valasiklovir supresyon görevi (hekim reçete eder)', 'Doğum planı notu: aktif lezyon veya prodrom → C/S değerlendir (hekim onaylar)'] : k.atakYil >= 6 ? ['Supresif tedavi tartışılabilir (≥6 atak/yıl) — hekim kararı'] : [] }

// ---------- PCOS (Rotterdam, TJOD 2023) ----------
export type PcosGirdi = { oligoAnovulasyon: boolean; hiperandrojenizm: boolean; pcomUs: boolean; menarsYil: number | null; dislama: { tsh?: boolean; prl?: boolean; ohp17?: boolean } }
export function pcosDegerlendir(g: PcosGirdi): { kriterSayisi: number; rotterdamKarsilar: boolean; dislamaTam: boolean; not: string[]; tanikilidi: false } {
  const k = [g.oligoAnovulasyon, g.hiperandrojenizm, g.pcomUs].filter(Boolean).length
  const not: string[] = []
  const dislamaTam = !!(g.dislama.tsh && g.dislama.prl && g.dislama.ohp17)
  if (!dislamaTam) not.push('Dışlama laboratuvarı eksik (TSH, PRL, 17-OHP) — tanı öncesi tamamlanmalı.')
  if (g.menarsYil != null && g.menarsYil < 1) not.push('TJOD 2023: menarştan sonraki ilk yılda PCOS tanısı konmaz; bulgular sürerse yeniden değerlendirin.')
  if (g.pcomUs && k === 1) not.push('PCOM tek başına PCOS değildir.')
  return { kriterSayisi: k, rotterdamKarsilar: k >= 2 && dislamaTam && !(g.menarsYil != null && g.menarsYil < 1), dislamaTam, not, tanikilidi: false }
}

// ---------- Contraception / IUD ----------
export function riaTakvimi(takildi: Tarih, tip: 'cu5' | 'cu10' | 'lng5' | 'lng8'): { ipKontrol: Tarih; pidUyariBitis: Tarih; sonKullanim: Tarih } {
  const [y, m, d] = takildi.split('-').map(Number); const p = (g: number) => new Date(Date.UTC(y, m - 1, d + g)).toISOString().slice(0, 10)
  return { ipKontrol: p(35), pidUyariBitis: p(20), sonKullanim: ekleAy(takildi, { cu5: 60, cu10: 120, lng5: 60, lng8: 96 }[tip]) }
}

// ---------- Menopause / HRT ----------
export type HrtOnKontrol = { mamografi12Ay: boolean; tvusEt: number | null; vteOykusu: boolean; memeCa: boolean; tanisizKanama: boolean; karacigerHastaligi: boolean; sigara: boolean; yas: number | null; menopozYil: number | null }
export function hrtOnDegerlendirme(h: HrtOnKontrol): { engeller: string[]; uyarilar: string[]; eksikler: string[] } {
  const engeller: string[] = [], uyarilar: string[] = [], eksikler: string[] = []
  if (h.vteOykusu) engeller.push('VTE öyküsü — oral östrojen kontrendike; transdermal için hematoloji görüşü')
  if (h.memeCa) engeller.push('Meme kanseri öyküsü')
  if (h.tanisizKanama) engeller.push('Tanısız vajinal kanama — önce endometriyum değerlendirmesi')
  if (h.karacigerHastaligi) engeller.push('Aktif karaciğer hastalığı')
  if (!h.mamografi12Ay) eksikler.push('Son 12 ay mamografi')
  if (h.tvusEt == null) eksikler.push('TVUS endometriyum kalınlığı')
  else if (h.tvusEt > 4) uyarilar.push(`ET ${h.tvusEt} mm (>4 mm postmenopozda) — endometriyum değerlendirmesi`)
  if (h.sigara) uyarilar.push('Sigara — transdermal yol tercih')
  if (h.yas != null && h.yas >= 60) uyarilar.push('≥60 yaş: başlangıç için risk/yarar dikkatle')
  if (h.menopozYil != null && h.menopozYil > 10) uyarilar.push('Menopoz üzerinden >10 yıl: kardiyovasküler pencere kapalı olabilir')
  return { engeller, uyarilar, eksikler }
}
export const HRT_YILLIK_GOREVLER = ['Mamografi', 'TVUS endometriyum', 'Tansiyon', 'VTE semptom sorgusu', 'Meme muayenesi', 'Lipid/glukoz']

// ---------- Infertility step 1 (stop at sevk) ----------
export const INFERTILITE_ADIM1 = ['Deneme süresi (≥12 ay; ≥35 yaş için 6 ay)', 'AMH', 'TSH, PRL', 'Semen analizi (sevk)', 'HSG (stub)', 'Siklus takibi / ovulasyon', 'IVF merkeze sevk (Notya burada durur)']

// ---------- Red flags ----------
export function kirmiziBayraklar(g: { bhcgPozitif?: boolean; agri?: boolean; kanama?: boolean; ates?: boolean; servikalHassasiyet?: boolean; postmenopozKanama?: boolean }): { kod: string; mesaj: string }[] {
  const out: { kod: string; mesaj: string }[] = []
  if (g.bhcgPozitif && (g.agri || g.kanama)) out.push({ kod: 'ektopik', mesaj: 'β-hCG pozitif + ağrı/kanama → ektopik gebelik dışlanmalı (TVUS, seri β-hCG)' })
  if (g.ates && g.servikalHassasiyet) out.push({ kod: 'pid', mesaj: 'Ateş + servikal hareket hassasiyeti → PID düşünün' })
  if (g.postmenopozKanama) out.push({ kod: 'pmp', mesaj: 'Postmenopozal kanama → endometriyum değerlendirmesi (TVUS ET, biyopsi)' })
  return out
}

export const YILLIK_KONTROL_ALANLARI = ['lmp', 'gravida_para', 'kontrasepsiyon', 'sigara', 'aile_meme_over', 'spekulum', 'bimanuel', 'tvus_uterus_mm', 'tvus_et_mm', 'tvus_overler', 'meme_palpasyon'] as const
