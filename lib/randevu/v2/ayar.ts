/**
 * NOTYA-RANDEVU-V2 — the per-doctor 'Hasta Portalı Randevu' settings (randevu_portal_ayarlari). Pure, client-safe.
 * Default is OFF; with it off nothing in V2 is reachable (portal, links, cron all answer "kapalı").
 */

/** Existing randevular.tur values a patient may book. 'diger' stays practice-only. */
export const PORTAL_TURLERI = ['ilk_muayene', 'muayene', 'kontrol'] as const
export type PortalTuru = (typeof PORTAL_TURLERI)[number]

export const TUR_ADI: Record<PortalTuru, string> = {
  ilk_muayene: 'İlk muayene',
  muayene: 'Muayene',
  kontrol: 'Kontrol',
}

export type OnayModu = 'hepsi_onay' | 'mevcut_hasta_otomatik'

export type PortalRandevuAyari = {
  acik: boolean
  turler: Record<PortalTuru, { acik: boolean; sure: number }>
  tamponDk: number
  minBildirimSaat: number
  maxIleriGun: number
  iptalSinirSaat: number
  onayModu: OnayModu
  eskalasyonSaat: number
}

export const VARSAYILAN_AYAR: PortalRandevuAyari = {
  acik: false,
  turler: {
    ilk_muayene: { acik: true, sure: 30 },
    muayene: { acik: true, sure: 20 },
    kontrol: { acik: true, sure: 15 },
  },
  tamponDk: 0,
  minBildirimSaat: 2,
  maxIleriGun: 30,
  iptalSinirSaat: 24,
  onayModu: 'hepsi_onay',
  eskalasyonSaat: 4,
}

export function portalTuruMu(x: unknown): x is PortalTuru {
  return typeof x === 'string' && (PORTAL_TURLERI as readonly string[]).includes(x)
}

function tamsayi(x: unknown, varsayilan: number, min: number, max: number): number {
  const n = Number(x)
  if (!Number.isFinite(n)) return varsayilan
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** Normalises anything (a DB row in snake_case or a request body in camelCase) into a valid setting. */
export function ayarNormalize(x: unknown): PortalRandevuAyari {
  const r = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
  const v = VARSAYILAN_AYAR
  const hamTurler = (r.turler && typeof r.turler === 'object' ? r.turler : {}) as Record<string, { acik?: unknown; sure?: unknown }>
  const turler = {} as PortalRandevuAyari['turler']
  for (const t of PORTAL_TURLERI) {
    const h = hamTurler[t] || {}
    turler[t] = {
      acik: typeof h.acik === 'boolean' ? h.acik : v.turler[t].acik,
      sure: tamsayi(h.sure, v.turler[t].sure, 5, 240),
    }
  }
  const al = (camel: string, snake: string) => (r[camel] !== undefined ? r[camel] : r[snake])
  const onay = al('onayModu', 'onay_modu')
  return {
    acik: al('acik', 'acik') === true,
    turler,
    tamponDk: tamsayi(al('tamponDk', 'tampon_dk'), v.tamponDk, 0, 120),
    minBildirimSaat: tamsayi(al('minBildirimSaat', 'min_bildirim_saat'), v.minBildirimSaat, 0, 720),
    maxIleriGun: tamsayi(al('maxIleriGun', 'max_ileri_gun'), v.maxIleriGun, 1, 365),
    iptalSinirSaat: tamsayi(al('iptalSinirSaat', 'iptal_sinir_saat'), v.iptalSinirSaat, 0, 720),
    onayModu: onay === 'mevcut_hasta_otomatik' ? 'mevcut_hasta_otomatik' : 'hepsi_onay',
    eskalasyonSaat: tamsayi(al('eskalasyonSaat', 'eskalasyon_saat'), v.eskalasyonSaat, 1, 168),
  }
}

/** The DB row for an upsert. */
export function ayarSatiri(doktorId: string, a: PortalRandevuAyari): Record<string, unknown> {
  return {
    doktor_id: doktorId,
    acik: a.acik,
    turler: a.turler,
    tampon_dk: a.tamponDk,
    min_bildirim_saat: a.minBildirimSaat,
    max_ileri_gun: a.maxIleriGun,
    iptal_sinir_saat: a.iptalSinirSaat,
    onay_modu: a.onayModu,
    eskalasyon_saat: a.eskalasyonSaat,
    updated_at: new Date().toISOString(),
  }
}

export function acikTurler(a: PortalRandevuAyari): { tur: PortalTuru; ad: string; sure: number }[] {
  return PORTAL_TURLERI.filter((t) => a.turler[t].acik).map((t) => ({ tur: t, ad: TUR_ADI[t], sure: a.turler[t].sure }))
}
