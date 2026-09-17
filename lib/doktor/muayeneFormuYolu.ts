/**
 * NOTYA-MUAYENEYE-DON-01 (Gökhan, 2026-09-17): "Bugünkü Muayene Formuna Ekle" sonrası yeşil
 * onay panelinde tek eksik, eklenen muayene formuna dönüş bağlantısıydı — hekim sonucu
 * ekledikten sonra formu elle aramak zorunda kalıyordu.
 *
 * gununNotunaEkle() zaten hangi nota yazdığını (notId) döndürüyor; burası o notId'yi hekimin
 * düzenleyebildiği muayene formu adresine çeviren tek yer. Etiket de tek yerde: her branşın
 * kendi onay kutusu aynı sözcükleri kullansın.
 */

/** Hekimin notu düzenleyip yeniden onaylayabildiği muayene formu sayfası (NOTYA-NOT-01). */
export function muayeneFormuYolu(notId: string): string {
  return `/dashboard/doktor/notlar/${encodeURIComponent(notId)}`
}

/** Onay kutularında kullanılan ortak ikincil bağlantı metni. */
export const MUAYENE_FORMUNA_DON = 'Muayene Formuna Dön →'

/**
 * Bir API yanıtından dönüş bağlantısı için notId çıkarır.
 * Yalnız not gerçekten eklendiyse döner: eklenemediyse hekimi boş bir forma göndermeyiz.
 *
 * İki yanıt şekli var:
 *   - { notEkleme: { eklendi, notId } }  → M-CHAT, gelişim, gebelik, jinekoloji ofis viziti
 *   - { ok: true, notId }                → dahiliye / göz "Nota ekle" kartları
 */
export function eklenenNotId(yanit: unknown): string | null {
  if (!yanit || typeof yanit !== 'object') return null
  const y = yanit as Record<string, unknown>

  const ne = y.notEkleme
  if (ne && typeof ne === 'object') {
    const n = ne as Record<string, unknown>
    if (n.eklendi === true && typeof n.notId === 'string' && n.notId) return n.notId
    return null
  }

  // Düz şekil: notId yalnız ekleme başarılıysa yazılır, ok:false ise gönderilmez.
  if (y.ok === false) return null
  return typeof y.notId === 'string' && y.notId ? y.notId : null
}
