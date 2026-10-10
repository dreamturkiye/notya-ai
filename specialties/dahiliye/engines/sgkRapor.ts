/**
 * NOTYA-DAH-WOW W1.4 — SGK ilaç kullanım raporu şablonları (HT / DM / statin / DOAK; WOW-NEXT C4: D vitamini / B12), aktif kartlardan ön dolu.
 * Tools › Hasta Raporları (pediatri) kabuğunun ikizi: aynı SgkRaporDraft şekli + aynı e-Nabız/Medula zarfı (lib/enabiz/paket).
 * Kurallar: etken madde YALNIZ hasta_ilaclar satırlarından (uydurma yok, doz yok); lab kanıtı YALNIZ onaylı lab satırından;
 * T.C. kimlik no hiç yazılmaz (tcSon4 boş). SUT koşulları kontrol listesi olarak — güncel madde metni hekim doğrular.
 * Rapor hekim kilitleyene kadar "taslak"tır; Medula'ya giriş hekim + e-imza ile.
 */
import type { Dipnot } from './dahiliye'
import type { SgkRaporDraft } from '@/lib/sgk/raporTipleri'

export type SgkSablon = 'ht' | 'dm' | 'statin' | 'doak' | 'vitd' | 'b12'
export const SGK_SABLONLARI: { id: SgkSablon; ad: string }[] = [
  { id: 'ht', ad: 'Hipertansiyon — antihipertansif ilaç raporu' },
  { id: 'dm', ad: 'Diyabet — oral antidiyabetik / GLP-1 / insülin raporu' },
  { id: 'statin', ad: 'Dislipidemi — lipid düşürücü ilaç raporu' },
  { id: 'doak', ad: 'Antikoagülan — DOAK / warfarin raporu' },
  { id: 'vitd', ad: 'D vitamini eksikliği — replasman raporu' },
  { id: 'b12', ad: 'Vitamin B12 eksikliği — replasman raporu' },
]

const SINIF_RE: Record<SgkSablon, RegExp> = {
  ht: /pril\b|sartan|dipin\b|amlodipin|nifedipin|lerkanidipin|hidroklorotiyazid|indapamid|klortalidon|spironolakton|eplerenon|bisoprolol|metoprolol|nebivolol|karvedilol|doksazosin|moksonidin/i,
  // "nsülin" also matches the catalogue's capital-İ spelling ("İnsülin glarjin"), which /insülin/i does not.
  dm: /metformin|gliflozin|gliptin|glutid|tirzepatid|gliklazid|glimepirid|glibenklamid|pioglitazon|akarboz|nsülin|insulin|liksisenatid|repaglinid/i,
  // "evolocumab", "rivoraksaban", "varfarin": the spellings the medicines catalogue (TİTCK) writes into
  // hasta_ilaclar — without them the template did not see the medicine and the report-length rule could not apply.
  statin: /statin|ezetimib|fenofibrat|gemfibrozil|evolokumab|evolocumab|alirokumab/i,
  doak: /apiksaban|rivaroksaban|rivoraksaban|dabigatran|edoksaban|warfarin|varfarin/i,
  vitd: /kolekalsiferol|kalsitriol|alfakalsidol|d3 vitamini|d vitamini/i,
  b12: /siyanokobalamin|hidroksokobalamin|metilkobalamin|kobalamin|b12/i,
}

export interface SgkLab { ad: string; deger: number; tarih: string }
export interface SgkRaporGirdi {
  sablon: SgkSablon
  hasta: { adSoyad: string; yas: number | null; kadin: boolean }
  ilaclar: { ad: string; etken?: string | null; aktif: boolean }[]
  labs: Record<string, SgkLab[]> // canonical_key → onaylı seri (yeniden eskiye)
  kbSerisi?: { sbp: number; dbp: number; tarih: string }[]
  htEvreHekim?: string | null
  dmTip?: 'T2' | 'T1' | 'diger' | null
  kvrKategoriHekim?: string | null
  askvh?: boolean
  doakEndikasyon?: 'af' | 'dvt' | 'pe' | null
  chaVasc?: { kky: boolean; ht: boolean; dm: boolean; inmeTia: boolean; vaskuler: boolean }
  mekanikKapak?: boolean
  sureAy?: number
  bugun: string
}
export interface SgkRaporSonuc { draft: SgkRaporDraft; sutKontrol: { madde: string; tamam: boolean | null }[]; eksikler: string[]; chaVascSkor: number | null; dipnotlar: Dipnot[]; /** longest report length the draft may propose, in months (raporSureTavani) */ sureTavani: number }

