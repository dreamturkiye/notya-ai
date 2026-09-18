/**
 * DERM-CHAPTER — İşlem odası ve bildirim yazdırma taslakları (pure metin üretimi).
 *
 * Kurallar:
 * - `window.print()` dostu: motor satır dizileri üretir, UI yazdırma bloğunu basar.
 * - **URL'e PHI konmaz** — yazdırma içeriği hâlihazırda yüklü veriden istemcide kurulur; hasta adı,
 *   T.C. veya protokol numarası query string'e yazılmaz (`yazdirmaHrefGuvenliMi` bunu test eder).
 * - Numune etiketi: hasta adı yerine **baş harf + protokol / kasa numarası** (laboratuvar eşleşmesi
 *   hekim/kurum sistemiyle yapılır). Fiksatif ve kap sayısı hekim/hemşire girer.
 * - Form 014: **yazdırılabilir taslak** — Notya canlı bildirim (TSİM / ağ) yapmaz.
 * - Onam metni hekim tarafından düzenlenir; buradaki maddeler derm-spine şablonundan gelir.
 */
import { DERM_ONAMLAR, ISLEM_SABLONLARI, type IslemTuru } from './derm-spine'
import type { Dipnot } from '../protocols/sources'
import type { BzbhKind } from '../protocols/endemic-bzbh'

export type YazdirmaBolumu = { baslik: string; satirlar: string[] }

export type YazdirmaTaslagi = {
  baslik: string
  ustBilgi: string[]
  bolumler: YazdirmaBolumu[]
  imzaSatirlari: string[]
  altBilgi: string[]
}

/** Yazdırma bağlantısı PHI taşımamalı — deep-link testinde kullanılır. */
export function yazdirmaHrefGuvenliMi(href: string): boolean {
  return !/(hastaAdi|adSoyad|tc|tckn|tcKimlik|dogumTarihi|telefon)=/i.test(href)
}

// ── İşlem onamı ───────────────────────────────────────────────────────────────

export type OnamYazdirGirdi = {
  onamKodu: string
  /** ekranda görünen hasta adı — yalnız yazdırma gövdesine yazılır, URL'e asla */
  hastaAdi?: string | null
  tarih: string
  hekimAdi?: string | null
  klinikAdi?: string | null
  islem?: IslemTuru | null
  /** hekimin eklediği bölge / taraf bilgisi */
  bolge?: string | null
  /** kozmetik işlemlerde ürün / lot (estetik kartından) */
  lotNo?: string | null
}

export function onamYazdirmaTaslagi(g: OnamYazdirGirdi): YazdirmaTaslagi | null {
  const s = DERM_ONAMLAR.find((o) => o.kod === g.onamKodu)
  if (!s) return null
  const islem = g.islem ? ISLEM_SABLONLARI[g.islem] : null
  const bolumler: YazdirmaBolumu[] = [
    { baslik: 'İşlem hakkında', satirlar: [...s.maddeler, ...(islem ? [`Planlanan işlem: ${islem.ad}`] : [])] },
    { baslik: 'Olası riskler ve istenmeyen etkiler', satirlar: [...s.riskler] },
  ]
  if (islem) {
    bolumler.push({ baslik: 'İşlem sonrası bakım', satirlar: [...islem.yaraBakimi, `Kontrol randevusu: işlemden ${islem.kontrolGun} gün sonra`] })
  }
  if (g.lotNo) bolumler.push({ baslik: 'Ürün izlenebilirliği', satirlar: [`Ürün / lot numarası: ${g.lotNo}`] })
  bolumler.push({
    baslik: 'Hasta beyanı',
    satirlar: [
      'Yukarıdaki bilgiler bana anlatıldı; soru sorma imkânı verildi ve sorularım yanıtlandı.',
      'İşlemin kabul edilmesi ya da reddedilmesinin tamamen benim kararım olduğunu biliyorum.',
      'Onam formunun bir kopyasını aldım.',
    ],
  })
  return {
    baslik: s.ad,
    ustBilgi: [
      g.klinikAdi ? g.klinikAdi : '',
      g.hastaAdi ? `Hasta: ${g.hastaAdi}` : 'Hasta: ……………………………………',
      g.bolge ? `Bölge / taraf: ${g.bolge}` : 'Bölge / taraf: ……………………………………',
      `Tarih: ${g.tarih}`,
    ].filter(Boolean),
    bolumler,
    imzaSatirlari: [
      'Hasta / yasal temsilci adı, imza: ………………………………………………',
      `Hekim adı, imza: ${g.hekimAdi ? g.hekimAdi : '………………………………………………'}`,
      'Tanık (gerekiyorsa) adı, imza: ………………………………………………',
    ],
    altBilgi: ['Bu taslak hekim tarafından düzenlenir ve imzalanır. Notya onam formunu hekim adına onaylamaz.'],
  }
}

