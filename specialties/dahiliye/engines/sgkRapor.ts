/**
 * NOTYA-DAH-WOW W1.4 — SGK ilaç kullanım raporu şablonları (HT / DM / statin / DOAK), aktif kartlardan ön dolu.
 * Tools › Hasta Raporları (pediatri) kabuğunun ikizi: aynı SgkRaporDraft şekli + aynı e-Nabız/Medula zarfı (lib/enabiz/paket).
 * Kurallar: etken madde YALNIZ hasta_ilaclar satırlarından (uydurma yok, doz yok); lab kanıtı YALNIZ onaylı lab satırından;
 * T.C. kimlik no hiç yazılmaz (tcSon4 boş). SUT koşulları kontrol listesi olarak — güncel madde metni hekim doğrular.
 * Rapor hekim kilitleyene kadar "taslak"tır; Medula'ya giriş hekim + e-imza ile.
 */
import type { Dipnot } from './dahiliye'
import type { SgkRaporDraft } from '@/lib/sgk/raporTipleri'

export type SgkSablon = 'ht' | 'dm' | 'statin' | 'doak'
export const SGK_SABLONLARI: { id: SgkSablon; ad: string }[] = [
  { id: 'ht', ad: 'Hipertansiyon — antihipertansif ilaç raporu' },
  { id: 'dm', ad: 'Diyabet — oral antidiyabetik / GLP-1 / insülin raporu' },
  { id: 'statin', ad: 'Dislipidemi — lipid düşürücü ilaç raporu' },
  { id: 'doak', ad: 'Antikoagülan — DOAK / warfarin raporu' },
]

const SINIF_RE: Record<SgkSablon, RegExp> = {
  ht: /pril\b|sartan|dipin\b|amlodipin|nifedipin|lerkanidipin|hidroklorotiyazid|indapamid|klortalidon|spironolakton|eplerenon|bisoprolol|metoprolol|nebivolol|karvedilol|doksazosin|moksonidin/i,
  dm: /metformin|gliflozin|gliptin|glutid|tirzepatid|gliklazid|glimepirid|glibenklamid|pioglitazon|akarboz|insülin|insulin|repaglinid/i,
  statin: /statin|ezetimib|fenofibrat|gemfibrozil|evolokumab|alirokumab/i,
  doak: /apiksaban|rivaroksaban|dabigatran|edoksaban|warfarin/i,
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
export interface SgkRaporSonuc { draft: SgkRaporDraft; sutKontrol: { madde: string; tamam: boolean | null }[]; eksikler: string[]; chaVascSkor: number | null; dipnotlar: Dipnot[] }

const ICD: Record<string, { icd10: string; aciklama: string }> = {
  ht: { icd10: 'I10', aciklama: 'Esansiyel (primer) hipertansiyon' },
  dm_T2: { icd10: 'E11.9', aciklama: 'Tip 2 diabetes mellitus, komplikasyonsuz' },
  dm_T1: { icd10: 'E10.9', aciklama: 'Tip 1 diabetes mellitus, komplikasyonsuz' },
  statin: { icd10: 'E78.0', aciklama: 'Saf hiperkolesterolemi' },
  doak_af: { icd10: 'I48', aciklama: 'Atriyal fibrilasyon ve flutter' },
  doak_dvt: { icd10: 'I82.4', aciklama: 'Alt ekstremite derin ven trombozu' },
  doak_pe: { icd10: 'I26.9', aciklama: 'Pulmoner emboli, akut kor pulmonale olmadan' },
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
    sutKontrol.push({ madde: 'Tanı ≥2 ayrı vizitte yüksek ofis KB veya ev/ambulatuvar KB ile doğrulanmış', tamam: kb.filter((k) => k.sbp >= 140 || k.dbp >= 90).length >= 2 ? true : kb.length ? false : null })
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
    const ldlSon = ldl[0]?.tarih
    sutKontrol.push({ madde: 'Güncel lipid profili (son 6 ay) rapora ekli', tamam: ldlSon ? ldlSon >= ekleAy(g.bugun, -6) : false })
    sutKontrol.push({ madde: 'LDL eşiği / risk durumu (KVH, DM vb.) SUT lipid düşürücü ilaç ilkelerine göre hekim tarafından doğrulandı', tamam: null })
    dip.push({ ref: 'TEMD_LIPID', not: 'Risk kategorisi ve LDL hedefi hekim kilidi; rapor kanıtı onaylı lipid paneli' })
  } else {
    const end = g.doakEndikasyon || null
    tani = end === 'dvt' ? ICD.doak_dvt : end === 'pe' ? ICD.doak_pe : ICD.doak_af
    if (!end) eksikler.push('Endikasyon seçimi (AF / DVT / PE)')
    if (g.mekanikKapak && etkenler.some((e) => /apiksaban|rivaroksaban|dabigatran|edoksaban/i.test(e))) eksikler.push('MEKANİK KAPAK: DOAK kontrendike — rapor oluşturulmaz, hekim değerlendirmeli')
    if (end === 'af' && g.chaVasc) {
      chaVascSkor = chaVascSkoru(g.chaVasc, g.hasta.yas, g.hasta.kadin)
      klinik.push(`CHA₂DS₂-VASc (hekim işaretli bileşenler): ${chaVascSkor}`)
      sutKontrol.push({ madde: 'Non-valvüler AF; EKG belgesi Belgeler\'de', tamam: null })
      sutKontrol.push({ madde: 'İnme risk skoru SUT eşiğini karşılıyor (hekim doğrular)', tamam: null })
    }
    for (const k of ['Kre', 'eGFR', 'Hb', 'Plt', 'ALT', 'INR']) { const l = sonLab(g, k); if (l) tetkik.push(fmtLab({ ...l, ad: k })) }
    if (!sonLab(g, 'Kre')) eksikler.push('Onaylı kreatinin (DOAK böbrek uygunluğu)')
    const inr = (g.labs.INR || []).slice(0, 6)
    if (inr.length) klinik.push(`INR geçmişi: ${inr.map((x) => `${String(x.deger).replace('.', ',')} (${x.tarih})`).join('; ')}`)
    sutKontrol.push({ madde: 'Warfarin kullanım öyküsü / INR izlem güçlüğü veya kontrendikasyon gerekçesi belgelendi (gerekiyorsa)', tamam: inr.length ? true : null })
    dip.push({ ref: 'HARRISON', not: 'DOAK uygunluğu: endikasyon, böbrek fonksiyonu, yaş/kilo; mekanik kapakta warfarin' })
  }
  if (!etkenler.length) eksikler.push('Etken madde — önce muayenede reçete yazın (hasta_ilaclar)')

  const sure = Math.min(24, Math.max(1, Math.round(g.sureAy || 12)))
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
  return { draft, sutKontrol, eksikler, chaVascSkor, dipnotlar: dip }
}

function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }
