/**
 * NOTYA-JINE-02 — Jinekoloji V2 rules (kadın-doğum only). AI drafts; doctor locks.
 * Golden refs (ref_code on every node, shown only behind the clinician "kaynak" toggle, never on patient print):
 *   BEREK (Berek & Novak 16 TR) · SPEROFF (Klinik Jinekolojik Endokrinoloji ve İnfertilite TR) · TJOD_OK (Oral Kontrasepsiyon)
 *   TJOD_MENORAJI · TJOD_PCOS23 · TJOD_ENDO14 · TJOD_RM (RCOG/TJOD tekrarlayan gebelik kaybı) · HSGM_HPV · WHO_MEC (KOK uygunluk)
 * Nodes: AUB/PALM-COEIN + PMP pathway · KOK gate (WHO MEC 4 = block, 3 = caution) · Endometriozis · Tekrarlayan gebelik kaybı ·
 *        Erken gebelik kaybı (definitive TVUS criteria + βhCG trend) — Williams labour tools are NOT here.
 */
export type RefKod = 'BEREK' | 'SPEROFF' | 'TJOD_OK' | 'TJOD_MENORAJI' | 'TJOD_PCOS23' | 'TJOD_ENDO14' | 'TJOD_RM' | 'HSGM_HPV' | 'WHO_MEC' | 'ACOG'
export type Dipnot = { ref: RefKod; not: string }

// ---------- 1. AUB — PALM-COEIN (FIGO) ----------
export const PALM = [['P', 'Polip'], ['A', 'Adenomyozis'], ['L', 'Leiomyom'], ['M', 'Malignite / hiperplazi']] as const
export const COEIN = [['C', 'Koagülopati'], ['O', 'Ovulatuvar disfonksiyon'], ['E', 'Endometriyal'], ['I', 'İyatrojenik'], ['N', 'Sınıflandırılmamış']] as const
export type AubGirdi = { yas: number | null; postmenopoz: boolean; palm: Record<string, boolean>; coein: Record<string, boolean>; sureGun: number | null; pedAdet: number | null; pihti: boolean; hb: number | null; ferritin: number | null; obezite?: boolean; anovulasyonOykusu?: boolean; kronikAub?: boolean }
export type AubPlan = { menoraji: boolean; anemi: 'yok' | 'hafif' | 'orta' | 'agir' | 'bilinmiyor'; tetkikler: string[]; endometrialOrnekZorunlu: boolean; gerekce: string[]; dipnotlar: Dipnot[] }

export function aubDegerlendir(g: AubGirdi): AubPlan {
  const dip: Dipnot[] = []
  const menoraji = (g.sureGun != null && g.sureGun > 7) || (g.pedAdet != null && g.pedAdet >= 20) || g.pihti
  if (menoraji) dip.push({ ref: 'TJOD_MENORAJI', not: '>7 gün, ≥20 ped/adet veya pıhtı = ağır adet kanaması' })
  const anemi: AubPlan['anemi'] = g.hb == null ? 'bilinmiyor' : g.hb >= 12 ? 'yok' : g.hb >= 10 ? 'hafif' : g.hb >= 8 ? 'orta' : 'agir'
  const tetkikler = ['TVUS (endometriyum, myom, adneks)', 'Hemogram (Hb, MCV) + ferritin', 'TSH', 'β-hCG (üreme çağında)']
  if (g.coein.C || (g.yas != null && g.yas < 20 && menoraji)) { tetkikler.push('Koagülasyon paneli (PT/aPTT, vWF) — adölesan menorajide vWD taraması'); dip.push({ ref: 'BEREK', not: 'Adölesan ağır menorajide koagülopati %10–20' }) }
  const gerekce: string[] = []
  let zorunlu = false
  if (g.postmenopoz) { zorunlu = true; gerekce.push('Postmenopozal kanama: endometriyal örnekleme zorunlu; ofis sitolojisi/Pap PMP tanısını KAPATMAZ'); dip.push({ ref: 'TJOD_MENORAJI', not: 'Brush sitoloji PMP\'de küretaj/pipelle yerine geçmez' }) }
  else if (g.yas != null && g.yas >= 45) { zorunlu = true; gerekce.push('≥45 yaş AUB: endometriyal örnekleme (pipelle) önerilir') }
  else if (g.yas != null && g.yas < 45 && (g.obezite || g.anovulasyonOykusu || (g.kronikAub && g.hb != null && g.hb < 12))) { zorunlu = true; gerekce.push('<45 yaş + karşılanmamış östrojen (obezite/anovulasyon) veya tedaviye dirençli kronik AUB: örnekleme') }
  if (zorunlu) { tetkikler.push('Endometriyal örnekleme görevi (pipelle; başarısızsa D&C — onam kütüphanesi)'); dip.push({ ref: 'BEREK', not: 'ACOG/Berek: ≥45 yaş veya risk faktörlü <45 AUB\'de örnekleme' }) }
  if (anemi === 'agir') gerekce.push('Ağır anemi (Hb <8): acil değerlendirme, transfüzyon ihtiyacı hekim kararı')
  dip.push({ ref: 'BEREK', not: 'FIGO PALM-COEIN sınıflaması' })
  return { menoraji, anemi, tetkikler, endometrialOrnekZorunlu: zorunlu, gerekce, dipnotlar: dip }
}