// ── Numune (patoloji) etiketi ────────────────────────────────────────────────

export const FIKSATIF_SECENEKLERI = ['%10 formalin', 'Michel medyumu (DIF)', 'Serum fizyolojik', 'Taze / fiksatifsiz', 'Diğer (hekim yazar)'] as const

export type SpesimenEtiketGirdi = {
  /** hasta adı yerine baş harfler — etiket üzerinde tam ad taşınmaz */
  hastaBasHarfleri: string
  /** kurum protokol / kasa numarası (hekim girer) */
  protokolNo?: string | null
  bolge: string
  islem?: IslemTuru | null
  tarih: string
  /** kaç kap gönderiliyor */
  kapSayisi?: number | null
  fiksatif?: string | null
  /** eksizyonda yönlendirme dikişi / işaret */
  yonlendirme?: string | null
  hekimAdi?: string | null
  klinikAdi?: string | null
}

export type SpesimenEtiket = {
  satirlar: string[]
  eksikler: string[]
  uyari: string
}

export function spesimenEtiketi(g: SpesimenEtiketGirdi): SpesimenEtiket {
  const eksikler: string[] = []
  if (!g.hastaBasHarfleri?.trim()) eksikler.push('Hasta baş harfleri')
  if (!g.protokolNo?.trim()) eksikler.push('Protokol / kasa numarası')
  if (!g.bolge?.trim()) eksikler.push('Alınan bölge')
  if (!g.fiksatif?.trim()) eksikler.push('Fiksatif')
  const islemAd = g.islem ? ISLEM_SABLONLARI[g.islem].ad : 'İşlem (hekim yazar)'
  const satirlar = [
    g.klinikAdi || 'Klinik: ……………………',
    `Hasta: ${(g.hastaBasHarfleri || '—').toLocaleUpperCase('tr-TR')}  ·  Protokol: ${g.protokolNo || '……………'}`,
    `Bölge: ${g.bolge || '……………'}`,
    `İşlem: ${islemAd}`,
    `Fiksatif: ${g.fiksatif || '……………'}  ·  Kap: ${g.kapSayisi ?? 1}`,
    ...(g.yonlendirme ? [`Yönlendirme işareti: ${g.yonlendirme}`] : []),
    `Alınma tarihi: ${g.tarih}`,
    `Gönderen hekim: ${g.hekimAdi || '……………………'}`,
  ]
  return {
    satirlar,
    eksikler,
    uyari: 'Etiket üzerinde hastanın tam adı ve T.C. kimlik numarası yazılmaz; laboratuvar eşleşmesi kurum protokol numarasıyla yapılır.',
  }
}

/** Her kap için ayrı etiket (kap sayısına göre çoğaltılır, kap no eklenir). */
export function spesimenEtiketleri(g: SpesimenEtiketGirdi): SpesimenEtiket[] {
  const adet = Math.min(10, Math.max(1, Number(g.kapSayisi ?? 1)))
  return Array.from({ length: adet }, (_, i) => {
    const e = spesimenEtiketi(g)
    return { ...e, satirlar: [...e.satirlar, `Kap ${i + 1} / ${adet}`] }
  })
}

// ── BZBH Form 014 yazdırılabilir taslak ──────────────────────────────────────

export const BZBH_ADI: Record<BzbhKind, string> = {
  sifiliz: 'Sifiliz',
  gonore: 'Gonore',
  hiv: 'HIV enfeksiyonu',
  sark_cibani: 'Kutanöz layşmanyaz (şark çıbanı)',
  lepra: 'Lepra',
}

export type Form014Girdi = {
  kind: BzbhKind
  hastaAdi?: string | null
  /** doğum yılı — tam tarih yerine yıl yeterlidir (taslak) */
  dogumYili?: string | null
  cinsiyet?: string | null
  /** hekimin yazdığı ikamet ili/ilçesi */
  ikamet?: string | null
  tarih: string
  /** tanı dayanağı: klinik / laboratuvar (hekim işaretler) */
  klinikTani?: boolean
  laboratuvarTani?: boolean
  laboratuvarNotu?: string | null
  hekimAdi?: string | null
  klinikAdi?: string | null
}