/** The four medicines of SUT 4.2.15.D (dabigatran, rivaroksaban, apiksaban, edoksaban), with the catalogue's "rivoraksaban" spelling. */
const DOAK_RE = /dabigatran|rivaroksaban|rivoraksaban|apiksaban|edoksaban/i

const ICD: Record<string, { icd10: string; aciklama: string }> = {
  ht: { icd10: 'I10', aciklama: 'Esansiyel (primer) hipertansiyon' },
  dm_T2: { icd10: 'E11.9', aciklama: 'Tip 2 diabetes mellitus, komplikasyonsuz' },
  dm_T1: { icd10: 'E10.9', aciklama: 'Tip 1 diabetes mellitus, komplikasyonsuz' },
  statin: { icd10: 'E78.0', aciklama: 'Saf hiperkolesterolemi' },
  doak_af: { icd10: 'I48', aciklama: 'Atriyal fibrilasyon ve flutter' },
  doak_dvt: { icd10: 'I82.4', aciklama: 'Alt ekstremite derin ven trombozu' },
  doak_pe: { icd10: 'I26.9', aciklama: 'Pulmoner emboli, akut kor pulmonale olmadan' },
  vitd: { icd10: 'E55.9', aciklama: 'D vitamini eksikliği, tanımlanmamış' },
  b12_anemi: { icd10: 'D51.9', aciklama: 'Vitamin B12 eksikliği anemisi, tanımlanmamış' },
  b12: { icd10: 'E53.8', aciklama: 'B grubu diğer vitaminlerin eksikliği (B12)' },
}

const fmtLab = (l: SgkLab) => `${l.ad} ${String(l.deger).replace('.', ',')} (${l.tarih})`
const sonLab = (g: SgkRaporGirdi, k: string) => g.labs[k]?.[0] ?? null

/** CHA2DS2-VASc — hekim işaretlediği bileşenlerden toplam (hekim onaylar). */
export function chaVascSkoru(c: NonNullable<SgkRaporGirdi['chaVasc']>, yas: number | null, kadin: boolean): number {
  return (c.kky ? 1 : 0) + (c.ht ? 1 : 0) + (c.dm ? 1 : 0) + (c.inmeTia ? 2 : 0) + (c.vaskuler ? 1 : 0) + (yas != null && yas >= 75 ? 2 : yas != null && yas >= 65 ? 1 : 0) + (kadin ? 1 : 0)
}

export function sgkRaporTaslagi(g: SgkRaporGirdi): SgkRaporSonuc {
  const etkenler = Array.from(new Set(g.ilaclar.filter((i) => i.aktif && SINIF_RE[g.sablon].test(`${i.ad} ${i.etken || ''}`)).map((i) => (i.etken || i.ad).trim())))
  const eksikler: string[] = []
  const sutKontrol: SgkRaporSonuc['sutKontrol'] = []
  const tetkik: string[] = []
  const klinik: string[] = []
  let tani = ICD.ht
  let chaVascSkor: number | null = null
  const dip: Dipnot[] = [{ ref: 'SGK', not: 'İlaç kullanım raporu: ICD-10 + etken madde + süre (≤24 ay) + e-imza; SUT kullanım ilkeleri hekim tarafından güncel metinle doğrulanır' }]

  if (g.sablon === 'ht') {
    const kb = (g.kbSerisi || []).slice(0, 3)
    if (kb.length) klinik.push(`Ofis KB ölçümleri: ${kb.map((k) => `${k.sbp}/${k.dbp} (${k.tarih})`).join('; ')}`)
    else eksikler.push('En az bir ofis KB ölçümü (Dahiliye › Özet)')
    if (g.htEvreHekim) klinik.push(`Hekim evresi: ${g.htEvreHekim}`); else eksikler.push('HT evresi hekim kilidi (HT kartı)')
    for (const k of ['Kre', 'eGFR', 'K']) { const l = sonLab(g, k); if (l) tetkik.push(fmtLab({ ...l, ad: k })) }
    // NOTYA-SUT-RAPOR-01 — the text has no "confirmed on two visits" condition for a hypertension report; that is the
    // clinical guideline in the footnote below, and the office readings stay in the draft. What the text does ask
    // for is EK-4/F 51: when an angiotensin receptor blocker is combined with other antihypertensives, the report
    // states that monotherapy did not control blood pressure adequately.
    // Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
    sutKontrol.push({ madde: 'SUT EK-4/F 51: anjiyotensin reseptör blokerinin diğer antihipertansiflerle kombinasyonu kullanılıyorsa, monoterapi ile kan basıncının yeterince kontrol altına alınamadığı raporda belirtildi (hekim doğrular)', tamam: null })
    dip.push({ ref: 'HT_UZLASI2025', not: 'HT tanısı tekrarlanan ofis ölçümü veya ev/ambulatuvar KB ile doğrulanır' })
  } else if (g.sablon === 'dm') {
    tani = g.dmTip === 'T1' ? ICD.dm_T1 : ICD.dm_T2
    const a1c = (g.labs.HbA1c || []).slice(0, 3)
    if (a1c.length) klinik.push(`HbA1c: ${a1c.map((x) => `%${String(x.deger).replace('.', ',')} (${x.tarih})`).join('; ')}`); else eksikler.push('Onaylı HbA1c lab satırı')
    for (const k of ['Glu', 'eGFR', 'Kre', 'UACR']) { const l = sonLab(g, k); if (l) tetkik.push(fmtLab({ ...l, ad: k })) }
    if (!sonLab(g, 'eGFR')) eksikler.push('Onaylı eGFR (SGLT2/metformin uygunluğu)')
    const kombinasyon = etkenler.length >= 2
    sutKontrol.push({ madde: 'Kombinasyon/ikinci basamak ajanlarda önceki tedavi ve HbA1c yanıtı raporda belgelenmiş', tamam: kombinasyon ? a1c.length >= 2 : null })
    sutKontrol.push({ madde: 'GLP-1 RA / SGLT2 / DPP-4 için ilgili SUT kullanım ilkeleri (branş/VKİ/önceki tedavi koşulları) hekim tarafından kontrol edildi', tamam: null })
    dip.push({ ref: 'TEMD_DM2026', not: 'Tanı HbA1c/glukoz ile doğrulanmış; basamak tedavi gerekçesi HbA1c izlemi ile' })
  } else if (g.sablon === 'statin') {
    tani = ICD.statin
    const ldl = (g.labs.LDL || []).slice(0, 2)
    if (ldl.length) klinik.push(`LDL: ${ldl.map((x) => `${x.deger} mg/dL (${x.tarih})`).join('; ')}`); else eksikler.push('Onaylı LDL lab satırı')
    for (const k of ['TChol', 'HDL', 'TG', 'ALT', 'CK']) { const l = sonLab(g, k); if (l) tetkik.push(fmtLab({ ...l, ad: k })) }
    if (g.kvrKategoriHekim) klinik.push(`KVR kategorisi (hekim kilidi): ${g.kvrKategoriHekim}`); else eksikler.push('KVR kategorisi hekim kilidi (KVR sekmesi)')
    if (g.askvh) klinik.push('Aterosklerotik KVH öyküsü mevcut')
    // NOTYA-SUT-RAPOR-01 — SUT 4.2.28.A-1(3): "Tedaviye başlamaya esas olan ilk uzman hekim raporunda, bu rapor
    // öncesi son 6 ay içinde, birinci fıkranın a, b ve c bentleri için en az bir hafta ara ile iki defa olmak üzere,
    // yapılmış kan lipid düzeylerinin her ikisinde de yüksek olduğunu gösteren tetkik sonuçları belirtilir."
    // One recent result used to tick this line. It is ticked now only when the approved LDL series holds two results
    // from the last six months at least a week apart; one recent result leaves it to the doctor (enough only under
    // 4.2.28.A-1(1)(ç)); no recent result fails it. Whether the levels are high enough is the next line.
    // Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
    const lipidDurumu = lipidIkiOlcum(g.labs.LDL || [], g.bugun)
    sutKontrol.push({ madde: 'SUT 4.2.28.A-1(3): ilk raporda, rapor öncesi son 6 ay içinde en az bir hafta arayla yapılmış iki kan lipid düzeyi sonucu belirtildi (birinci fıkranın a, b ve c bentleri için; ç bendinde hekim doğrular)', tamam: lipidDurumu === 'iki' ? true : lipidDurumu === 'tek' ? null : false })
    sutKontrol.push({ madde: 'LDL eşiği / risk durumu (KVH, DM vb.) SUT lipid düşürücü ilaç ilkelerine göre hekim tarafından doğrulandı', tamam: null })
    dip.push({ ref: 'TEMD_LIPID', not: 'Risk kategorisi ve LDL hedefi hekim kilidi; rapor kanıtı onaylı lipid paneli' })
  } else if (g.sablon === 'vitd' || g.sablon === 'b12') {
    const vd = g.sablon === 'vitd'
    const seri = (g.labs[vd ? 'VitD' : 'B12'] || []).slice(0, 2)
    const hb = sonLab(g, 'Hb')
    tani = vd ? ICD.vitd : hb && hb.deger < (g.hasta.kadin ? 12 : 13) ? ICD.b12_anemi : ICD.b12
    if (seri.length) klinik.push(`${vd ? '25-OH D' : 'B12'}: ${seri.map((x) => `${String(x.deger).replace('.', ',')} ${vd ? 'ng/mL' : 'pg/mL'} (${x.tarih})`).join('; ')}`)
    else eksikler.push(`Onaylı ${vd ? '25-OH D vitamini' : 'B12'} lab satırı`)
    for (const k of vd ? ['Ca', 'P', 'ALP', 'Kre'] : ['Hb', 'MCV', 'Folate']) { const l = sonLab(g, k); if (l) tetkik.push(fmtLab({ ...l, ad: k })) }
    // NOTYA-SUT-RAPOR-01 — the text sets no laboratory threshold for vitamin D or B12 ("25-OH D <20 ng/mL",
    // "B12 <200 pg/mL" were shown as SUT conditions and ticked from the lab value). What it has: EK-4/E 13/31
    // (kolekalsiferol mono preparations are paid only in their licensed indications) and EK-4/F 3 (kalsitriol and
    // alfakalsidol are on the report list). It has no B12 rule. The lab results stay in the draft as evidence.
    // Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
    if (vd) sutKontrol.push({ madde: 'SUT EK-4/E 13/31: kolekalsiferol (D3) mono preparatları yalnızca ruhsatlı endikasyonlarında ödenir; kalsitriol ve alfakalsidol EK-4/F 3 kapsamında sağlık raporuyla verilir (hekim doğrular)', tamam: null })
    sutKontrol.push({ madde: 'Raporla/raporsuz reçetelenebilirlik ve ilgili SUT maddesi hekim tarafından güncel metinle doğrulandı', tamam: null })
    if (vd && !sonLab(g, 'Ca')) eksikler.push('Onaylı kalsiyum (replasman öncesi)')
    dip.push(vd ? { ref: 'TEMD_OSTEO2025', not: '25-OH D <20 ng/mL eksiklik; replasman sonrası düzey ve Ca izlemi' } : { ref: 'HARRISON', not: 'B12 eksikliği: düzey + hemogram; nörolojik bulguda parenteral yol' })
  } else {
    const end = g.doakEndikasyon || null
    tani = end === 'dvt' ? ICD.doak_dvt : end === 'pe' ? ICD.doak_pe : ICD.doak_af
    if (!end) eksikler.push('Endikasyon seçimi (AF / DVT / PE)')
    if (g.mekanikKapak && etkenler.some((e) => DOAK_RE.test(e))) eksikler.push('MEKANİK KAPAK: DOAK kontrendike — rapor oluşturulmaz, hekim değerlendirmeli')
    if (end === 'af' && g.chaVasc) {
      chaVascSkor = chaVascSkoru(g.chaVasc, g.hasta.yas, g.hasta.kadin)
      klinik.push(`CHA₂DS₂-VASc (hekim işaretli bileşenler): ${chaVascSkor}`)
      sutKontrol.push({ madde: 'Non-valvüler AF; EKG belgesi Belgeler\'de', tamam: null })
      // NOTYA-SUT-RAPOR-01 — SUT 4.2.15.D-1(1): the text sets no score threshold; it asks for at least one of the
      // listed risk factors to be stated in the report. Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
      sutKontrol.push({ madde: 'SUT 4.2.15.D-1: inme veya geçici iskemik atak öyküsü, 75 yaş ve üzeri, kalp yetmezliği (NYHA II ve üzeri), diyabet veya hipertansiyondan en az biri raporda belirtildi (hekim doğrular)', tamam: null })
    }
    for (const k of ['Kre', 'eGFR', 'Hb', 'Plt', 'ALT', 'INR']) { const l = sonLab(g, k); if (l) tetkik.push(fmtLab({ ...l, ad: k })) }
    if (!sonLab(g, 'Kre')) eksikler.push('Onaylı kreatinin (DOAK böbrek uygunluğu)')
    const inr = (g.labs.INR || []).slice(0, 6)
    if (inr.length) klinik.push(`INR geçmişi: ${inr.map((x) => `${String(x.deger).replace('.', ',')} (${x.tarih})`).join('; ')}`)
    // NOTYA-SUT-RAPOR-01 — SUT 4.2.15.D-1(1)(a)-(b) and 4.2.15.D-2(1)(b),(2). Source: SGK güncel SUT, 02.10.2026
    // (RG 33388) işlenmiş hali. One recorded INR used to tick this line; the text asks for five measurements at least
    // a week apart with at least three outside 2–3, after at least two months of warfarin, or a listed exception.
    // The tick now follows the recorded INR results only; warfarin duration and the exceptions stay with the doctor.
    sutKontrol.push({ madde: 'SUT 4.2.15.D: en az 2 ay varfarin sonrası, en az birer hafta arayla son 5 INR ölçümünün en az 3’ü 2–3 dışında; veya SUT’taki istisna (varfarin altında serebrovasküler olay; DVT/PE’de tekrarlayan idiyopatik pulmoner emboli, homozigot trombofili, venöz tromboemboli geçirmiş aktif kanser, immobilite) raporda belirtildi', tamam: doakInrKosulu(inr) ? true : null })
    // SUT 4.2.15.D-1(2) and 4.2.15.D-2(3) (as amended by RG 25.03.2025 no. 32852): the first two report periods
    // (24 months in total) need a one-year health board report; later reports may be specialist reports.
    sutKontrol.push({ madde: 'Rapor türü (SUT 4.2.15.D): ilk iki rapor dönemi (toplam 24 ay) 1 yıl süreli sağlık kurulu raporu; sonraki raporlar uzman hekim raporu (hekim doğrular)', tamam: null })
    dip.push({ ref: 'HARRISON', not: 'DOAK uygunluğu: endikasyon, böbrek fonksiyonu, yaş/kilo; mekanik kapakta warfarin' })
  }
  if (!etkenler.length) eksikler.push('Etken madde — önce muayenede reçete yazın (hasta_ilaclar)')

  // NOTYA-SUT-RAPOR-01 — report length. General ceiling: SUT 4.1.3(5), two years. Shorter terms the text fixes for
  // a medicine of this template win (raporSureTavani below). Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
  const tavan = raporSureTavani(g.sablon, etkenler)
  const sure = Math.min(tavan.ay, Math.max(1, Math.round(g.sureAy || 12)))
  if (tavan.madde) {
    // The anticoagulant checklist already carries its report-type line (4.2.15.D); the others get the term here.
    if (g.sablon !== 'doak') sutKontrol.push({ madde: tavan.aciklama, tamam: null })
    dip.push({ ref: 'SGK', not: tavan.aciklama })
  }
  const draft: SgkRaporDraft = {
    raporBasligi: 'İlaç Kullanım Raporu',
    raporTuru: 'Ilk',
    hastaAdi: g.hasta.adSoyad,
    tcSon4: '',
    tani,
    mevcutDurum: klinik.join('\n'),
    hekim_degerlendirmesi: `${tani.aciklama} tanısıyla izlenen hastada ${etkenler.length ? `${etkenler.join(', ')} kullanımının ${sure} ay süreyle devamı` : 'ilaç tedavisi'} uygundur. (Taslak — hekim düzenler ve onaylar.)`,
    onerilen_sure_ay: sure,
    etkenMaddeler: etkenler,
    zorunluTetkikler: tetkik,
  }
  return { draft, sutKontrol, eksikler, chaVascSkor, dipnotlar: dip, sureTavani: tavan.ay }
}

