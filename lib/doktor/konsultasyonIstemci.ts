/**
 * KONSULTASYON-02 — konsültasyon rotasının tarayıcı istemcisi. TEK yer: hasta dosyası › Konsültasyonlar kartı ve
 * Araçlar › Bekleyen Konsültasyonlar aynı çağrıyı ve aynı metinleri kullanır (iki yüzey aynı işlemi farklı yapmasın).
 */
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { TASLAK_OLUSTURULAMADI } from '@/lib/doktor/konsultasyonTaslagi'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function konsultasyonApi(yol: string, init?: { method?: string; govde?: unknown }): Promise<{ ok: boolean; j: Record<string, any> }> {
  const t = await getAccessTokenAsync()
  const r = await fetch(yol, {
    method: init?.method || 'GET',
    headers: { Authorization: `Bearer ${t}`, ...(init?.govde !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: init?.govde !== undefined ? JSON.stringify(init.govde) : undefined,
    cache: 'no-store',
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j = (await r.json().catch(() => ({}))) as Record<string, any>
  return { ok: r.ok && j.ok !== false, j }
}

/** Kart ve bekleyenler listesinin tek dokunuşlu işlemleri (yanıt ekleme formu hasta dosyasındadır). */
export function konsultasyonIslemi(id: string, islem: 'kapat' | 'hatirlat' | 'nota_ekle') {
  return konsultasyonApi('/api/doktor/konsultasyon', { method: 'PATCH', govde: { id, islem } })
}

/** Araçlar › Bekleyen Konsültasyonlar (ORTAK_DOKTOR_ARACLARI — 30 branş). */
export const BEKLEYEN_KONSULTASYONLAR_ROTASI = '/doktor-tools/bekleyen-konsultasyonlar'

export const YANITSIZ_KAPAT_ONAYI = 'Bu konsültasyon yanıt gelmeden kapatılsın mı? Geç gelen rapor yine eklenebilir.'
export const HATIRLATMA_GONDERILDI = 'Hastaya Sağlığım üzerinden hatırlatma gönderildi (klinik bilgi içermez).'

/** Hasta dosyası › Konsültasyonlar; `yanit` verilirse o konsültasyonun yanıt formu açık gelir. */
export function konsultasyonDosyaYolu(patientId: string, yanitId?: string): string {
  const yol = `/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}?tab=konsultasyon`
  return yanitId ? `${yol}&yanit=${encodeURIComponent(yanitId)}` : yol
}

/* ───────────────────────── Ayşe taslakları (AYSE-KONSULTASYON-01) ───────────────────────── */

export type TaslakYaniti =
  | { ok: true; taslak: string; kaynak?: unknown; dozUyarisi?: string[]; belgeDurumu?: string }
  | { ok: false; mesaj: string; neden?: string }

type Api = typeof konsultasyonApi

/**
 * Taslak isteği — HER hata (ağ, 4xx/5xx, kredi yok, model çıktısı düştü) tek bir yumuşak sonuca iner: form boş ama
 * kullanılabilir kalır ve hekim "Taslak oluşturulamadı, elle yazabilirsiniz" görür. Hekim asla kilitlenmez.
 */
export async function taslakIste(govde: Record<string, unknown>, api: Api = konsultasyonApi): Promise<TaslakYaniti> {
  try {
    const { ok, j } = await api('/api/doktor/konsultasyon', { method: 'POST', govde })
    if (ok && typeof j.taslak === 'string' && j.taslak.trim()) {
      return { ok: true, taslak: j.taslak, kaynak: j.kaynak, dozUyarisi: Array.isArray(j.dozUyarisi) ? j.dozUyarisi : [], belgeDurumu: j.belgeDurumu }
    }
    // Taslak uç noktasının kendi yumuşak hatası (neden + "elle yazabilirsiniz" cümlesi) aynen; oturum / ağ / sunucu
    // hataları gibi diğer her şey tek cümleye iner.
    if (typeof j.neden === 'string') return { ok: false, mesaj: typeof j.error === 'string' && j.error ? j.error : TASLAK_OLUSTURULAMADI, neden: j.neden }
    return { ok: false, mesaj: TASLAK_OLUSTURULAMADI }
  } catch {
    return { ok: false, mesaj: TASLAK_OLUSTURULAMADI }
  }
}

export const istemTaslagiIste = (patientId: string, hedefBrans: string, not?: string, api?: Api) =>
  taslakIste({ islem: 'istem_taslagi', patientId, hedefBrans, ...(not ? { not } : {}) }, api)

export const yanitTaslagiIste = (id: string, belgeId: string, deid?: { mime: string; base64: string } | null, api?: Api) =>
  taslakIste({ islem: 'yanit_taslagi', id, belgeId, ...(deid ? { deid } : {}) }, api)

/**
 * Fotoğraf rapor: sunucu "deid_gerekli" derse (mevcut belge değerlendirmesi yok) tarayıcı kasadaki görüntüyü indirir,
 * EXIF'siz küçültülmüş türevini çıkarır (core/belgeler/deid — NOTYA-BELGE-01 sözleşmesi) ve yeniden ister.
 */
export async function yanitTaslagiIsteVeGerekirseKimliksizlestir(id: string, belgeId: string): Promise<TaslakYaniti> {
  const ilk = await yanitTaslagiIste(id, belgeId)
  if (ilk.ok || ilk.neden !== 'deid_gerekli') return ilk
  try {
    const t = await getAccessTokenAsync()
    const r = await fetch(`/api/doktor/documents/${encodeURIComponent(belgeId)}/download`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
    if (!r.ok) return { ok: false, mesaj: TASLAK_OLUSTURULAMADI }
    const { gorseliKimliksizlestir } = await import('@/core/belgeler/deid')
    const d = await gorseliKimliksizlestir(await r.blob())
    return yanitTaslagiIste(id, belgeId, { mime: d.mime, base64: d.base64 })
  } catch {
    return { ok: false, mesaj: TASLAK_OLUSTURULAMADI }
  }
}
