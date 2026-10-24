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
  const meta = (oturum.user.user_metadata ?? {}) as { muayenehane?: unknown; meslekKaydi?: unknown }
  const ham = meta.muayenehane && typeof meta.muayenehane === 'object' ? { ...(meta.muayenehane as Record<string, unknown>) } : {}
  // LOOK-PARITY-04: the retired account field moves in only when it passes the same validation; an existing value wins.
  const tasi = t.meslekKaydiTasi
  const eskiVar = Boolean(tasi) && 'meslekKaydi' in meta
  if (tasi && eskiVar) {
    const tas = typeof meta.meslekKaydi === 'string' ? tasi.bicim(meta.meslekKaydi) : null
    if (tas && !(typeof ham[tasi.alan] === 'string' && (ham[tasi.alan] as string).trim())) ham[tasi.alan] = tas
  }
  const r = t.dogrula(ham)
  const degerler = Object.keys(r.hatalar).length ? {} : r.temiz
  if (eskiVar) {
    // Best effort: keep the migrated value (or none) and drop the retired field, so nothing stale is left behind.
    const yeni = { ...(oturum.user.user_metadata as Record<string, unknown>) }
    delete yeni.meslekKaydi
    if (Object.keys(degerler).length) yeni.muayenehane = degerler
    try { await oturum.supabase.auth.admin.updateUserById(oturum.user.id, { user_metadata: yeni }) } catch { /* retried on the next read */ }
  }
  return cevap({ degerler })
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
  if (t.meslekKaydiTasi) delete mevcut.meslekKaydi
  const { error } = await oturum.supabase.auth.admin.updateUserById(oturum.user.id, { user_metadata: mevcut })
  if (error) return KOD.basarisiz()
  return cevap({ ok: true, degerler: r.temiz, uyarilar: r.uyarilar })
})
