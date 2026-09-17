/**
 * GOZ-CHAPTER — SGK rapor taslakları (dahiliye sgkRapor deseni: aynı SgkRaporDraft şekli, hekim kilitler, Medula'ya giriş
 * hekim + e-imza). Kurallar SUT 4.2.33 birincil metninden (2026-09-17); GİL için EK-3/G listesi doğrulanamadı → kontrol
 * maddesi "hekim/idare teyit eder". T.C. kimlik no yazılmaz. ICD-10 kodu önerisi hekim doğrular. Doz yazılmaz (bevacizumab
 * dahil) — 4.2.33(6) dozu raporda hekimin belirteceğini söyler.
 */
import type { SgkRaporDraft } from '@/lib/sgk/raporTipleri'
import type { Dipnot } from '../protocols/sources'
import { AJAN_ADI, ENDIKASYON_ADI, sutYanit, type Ajan, type Endikasyon, type Enjeksiyon } from './antiVegf'
import { vaGoster } from './va'

export type GozSgkSablon = 'anti_vegf_baslangic' | 'anti_vegf_idame' | 'deksametazon_implant' | 'katarakt_gil'
export const GOZ_SGK_SABLONLARI: { id: GozSgkSablon; ad: string }[] = [
  { id: 'anti_vegf_baslangic', ad: 'Anti-VEGF başlangıç (yükleme) raporu' },
  { id: 'anti_vegf_idame', ad: 'Anti-VEGF idame raporu (yanıt değerlendirmeli)' },
  { id: 'deksametazon_implant', ad: 'Deksametazon intravitreal implant raporu' },
  { id: 'katarakt_gil', ad: 'Katarakt / GİL — işlem öncesi bilgi notu' },
]

const ICD: Record<Endikasyon | 'katarakt', { icd10: string; aciklama: string }> = {
  ybmd: { icd10: 'H35.3', aciklama: 'Makula ve arka kutup dejenerasyonu (yaş tip YBMD)' },
  dmo: { icd10: 'H36.0', aciklama: 'Diyabetik retinopati (diyabetik makula ödemi)' },
  rvt: { icd10: 'H34.8', aciklama: 'Diğer retinal vasküler tıkanıklıklar (retinal ven tıkanıklığı)' },
  miyopik_knv: { icd10: 'H44.2', aciklama: 'Dejeneratif miyopi (koroidal neovaskülarizasyon)' },
  rop: { icd10: 'H35.1', aciklama: 'Prematüre retinopatisi' },
  diger: { icd10: '', aciklama: 'Tanı hekim tarafından girilecek' },
  katarakt: { icd10: 'H25.9', aciklama: 'Senil katarakt, tanımlanmamış' },
}

export interface GozSgkGirdi {
  sablon: GozSgkSablon
  hasta: { adSoyad: string }
  goz: 'sag' | 'sol'
  ajan?: Ajan | null
  endikasyon?: Endikasyon | null
  /** hekim girişi anamnez özeti */
  anamnez?: string | null
  /** başlangıç (yükleme) muayenesi ve bir önceki muayene VA/MFK — 4.2.33(4) karşılaştırma */
  vaBaslangic?: string | null
  vaOnceki?: string | null
  vaSimdi?: string | null
  mfkBaslangic?: number | null
  mfkOnceki?: number | null
  mfkSimdi?: number | null
  /** belgeler: renkli fundus resmi, FFA (veya kontrendikasyon notu), OKT — hasta_goruntulemeler kayıt tarihleri */
  renkliResim?: string | null
  ffa?: string | null
  ffaKontrendike?: boolean
  okt?: string | null
  gecmis: Enjeksiyon[]
  hekimYanitVarBeyani?: boolean
  bugun: string
}

export interface GozSgkSonuc { draft: SgkRaporDraft; raporTipi: string; sutKontrol: { madde: string; tamam: boolean | null }[]; eksikler: string[]; dipnotlar: Dipnot[] }

