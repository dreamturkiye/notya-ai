/**
 * DERM-EXCEPTIONAL-01 — Belge Tier A (Asistana raporla) → derm dual-sign okuma taslağı. Pure.
 * Kaynak: Belge kasasındaki analiz (belge_analizleri) VEYA Deri › Görüntü'deki hasta_goruntulemeler satırı — ikisi de aynı Tier A yolu.
 * Kurallar: vücut bölgesi zorunlu (okuma lezyon başınadır; "tüm vücut" tek okumaya sığmaz), deri tipi (Fitzpatrick)
 * bilinmiyorsa güven üst sınırı ≤ %70, taslak her zaman asistan yazımıdır ve uzman onayı bekler; TANI YAZILMAZ —
 * model kodları "olası bulgu" olarak, tanı değil diye etiketlenir (melanom/BCC/SCC tanısı histopatoloji ile).
 * Görüntü okunamazsa (hata / düşük kalite) morfoloji kontrol listesi iskeleti yedek taslaktır.
 */
import type { BelgeRaporu } from '@/core/belgeler/types'
import type { VisionRead } from '../schema'
import { VISION_DISCLAIMER } from './vision-tools'

export const DERM_MODALITELER = ['dermatoskopi', 'derm', 'yara'] as const
export type DermModalite = (typeof DERM_MODALITELER)[number]

/** Belge ontolojisi modalitesi → derm görüntü modalitesi. Başka modalite köprüden geçmez. */
export function belgeModaliteDerm(m: string | null | undefined): DermModalite | null {
  return (DERM_MODALITELER as readonly string[]).includes(String(m)) ? (m as DermModalite) : null
}

/** Derm modalitesi → dual-sign okuma görevi (VisionRead.task). Dermoskopi ipucu yalnız dermatoskopiden. */
export function dermModaliteTask(m: DermModalite): VisionRead['task'] {
  return m === 'dermatoskopi' ? 'dermoskopi_ipucu' : 'morfoloji'
}

/** Fitzpatrick bilinmeyen telefon fotoğrafı (core/belgeler/fusion cap tablosu) — köprü de aynı sınırı uygular. */
export const FITZ_BILINMIYOR_UST = 70

export function guvenUst(capPct: number | null | undefined, fitzpatrickBilinmiyor: boolean): number {
  const cap = capPct != null && Number.isFinite(Number(capPct)) ? Math.max(0, Math.min(100, Number(capPct))) : FITZ_BILINMIYOR_UST
  return fitzpatrickBilinmiyor ? Math.min(cap, FITZ_BILINMIYOR_UST) : cap
}

const TUM_VUCUT = /^(t[uü]m v[uü]cut|genel|her yer|yayg[ıi]n)$/i

/** Okuma lezyon başınadır: bölge zorunlu, "tüm vücut" reddedilir (TBSE ayrı bir akış). */
export function kopruBolgeDogrula(bolge: unknown): { ok: true; bolge: string } | { ok: false; hata: string } {
  const b = String(bolge ?? '').trim().slice(0, 120)
  if (b.length < 2) return { ok: false, hata: 'Vücut bölgesi seçin — okuma lezyon başına yazılır.' }
  if (TUM_VUCUT.test(b)) return { ok: false, hata: 'Tüm vücut tek okumaya aktarılmaz; her lezyon için ayrı görüntü yükleyin.' }
  return { ok: true, bolge: b }
}

/** Analiz okunabilir mi? Hata / düşük kalite → köprü reddeder, yedek morfoloji kontrol listesi önerilir. */
export function analizKopruyeUygun(durum: string | null | undefined, rapor: BelgeRaporu | null | undefined): { ok: true } | { ok: false; hata: string } {
  if (!rapor || durum === 'hata') return { ok: false, hata: 'Asistan analizi yok veya hata ile bitti — Deri › Görüntü’de morfoloji kontrol listesi taslağı kullanın.' }
  if (durum === 'kalite_dusuk' || rapor.kalite === 'dusuk') return { ok: false, hata: 'Görüntü kalitesi düşük — bulgu taslağı aktarılmaz; morfoloji kontrol listesi taslağı veya yeniden çekim.' }
  return { ok: true }
}

const MOD_AD: Record<DermModalite, string> = {
  dermatoskopi: 'Dermatoskopi',
  derm: 'Deri lezyonu fotoğrafı',
  yara: 'Yara / yanık fotoğrafı',
}

export interface TaslakGirdi {
  rapor: BelgeRaporu
  modalite: DermModalite
  bolge: string
  guvenUstPct: number
  fitzpatrickBilinmiyor: boolean
}

/**
 * Dual-sign taslak metni. Model "tanı" başlıkları "olası bulgu (tanı değildir)" olarak, güven üst sınırıyla
 * kırpılarak yazılır. Resmî tanıyı hekim lezyon kartında kilitler; histopatoloji son sözü söyler.
 */
export function belgeTaslakMetni(g: TaslakGirdi): string {
  const r = g.rapor
  const satir: string[] = [`Asistan taslak (Belge Tier A, ${MOD_AD[g.modalite]}, ${g.bolge}) — ${VISION_DISCLAIMER}`]
  if (r.ozet) satir.push(`Özet: ${r.ozet}`)
  if (r.bulgular.length) satir.push('Gözlemler:', ...r.bulgular.slice(0, 12).map((b, i) => `${i + 1}. ${b}`))
  if (r.tanilar.length) {
    satir.push(`Olası bulgular (karar desteği; tanı değildir — resmî tanıyı hekim lezyon kartında kilitler, histopatoloji esastır; güven ≤%${g.guvenUstPct}):`)
    for (const t of r.tanilar.slice(0, 5)) satir.push(`- ${t.ad} (%${Math.min(t.guven_pct, g.guvenUstPct)})`)
  }
  if (r.acil_bayrak) satir.push('Asistan acil bayrağı kaldırdı — hekim aynı gün ABCDE / dermoskopi ile değerlendirir.')
  const sinir = [...r.sinirlar]
  if (g.fitzpatrickBilinmiyor) sinir.push(`Deri tipi (Fitzpatrick) bilinmiyor — güven en çok %${FITZ_BILINMIYOR_UST}.`)
  if (sinir.length) satir.push(`Sınırlar: ${[...new Set(sinir)].join(' · ')}`)
  satir.push('Uzman onayından önce klinik karar verilmez.')
  return satir.join('\n').slice(0, 3000)
}

/** Taslağın ayırıcı listesi — model tanıları "olası bulgu" olarak, cap ile kırpılmış etiketle. */
export function taslakAyiricilar(rapor: BelgeRaporu, guvenUstPct: number): string[] {
  return rapor.tanilar.slice(0, 5).map((t) => `${t.ad} (%${Math.min(t.guven_pct, guvenUstPct)}) — olası bulgu`)
}

/** Sonraki adım önerisi; işlem/doz değil, hekimin kapısı. */
export function taslakSonrakiAdim(rapor: BelgeRaporu, modalite: DermModalite): string {
  if (rapor.acil_bayrak) return 'Aynı gün hekim değerlendirmesi: ABCDE + dermoskopi, eksizyonel biyopsi kararı hekimindir.'
  if (modalite === 'yara') return 'Yara bakımı kontrolü ve enfeksiyon bulgularının hekimce değerlendirilmesi.'
  return 'Uzman onayı; gerekirse dermoskopik takip fotoğrafı (aynı lezyon_id) planlanır.'
}

/** Taslak metinde tanı kesinliği dili yakalanır (hekim yine yazabilir; uyarı). */
export function taslakTaniDiliUyarisi(metin: string): string | null {
  return /(?<![\p{L}])(kesin(likle)? tan[ıi]|tan[ıi]s[ıi] konmu[şs]tur|kesin olarak|melanomdur|malign(dir|dir\.)?)(?![\p{L}])/iu.test(metin)
    ? 'Taslak kesin tanı dili içeriyor — okuma karar desteğidir, tanı histopatoloji ile konur.'
    : null
}
