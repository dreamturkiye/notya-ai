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
import { GIL_EK3G_KALEMLERI } from './klinik'
import { biyometriMetni, biyometriTamMi, type Biyometri } from './katarakt'

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
  /** katarakt_gil: Katarakt kartından (hekim girişi) — biyometri saklanır, GİL gücü hesaplanmaz */
  gil?: { tip: string | null; ek3gKod: string | null; biyometri: Biyometri | null; kontrolEksik: string[] | null; planlananTarih: string | null } | null
  bugun: string
}

const GIL_TIP_AD: Record<string, string> = { monofokal: 'Monofokal', torik: 'Torik', multifokal: 'Multifokal', edof: 'EDOF', diger: 'Diğer' }

export interface GozSgkSonuc { draft: SgkRaporDraft; raporTipi: string; sutKontrol: { madde: string; tamam: boolean | null }[]; eksikler: string[]; dipnotlar: Dipnot[] }

export function gozSgkTaslak(g: GozSgkGirdi): GozSgkSonuc {
  const eksikler: string[] = [], sutKontrol: GozSgkSonuc['sutKontrol'] = [], klinik: string[] = [], tetkik: string[] = []
  const dip: Dipnot[] = []
  const gozAd = g.goz === 'sag' ? 'Sağ göz' : 'Sol göz'

  if (g.sablon === 'katarakt_gil') {
    // GOZ-EXCEPTIONAL-01: anti-VEGF kalitesinde bölümler — zorunlu maddeler, eksikler, kilit. SUT'ta GİL için ayrı rapor kuralı yok;
    // maddeler klinik ön-op standardıdır (TR pratik) + EK-3/G kalem seçimi. GİL gücü yazılmaz / hesaplanmaz.
    const tani = ICD.katarakt
    const gil = g.gil || null
    if (g.anamnez) klinik.push(`Anamnez: ${g.anamnez}`)
    if (g.vaSimdi) klinik.push(`${gozAd} düzeltilmiş görme keskinliği: ${vaGoster(g.vaSimdi)}`); else eksikler.push('Güncel düzeltilmiş görme keskinliği')
    const bio = gil?.biyometri || null
    if (biyometriTamMi(bio)) tetkik.push(biyometriMetni(bio, gozAd)); else eksikler.push('Biyometri (AL, K1/K2, A-sabiti — hekim girer; Notya GİL gücü hesaplamaz)')
    sutKontrol.push({ madde: 'Biyometri değerleri kayıtlı (hekim girişi)', tamam: biyometriTamMi(bio) })
    const tip = gil?.tip || null
    if (tip) klinik.push(`Planlanan GİL tipi (hekim): ${GIL_TIP_AD[tip] || tip}`); else eksikler.push('GİL tipi (hekim seçimi)')
    const kalem = gil?.ek3gKod ? GIL_EK3G_KALEMLERI.find((k) => k.kod === gil.ek3gKod) || null : null
    if (kalem) klinik.push(`SGK EK-3/G kalemi: ${kalem.kod} — ${kalem.ad} (bedel/fark idare teyit eder)`); else eksikler.push('EK-3/G GİL kalem kodu')
    sutKontrol.push({ madde: 'GİL kalemi EK-3/G listesinde (tip ve kod) — hekim/idare teyit eder', tamam: kalem ? true : null })
    if (gil?.kontrolEksik) {
      if (gil.kontrolEksik.length) for (const e of gil.kontrolEksik) eksikler.push(`Ön-op kontrol: ${e}`)
      sutKontrol.push({ madde: 'Ön-op kontrol listesinin zorunlu maddeleri (onam dahil) işaretli', tamam: gil.kontrolEksik.length === 0 })
    } else {
      eksikler.push('Ön-op kontrol listesi (Katarakt kartı) doldurulmadı')
      sutKontrol.push({ madde: 'Ön-op kontrol listesinin zorunlu maddeleri (onam dahil) işaretli', tamam: false })
    }
    if (gil?.planlananTarih) klinik.push(`Planlanan işlem tarihi: ${gil.planlananTarih}`)
    sutKontrol.push({ madde: 'Sözleşmeli özel sağlık hizmeti sunucusu: FAKO tarihi ≥2 gün önce SGK sistemine (sistem kurulunca yürürlükte)', tamam: null })
    sutKontrol.push({ madde: 'Medula girişi ve e-imza hekim tarafından (Notya canlı gönderim yapmaz)', tamam: null })
    dip.push({ ref: 'SUT_EK3G', not: 'GİL ödemesi EK-3/G listesine bağlı — kalem kodu seçilir, bedel yazılmaz' }, { ref: 'SUT_244I', not: 'FAKO planlama bildirimi' }, { ref: 'TOD', not: 'Ön-op değerlendirme maddeleri — TR klinik pratik; kurum protokolü hekim teyit eder' })
    return {
      raporTipi: 'Bilgi notu (SUT metninde GİL için ayrı rapor kuralı bulunamadı) — Medula’ya hekim e-imza ile',
      draft: { raporBasligi: 'Katarakt Ameliyatı Öncesi Bilgi Notu', raporTuru: 'Ilk', hastaAdi: g.hasta.adSoyad, tcSon4: '', tani, anamnez: g.anamnez || undefined, mevcutDurum: klinik.join('\n'), hekim_degerlendirmesi: `${gozAd} katarakt nedeniyle fakoemülsifikasyon + GİL implantasyonu planlanmıştır. (Taslak — hekim düzenler ve onaylar.)`, malzemeOnerileri: [kalem ? `Göz içi lens — EK-3/G ${kalem.kod}; tip ve güç hekim tarafından` : 'Göz içi lens — tip ve güç hekim tarafından'], zorunluTetkikler: tetkik },
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

/** Panoya / yazdırmaya düz metin (hasta adı ve T.C. boş kalır — Medula'da hekim doldurur). */
export function gozSgkMetni(s: GozSgkSonuc): string {
  const d = s.draft
  return [
    d.raporBasligi,
    `Rapor türü: ${s.raporTipi}`,
    `Tanı önerisi (hekim doğrular): ${d.tani.icd10 ? `${d.tani.icd10} ` : ''}${d.tani.aciklama}`,
    d.mevcutDurum ? `\n${d.mevcutDurum}` : '',
    d.zorunluTetkikler?.length ? `\nTetkikler:\n- ${d.zorunluTetkikler.join('\n- ')}` : '',
    d.etkenMaddeler?.length ? `\nEtken madde: ${d.etkenMaddeler.join(', ')} (doz hekim yazar)` : '',
    d.malzemeOnerileri?.length ? `\nMalzeme: ${d.malzemeOnerileri.join(', ')}` : '',
    d.hekim_degerlendirmesi ? `\n${d.hekim_degerlendirmesi}` : '',
    s.eksikler.length ? `\nEksikler:\n- ${s.eksikler.join('\n- ')}` : '',
  ].filter(Boolean).join('\n')
}
