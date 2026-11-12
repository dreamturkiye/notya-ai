/**
 * GERI-CAGIRMA-01 — the recall message. Pure and client-safe; the words are injected (Türkiye's are below, a country
 * build passes its own from its pack), the logic is the same file everywhere.
 *
 * HARD RULE: the message is GENERIC. It never carries the recall reason, a test name, a diagnosis, a drug or a
 * vaccine — a message can be read by someone else. It says a check-up is due, who it is from, and how to book.
 * It is an informational reminder to the practice's own patient: no price, no discount, no promotional wording
 * (health advertising rules). geriCagirma.test.ts checks every template against every reason label of every branş.
 */

export const SABLON_ANAHTARLARI = ['kontrol', 'randevu', 'kisa'] as const
export type SablonAnahtari = (typeof SABLON_ANAHTARLARI)[number]
export const VARSAYILAN_SABLON: SablonAnahtari = 'kontrol'

export const sablonMu = (x: unknown): x is SablonAnahtari => typeof x === 'string' && (SABLON_ANAHTARLARI as readonly string[]).includes(x)

export type SablonMetinleri = {
  etiket: Record<SablonAnahtari, string>
  konu: string
  /** Greeting with the name, and without (minor: the message speaks to the parent, so no name in the greeting). */
  selamAdli: (ad: string) => string
  selamAdsiz: string
  /** Body per template for an adult, and for a minor's parent/guardian (`ad` may be ''). */
  govde: Record<SablonAnahtari, { yetiskin: string; veli: (ad: string) => string }>
  /** Sentence that carries the personal booking link; `{link}` is replaced. */
  baglantili: string
  /** Sentence used when no personal link can be made. */
  baglantisiz: string
}

/** Türkiye. 'kontrol' reuses the wording of the existing one-tap `kontrol_hatirlatma` message (lib/iletisim/sablonlar.ts). */
export const TR_SABLON_METINLERI: SablonMetinleri = {
  etiket: { kontrol: 'Kontrol zamanı', randevu: 'Randevu hatırlatması', kisa: 'Kısa hatırlatma' },
  konu: 'Kontrol hatırlatması',
  selamAdli: (ad) => `Merhaba ${ad},`,
  selamAdsiz: 'Merhaba,',
  govde: {
    kontrol: { yetiskin: 'kontrol zamanınız geldi.', veli: (ad) => `${ad || 'çocuğunuz'} için kontrol zamanı geldi.` },
    randevu: { yetiskin: 'kontrol randevusu almanızı hatırlatmak isteriz.', veli: (ad) => `${ad || 'çocuğunuz'} için kontrol randevusu almanızı hatırlatmak isteriz.` },
    kisa: { yetiskin: 'sizi kontrole bekliyoruz.', veli: (ad) => `${ad || 'çocuğunuz'} ile sizi kontrole bekliyoruz.` },
  },
  baglantili: 'Size uygun bir saati buradan seçebilirsiniz: {link}',
  baglantisiz: 'Randevu için muayenehanemizi arayabilirsiniz.',
}

export type MesajGirdisi = { hastaAdi?: string | null; veliDili?: boolean; doktorAdi?: string | null; link?: string | null }

const temiz = (s: string | null | undefined) => String(s || '').replace(/\s+/g, ' ').trim()

/** The message one patient gets, before the channel's own closing lines (emergency line, opt-out) are added. */
export function mesajKur(anahtar: SablonAnahtari, g: MesajGirdisi, m: SablonMetinleri = TR_SABLON_METINLERI): { konu: string; metin: string } {
  const ad = temiz(g.hastaAdi)
  const doktor = temiz(g.doktorAdi)
  const link = temiz(g.link)
  const selam = g.veliDili || !ad ? m.selamAdsiz : m.selamAdli(ad)
  const govde = g.veliDili ? m.govde[anahtar].veli(ad) : m.govde[anahtar].yetiskin
  const nasil = link ? m.baglantili.replace('{link}', link) : m.baglantisiz
  const satirlar = [`${selam} ${govde} ${nasil}`, ...(doktor ? ['', doktor] : [])]
  return { konu: doktor ? `${m.konu} · ${doktor}` : m.konu, metin: satirlar.join('\n') }
}
