/**
 * AU-BETA-01 — GET/POST /api/ulke/muayenehane: the practice particulars on THIS account (pack extension `uzanti.muayenehane`).
 * Kept in auth user_metadata, like the professional registration. Every field optional; an invalid one answers 400 with the
 * field's key and sentence and changes nothing. Nothing is looked up in any register.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'

export const dynamic = 'force-dynamic'

export const GET = sinirda('muayenehane GET', async (req: NextRequest) => {
  const t = ulkePaketi().uzanti?.muayenehane
  if (!t) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const ham = (oturum.user.user_metadata as { muayenehane?: unknown } | null)?.muayenehane
  const r = t.dogrula(ham && typeof ham === 'object' ? (ham as Record<string, unknown>) : {})
  return cevap({ degerler: Object.keys(r.hatalar).length ? {} : r.temiz })
})

export const POST = sinirda('muayenehane POST', async (req: NextRequest) => {
  const t = ulkePaketi().uzanti?.muayenehane
  if (!t) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const r = t.dogrula(g)
  if (Object.keys(r.hatalar).length) return cevap({ code: 'GECERSIZ', hatalar: r.hatalar }, 400)
  const mevcut = oturum.user.user_metadata && typeof oturum.user.user_metadata === 'object' ? { ...oturum.user.user_metadata } : {}
  if (Object.keys(r.temiz).length) mevcut.muayenehane = r.temiz
  else delete mevcut.muayenehane
  const { error } = await oturum.supabase.auth.admin.updateUserById(oturum.user.id, { user_metadata: mevcut })
  if (error) return KOD.basarisiz()
  return cevap({ ok: true, degerler: r.temiz, uyarilar: r.uyarilar })
})
