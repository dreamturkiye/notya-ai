/**
 * /api/users/me — süreç içi, 60 sn. Hasta listesi ve dosya burada yok.
 * İzole yapışkan değil; ıskalama yine tek users okuması. Profil yazımı hekimProfilDusur ile düşer.
 */
const TTL_MS = 60_000

type Kayit = { veri: unknown; son: number }
const bellek = new Map<string, Kayit>()

export const HEKIM_PROFIL_TTL_MS = TTL_MS

export function hekimProfilOku(userId: string, simdi = Date.now()): unknown | null {
  if (!userId) return null
  const s = bellek.get(userId)
  if (!s) return null
  if (simdi - s.son > TTL_MS) {
    bellek.delete(userId)
    return null
  }
  return s.veri
}

export function hekimProfilYaz(userId: string, veri: unknown, simdi = Date.now()): void {
  if (!userId) return
  bellek.set(userId, { veri, son: simdi })
}

export function hekimProfilDusur(userId: string): void {
  if (!userId) return
  bellek.delete(userId)
}
