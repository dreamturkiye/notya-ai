/**
 * NOTYA-ILETISIM-03 — Meta webhook yardımcıları.
 *
 * Gizlilik kuralı: bu dosya gelen mesajların GÖVDESİNİ asla döndürmez. `durumlariAyikla` yalnız
 * `statuses[]` (teslim durumu) ve `message_template_status_update` (şablon onayı) okur; `messages[]`,
 * `smb_message_echoes`, `history` gibi içerik taşıyan alanlar okunmadan atılır.
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
        // v.messages (gelen hasta mesajları) BİLEREK okunmaz.
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
      // history / smb_app_state_sync / smb_message_echoes: coexistence eşitlemesi — içerik, BİLEREK okunmaz.
    }
  }
  return { teslim, sablon, kaldirilanWabalar }
}
