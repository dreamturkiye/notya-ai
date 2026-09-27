/**
 * /api/users/me — süreç içi, 60 sn. Hasta listesi ve dosya burada yok.
 * İzole yapışkan değil; ıskalama yine tek users okuması.
 * Profil yazımı ve süper kullanıcı branş değişimi hekimProfilDusur ile düşer.
 * Üst sınır: süresi dolmuş kayıtlar ve en eski girdiler atılır (izole şişmesin).
 */
const TTL_MS = 60_000
const AZAMI = 400

type Kayit = { veri: unknown; son: number }
const bellek = new Map<string, Kayit>()

export const HEKIM_PROFIL_TTL_MS = TTL_MS
export const HEKIM_PROFIL_AZAMI = AZAMI

function yerAc(simdi: number): void {
  for (const [id, s] of bellek) {
    if (simdi - s.son > TTL_MS) bellek.delete(id)
  }
  while (bellek.size >= AZAMI) {
    const ilk = bellek.keys().next().value
    if (!ilk) break
    bellek.delete(ilk)
  }
}

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
  yerAc(simdi)
  bellek.set(userId, { veri, son: simdi })
}

export function hekimProfilDusur(userId: string): void {
  if (!userId) return
  bellek.delete(userId)
}
