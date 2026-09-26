/**
 * NOTYA-ILETISIM-03 — Meta webhook yardımcıları.
 *
 * `olaylariAyikla` gelen gövdeyi DÖNDÜRMEZ: yalnız teslim, şablon onayı ve bağlantı kopması.
 * NOTYA-KALKAN-01: gövde ayrı `kalkanAyikla` ile okunur (defter). `history` hâlâ okunmaz.
 */
import { createHmac, timingSafeEqual } from 'crypto'

/** X-Hub-Signature-256: "sha256=" + HMAC-SHA256(app secret, ham gövde). Sabit zamanlı karşılaştırma. */
export function imzaGecerliMi(hamGovde: string, baslik: string | null, appSecret: string): boolean {
  if (!baslik || !baslik.startsWith('sha256=') || !appSecret) return false
  const beklenen = createHmac('sha256', appSecret).update(hamGovde, 'utf8').digest('hex')
  const gelen = baslik.slice('sha256='.length).trim().toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(gelen)) return false
  return timingSafeEqual(Buffer.from(beklenen, 'hex'), Buffer.from(gelen, 'hex'))
}

/** GET doğrulaması: hub.mode=subscribe ve hub.verify_token eşleşirse hub.challenge aynen döner. */
export function dogrulamaYaniti(params: URLSearchParams, verifyToken: string): string | null {
  if (params.get('hub.mode') !== 'subscribe') return null
  const t = params.get('hub.verify_token') || ''
  if (!verifyToken || t.length !== verifyToken.length) return null
  if (!timingSafeEqual(Buffer.from(t), Buffer.from(verifyToken))) return null
  return params.get('hub.challenge')
}

export type TeslimDurumu = 'sent' | 'delivered' | 'read' | 'failed'

export interface TeslimOlayi {
  phoneNumberId: string
  mesajId: string
  durum: TeslimDurumu
  zaman: string | null
  hataKodu: string | null
}

export interface SablonOlayi {
  wabaId: string
  sablonAdi: string
  sablonId: string | null
  durum: string
}

const TESLIM: ReadonlySet<string> = new Set(['sent', 'delivered', 'read', 'failed'])

type Obj = Record<string, unknown>
const obj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {})
const dizi = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

export function olaylariAyikla(govde: unknown): { teslim: TeslimOlayi[]; sablon: SablonOlayi[]; kaldirilanWabalar: string[] } {
  const teslim: TeslimOlayi[] = []
  const sablon: SablonOlayi[] = []
  const kaldirilanWabalar: string[] = []
  const g = obj(govde)
  if (g.object !== 'whatsapp_business_account') return { teslim, sablon, kaldirilanWabalar }
  for (const entry of dizi(g.entry)) {
    const e = obj(entry)
    const wabaId = String(e.id || '')
    for (const change of dizi(e.changes)) {
      const c = obj(change)
      const v = obj(c.value)
      if (c.field === 'messages') {
        const phoneNumberId = String(obj(v.metadata).phone_number_id || '')
        for (const s of dizi(v.statuses)) {
          const st = obj(s)
          const durum = String(st.status || '')
          if (!TESLIM.has(durum) || !st.id || !phoneNumberId) continue
          const ts = Number(st.timestamp)
          const hata = obj(dizi(st.errors)[0])
          teslim.push({
            phoneNumberId,
            mesajId: String(st.id),
            durum: durum as TeslimDurumu,
            zaman: Number.isFinite(ts) && ts > 0 ? new Date(ts * 1000).toISOString() : null,
            hataKodu: hata.code != null ? String(hata.code) : null,
          })
        }
        // v.messages burada okunmaz — gövde kalkanAyikla'dadır, bu dönüşe girmez.
      } else if (c.field === 'message_template_status_update') {
        const ad = String(v.message_template_name || '')
        const durum = String(v.event || '')
        if (ad && durum && wabaId) sablon.push({ wabaId, sablonAdi: ad, sablonId: v.message_template_id != null ? String(v.message_template_id) : null, durum })
      } else if (c.field === 'account_update' || c.field === 'account_offboarded') {
        // Doktor uygulamadan bağlantıyı kopardı (Ayarlar › Hesap › Business Platform › Bağlantıyı kes →
        // PARTNER_REMOVED) ya da Meta hesabı ayırdı: anahtar bizde kalmamalı.
        const olay = String(v.event || '')
        if (wabaId && (c.field === 'account_offboarded' || /PARTNER_REMOVED|ACCOUNT_DELETED/i.test(olay))) kaldirilanWabalar.push(wabaId)
      }
      // history / smb_app_state_sync: eşitleme dökümü, okunmaz. Echo gövdesi kalkanAyikla'da.
    }
  }
  return { teslim, sablon, kaldirilanWabalar }
}

export type KalkanYon = 'gelen' | 'giden_hekim'

/** Gelen hasta satırı veya doktorun uygulamadan yazdığı yankı. history yok. */
export interface KalkanHam {
  phoneNumberId: string
  wamid: string
  karsiNumara: string
  zaman: string | null
  tip: string
  govde: string
  mediaId: string | null
  yon: KalkanYon
}

function metinVeMedya(m: Obj): { govde: string; tip: string; mediaId: string | null } {
  const tip = String(m.type || 'text')
  const text = obj(m.text)
  const govde = String(text.body || obj(m.image).caption || obj(m.audio).caption || obj(m.video).caption || obj(m.document).caption || '')
  const media = obj(m.image).id || obj(m.audio).id || obj(m.video).id || obj(m.document).id || null
  return { govde, tip, mediaId: media != null ? String(media) : null }
}

function zamanIso(ts: unknown): string | null {
  const n = Number(ts)
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null
}

/** Gelen `messages[]` ve doktor yankısı `smb_message_echoes`. Teslim ayıklayıcısına gövde koymaz. */
export function kalkanAyikla(govde: unknown): KalkanHam[] {
  const out: KalkanHam[] = []
  const g = obj(govde)
  if (g.object !== 'whatsapp_business_account') return out
  for (const entry of dizi(g.entry)) {
    for (const change of dizi(obj(entry).changes)) {
      const c = obj(change)
      const v = obj(c.value)
      const phoneNumberId = String(obj(v.metadata).phone_number_id || '')
      if (!phoneNumberId) continue
      if (c.field === 'messages') {
        for (const raw of dizi(v.messages)) {
          const m = obj(raw)
          if (!m.id || !m.from) continue
          const parca = metinVeMedya(m)
          out.push({ phoneNumberId, wamid: String(m.id), karsiNumara: String(m.from), zaman: zamanIso(m.timestamp), ...parca, yon: 'gelen' })
        }
      } else if (c.field === 'smb_message_echoes') {
        for (const raw of dizi(v.message_echoes)) {
          const m = obj(raw)
          if (!m.id || !m.to) continue
          const parca = metinVeMedya(m)
          out.push({ phoneNumberId, wamid: String(m.id), karsiNumara: String(m.to), zaman: zamanIso(m.timestamp), ...parca, yon: 'giden_hekim' })
        }
      }
    }
  }
  return out
}
