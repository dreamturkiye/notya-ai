/**
 * NOTYA-RANDEVU-V2 — patient e-mail texts for the new flow. Pure.
 * Same rules as lib/iletisim/sablonlar.ts: logistics only (no diagnosis, reason, type or result), guardian
 * wording follows the patient's age (veliDili), signed with the doctor's name.
 */
import { gunIfadesi, saatIfadesi, bugunTrIso } from '@/lib/iletisim/sablonlar'
import type { JetonEylemi } from './jeton'

export type RandevuEpostaTuru = 'onay_eposta' | 'oneri_eposta' | 'red_eposta' | 'iptal_eposta' | 'gun_once' | 'sabah' | 'bekleme_teklif'

export type RandevuEpostaGirdisi = {
  hastaAdi?: string | null
  veliDili?: boolean
  doktorAdi?: string | null
  randevuIso: string
  bugunIso?: string
  /** Signed single-appointment links (lib/randevu/v2/jeton.ts) — omitted when the secret is missing. */
  linkler?: Partial<Record<JetonEylemi, string>>
}

const temiz = (s: string | null | undefined) => String(s || '').replace(/\s+/g, ' ').trim()

function merhaba(g: RandevuEpostaGirdisi): string {
  const ad = temiz(g.hastaAdi)
  return g.veliDili || !ad ? 'Merhaba,' : `Merhaba ${ad},`
}

function kimin(g: RandevuEpostaGirdisi): string {
  if (!g.veliDili) return 'randevunuz'
  return `${temiz(g.hastaAdi) || 'çocuğunuz'} adına randevunuz`
}

function zaman(g: RandevuEpostaGirdisi): string {
  return `${gunIfadesi(g.randevuIso, g.bugunIso || bugunTrIso())} saat ${saatIfadesi(g.randevuIso)}`
}

function doktorIle(g: RandevuEpostaGirdisi): string {
  const d = temiz(g.doktorAdi)
  return d ? `${d} ile ` : ''
}

const LINK_ETIKETI: Record<JetonEylemi, string> = {
  geliyorum: 'Geliyorum',
  kabul: 'Bu saati kabul ediyorum',
  ertele: 'Başka bir saat seçmek istiyorum',
  iptal: 'İptal etmek istiyorum',
  teklif: 'Bu saati istiyorum',
}

function linkSatirlari(g: RandevuEpostaGirdisi, sira: JetonEylemi[]): string[] {
  const l = g.linkler || {}
  const satir = sira.filter((e) => l[e]).flatMap((e) => [`${LINK_ETIKETI[e]}:`, String(l[e])])
  return satir.length ? ['', ...satir] : []
}

function imzala(govde: string[], g: RandevuEpostaGirdisi): string {
  const d = temiz(g.doktorAdi)
  return [...govde, ...(d ? ['', d] : [])].join('\n')
}

function konu(baslik: string, g: RandevuEpostaGirdisi): string {
  const d = temiz(g.doktorAdi)
  return d ? `${baslik} · ${d}` : baslik
}

export function randevuEpostasi(tur: RandevuEpostaTuru, g: RandevuEpostaGirdisi): { konu: string; metin: string } {
  const z = zaman(g)
  switch (tur) {
    case 'onay_eposta':
      return {
        konu: konu('Randevunuz onaylandı', g),
        metin: imzala([
          `${merhaba(g)} ${doktorIle(g)}${z} için ${kimin(g)} onaylandı. Takviminize eklemek için ekteki dosyayı açabilirsiniz.`,
          ...linkSatirlari(g, ['geliyorum', 'ertele', 'iptal']),
        ], g),
      }
    case 'oneri_eposta':
      return {
        konu: konu('Randevunuz için yeni saat önerisi', g),
        metin: imzala([
          `${merhaba(g)} istediğiniz saat uygun olmadığı için muayenehanemiz ${z} saatini öneriyor. Bu saat size uyarsa onaylamanız yeterli.`,
          ...linkSatirlari(g, ['kabul', 'ertele', 'iptal']),
        ], g),
      }
    case 'red_eposta':
      return {
        konu: konu('Randevu talebiniz', g),
        metin: imzala([
          `${merhaba(g)} ${z} için olan randevu talebinizi bu sefer karşılayamıyoruz. Başka bir saat için Sağlığım’dan yeniden talep oluşturabilir ya da bizi arayabilirsiniz.`,
        ], g),
      }
    case 'iptal_eposta':
      return {
        konu: konu('Randevunuz iptal edildi', g),
        metin: imzala([`${merhaba(g)} ${z} için olan ${kimin(g)} iptal edildi. Yeni bir randevu için Sağlığım’ı kullanabilir ya da bizi arayabilirsiniz.`], g),
      }
    case 'gun_once':
      return {
        konu: konu('Randevu hatırlatması', g),
        metin: imzala([
          `${merhaba(g)} ${z} için ${doktorIle(g)}${kimin(g)} var. Gelebilecekseniz “Geliyorum”a dokunmanız yeterli; gelemeyecekseniz lütfen bize haber verin.`,
          ...linkSatirlari(g, ['geliyorum', 'ertele', 'iptal']),
        ], g),
      }
    case 'bekleme_teklif':
      return {
        konu: konu('Daha erken bir saat açıldı', g),
        metin: imzala([
          `${merhaba(g)} istediğiniz gibi daha erken bir saat açıldı: ${z}. Bu saati isterseniz aşağıdaki bağlantıya dokunun; mevcut randevunuz bu saate taşınır. Saat, ilk isteyene verilir ve kısa süre ayrılı kalır.`,
          ...linkSatirlari(g, ['teklif']),
        ], g),
      }
    case 'sabah':
      return {
        konu: konu('Bugünkü randevunuz', g),
        metin: imzala([
          `${merhaba(g)} ${z} için ${doktorIle(g)}${kimin(g)} var. Görüşmek üzere.`,
          ...linkSatirlari(g, ['geliyorum', 'iptal']),
        ], g),
      }
  }
}