/**
 * NOTYA-SUT-RAPOR-01 — the longest report this draft may propose, in months.
 * Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
 *  - SUT 4.1.3(5): "Sağlık raporları, SUT’ta yer alan özel düzenlemeler hariç olmak üzere en fazla iki yıl süre ile
 *    geçerlidir." → 24 months unless a rule below applies.
 *  - SUT 4.2.15.D-1(2) and 4.2.15.D-2(3) (as amended by RG 25.03.2025 no. 32852): dabigatran, rivaroksaban,
 *    apiksaban and edoksaban are paid on a "1 yıl süreli sağlık kurulu raporu" for the first two report periods
 *    (24 months in total); later reports are specialist reports. The draft is a first report → 12 months.
 *  - SUT 4.2.28.E(1): evolokumab starts on a "6 ay süreli sağlık kurulu raporu"; continuation is a new one-year
 *    health board report. The draft is a first report → 6 months.
 *  - SUT 4.2.38(7): the insülin glarjin + liksisenatid combination is paid on a "1 yıl süreli endokrinoloji uzman
 *    hekim raporu" → 12 months.
 * The draft cannot tell a first report from a later one; where the text allows more later (specialist reports for
 * the anticoagulants after 24 months), it still proposes the first-report term — a shorter report is always valid.
 */
