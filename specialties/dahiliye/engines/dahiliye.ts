/**
 * NOTYA-DAH-01 — İç hastalıkları (muayenehane dahiliye) V1 rules. Pure functions; AI drafts, hekim kilitler.
 * ref_code on every node (shown only behind the clinician "kaynak" toggle):
 *   TIHUD2023 · HARRISON · TEMD_DM2026 · HT_UZLASI2025 · TEMD_HT2022 · TEMD_LIPID · TEMD_TIROID2025 · TEMD_OBEZITE2024 · TEMD_OSTEO2025
 * No drug doses from memory — class + "hekim dozu yazar". No fake SCORE2. No CKD stage without creatinine.
 */
export type Ref = 'TIHUD2023' | 'HARRISON' | 'TEMD_DM2026' | 'HT_UZLASI2025' | 'TEMD_HT2022' | 'TEMD_LIPID' | 'TEMD_TIROID2025' | 'TEMD_OBEZITE2024' | 'TEMD_OSTEO2025' | 'TEMD_RAMAZAN' | 'HSGM_HT2025' | 'HYP' | 'KETEM' | 'SGK'
export type Dipnot = { ref: Ref; not: string }
export const REF_ACIKLAMA: Record<Ref, string> = { TIHUD2023: 'TİHUD İç Hastalıkları 4. baskı (2023)', HARRISON: 'Harrison İç Hastalıkları Prensipleri 20 (TR)', TEMD_DM2026: 'TEMD Diyabet 2026', HT_UZLASI2025: 'Türk Hipertansiyon Uzlaşı Raporu 2025', TEMD_HT2022: 'TEMD Hipertansiyon 2022', TEMD_LIPID: 'TEMD Dislipidemi 2021', TEMD_TIROID2025: 'TEMD Tiroid 2025', TEMD_OBEZITE2024: 'TEMD Obezite 2024', TEMD_OSTEO2025: 'TEMD Osteoporoz 2025', TEMD_RAMAZAN: 'TEMD Ramazan ve Diyabet Rehberi', HSGM_HT2025: 'Sağlık Bakanlığı HSGM Hipertansiyon 2025', HYP: 'Halk Sağlığı Genel Müdürlüğü Yetişkin Hastalık Yönetim Platformu (HYP)', KETEM: 'Sağlık Bakanlığı KETEM ulusal kanser tarama programları', SGK: 'SGK Sağlık Uygulama Tebliği (SUT) — güncel metin hekim doğrular' }
const ekleAy = (t: string, ay: number) => { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }
const eski = (t: string | null, bugun: string, ay: number) => !t || t < ekleAy(bugun, -ay)

// ---------- 1. Hipertansiyon (Uzlaşı 2025 office BP) ----------
export type KbSinif = 'normal' | 'artmis' | 'ht_evre1' | 'ht_evre2'
export function kbSinifla(sbp: number, dbp: number): { sinif: KbSinif; ad: string; dipnot: Dipnot } {
  const d: Dipnot = { ref: 'HT_UZLASI2025', not: 'Ofis KB: normal <120/80; artmış 120–139/80–89; HT ≥140/90; evre 1 140–159/90–99; evre 2 ≥160/≥100' }
  if (sbp >= 160 || dbp >= 100) return { sinif: 'ht_evre2', ad: 'Hipertansiyon evre 2', dipnot: d }
  if (sbp >= 140 || dbp >= 90) return { sinif: 'ht_evre1', ad: 'Hipertansiyon evre 1', dipnot: d }
  if (sbp >= 120 || dbp >= 80) return { sinif: 'artmis', ad: 'Artmış kan basıncı', dipnot: d }
  return { sinif: 'normal', ad: 'Normal', dipnot: d }
}
export type KbHedef = { hedefSbp: [number, number]; hedefDbp: [number, number] | null; tedaviEsigi: [number, number]; kova: '18-79' | '80+' | 'kirilgan'; dipnot: Dipnot }
export function kbHedefi(yas: number | null, kirilgan: boolean): KbHedef {
  const d: Dipnot = { ref: 'HT_UZLASI2025', not: 'Hedefler komorbiditeden bağımsız yaş/kırılganlık kovaları; hekim override edebilir' }
  if (kirilgan) return { hedefSbp: [140, 150], hedefDbp: null, tedaviEsigi: [160, 90], kova: 'kirilgan', dipnot: d }
  if (yas != null && yas >= 80) return { hedefSbp: [130, 140], hedefDbp: null, tedaviEsigi: [140, 90], kova: '80+', dipnot: d }
  return { hedefSbp: [120, 130], hedefDbp: [70, 80], tedaviEsigi: [140, 90], kova: '18-79', dipnot: d }
}
export type HtGirdi = { sbp: number; dbp: number; yas: number | null; kirilgan: boolean; onceki: { sbp: number; dbp: number; tarih: string }[]; aktifAntihipertansif: number; diuretikVar: boolean; sekonderSuphe?: boolean }
export type HtPlan = { sinif: KbSinif; hedef: KbHedef; hedefteMi: boolean; dogrulanmisHt: boolean; plan: string[]; direncli: boolean; baslangicTetkik: string[]; sevk: string[]; dipnotlar: Dipnot[] }
export function htDegerlendir(g: HtGirdi): HtPlan {
  const s = kbSinifla(g.sbp, g.dbp); const h = kbHedefi(g.yas, g.kirilgan)
  const hedefteMi = g.sbp <= h.hedefSbp[1] && (h.hedefDbp ? g.dbp <= h.hedefDbp[1] : true)
  const yuksekOlcum = [{ sbp: g.sbp, dbp: g.dbp }, ...g.onceki.slice(0, 2)].filter((o) => o.sbp >= 140 || o.dbp >= 90).length
  const dogrulanmisHt = yuksekOlcum >= 2 || s.sinif === 'ht_evre2'
  const plan: string[] = [], sevk: string[] = []
  const esik = g.sbp >= h.tedaviEsigi[0] || g.dbp >= h.tedaviEsigi[1]
  if (s.sinif === 'artmis') plan.push('Yaşam tarzı 3 ay (tuz <5 g, DASH, egzersiz, kilo, alkol); 3 ayda tekrar ofis KB ± ev KB')
  if (s.sinif === 'ht_evre1' && !dogrulanmisHt) plan.push('Tek ölçüm: 1–4 hafta içinde tekrar ofis KB veya ev/ambulatuvar KB ile doğrulama')
  if (dogrulanmisHt && esik && g.aktifAntihipertansif === 0) plan.push('Başlangıç kombinasyon önerisi (hekim seçer): ACEi/ARB + KKB VEYA ACEi/ARB + tiyazid-benzeri diüretik — tek hap tercih; hekim dozu yazar')
  if (dogrulanmisHt && !hedefteMi && g.aktifAntihipertansif >= 1) plan.push('Hedef dışı: basamak artışı / üçlü kombinasyona geçiş (ACEi-ARB + KKB + diüretik) — hekim kararı')
  const direncli = !hedefteMi && g.aktifAntihipertansif >= 3 && g.diuretikVar
  if (direncli) { plan.push('Dirençli HT: ilaç uyumu, ev/ambulatuvar KB, sekonder neden taraması; spironolakton eklenmesi tartışılır (hekim)'); sevk.push('Nefroloji / hipertansiyon merkezi (dirençli HT)') }
  if (g.sekonderSuphe) sevk.push('Sekonder HT araştırma: nefroloji / endokrinoloji (V1: sihirbaz yok, sevk notu)')
  const baslangicTetkik = ['Açlık glukoz / HbA1c', 'Lipid paneli', 'Kreatinin + eGFR', 'Na / K', 'Spot idrar albümin/kreatinin (UACR)', 'EKG belgesi (Belgeler)']
  return { sinif: s.sinif, hedef: h, hedefteMi, dogrulanmisHt, plan, direncli, baslangicTetkik, sevk, dipnotlar: [s.dipnot, h.dipnot, { ref: 'HT_UZLASI2025', not: 'HT doğrulandığında ikili kombinasyon ile başlangıç; dirençli HT: ≥3 ilaç (diüretik dahil) hedef dışı' }, { ref: 'TIHUD2023', not: 'Başlangıç tetkik seti' }] }
}