/** PMP pathway: sampling is the gate; ET is context. Cytology never closes it. */
export type PmpDurum = { tvusEt: number | null; ornekleme: { tur: 'pipelle' | 'dc' | 'histeroskopi' | null; sonuc: string | null } ; sitolojiVar: boolean }
export function pmpKapatilabilir(p: PmpDurum): { kapatilabilir: boolean; eksik: string[]; not: string[]; dipnotlar: Dipnot[] } {
  const eksik: string[] = [], not: string[] = []
  if (p.tvusEt == null) eksik.push('TVUS endometriyum kalınlığı')
  if (!p.ornekleme.tur || !p.ornekleme.sonuc) eksik.push('Endometriyal örnekleme sonucu (pipelle / D&C / histeroskopi)')
  if (p.sitolojiVar && (!p.ornekleme.tur || !p.ornekleme.sonuc)) not.push('Pap/sitoloji tek başına PMP değerlendirmesini kapatmaz')
  if (p.tvusEt != null && p.tvusEt <= 4) not.push('ET ≤4 mm: tek epizod PMP\'de örnekleme ertelenebilir (ACOG) — ancak tekrar kanamada zorunlu; hekim kararı, bu kart görevi açık tutar')
  if (p.tvusEt != null && p.tvusEt > 4) not.push('ET >4 mm: örnekleme zorunlu')
  return { kapatilabilir: eksik.length === 0, eksik, not, dipnotlar: [{ ref: 'TJOD_MENORAJI', not: 'PMP: TVUS + örnekleme; sitoloji yeterli değil' }, { ref: 'ACOG', not: 'ET ≤4 mm tek epizodda erteleme seçeneği' }] }
}

// ---------- 3. KOK — WHO MEC gate (TJOD Oral Kontrasepsiyon) ----------
export type KokGirdi = { yas: number | null; sigaraGunluk: number | null; vteOykusu: boolean; migrenAura: boolean; migrenAurasiz35Ustu?: boolean; taSistolik: number | null; taDiastolik: number | null; vaskulerHastalik: boolean; memeCa: boolean; memeCaGecmis5YilUstu?: boolean; karacigerAgir: boolean; karacigerTumor: boolean; postpartumGun: number | null; emziriyor: boolean; slePozitifApl: boolean; dmVaskuler: boolean; buyukCerrahiImmobil: boolean; bilinmeyenKanama: boolean; hiperlipidemi?: boolean; obeziteBmi?: number | null }
export type KokSonuc = { kategori: 1 | 2 | 3 | 4; engeller: string[]; dikkat: string[]; alternatif: string[]; dipnotlar: Dipnot[] }
export function kokDegerlendir(g: KokGirdi): KokSonuc {
  const e4: string[] = [], e3: string[] = []
  const sig = g.sigaraGunluk || 0
  if (g.yas != null && g.yas >= 35 && sig >= 15) e4.push('≥35 yaş + sigara ≥15/gün (MEC 4)'); else if (g.yas != null && g.yas >= 35 && sig > 0) e3.push('≥35 yaş + sigara <15/gün (MEC 3)')
  if (g.vteOykusu) e4.push('VTE öyküsü (MEC 4)')
  if (g.migrenAura) e4.push('Auralı migren (MEC 4 — inme riski)'); else if (g.migrenAurasiz35Ustu) e3.push('Aurasız migren ≥35 yaş (MEC 3)')
  if ((g.taSistolik != null && g.taSistolik >= 160) || (g.taDiastolik != null && g.taDiastolik >= 100) || g.vaskulerHastalik) e4.push('HT ≥160/100 veya vasküler hastalık (MEC 4)'); else if ((g.taSistolik != null && g.taSistolik >= 140) || (g.taDiastolik != null && g.taDiastolik >= 90)) e3.push('HT 140–159/90–99 (MEC 3)')
  if (g.memeCa) e4.push('Meme kanseri (aktif/son 5 yıl) (MEC 4)'); else if (g.memeCaGecmis5YilUstu) e3.push('Meme kanseri öyküsü >5 yıl, nükssüz (MEC 3)')
  if (g.karacigerAgir || g.karacigerTumor) e4.push('Ağır karaciğer hastalığı / karaciğer tümörü (MEC 4)')
  if (g.postpartumGun != null && g.postpartumGun < 21) e4.push('Postpartum <21 gün (MEC 4 — VTE)'); else if (g.postpartumGun != null && g.postpartumGun < 42 && g.emziriyor) e3.push('Postpartum 21–42 gün, emziriyor (MEC 3)')
  if (g.slePozitifApl) e4.push('SLE + pozitif antifosfolipid antikor (MEC 4)')
  if (g.dmVaskuler) e4.push('DM + vasküler komplikasyon (MEC 4)')
  if (g.buyukCerrahiImmobil) e4.push('Büyük cerrahi + uzun immobilizasyon (MEC 4)')
  if (g.bilinmeyenKanama) e3.push('Açıklanmamış vajinal kanama: önce değerlendir (MEC 3, değerlendirmeye kadar)')
  if (g.obeziteBmi != null && g.obeziteBmi >= 35) e3.push('BMI ≥35 (VTE riski; MEC 2–3)')
  if (g.hiperlipidemi) e3.push('Hiperlipidemi: bireysel değerlendirme')
  const kategori: KokSonuc['kategori'] = e4.length ? 4 : e3.length ? 3 : 1
  const alternatif = kategori >= 3 ? ['Sadece progestin (POP / LNG-RİA / implant) — östrojen içermeyen yöntemler çoğu MEC 4 durumunda uygundur', 'Cu-RİA'] : []
  return { kategori, engeller: e4, dikkat: e3, alternatif, dipnotlar: [{ ref: 'WHO_MEC', not: 'WHO Tıbbi Uygunluk Kriterleri (MEC) kategori 3/4' }, { ref: 'TJOD_OK', not: 'TJOD Oral Kontrasepsiyon kılavuzu başlangıç kontrol listesi' }] }
}

// ---------- 4. Endometriozis (TJOD 2014) ----------
export type EndoGirdi = { dismenore: boolean; disparoni: boolean; kronikPelvikAgri: boolean; infertilite: boolean; diskezi?: boolean; endometriomaCm: number | null; ca125: number | null; gebelikIstegi: boolean; tedaviyeDirenc?: boolean }
export type EndoKart = { triadPuan: number; olasilik: 'dusuk' | 'orta' | 'yuksek'; ampirik: string[]; sevk: string[]; not: string[]; dipnotlar: Dipnot[] }
export function endometriozisDegerlendir(g: EndoGirdi): EndoKart {
  const puan = [g.dismenore, g.disparoni, g.kronikPelvikAgri, g.infertilite, !!g.diskezi].filter(Boolean).length
  const olasilik: EndoKart['olasilik'] = g.endometriomaCm != null && g.endometriomaCm > 0 ? 'yuksek' : puan >= 3 ? 'yuksek' : puan === 2 ? 'orta' : 'dusuk'
  const ampirik: string[] = [], sevk: string[] = [], not: string[] = []
  if (!g.gebelikIstegi && puan >= 1) { ampirik.push('Ampirik NSAİİ (adet öncesi başlanan) — hekim reçete eder'); ampirik.push('Progestin / kombine OK (KOK kapısı geçilirse) — 3–6 ay ampirik; yanıt yoksa yeniden değerlendir') }
  if (g.gebelikIstegi) { not.push('Gebelik isteği: hormonal supresyon gebeliği geciktirir; infertilite yolu öncelikli'); if (g.infertilite) sevk.push('İnfertilite + endometriozis: ÜYTE/IVF merkezine sevk (Notya burada durur)') }
  if (g.endometriomaCm != null && g.endometriomaCm >= 4) sevk.push('Endometrioma ≥4 cm: cerrahi değerlendirme (laparoskopi) — hekim kararı')
  if (g.tedaviyeDirenc) sevk.push('3–6 ay medikal tedaviye dirençli ağrı: laparoskopik tanı/tedavi')
  if (g.ca125 != null) not.push(`CA-125 ${g.ca125}: tanı koydurmaz; takipte yardımcı olabilir (isteğe bağlı)`)
  not.push('Evreleme (rASRM) yalnız cerrahi ile — ofiste evreleme yapılmaz')
  return { triadPuan: puan, olasilik, ampirik, sevk, not, dipnotlar: [{ ref: 'TJOD_ENDO14', not: 'TJOD Endometriozis 2014: ampirik tedavi, cerrahi/IVF sevk kriterleri' }, { ref: 'SPEROFF', not: 'Ağrı-infertilite ekseni; hormonal supresyon gebelik isteğinde ertelenir' }] }
}

// ---------- 5. Tekrarlayan gebelik kaybı (TJOD / RCOG / ESHRE) ----------
export type RmGirdi = { klinikKayipSayisi: number; hekimEsigi3: boolean; anneYas: number | null; ardisik: boolean }
export type RmKart = { kriterKarsilandi: boolean; tetkikler: { ad: string; oneri: 'rutin' | 'secili' | 'onerilmez' }[]; not: string[]; dipnotlar: Dipnot[] }
export function rmDegerlendir(g: RmGirdi): RmKart {
  const esik = g.hekimEsigi3 ? 3 : 2
  const karsilandi = g.klinikKayipSayisi >= esik
  const tetkikler: RmKart['tetkikler'] = [
    { ad: 'Antifosfolipid sendromu: aCL IgG/IgM, lupus antikoagülanı, anti-β2GP1 — 12 hafta arayla 2 kez', oneri: 'rutin' },
    { ad: 'Uterus kavitesi: 3D TVUS / SHG / HSG (septum, sineşi, myom)', oneri: 'rutin' },
    { ad: 'TSH (± anti-TPO)', oneri: 'rutin' },
    { ad: 'Ebeveyn karyotipi', oneri: g.klinikKayipSayisi >= 3 || (g.anneYas != null && g.anneYas < 36) ? 'rutin' : 'secili' },
    { ad: 'Abortus materyali karyotip/array (bir sonraki kayıpta)', oneri: 'secili' },
    { ad: 'Kalıtsal trombofili paneli (Faktör V Leiden, protrombin)', oneri: 'onerilmez' },
    { ad: 'İmmünoterapi / paternal lökosit', oneri: 'onerilmez' },
  ]
  const not: string[] = []
  if (!karsilandi) not.push(`Klinik kayıp ${g.klinikKayipSayisi} < eşik ${esik}: tam tetkik henüz endike değil; hasta ile konuşulur`)
  if (g.anneYas != null && g.anneYas >= 40) not.push('≥40 yaş: en sık neden embriyonik anöploidi — sonraki gebelikte erken TVUS')
  not.push('IVF/PGT-A rutin önerilmez; ÜYTE kararı merkezde (Notya burada durur)')
  return { kriterKarsilandi: karsilandi, tetkikler, not, dipnotlar: [{ ref: 'TJOD_RM', not: 'TJOD/RCOG: ≥2 (ESHRE) veya 3 (RCOG) kayıp; APS, kavite, karyotip' }, { ref: 'SPEROFF', not: 'Kalıtsal trombofili taraması rutin değil' }] }
}

// ---------- 6. Erken gebelik kaybı — definitive TVUS criteria ----------
export type EgkGirdi = { crlMm: number | null; fhrVar: boolean | null; msdMm: number | null; embriyoVar: boolean | null; bhcg: { at: string; value: number }[]; rhNegatif: boolean; hafta: number | null }
export type EgkKart = { tanı: 'kesin_nonviabl' | 'suphe' | 'viabl' | 'belirsiz'; gerekce: string; secenekler: string[]; gorevler: string[]; dipnotlar: Dipnot[] }
export function egkDegerlendir(g: EgkGirdi, bhcgTrend: 'rising' | 'plateau' | 'falling' | 'insufficient'): EgkKart {
  let tani: EgkKart['tanı'] = 'belirsiz', gerekce = 'TVUS kriterleri kesin değil — 7–14 gün sonra tekrar TVUS'
  if (g.crlMm != null && g.crlMm >= 7 && g.fhrVar === false) { tani = 'kesin_nonviabl'; gerekce = 'CRL ≥7 mm ve kalp atımı yok (kesin)' }
  else if (g.msdMm != null && g.msdMm >= 25 && g.embriyoVar === false) { tani = 'kesin_nonviabl'; gerekce = 'MSD ≥25 mm ve embriyo yok (kesin)' }
  else if (g.fhrVar === true) { tani = 'viabl'; gerekce = 'Fetal kalp atımı izlendi' }
  else if ((g.crlMm != null && g.crlMm < 7 && g.fhrVar === false) || (g.msdMm != null && g.msdMm >= 16 && g.msdMm < 25 && g.embriyoVar === false)) { tani = 'suphe'; gerekce = 'Nonviabilite şüphesi — kesin değil; 7–14 gün tekrar TVUS' }
  const secenekler = tani === 'kesin_nonviabl' ? ['Bekleme (expectan) — hasta tercihi, 2–4 hafta', 'Medikal (misoprostol ± mifepriston) — hekim reçete eder', 'Cerrahi (vakum aspirasyon / D&C) — onam kütüphanesi: dc_dusuk'] : []
  const gorevler: string[] = []
  if (g.rhNegatif && tani !== 'viabl') gorevler.push('Rh negatif: anti-D immünoglobulin (hekim uygular)')
  if (tani === 'belirsiz' || tani === 'suphe') gorevler.push('Tekrar TVUS 7–14 gün')
  if (bhcgTrend === 'plateau') gorevler.push('β-hCG plato: ektopik dışla (gebelik yeri belirsiz — GTED protokolü)')
  if (bhcgTrend === 'rising' && g.embriyoVar === false && g.msdMm == null) gorevler.push('β-hCG yükseliyor, intrauterin gebelik görülmedi: PUL — 48 saatte tekrar')
  if (tani === 'kesin_nonviabl') gorevler.push('Onam: D&C / düşük (dc_dusuk) — seçenek cerrahi ise')
  return { tanı: tani, gerekce, secenekler, gorevler, dipnotlar: [{ ref: 'ACOG', not: 'Kesin nonviabilite: CRL ≥7 mm FHR yok; MSD ≥25 mm embriyo yok' }, { ref: 'BEREK', not: 'Bekleme / medikal / cerrahi eşdeğer; hasta tercihi' }] }
}

export const REF_ACIKLAMA: Record<RefKod, string> = { BEREK: 'Berek & Novak Jinekoloji 16. baskı (TR)', SPEROFF: 'Speroff Klinik Jinekolojik Endokrinoloji ve İnfertilite (TR)', TJOD_OK: 'TJOD Oral Kontrasepsiyon Kılavuzu', TJOD_MENORAJI: 'TJOD Menoraji Kılavuzu', TJOD_PCOS23: 'TJOD PKOS 2023', TJOD_ENDO14: 'TJOD Endometriozis 2014', TJOD_RM: 'TJOD / RCOG Tekrarlayan Gebelik Kaybı', HSGM_HPV: 'SB HSGM HPV-DNA tarama algoritması', WHO_MEC: 'WHO Medical Eligibility Criteria (kontrasepsiyon)', ACOG: 'ACOG Practice Bulletin' }
