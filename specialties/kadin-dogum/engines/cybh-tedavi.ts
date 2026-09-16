/**
 * NOTYA-JINE-04 — CYBH / women's STI treatment engine (TR clinic).
 * CDC 2021 regimens adapted for Turkish office practice (Türk Dermatoloji pocket + TJOD teaching).
 * AI drafts only — doctor locks and prescriptions. No auto-order of drugs.
 */
import type { Etken } from './jinekoloji-spine'

export type CybhTedaviSatir = {
  etken: Etken
  baslik: string
  birinciBasamak: string
  alternatif?: string
  gebe?: string
  partner: string
  naat?: string
  toc?: string /** test of cure */
  notlar: string[]
  kaynak: 'CDC2021' | 'WHO' | 'HSGM' | 'TJOD'
}

const REJIM: Record<Etken, CybhTedaviSatir> = {
  candida: {
    etken: 'candida', baslik: 'Vulvovajinal kandidiyaz',
    birinciBasamak: 'Flukonazol 150 mg PO tek doz (komplike olmayan)',
    alternatif: 'Klotrimazol / mikonazol / terkonazol topikal 3–7 gün',
    gebe: 'Yalnız topikal azol 7 gün — oral flukonazol gebelikte kaçının',
    partner: 'Rutin partner tedavisi gerekmez (semptomatik partnerde topikal)',
    notlar: ['Komplike (rekürren ≥4/yıl, şiddetli, DM): flukonazol 150 mg ×3 (0-3-7) veya topikal 7–14 gün'],
    kaynak: 'CDC2021',
  },
  bv: {
    etken: 'bv', baslik: 'Bakteriyel vajinoz',
    birinciBasamak: 'Metronidazol 500 mg PO BID ×7 gün',
    alternatif: 'Metronidazol jel %0,75 5 g PV qhs ×5 gün · veya Klindamisin krem %2 5 g PV qhs ×7 gün',
    gebe: 'Metronidazol 500 mg BID ×7 (gebelikte güvenli kabul; topikal alternatif)',
    partner: 'Rutin partner tedavisi önerilmez',
    notlar: ['Alkol ile metronidazol etkileşimi uyarısı', 'Rekürens sık — 3. ayda tekrar değerlendir'],
    kaynak: 'CDC2021',
  },
  trichomonas: {
    etken: 'trichomonas', baslik: 'Trikomoniyaz',
    birinciBasamak: 'Metronidazol 500 mg PO BID ×7 gün (kadın)',
    alternatif: 'Tinidazol 2 g PO tek doz (gebelik dışı)',
    gebe: 'Metronidazol 500 mg BID ×7',
    partner: 'Partner(ler) aynı anda tedavi edilmeli — tek doz 2 g metronidazol (erkek) veya 7 gün (kadın partner)',
    naat: 'NAAT tercih (vajinal/idrar); ıslak yayma duyarlılığı düşük',
    toc: 'TOC 3 hafta sonra önerilir (yüksek reinfeksiyon)',
    notlar: ['Tek doz metronidazol kadınlarda artık birinci basamak değil (CDC 2021)'],
    kaynak: 'CDC2021',
  },
  chlamydia: {
    etken: 'chlamydia', baslik: 'Klamidya',
    birinciBasamak: 'Doksisiklin 100 mg PO BID ×7 gün',
    alternatif: 'Azitromisin 1 g PO tek doz (uyum sorunu / gebe alternatif)',
    gebe: 'Azitromisin 1 g PO tek doz (tercih) · veya Amoksisilin 500 mg TID ×7',
    partner: 'Son 60 gündeki partner(ler) tedavi + 7 gün cinsel perhiz / kondom',
    naat: 'Vajinal / servikal / idrar NAAT',
    toc: 'Gebelikte TOC ~4 hafta; gebe değilse rutin TOC gerekmez (3 ayda retest)',
    notlar: ['PID şüphesinde servikal hareket hassasiyeti → PID protokolü'],
    kaynak: 'CDC2021',
  },
  gonorrhea: {
    etken: 'gonorrhea', baslik: 'Gonore',
    birinciBasamak: 'Seftriakson 500 mg IM tek doz (<150 kg); ≥150 kg → 1 g IM',
    alternatif: 'Sefiksim 800 mg PO tek doz (IM yoksa) — TOC önerilir',
    gebe: 'Seftriakson 500 mg IM (azitromisin eklemesi artık rutin değil)',
    partner: 'Son 60 gündeki partner(ler) empirik tedavi + perhiz',
    naat: 'NAAT + mümkünse kültür (direnç sürveyansı)',
    toc: 'Faringeal enfeksiyonda TOC 7–14 gün; ekstra-genital şüphede TOC',
    notlar: ['Klamidya ko-enfeksiyonu dışlanmadıysa doksisiklin 100 BID ×7 ekle'],
    kaynak: 'CDC2021',
  },
  m_genitalium: {
    etken: 'm_genitalium', baslik: 'Mycoplasma genitalium',
    birinciBasamak: 'Direnç testi varsa: makrolid-duyarlı → Azitromisin 1 g + 500 mg ×3 gün; dirençli → Moksifloksasin 400 mg ×7–14 gün',
    alternatif: 'Direnç bilinmiyor: Doksisiklin 100 BID ×7 → ardından azitromisin veya moksifloksasin (hekim)',
    partner: 'Partner değerlendirme/tedavi — aynı etken şüphesi',
    naat: 'MG NAAT (özellikle inatçı üretrit/servisit)',
    toc: 'TOC 21 gün sonra',
    notlar: ['Makrolid direnci Türkiye ve Avrupa\'da yüksek — kör azitromisin kaçının'],
    kaynak: 'CDC2021',
  },
  hsv1: {
    etken: 'hsv1', baslik: 'HSV-1 genital',
    birinciBasamak: 'İlk atak: Asiklovir 400 mg TID ×7–10 gün · veya Valasiklovir 1 g BID ×7–10 gün',
    alternatif: 'Rekürens: Asiklovir 800 mg BID ×5 · Valasiklovir 500 mg BID ×3',
    gebe: '36 hf\'dan doğuma: Asiklovir 400 mg TID veya Valasiklovir 500 mg BID supresyon',
    partner: 'Bilgilendirme; asemptomatik bulaş mümkün; partner seroloji isteğe bağlı',
    notlar: ['≥6 atak/yıl: günlük supresyon tartışılır', 'Aktif lezyon/prodrom doğumda → C/S değerlendir'],
    kaynak: 'CDC2021',
  },
  hsv2: {
    etken: 'hsv2', baslik: 'HSV-2 genital',
    birinciBasamak: 'İlk atak: Asiklovir 400 mg TID ×7–10 gün · veya Valasiklovir 1 g BID ×7–10 gün',
    alternatif: 'Supresyon: Valasiklovir 500 mg–1 g günlük veya Asiklovir 400 mg BID',
    gebe: '36 hf\'dan doğuma: Asiklovir 400 mg TID veya Valasiklovir 500 mg BID',
    partner: 'Danışmanlık + bulaş riski; partner HSV seroloji',
    notlar: ['İlk ülserde HIV + RPR zorunlu kontrol listesi'],
    kaynak: 'CDC2021',
  },
  hpv_wart: {
    etken: 'hpv_wart', baslik: 'Anogenital siğil (HPV)',
    birinciBasamak: 'Hasta uygulanan: İmikimod %5 · veya Podofilotoksin · veya Sinekateşin',
    alternatif: 'Klinik: Kriyoterapi · TCA · cerrahi eksizyon / elektrokoter',
    gebe: 'Podofilotoksin/imikimod kaçının; kriyo veya TCA tercih',
    partner: 'Partner muayene önerilir; rutin partner "tedavi" yok',
    notlar: ['Serviks tarama yoluna bağla (HPV-DNA/Pap)', 'Kanser ≠ siğil — CIN yolu ayrı'],
    kaynak: 'CDC2021',
  },
  syphilis: {
    etken: 'syphilis', baslik: 'Sifiliz',
    birinciBasamak: 'Erken (primer/sekonder/erken latent): Benzatin penisilin G 2,4 MU IM tek doz',
    alternatif: 'Penisilin alerjisi (gebe değil): Doksisiklin 100 BID ×14 (erken) — desensitizasyon tercih',
    gebe: 'Yalnız penisilin — alerjide desensitizasyon (zorunlu)',
    partner: 'Partner tarama + tedavi; bildirim kurallarına uy',
    naat: 'RPR/VDRL + TPHA/FTA doğrulama; titre takibi',
    toc: 'RPR titresini 6–12 ay izle (4 kat düşüş hedef)',
    notlar: ['Geç latent / bilinmeyen süre: 2,4 MU IM haftalık ×3', 'Nörosifiliz → enfeksiyon hastalıkları'],
    kaynak: 'CDC2021',
  },
  hiv: {
    etken: 'hiv', baslik: 'HIV',
    birinciBasamak: 'Enfeksiyon hastalıkları / HIV merkezine acil sevk — ofiste ART başlatılmaz',
    partner: 'Partner test öner; PrEP/PEP sevk',
    naat: '4. nesil Ag/Ab + doğrulama',
    notlar: ['Gebelikte perinatal profilaksi protokolü merkezde', 'KVKK: özel nitelikli veri — bilgilendirilmiş onam'],
    kaynak: 'HSGM',
  },
  hbv: {
    etken: 'hbv', baslik: 'HBV',
    birinciBasamak: 'HBsAg+ → hepatoloji/enfeksiyon sevk; gebelikte yenidoğan HBIg + aşı protokolü',
    partner: 'Partner HBsAg/anti-HBs; aşı adayı ise aşılama',
    notlar: ['Doğumda bebek: HBIg + HepB 1. doz (taburcu gate)'],
    kaynak: 'HSGM',
  },
}

