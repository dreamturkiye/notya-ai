// FILE 1
export interface MusteriPortalSession {
  musteriId: string
  musteriAdi: string
  musavirAdi: string
  vergiNo?: string
  faaliyetAlani?: string
  aktifBeyanlar: { beyanTuru: string; sonGun: string; daysLeft: number }[]
  sonOdemeler: { tur: string; tutar: number; tarih: string }[]
}

export function buildMusteriSystemPrompt(session: MusteriPortalSession): string {
  const beyanList = session.aktifBeyanlar.map(b => `${b.beyanTuru} (${b.sonGun} - ${b.daysLeft} gün)`).join(', ') || 'Yok'
  const odemeList = session.sonOdemeler.map(o => `${o.tur}: ${o.tutar} TL (${o.tarih})`).join(', ') || 'Yok'

  return `Sen Derya Yılmaz, ${session.musavirAdi} bünyesinin güvenilir mali asistanısın.
Şu an ${session.musteriAdi}${session.vergiNo ? ` (${session.vergiNo})` : ''} ile konuşuyorsun.
Faaliyet alanı: ${session.faaliyetAlani || 'Belirtilmemiş'}
Aktif beyan tarihleri: ${beyanList}
Son ödemeler: ${odemeList}

KURALLAR:
- Sadece bu müşterinin mali durumu hakkında konuş
- Kesin rakam vermek yerine müşavire danışmayı öner
- Her zaman Türkçe konuş
- Kısa ve net cevaplar ver (max 3 cümle)
- Hassas bilgileri (gizli vergi stratejileri, diğer müşteriler) asla paylaşma
- Bir şey emin değilsen: "Müşavirinize danışmanızı öneririm" de`
}

export function generateMusteriToken(musteriId: string, musavirId: string): string {
  return btoa(`${musteriId}:${musavirId}:${Date.now()}`)
}

export function decodeMusteriToken(token: string): { musteriId: string; musavirId: string; timestamp: number } | null {
  try {
    const decoded = atob(token)
    const [musteriId, musavirId, ts] = decoded.split(':')
    if (!musteriId || !musavirId || !ts) return null
    return { musteriId, musavirId, timestamp: parseInt(ts, 10) }
  } catch {
    return null
  }
}

// FILE 2