/**
 * KONSULTASYON-02 — konsültasyon rotasının tarayıcı istemcisi. TEK yer: hasta dosyası › Konsültasyonlar kartı ve
 * Araçlar › Bekleyen Konsültasyonlar aynı çağrıyı ve aynı metinleri kullanır (iki yüzey aynı işlemi farklı yapmasın).
 *
 * Konsültan e-postası: cihazdaki posta uygulaması (mailto → Mac Mail / iPhone Mail) veya Ayarlar › İletişim tercihi
 * (Gmail/Outlook web). Sunucu OAuth kutusu gerekmez — NOTYA-ILETISIM-01 ile aynı desen.
 */
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { epostaLinki } from '@/lib/iletisim/baglantilar'
import { baglantiyiAc, cihazEpostaAcilisi } from '@/lib/iletisim/istemci'
import { TASLAK_OLUSTURULAMADI } from '@/lib/doktor/konsultasyonTaslagi'
import { epostaDurumMetni } from '@/lib/doktor/konsultasyonEposta'

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
export function konsultasyonIslemi(
  id: string,
  islem: 'kapat' | 'hatirlat' | 'nota_ekle' | 'sil' | 'eposta_gonder',
  ek?: { aliciEposta?: string; isaretle?: boolean },
) {
  return konsultasyonApi('/api/doktor/konsultasyon', {
    method: 'PATCH',
    govde: {
      id,
      islem,
      ...(ek?.aliciEposta ? { aliciEposta: ek.aliciEposta } : {}),
      ...(ek?.isaretle ? { isaretle: true } : {}),
    },
  })
}

/**
 * Taslak alanlarından cihaz postasını açar (Mac Mail / iPhone Mail / tercih edilen web).
 * iOS Safari için senkron çağrılmalı (tap handler içinde).
 */
export function konsultanEpostasiniAc(taslak: { alici: string; konu: string; metin: string }): boolean {
  const acilis = cihazEpostaAcilisi() || 'uygulama'
  const link = epostaLinki(taslak.alici, taslak.konu, taslak.metin, acilis)
  if (!link) return false
  baglantiyiAc(link)
  return true
}

/** Araçlar › Konsültasyonlar (ORTAK_DOKTOR_ARACLARI — 30 branş). Eski bekleyen route 308 ile buraya gider. */
export const KONSULTASYONLAR_ROTASI = '/doktor-tools/konsultasyonlar'
/** @deprecated KONSULTASYONLAR_ROTASI kullanın — geri uyum için aynı hedef. */
export const BEKLEYEN_KONSULTASYONLAR_ROTASI = KONSULTASYONLAR_ROTASI

export const YANITSIZ_KAPAT_ONAYI = 'Bu konsültasyon yanıt gelmeden kapatılsın mı? Geç gelen rapor yine eklenebilir.'
export const YANITSIZ_SIL_ONAYI = 'Yanıtsız kapatılmış bu konsültasyon hasta dosyasından silinsin mi? Bu işlem geri alınamaz.'
/** Yanıt bekleyen istemi iptal / sil — hekim yeniden yazmak veya vazgeçmek ister. */
export const ISTEM_IPTAL_ONAYI = 'Bu konsültasyon istemi iptal edilsin mi? Kayıt silinir; isterseniz yeniden yazabilirsiniz. Bu işlem geri alınamaz.'
export const HATIRLATMA_GONDERILDI = 'Hastaya Sağlığım üzerinden hatırlatma gönderildi (klinik bilgi içermez).'
/** Konsültana portal linki — cihaz postası; Hatırlat (hasta) ile karışmasın. */
export const KONSULTAN_EPOSTA_GONDERILDI = 'Gönderildi olarak işaretlendi (posta uygulamanızda Gönder’e bastığınızdan emin olun).'
export const KONSULTAN_EPOSTA_ALICI_SOR = 'Konsültanın e-posta adresi (ör. ad@ornek.com):'
export { epostaDurumMetni, ILETISIM_EPOSTA_AYAR_YOLU } from '@/lib/doktor/konsultasyonEposta'

/**
 * Konsültana e-posta: sunucudan taslak al → cihaz postasını aç → gönderildi işaretle.
 * Alıcı yoksa sunucu 400 döner; çağıran prompt edebilir.
 */
export async function konsultanEpostaGonderAkisi(
  id: string,
  aliciEposta?: string,
): Promise<{ ok: boolean; metin: string; konsultasyon?: Record<string, unknown>; aliciEposta?: string }> {
  const hazir = await konsultasyonIslemi(id, 'eposta_gonder', aliciEposta ? { aliciEposta } : undefined)
  if (!hazir.ok) {
    return {
      ok: false,
      metin: epostaDurumMetni(String(hazir.j.epostaDurum || ''), typeof hazir.j.aliciEposta === 'string' ? hazir.j.aliciEposta : null)
        || hazir.j.error || 'E-posta hazırlanamadı.',
    }
  }
  const alici = String(hazir.j.aliciEposta || aliciEposta || '')
  const konu = String(hazir.j.epostaKonu || '')
  const metin = String(hazir.j.epostaMetin || '')
  if (!alici || !konu || !metin) {
    return { ok: false, metin: epostaDurumMetni('hata') }
  }
  const acildi = konsultanEpostasiniAc({ alici, konu, metin })
  if (!acildi) return { ok: false, metin: 'Posta uygulaması açılamadı — e-posta adresini kontrol edin.' }

  // Hekim posta uygulamasında Gönder’e basacak; biz açıldıktan sonra işaretleriz.
  const isaret = await konsultasyonIslemi(id, 'eposta_gonder', { aliciEposta: alici, isaretle: true })
  return {
    ok: true,
    metin: epostaDurumMetni('hazir', alici),
    konsultasyon: (isaret.ok && isaret.j.konsultasyon) || hazir.j.konsultasyon,
    aliciEposta: alici,
  }
}

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