// ---------- 2. Diyabet (TEMD 2026) ----------
export type DmGirdi = { tip: 'T2' | 'T1' | 'diger'; taniTarihi: string | null; hba1c: number | null; oncekiHba1c: { deger: number; tarih: string }[]; hedefHba1c: number | null; ilacSiniflari: string[]; eGFR: number | null; sonUacr: string | null; sonGozDibi: string | null; sonAyak: string | null; sonLipid: string | null; bugun: string }
export type DmPlan = { kontrolde: boolean | null; delta: number | null; sonrakiHba1cAy: 3 | 6; gorevler: { kod: string; ad: string; due: string | null }[]; uyarilar: string[]; plan: string[]; dipnotlar: Dipnot[] }
export function dmDegerlendir(g: DmGirdi): DmPlan {
  const hedef = g.hedefHba1c ?? 7.0
  const kontrolde = g.hba1c == null ? null : g.hba1c <= hedef
  const delta = g.hba1c != null && g.oncekiHba1c[0] ? Math.round((g.hba1c - g.oncekiHba1c[0].deger) * 10) / 10 : null
  const sonrakiAy: 3 | 6 = kontrolde === false || g.hba1c == null ? 3 : 6
  const gorevler: DmPlan['gorevler'] = [{ kod: 'dm_hba1c', ad: `HbA1c kontrolü (${sonrakiAy} ay)`, due: ekleAy(g.bugun, sonrakiAy) }]
  if (eski(g.sonUacr, g.bugun, 12)) gorevler.push({ kod: 'dm_uacr', ad: 'Yıllık spot idrar UACR + eGFR', due: g.bugun })
  if (eski(g.sonGozDibi, g.bugun, 12)) gorevler.push({ kod: 'dm_goz', ad: 'Yıllık göz dibi — göz sevki', due: g.bugun })
  if (eski(g.sonAyak, g.bugun, 12)) gorevler.push({ kod: 'dm_ayak', ad: 'Yıllık ayak muayenesi (monofilaman, nabız, cilt)', due: g.bugun })
  if (eski(g.sonLipid, g.bugun, 12)) gorevler.push({ kod: 'dm_lipid', ad: 'Yıllık lipid paneli', due: g.bugun })
  const uyarilar: string[] = [], plan: string[] = []
  if (g.eGFR != null && g.eGFR < 30 && g.ilacSiniflari.includes('metformin')) uyarilar.push('eGFR <30: metformin kontrendike — hekim gözden geçirsin')
  else if (g.eGFR != null && g.eGFR < 45 && g.ilacSiniflari.includes('metformin')) uyarilar.push('eGFR 30–44: metformin doz azaltımı — hekim kararı')
  if (g.eGFR != null && g.eGFR < 20 && g.ilacSiniflari.includes('sglt2')) uyarilar.push('eGFR <20: SGLT2 başlanmaz (devam kararı nefroloji/hekim)')
  if (g.tip === 'T2' && g.hba1c != null && !g.ilacSiniflari.length) plan.push('Yaşam tarzı + metformin (kontrendikasyon yoksa) — sınıf önerisi; hekim dozu yazar')
  if (g.tip === 'T2' && kontrolde === false && g.ilacSiniflari.length >= 1) plan.push('Hedef dışı: ek sınıf (SGLT2 — KVH/KBH/KY varsa öncelikli; GLP-1 — obezite/KVH; DPP-4; sülfonilüre) — hekim seçer, doz yazar')
  if (g.hba1c != null && g.hba1c >= 10) plan.push('HbA1c ≥10 / semptomatik: insülin gereksinimi değerlendir — asistan titrasyon yapmaz')
  if (g.tip === 'T1') plan.push('Tip 1: insülin rejimi hekim/endokrin; DKA eğitimi; hipoglisemi planı')
  return { kontrolde, delta, sonrakiHba1cAy: sonrakiAy, gorevler, uyarilar, plan, dipnotlar: [{ ref: 'TEMD_DM2026', not: 'HbA1c 3 ayda bir (hedef dışı) / 6 ayda bir (hedefte); yıllık UACR, eGFR, lipid, ayak, göz dibi; genel hedef HbA1c <7 (bireyselleştirilir)' }, { ref: 'TIHUD2023', not: 'Tek glukoz ile DM tanısı konmaz; doğrulama gerekir' }] }
}