export function raporSureTavani(sablon: SgkSablon, etkenler: string[]): { ay: number; madde: string | null; aciklama: string } {
  const metin = etkenler.join(' | ')
  if (sablon === 'doak' && DOAK_RE.test(metin)) {
    return { ay: 12, madde: 'SUT 4.2.15.D-1(2), 4.2.15.D-2(3)', aciklama: 'Rapor süresi (SUT 4.2.15.D): dabigatran, rivaroksaban, apiksaban ve edoksaban için ilk iki rapor dönemi 1 yıl süreli sağlık kurulu raporudur — taslak en fazla 12 ay önerir' }
  }
  if (sablon === 'statin' && /evolokumab|evolocumab/i.test(metin)) {
    return { ay: 6, madde: 'SUT 4.2.28.E(1)', aciklama: 'Rapor süresi (SUT 4.2.28.E): evolokumab için ilk rapor 6 ay süreli sağlık kurulu raporudur; devamında 1 yıl süreli yeni sağlık kurulu raporu düzenlenir — taslak en fazla 6 ay önerir' }
  }
  if (sablon === 'dm' && /liksisenatid|lixisenatid/i.test(metin)) {
    return { ay: 12, madde: 'SUT 4.2.38(7)', aciklama: 'Rapor süresi (SUT 4.2.38(7)): insülin glarjin + liksisenatid kombinasyonu 1 yıl süreli endokrinoloji uzman hekim raporuyla ödenir — taslak en fazla 12 ay önerir' }
  }
  return { ay: 24, madde: null, aciklama: 'Rapor süresi (SUT 4.1.3(5)): sağlık raporu, özel düzenlemeler dışında en fazla iki yıl geçerlidir' }
}