export function gozSgkTaslak(g: GozSgkGirdi): GozSgkSonuc {
  const eksikler: string[] = [], sutKontrol: GozSgkSonuc['sutKontrol'] = [], klinik: string[] = [], tetkik: string[] = []
  const dip: Dipnot[] = []
  const gozAd = g.goz === 'sag' ? 'Sağ göz' : 'Sol göz'

  if (g.sablon === 'katarakt_gil') {
    const tani = ICD.katarakt
    if (g.vaSimdi) klinik.push(`${gozAd} düzeltilmiş görme keskinliği: ${vaGoster(g.vaSimdi)}`); else eksikler.push('Güncel düzeltilmiş görme keskinliği')
    sutKontrol.push({ madde: 'GİL kalemi EK-3/G listesinde (tip ve kod) — hekim/idare teyit eder', tamam: null })
    sutKontrol.push({ madde: 'Sözleşmeli özel sağlık hizmeti sunucusu: FAKO tarihi ≥2 gün önce SGK sistemine (sistem kurulunca yürürlükte)', tamam: null })
    dip.push({ ref: 'SUT_EK3G', not: 'GİL ödemesi EK-3/G listesine bağlı — liste içeriği bu repoda doğrulanamadı' }, { ref: 'SUT_244I', not: 'FAKO planlama bildirimi' })
    return {
      raporTipi: 'Bilgi notu (SUT metninde GİL için ayrı rapor kuralı bulunamadı)',
      draft: { raporBasligi: 'Katarakt Ameliyatı Öncesi Bilgi Notu', raporTuru: 'Ilk', hastaAdi: g.hasta.adSoyad, tcSon4: '', tani, mevcutDurum: klinik.join('\n'), hekim_degerlendirmesi: `${gozAd} katarakt nedeniyle fakoemülsifikasyon + GİL implantasyonu planlanmıştır. (Taslak — hekim düzenler ve onaylar.)`, malzemeOnerileri: ['Göz içi lens — tip ve güç hekim tarafından'], zorunluTetkikler: tetkik },
      sutKontrol, eksikler, dipnotlar: dip,
    }
  }

  const ajan = g.ajan || null, end = g.endikasyon || null
  if (!ajan) eksikler.push('Ajan seçimi')
  if (!end) eksikler.push('Endikasyon seçimi')
  const tani = end ? ICD[end] : ICD.diger
  const beva = ajan === 'bevacizumab'
  const idame = g.sablon === 'anti_vegf_idame'
  const raporTipi = beva
    ? '1 ay süreli tek hekim raporu (göz hastalıkları uzmanı, günübirlik)'
    : g.sablon === 'deksametazon_implant' || !idame
      ? '3 ay süreli sağlık kurulu raporu (3 göz hastalıkları uzmanı)'
      : '1 ay süreli sağlık kurulu raporu (3 göz hastalıkları uzmanı)'
  dip.push({ ref: 'SUT_4233', not: '4.2.33(1)(a)-(b): bevacizumab 1 ay tek hekim; diğerleri başlangıç 3 ay / idame 1 ay, 3 göz uzmanlı sağlık kurulu' })
  if (ajan === 'faricimab' || ajan === 'brolucizumab' || ajan === 'diger') eksikler.push(`${ajan ? AJAN_ADI[ajan] : 'Ajan'} SUT 4.2.33'te yok — SGK raporu düzenlenemez`)

  // 4.2.33(2) zorunlu içerik
  if (g.anamnez) klinik.push(`Anamnez: ${g.anamnez}`); else eksikler.push('Hasta anamnezi')
  const va = idame ? g.vaSimdi : g.vaBaslangic || g.vaSimdi
  if (va) klinik.push(`${gozAd} görme keskinliği: ${vaGoster(va)}`); else eksikler.push('Görme keskinliği')
  if (g.renkliResim) tetkik.push(`Renkli fundus resmi (${g.renkliResim})`); else eksikler.push('Lezyona ait renkli resim')
  if (g.ffa) tetkik.push(`FFA (${g.ffa})`); else if (g.ffaKontrendike) tetkik.push('FFA: kontrendike (gerekçe hekim notunda)'); else eksikler.push('FFA veya kontrendikasyon notu')
  if (g.okt) tetkik.push(`OKT (${g.okt})${(idame ? g.mfkSimdi : g.mfkBaslangic ?? g.mfkSimdi) != null ? ` — MFK ${idame ? g.mfkSimdi : g.mfkBaslangic ?? g.mfkSimdi} µm` : ''}`); else eksikler.push('OKT bulgusu')
  sutKontrol.push({ madde: 'Rapor içeriği: anamnez, görme keskinliği, renkli resim, FFA (kontrendike değilse), OKT, yanıt kriterleri', tamam: eksikler.filter((e) => /anamnez|Görme|renkli|FFA|OKT/i.test(e)).length === 0 })
  dip.push({ ref: 'SUT_4233', not: '4.2.33(2): rapor içeriği' })

  if (g.sablon === 'anti_vegf_baslangic' && ajan && end) {
    const yukleme = g.gecmis.filter((e) => e.goz === g.goz && e.ajan === ajan && e.faz === 'yukleme' && e.durum === 'yapildi').length
    klinik.push(`${AJAN_ADI[ajan]} yükleme dozu: ${yukleme + 1}. doz (${ENDIKASYON_ADI[end]})`)
    sutKontrol.push({ madde: 'Raporda / reçetede kaçıncı yükleme dozu olduğu yazılı', tamam: true })
    if (end === 'ybmd' || end === 'rvt' || end === 'dmo' || end === 'miyopik_knv') {
      sutKontrol.push({ madde: 'Endikasyon basamak sırası (4.2.33.A–Ç: bevacizumab ile başlanır; kontrendikasyon/yanıtsızlıkta sıradaki ajan) hekim tarafından belgelendi', tamam: beva ? true : null })
    }
  }
  if (idame || g.sablon === 'deksametazon_implant') {
    // 4.2.33(4): yüklemede ilk muayeneye, idamede bir önceki muayeneye göre
    const y = sutYanit({ vaOnceki: g.vaOnceki ?? g.vaBaslangic ?? null, vaSimdi: g.vaSimdi ?? null, mfkOncekiMikron: g.mfkOnceki ?? g.mfkBaslangic ?? null, mfkSimdiMikron: g.mfkSimdi ?? null })
    klinik.push(`Tedaviye yanıt (bir önceki muayeneye göre): ${y.gerekce.join('; ') || 'veri eksik'} → taslak sınıf: ${y.sinif}`)
    if (y.sinif === 'belirsiz') eksikler.push('Yanıt sınıfı belirsiz — hekim değerlendirmesi yazılmalı')
    if (g.mfkSimdi != null && g.mfkSimdi >= 250 && g.hekimYanitVarBeyani) klinik.push('Hekim beyanı: hasta tedaviye yanıt vermektedir (4.2.33(5))')
    sutKontrol.push({ madde: 'Her idame raporunda bir önceki muayeneye göre yanıt değerlendirmesi', tamam: y.sinif !== 'belirsiz' })
    dip.push(y.dipnot)
  }
  const hekimDeg = idame
    ? `${gozAd} ${end ? ENDIKASYON_ADI[end] : ''} tanısıyla ${ajan ? AJAN_ADI[ajan] : 'intravitreal'} idame tedavisine devamı uygundur. (Taslak — hekim düzenler ve onaylar.)`
    : `${gozAd} ${end ? ENDIKASYON_ADI[end] : ''} tanısıyla ${ajan ? AJAN_ADI[ajan] : 'intravitreal'} tedavisi planlanmıştır. (Taslak — hekim düzenler ve onaylar.)`
  const draft: SgkRaporDraft = {
    raporBasligi: g.sablon === 'deksametazon_implant' ? 'İntravitreal İmplant Sağlık Kurulu Raporu' : beva ? 'İntravitreal Enjeksiyon Uzman Hekim Raporu' : 'İntravitreal Enjeksiyon Sağlık Kurulu Raporu',
    raporTuru: idame ? 'Devam' : 'Ilk',
    hastaAdi: g.hasta.adSoyad, tcSon4: '', tani,
    anamnez: g.anamnez || undefined,
    mevcutDurum: klinik.join('\n'),
    hekim_degerlendirmesi: hekimDeg.replace(/\s+/g, ' '),
    onerilen_sure_ay: beva || idame ? 1 : 3,
    etkenMaddeler: ajan ? [AJAN_ADI[ajan]] : [],
    zorunluTetkikler: tetkik,
  }
  return { draft, raporTipi, sutKontrol, eksikler, dipnotlar: dip }
}