export type NaatPaket = { kod: string; ad: string; ornek: string; endikasyon: string }

export const NAAT_PAKETLERI: NaatPaket[] = [
  { kod: 'ct_gc', ad: 'Klamidya + Gonore NAAT', ornek: 'Vajinal / servikal / ilk idrar', endikasyon: 'Semptom, risk, RİA öncesi, PID şüphesi' },
  { kod: 'tv', ad: 'Trikomonas NAAT', ornek: 'Vajinal', endikasyon: 'Akıntı, BV/kandidiyaz dışlandığında' },
  { kod: 'mg', ad: 'M. genitalium NAAT ± makrolid direnç', ornek: 'Vajinal / üretral', endikasyon: 'İnatçı servisit/üretrit' },
  { kod: 'hsv_pcr', ad: 'HSV PCR', ornek: 'Lezyon sıvısı', endikasyon: 'Ülser / vezikül' },
  { kod: 'hpv', ad: 'HPV-DNA (HR)', ornek: 'Servikal', endikasyon: '30–65 tarama / ASC-US refleks' },
]

export function cybhTedaviPlani(etkenler: Etken[], opts?: { gebe?: boolean }): {
  satirlar: CybhTedaviSatir[]
  partnerGerekli: boolean
  partnerMetin: string
  naatOner: NaatPaket[]
  tocGorevleri: string[]
  yazdirilabilirPartner: string
} {
  const uniq = [...new Set(etkenler)]
  const satirlar = uniq.map((e) => {
    const r = REJIM[e]
    if (!r) return null
    if (opts?.gebe && r.gebe) return { ...r, birinciBasamak: r.gebe, notlar: [...r.notlar, 'Gebelik doz/rejim uygulandı'] }
    return r
  }).filter(Boolean) as CybhTedaviSatir[]

  const partnerGerekli = uniq.some((e) => ['trichomonas', 'chlamydia', 'gonorrhea', 'm_genitalium', 'syphilis'].includes(e))
  const partnerMetin = satirlar.filter((s) => partnerGerekli || s.etken === 'hsv2').map((s) => `${s.baslik}: ${s.partner}`).join('\n') || 'Partner tedavisi bu etken(ler) için rutin değil.'
  const naatOner: NaatPaket[] = []
  if (uniq.some((e) => e === 'chlamydia' || e === 'gonorrhea') || uniq.length === 0) naatOner.push(NAAT_PAKETLERI[0])
  if (uniq.includes('trichomonas')) naatOner.push(NAAT_PAKETLERI[1])
  if (uniq.includes('m_genitalium')) naatOner.push(NAAT_PAKETLERI[2])
  if (uniq.includes('hsv1') || uniq.includes('hsv2')) naatOner.push(NAAT_PAKETLERI[3])
  if (uniq.includes('hpv_wart')) naatOner.push(NAAT_PAKETLERI[4])

  const tocGorevleri = satirlar.flatMap((s) => (s.toc ? [`TOC — ${s.baslik}: ${s.toc}`] : []))

  const yazdirilabilirPartner = [
    '— Partner bilgilendirme / tedavi notu (hasta onayı ile) —',
    `Tarih: ${new Date().toISOString().slice(0, 10)}`,
    partnerMetin,
    'Cinsel perhiz veya kondom: tedavi bitiminden en az 7 gün sonra / TOC sonrası.',
    'Bu form tıbbi reçete değildir; partner kendi hekimine başvurmalıdır.',
  ].join('\n')

  return { satirlar, partnerGerekli, partnerMetin, naatOner, tocGorevleri, yazdirilabilirPartner }
}

export function hsvSupresyon36hf(tip: 'hsv1' | 'hsv2' | null): string[] {
  if (!tip) return []
  return [
    '36. haftadan doğuma: Asiklovir 400 mg PO TID veya Valasiklovir 500 mg PO BID (hekim reçete)',
    'Aktif lezyon veya prodrom doğumda → sezaryen değerlendir (hekim onayı)',
    'Yenidoğan HSV riski pediatriye bildirilir',
  ]
}