/**
 * NOTYA-SUT-RAPOR-01 — SUT 4.2.28.A-1(3): two blood lipid results in the six months before the first report, at
 * least a week apart. Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
 * `ldl` is the approved series. 'iki' = two results inside the window at least seven days apart; 'tek' = at least
 * one result inside the window but no such pair; 'yok' = nothing inside the window. Levels are not judged here.
 */
export function lipidIkiOlcum(ldl: SgkLab[], bugun: string): 'iki' | 'tek' | 'yok' {
  const alt = ekleAy(bugun, -6)
  const gunler = ldl
    .map((x) => String(x.tarih).slice(0, 10))
    .filter((t) => t >= alt && t <= bugun)
    .map((t) => Date.parse(`${t}T00:00:00Z`))
    .filter((t) => Number.isFinite(t))
  if (!gunler.length) return 'yok'
  return Math.max(...gunler) - Math.min(...gunler) >= 7 * 86400000 ? 'iki' : 'tek'
}

/**
 * NOTYA-SUT-RAPOR-01 — SUT 4.2.15.D-1(1)(a) / 4.2.15.D-2(1)(b): "en az birer hafta ara ile yapılan son 5 ölçümün en az
 * üçünde ... INR değerinin 2-3 arasında tutulamadığı". Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
 * `inr` is the approved series, newest first. True only when the five most recent results are each at least seven
 * days apart and at least three lie outside 2–3; anything the records cannot show returns false.
 */
export function doakInrKosulu(inr: SgkLab[]): boolean {
  const son5 = inr.slice(0, 5)
  if (son5.length < 5) return false
  const gun = son5.map((x) => Date.parse(`${String(x.tarih).slice(0, 10)}T00:00:00Z`))
  if (gun.some((g) => !Number.isFinite(g))) return false
  for (let i = 0; i < gun.length - 1; i++) if (gun[i] - gun[i + 1] < 7 * 86400000) return false
  return son5.filter((x) => x.deger < 2 || x.deger > 3).length >= 3
}

function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }
