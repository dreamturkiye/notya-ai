/**
 * Phototherapy log. NO solarium modality (ban 2018).
 * NB-UVB 311, BB-UVB, PUVA oral/bath, local PUVA, excimer 308, UVA1, MED test.
 *
 * DERM-EXCEPTIONAL-01 (ünite v2): MED kaydı, seans başına doz adımı, yanık protokolü kontrol listesi,
 * cihaz başına kümülatif J ve yıllık TBSE hatırlatma ipucu. Hemşire kullanımına göre yazılmıştır.
 * Doz, doz artış oranı ve MED değeri **hekim/ünite protokolünden** girilir — burada doz üretilmez.
 */
export const PHOTO_DEVICES = [
  'nb-uvb-311',
  'bb-uvb',
  'puva-oral',
  'puva-bath',
  'local-puva',
  'excimer-308',
  'uva1',
] as const

export type PhotoDevice = (typeof PHOTO_DEVICES)[number]

/** UVB cihazları mJ/cm², UVA/PUVA cihazları J/cm² ile MED/MPD ölçer — birim hemşireye gösterilir. */
export const MED_BIRIMI: Record<PhotoDevice, 'mJ/cm²' | 'J/cm²'> = {
  'nb-uvb-311': 'mJ/cm²',
  'bb-uvb': 'mJ/cm²',
  'excimer-308': 'mJ/cm²',
  'puva-oral': 'J/cm²',
  'puva-bath': 'J/cm²',
  'local-puva': 'J/cm²',
  uva1: 'J/cm²',
}

/** Seans sonrası eritem yanıtı — doz adımı kararının gerekçesi (hekim/ünite protokolü). */
export const ERITEM_YANITI = ['yok', 'minimal', 'agrili', 'bullu'] as const
export type EritemYaniti = (typeof ERITEM_YANITI)[number]

export const ERITEM_ADI: Record<EritemYaniti, string> = {
  yok: 'Eritem yok',
  minimal: 'Minimal / asemptomatik eritem',
  agrili: 'Ağrılı eritem',
  bullu: 'Büllü reaksiyon',
}

export type PhotoSession = {
  date: string
  device: PhotoDevice
  j_cm2: number
  med_test?: boolean
  burn?: boolean
  sessionPhotoCoreImageId?: string
  // ── v2 alanları (hepsi optional — eski kayıtlar geçerliliğini korur) ──
  /** Ünite defterindeki seans sırası (hekim/hemşire girer) */
  seans_no?: number
  /** Bu seansta uygulanan doz artışı yüzdesi — protokolden girilir, hesaplanmaz */
  doz_adimi_pct?: number
  /** Seans sonrası eritem yanıtı */
  eritem?: EritemYaniti
  /** Kaçırılan gün sayısı (ara verme → protokol gereği doz geri alınabilir; karar hekimin) */
  kacirilan_gun?: number
  /** Yanık protokolü kontrol listesi — madde kodu → yapıldı */
  yanik_protokolu?: Record<string, boolean>
  /** Hemşire / hekim notu */
  not?: string
  /** Araçlar defteri: MED testi ölçülen eşik (J/cm²) */
  med_j_cm2?: number
  /** Araçlar defteri: hekimin bu seansta uyguladığı artış adımı (J/cm²) */
  dose_step?: number
  /** Araçlar defteri: yanık checklist kodları (BURN_CHECKLIST) */
  burn_checklist?: string[]
}

export type MedKaydi = {
  date: string
  device: PhotoDevice
  /** MED / MPD değeri — hekim okur ve girer */
  deger: number
  birim: 'mJ/cm²' | 'J/cm²'
  /** Test alanı fotoğrafı (core görüntüleme id) */
  testPhotoCoreImageId?: string
  not?: string
}

export function cumulativeJ(sessions: PhotoSession[], device?: PhotoDevice): number {
  const sum = sessions
    .filter((s) => device == null || s.device === device)
    .reduce((acc, s) => acc + s.j_cm2, 0)
  return Math.round(sum * 100) / 100
}

/** Cihaz başına kümülatif doz + seans sayısı + son seans tarihi. Boş cihaz listelenmez. */
export function cihazBasinaKumulatif(sessions: PhotoSession[]): Array<{
  device: PhotoDevice
  seans: number
  kumulatifJ: number
  sonSeans: string | null
}> {
  const out: Array<{ device: PhotoDevice; seans: number; kumulatifJ: number; sonSeans: string | null }> = []
  for (const d of PHOTO_DEVICES) {
    const list = sessions.filter((s) => s.device === d)
    if (!list.length) continue
    const tarihler = list.map((s) => s.date).filter(Boolean).sort()
    out.push({
      device: d,
      seans: list.length,
      kumulatifJ: cumulativeJ(list, d),
      sonSeans: tarihler.length ? tarihler[tarihler.length - 1] : null,
    })
  }
  return out.sort((a, b) => b.kumulatifJ - a.kumulatifJ)
}

/** Aynı cihazın en son MED kaydı — defterin başında gösterilir. */
export function sonMed(medler: MedKaydi[], device: PhotoDevice): MedKaydi | null {
  const list = medler.filter((m) => m.device === device).sort((a, b) => a.date.localeCompare(b.date))
  return list.length ? list[list.length - 1] : null
}

/** MED girilmemiş cihazlarda seans varsa eksik uyarısı (SUT: endikasyon raporu + MED + J/cm² defteri). */
export function medEksikCihazlar(sessions: PhotoSession[], medler: MedKaydi[]): PhotoDevice[] {
  return cihazBasinaKumulatif(sessions)
    .map((c) => c.device)
    .filter((d) => !sonMed(medler, d) && !sessions.some((s) => s.device === d && s.med_test))
}

/** Yanık protokolü — hemşire kontrol listesi. Doz / ilaç / süre yazılmaz; uygulama hekim protokolüne göredir. */
export const YANIK_PROTOKOLU: Array<{ kod: string; ad: string }> = [
  { kod: 'seans_durdur', ad: 'Sonraki seans durduruldu — hekime bildirildi' },
  { kod: 'alan_kaydi', ad: 'Etkilenen alan ve yüzdesi kaydedildi' },
  { kod: 'foto', ad: 'Alan fotoğrafı çekildi (Görüntüleme)' },
  { kod: 'sogutma', ad: 'Soğutma / nemlendirme uygulandı (ünite protokolü)' },
  { kod: 'bul_kontrol', ad: 'Bül / erozyon varlığı kontrol edildi' },
  { kod: 'doz_geri', ad: 'Doz geri alma kararı hekimden alındı ve deftere yazıldı' },
  { kod: 'hasta_bilgi', ad: 'Hastaya güneş koruma ve belirti takibi anlatıldı' },
]

export function yanikProtokoluEksikler(session: PhotoSession): string[] {
  if (!yanikBildirimiGerekli(session)) return []
  const isaretli = session.yanik_protokolu || {}
  return YANIK_PROTOKOLU.filter((m) => !isaretli[m.kod]).map((m) => m.ad)
}

/** Ağrılı / büllü eritem veya yanık işareti → protokol zorunlu. */
export function yanikBildirimiGerekli(session: PhotoSession): boolean {
  return session.burn === true || session.eritem === 'agrili' || session.eritem === 'bullu'
}

/** Doz adımı defter özeti — hekimin girdiği adımları gösterir, adım önermez. */
export function dozAdimiOzeti(sessions: PhotoSession[], device?: PhotoDevice): string {
  const list = sessions
    .filter((s) => device == null || s.device === device)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  if (!list.length) return 'Seans yok'
  const adimli = list.filter((s) => s.doz_adimi_pct != null)
  const son = list[list.length - 1]
  const bits = [`Son doz ${son.j_cm2} J/cm²`]
  if (son.doz_adimi_pct != null) bits.push(`son adım %${son.doz_adimi_pct}`)
  if (adimli.length) bits.push(`${adimli.length} seansta adım kaydı var`)
  return bits.join(' · ')
}

export const DOZ_ADIMI_KILIDI =
  'Doz ve artış oranı hekim / ünite protokolünden girilir; Notya doz üretmez veya önermez.'

/** Ara verme uyarısı — kaç gün geçtiğini söyler, doz kararını söylemez. */
export function araVermeUyarisi(sessions: PhotoSession[], todayIso: string): string | null {
  const tarihler = sessions.map((s) => s.date).filter(Boolean).sort()
  if (!tarihler.length) return null
  const son = tarihler[tarihler.length - 1]
  const gun = Math.floor((Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${son}T00:00:00Z`)) / 86_400_000)
  if (!Number.isFinite(gun) || gun < 8) return null
  return `Son seanstan ${gun} gün geçti — doz devamı / geri alma kararı hekimin.`
}

export function annualTbseDue(lastTbseIso: string | null, todayIso: string): boolean {
  if (!lastTbseIso) return true
  const last = Date.parse(lastTbseIso + 'T00:00:00Z')
  const today = Date.parse(todayIso + 'T00:00:00Z')
  return (today - last) / (365 * 86_400_000) >= 1
}

/**
 * Yıllık TBSE hatırlatma ipucu — fototerapi alan hastada kümülatif maruziyet nedeniyle deri muayenesi.
 * Görev oluşturma hekim eylemidir; burada yalnız metin üretilir.
 */
export function tbseHatirlatmaIpucu(input: {
  lastTbseIso: string | null
  todayIso: string
  sessions: PhotoSession[]
}): { gerekli: boolean; metin: string } | null {
  if (!input.sessions.length) return null
  const due = annualTbseDue(input.lastTbseIso, input.todayIso)
  const kumulatif = cumulativeJ(input.sessions)
  if (!due) return { gerekli: false, metin: `TBSE güncel (${input.lastTbseIso}) · kümülatif ${kumulatif} J/cm²` }
  return {
    gerekli: true,
    metin: input.lastTbseIso
      ? `Yıllık TBSE vadesi geçti (son ${input.lastTbseIso}) · kümülatif ${kumulatif} J/cm²`
      : `Fototerapi başladı, TBSE kaydı yok · kümülatif ${kumulatif} J/cm²`,
  }
}

export const SOLARIUM_FORBIDDEN = true

/** Solaryum kelimesi cihaz alanına yazılamaz (API de reddeder). */
export function solaryumMu(device: string): boolean {
  return /solaryum|solarium|sunbed|tanning/i.test(device)
}

/** Araçlar › fototerapi — YANIK_PROTOKOLU ile aynı maddeler. */
export const BURN_CHECKLIST: readonly { kod: string; ad: string }[] = YANIK_PROTOKOLU

export function sonSeans(sessions: PhotoSession[], device?: PhotoDevice): PhotoSession | null {
  const liste = sessions
    .filter((s) => device == null || s.device === device)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  return liste[liste.length - 1] ?? null
}

export type FototerapiOzet = {
  seans: number
  kumulatif: number
  sonTarih: string | null
  sonDoz: number | null
  medJ: number | null
  sonrakiDozTaslagi: number | null
  yanik: number
}

/** Araçlar özeti — sonraki doz taslağı yalnız hekim girdiği adım + son dozdan; yanıkta null. */
export function fototerapiOzeti(sessions: PhotoSession[], device?: PhotoDevice): FototerapiOzet {
  const liste = sessions
    .filter((s) => device == null || s.device === device)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  const son = liste[liste.length - 1] ?? null
  const med = [...liste].reverse().find((s) => s.med_j_cm2 != null || s.med_test)?.med_j_cm2 ?? null
  const yanik = liste.filter((s) => s.burn).length
  let sonraki: number | null = null
  if (son && !son.burn && son.dose_step != null) {
    sonraki = Math.round((son.j_cm2 + son.dose_step) * 100) / 100
  }
  return {
    seans: liste.length,
    kumulatif: cumulativeJ(liste),
    sonTarih: son?.date ?? null,
    sonDoz: son?.j_cm2 ?? null,
    medJ: med,
    sonrakiDozTaslagi: sonraki,
    yanik,
  }
}
