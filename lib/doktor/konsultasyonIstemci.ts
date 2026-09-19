/**
 * KONSULTASYON-02 — konsültasyon rotasının tarayıcı istemcisi. TEK yer: hasta dosyası › Konsültasyonlar kartı ve
 * Araçlar › Bekleyen Konsültasyonlar aynı çağrıyı ve aynı metinleri kullanır (iki yüzey aynı işlemi farklı yapmasın).
 */
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'

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