export type Form014Taslak = {
  taslak: YazdirmaTaslagi
  kontrolListesi: Array<{ madde: string; tamam: boolean | null }>
  eksikler: string[]
  agNotu: string
  dipnot: Dipnot
}

export const FORM014_AG_NOTU =
  'Notya, Form 014 / TSİM bildirimini elektronik olarak göndermez. Bu yazdırılabilir taslaktır; bildirim hekim tarafından kurumun resmî sistemi üzerinden yapılır.'

export function form014Taslagi(g: Form014Girdi): Form014Taslak {
  const eksikler: string[] = []
  if (!g.hastaAdi?.trim()) eksikler.push('Hasta adı (taslak üzerinde hekim doldurur)')
  if (!g.dogumYili?.trim()) eksikler.push('Doğum yılı')
  if (!g.ikamet?.trim()) eksikler.push('İkamet il / ilçe')
  if (!g.klinikTani && !g.laboratuvarTani) eksikler.push('Tanı dayanağı (klinik ve/veya laboratuvar)')

  const kontrolListesi: Array<{ madde: string; tamam: boolean | null }> = [
    { madde: 'Tanı dayanağı işaretli (klinik / laboratuvar)', tamam: !!(g.klinikTani || g.laboratuvarTani) },
    { madde: 'Laboratuvar sonucu ve tarihi yazılı (varsa)', tamam: g.laboratuvarTani ? !!g.laboratuvarNotu : null },
    { madde: 'Hasta kimlik ve ikamet bilgileri tam', tamam: !!(g.hastaAdi && g.dogumYili && g.ikamet) },
    { madde: 'Bildirim resmî sisteme hekim tarafından girildi', tamam: null },
    { madde: g.kind === 'sark_cibani' ? 'İzlem planı: 3 ayda bir, 1 yıl boyunca' : 'Partner / temaslı bilgilendirme planı hekim tarafından yapıldı', tamam: null },
  ]

  const taslak: YazdirmaTaslagi = {
    baslik: `Bildirimi Zorunlu Hastalık Bildirim Taslağı — ${BZBH_ADI[g.kind]}`,
    ustBilgi: [
      g.klinikAdi || '',
      `Hasta: ${g.hastaAdi || '……………………………………'}`,
      `Doğum yılı: ${g.dogumYili || '………'}  ·  Cinsiyet: ${g.cinsiyet || '………'}`,
      `İkamet (il / ilçe): ${g.ikamet || '……………………'}`,
      `Bildirim tarihi: ${g.tarih}`,
    ].filter(Boolean),
    bolumler: [
      {
        baslik: 'Tanı dayanağı',
        satirlar: [
          `${g.klinikTani ? '[X]' : '[ ]'} Klinik tanı`,
          `${g.laboratuvarTani ? '[X]' : '[ ]'} Laboratuvar ile doğrulanmış tanı`,
          g.laboratuvarNotu ? `Laboratuvar: ${g.laboratuvarNotu}` : 'Laboratuvar sonucu / tarihi: ……………………………………',
        ],
      },
      { baslik: 'Kontrol listesi', satirlar: kontrolListesi.map((k) => `${k.tamam === true ? '[X]' : k.tamam === false ? '[ ]' : '[·]'} ${k.madde}`) },
      { baslik: 'Hekim notu', satirlar: ['……………………………………………………………………', '……………………………………………………………………'] },
    ],
    imzaSatirlari: [`Bildiren hekim adı, imza: ${g.hekimAdi || '………………………………………………'}`],
    altBilgi: [FORM014_AG_NOTU],
  }

  return {
    taslak,
    kontrolListesi,
    eksikler,
    agNotu: FORM014_AG_NOTU,
    dipnot: { ref: 'BZBH_014', not: 'Bildirimi zorunlu hastalık bildirimi — form alanları ve güncel sürüm hekim / kurum teyidiyle' },
  }
}

/** Yazdırma taslağını düz metne çevirir (pano / yedek). */
export function taslakMetni(t: YazdirmaTaslagi): string {
  return [
    t.baslik,
    ...t.ustBilgi,
    ...t.bolumler.flatMap((b) => ['', b.baslik, ...b.satirlar.map((s) => `- ${s}`)]),
    '',
    ...t.imzaSatirlari,
    '',
    ...t.altBilgi,
  ].join('\n')
}