// ---------- 3. Lipid (TEMD 2021 + hekim hedefi) ----------
export type LipidGirdi = { tc: number | null; ldl: number | null; hdl: number | null; tg: number | null; hedefLdl: number | null; statinVar: boolean; statinBaslangic: string | null; alt: { deger: number; tarih: string }[]; ck: number | null; dm: boolean; ht: boolean; obezite: boolean; bugun: string }
export function lipidDegerlendir(g: LipidGirdi): { ldlHedefte: boolean | null; uyarilar: string[]; plan: string[]; yillikPanel: boolean; dipnotlar: Dipnot[] } {
  const uyarilar: string[] = [], plan: string[] = []
  const ldlHedefte = g.ldl == null || g.hedefLdl == null ? null : g.ldl <= g.hedefLdl
  if (g.hedefLdl == null) plan.push('LDL hedefi hekim alanıdır: kılavuza göre yüksek/çok yüksek riskte daha düşük hedef tartışılır (rakam otomatik kilitlenmez)')
  if (ldlHedefte === false) plan.push(g.statinVar ? 'Hedef dışı statin altında: statin yoğunluğu artışı veya ezetimib ekleme — hekim' : 'Statin başlangıcı sınıf önerisi — hekim dozu yazar')
  if (g.tg != null && g.tg >= 500) uyarilar.push('TG ≥500: pankreatit riski — fibrat/omega-3 ve sekonder nedenler (DM, alkol, hipotiroidi) — hekim')
  if (g.statinVar && g.statinBaslangic && g.alt.length >= 2) {
    const sonrasi = g.alt.filter((a) => a.tarih >= g.statinBaslangic!).sort((a, b) => b.tarih.localeCompare(a.tarih))[0]
    const oncesi = g.alt.filter((a) => a.tarih < g.statinBaslangic!).sort((a, b) => b.tarih.localeCompare(a.tarih))[0]
    if (sonrasi && oncesi && sonrasi.deger > oncesi.deger * 3 && sonrasi.deger > 120) uyarilar.push(`Statin sonrası ALT ${oncesi.deger} → ${sonrasi.deger} (>3× ÜSN): ilaç gözden geçirme — hekim`)
    else if (sonrasi && oncesi && sonrasi.deger > oncesi.deger * 1.5) uyarilar.push(`Statin sonrası ALT yükselişi ${oncesi.deger} → ${sonrasi.deger}: izlem`)
  }
  if (g.statinVar && g.ck != null && g.ck > 1000) uyarilar.push('CK >1000 + kas ağrısı: statin kes — hekim (miyopati)')
  const yillikPanel = g.dm || g.ht || g.obezite
  return { ldlHedefte, uyarilar, plan, yillikPanel, dipnotlar: [{ ref: 'TEMD_LIPID', not: 'DM/HT/obezitede yıllık lipid; statin altında ALT/CK izlemi' }] }
}

// ---------- 4. Tiroid (TEMD 2025) ----------
export function tiroidDegerlendir(g: { tsh: number | null; ft4: number | null; levoMcg: number | null; kiloKg: number | null; sonDozDegisim: string | null; nodulVar: boolean; bugun: string }): { yorum: string; gorevler: { kod: string; ad: string; due: string }[]; sevk: string[]; dipnotlar: Dipnot[] } {
  const gorevler: { kod: string; ad: string; due: string }[] = [], sevk: string[] = []
  let yorum = 'TSH/fT4 girilmedi'
  if (g.tsh != null) {
    if (g.tsh > 10) yorum = 'TSH >10: aşikâr hipotiroidi olasılığı — levotiroksin (hekim dozu yazar; tam replasman ~1,6 mcg/kg tartışılır)'
    else if (g.tsh > 4.5) yorum = 'TSH 4,5–10: subklinik hipotiroidi — fT4, anti-TPO, 6–8 haftada tekrar; tedavi kararı bireysel'
    else if (g.tsh < 0.1) yorum = 'TSH baskılı: hipertiroidi araştırma (fT4/fT3, TRAb, sintigrafi) — endokrin sevk'
    else if (g.tsh < 0.4) yorum = 'TSH hafif düşük: tekrar + fT4'
    else yorum = 'TSH normal'
  }
  if (g.sonDozDegisim && g.sonDozDegisim >= ekleAy(g.bugun, -2)) gorevler.push({ kod: 'tsh_kontrol', ad: 'Doz değişimi sonrası TSH kontrolü (6–8 hafta)', due: ekleAy(g.sonDozDegisim, 2) })
  if (g.nodulVar) { gorevler.push({ kod: 'tiroid_us', ad: 'Tiroid US belgesi → Belgeler › Asistana raporla (TI-RADS tarzı tarif)', due: g.bugun }); sevk.push('Nodül: İİAB / ablasyon / cerrahi kararı endokrin — ofis V1 dışı') }
  return { yorum, gorevler, sevk, dipnotlar: [{ ref: 'TEMD_TIROID2025', not: 'TSH eşikleri ve doz değişimi sonrası 6–8 hafta kontrol; girişimsel nodül yönetimi ofis dışı' }] }
}

