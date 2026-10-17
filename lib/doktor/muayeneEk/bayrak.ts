/**
 * MUAYENE-EKLERI-01 — TEK kill switch. NOTYA_MUAYENE_EKLERI=off (ya da 0/false/kapali/hayir) → Ekleri Ekle adımı, ek
 * API'leri ve sessions/end'in ek işleme yolu tamamen kapanır; kayıt → not akışı değişiklik öncesiyle birebir aynıdır.
 * Varsayılan AÇIK. Sunucuda okunur, istemciye /api/doktor/muayene-ekleri/durum ile yansıtılır (istemci ayrıca, durum
 * alınamazsa ESKİ akışa düşer: fail-open).
 */
const KAPALI = new Set(['off', '0', 'false', 'kapali', 'kapalı', 'hayir', 'hayır', 'no', 'disabled'])

export function muayeneEkleriAcikMi(env: Record<string, string | undefined> = process.env): boolean {
  const v = String(env.NOTYA_MUAYENE_EKLERI ?? '').trim().toLocaleLowerCase('tr-TR')
  return !KAPALI.has(v)
}
