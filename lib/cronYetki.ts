/**
 * SEC-CRON-01 (Kaan, 2026-09-25): cron uçlarının tek yetki kontrolü.
 * Eskiden x-vercel-cron: 1 başlığına güveniliyordu; bu başlığı DIŞARIDAN herkes gönderebilir (KVKK imha,
 * randevu hatırlatma ve FHIR dışa aktarım işlerini tetikleyebilirdi). Vercel, proje ortamında CRON_SECRET
 * tanımlıyken cron çağrılarına kendiliğinden Authorization: Bearer <CRON_SECRET> ekler — yalnız buna güvenilir.
 * Elle tetikleme için mevcut ?secret=<CRON_SECRET> yolu korunur. CRON_SECRET yoksa hiçbir çağrı geçmez.
 */
export function cronYetkiliMi(req: Request, gizli: string | undefined = process.env.CRON_SECRET): boolean {
  if (!gizli) return false
  if ((req.headers.get('authorization') || '') === 'Bearer ' + gizli) return true
  return new URL(req.url).searchParams.get('secret') === gizli
}