// ---------- 5. Check-up ----------
export const CHECKUP_SABLONU = ['Hemogram', 'Açlık glukoz', 'HbA1c', 'Lipid paneli', 'TSH', 'Kreatinin + eGFR', 'ALT/AST', 'Na/K', 'EKG belgesi', 'Akciğer grafisi (isteğe bağlı)', 'Batın US (isteğe bağlı)']
export function checkupAraligi(yas: number | null): { ay: number; not: string; dipnot: Dipnot } {
  const d: Dipnot = { ref: 'TIHUD2023', not: 'Hastane pratiği; yasal zorunluluk değil; hekim susturabilir' }
  if (yas == null) return { ay: 12, not: 'yaş bilinmiyor', dipnot: d }
  return yas >= 40 ? { ay: 12, not: '≥40: yıllık', dipnot: d } : { ay: 18, not: '18–39: 1–2 yıl', dipnot: d }
}
export function dxaGorevi(kadin: boolean, yas: number | null, erkenRisk: boolean): { gerekli: boolean; not: string; dipnot: Dipnot } {
  const gerekli = (kadin && yas != null && yas >= 65) || erkenRisk
  return { gerekli, not: gerekli ? 'DXA hatırlatması (yalnız hatırlatma)' : '—', dipnot: { ref: 'TEMD_OSTEO2025', not: 'Kadın ≥65 veya erken risk bayrakları (erken menopoz, steroid, kırık öyküsü)' } }
}

// ---------- 6. İlaç güvenliği (eGFR / polifarmasi) ----------
export const ILAC_GUVENLIK_DIPNOT: Dipnot[] = [{ ref: 'TEMD_DM2026', not: 'eGFR <30: metformin kontrendike; sülfonilürede hipoglisemi riski' }, { ref: 'TIHUD2023', not: 'KBH\'de NSAİİ\'den kaçınma; MRA ile hiperkalemi; DOAK böbrek fonksiyonuna göre değerlendirilir; ≥5 ilaç polifarmasi' }]
const EGFR30_UYARI: [RegExp, string][] = [[/metformin/i, 'metformin kontrendike (eGFR <30)'], [/ibuprofen|naproksen|diklofenak|nsaii|nsaid|etodolak|meloksikam/i, 'NSAİİ kaçın (eGFR <30)'], [/rivaroksaban|dabigatran|apiksaban|edoksaban/i, 'DOAK doz/uygunluk gözden geçir (eGFR <30)'], [/spironolakton|eplerenon/i, 'MRA + eGFR <30: hiperkalemi riski'], [/gliburid|glibenklamid/i, 'sülfonilüre hipoglisemi riski (eGFR <30)']]
export function ilacGuvenlik(ilaclar: { ad: string; aktif: boolean }[], eGFR: number | null): { uyarilar: string[]; polifarmasi: boolean; aktifSayi: number } {
  const aktif = ilaclar.filter((i) => i.aktif)
  const uyarilar: string[] = []
  if (eGFR != null && eGFR < 30) for (const i of aktif) for (const [re, u] of EGFR30_UYARI) if (re.test(i.ad)) uyarilar.push(`${i.ad}: ${u} — metin uyarısı, engel değil`)
  return { uyarilar, polifarmasi: aktif.length >= 5, aktifSayi: aktif.length }
}

// ---------- 8. Red flags ----------
export const KIRMIZI_DIPNOT: Dipnot[] = [{ ref: 'TIHUD2023', not: 'Ofiste acil sevk gerektiren bulgular: akut koroner sendrom şüphesi, K >6,0, Hb <7, akut böbrek hasarı (eGFR >%30 düşüş), ateş + lökositoz (sepsis değerlendirmesi)' }, { ref: 'HARRISON', not: 'Hiperkalemi ve akut koroner sendromda EKG ve acil değerlendirme' }]
export function kirmiziBayraklar(g: { gogusAgrisi: boolean; yeniEkg: boolean; k: number | null; hb: number | null; eGFR: number | null; oncekiEGFR: number | null; ates: boolean; wbc: number | null }): string[] {
  const out: string[] = []
  if (g.gogusAgrisi && g.yeniEkg) out.push('Göğüs ağrısı + yeni EKG: akut koroner sendrom dışlanmalı — acil/kardiyoloji')
  if (g.k != null && g.k > 6.0) out.push(`K ${g.k} >6,0: hiperkalemi — EKG + acil`)
  if (g.hb != null && g.hb < 7) out.push(`Hb ${g.hb} <7: ağır anemi — transfüzyon değerlendirmesi`)
  if (g.eGFR != null && g.oncekiEGFR != null && g.eGFR < g.oncekiEGFR * 0.7) out.push(`eGFR ${g.oncekiEGFR} → ${g.eGFR} (>%30 düşüş): akut böbrek hasarı — nefroloji/acil`)
  if (g.ates && g.wbc != null && g.wbc > 12) out.push('Ateş + lökositoz: enfeksiyon odağı / sepsis değerlendirmesi')
  return out
}
export const SEVK_HEDEFLERI = ['kardiyoloji', 'endokrinoloji', 'nefroloji', 'gastroenteroloji', 'gogus', 'goz', 'uroloji'] as const
