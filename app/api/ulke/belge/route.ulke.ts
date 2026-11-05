/**
 * BELGE-NO-01 (Kaan, 2026-11-05) — /api/ulke/belge: a printed record is registered when it is printed.
 *
 *   POST { kaynakId, hastaId?, ozet, gerekce?, tur? }   tur: 'arac_kaydi' (a tool's printed record, default) | 'hasta_disa_aktarim'
 *        200 { durum: 'tamam', belgeNo, rev, tarih, kod }          the version printed (a new revision when the content changed)
 *        200 { durum: 'gerekce_gerekli', belgeNo, rev }            the content changed since the last printout: a reason is required
 *        404 { code: 'NOT_FOUND' }  a patient that is not this doctor's (another doctor's answers exactly the same)
 *        400 GECERSIZ · 401 OTURUM_YOK · 429 COK_FAZLA · 500 BASARISIZ
 *
 * A DOCTOR'S SESSION. `ozet` is the SHA-256 of what is printed, worked out in the browser: no record text and no patient
 * value reaches this route or the database, only the hash. The doctor's name is read here, never taken from the body.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { belgeKaydet } from '@/lib/belge/sunucu'
import { hizSiniri } from '@/lib/belge/hizSiniri'
import { belgeIslevi, hekimAdi, kendiHastasi } from '@/lib/ulke/belge/sunucu'

export const dynamic = 'force-dynamic'
const SINIR = hizSiniri(60, 60_000)

export const POST = sinirda('belge POST', async (req: NextRequest) => {
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  if (!SINIR.izinli(oturum.user.id)) return cevap({ code: 'COK_FAZLA' }, 429)
  const g = await govdeOku(req)
  const hastaId = g.hastaId == null || g.hastaId === '' ? null : g.hastaId
  if (hastaId !== null && !uuidMi(hastaId)) return KOD.yok()
  if (hastaId && !(await kendiHastasi(oturum.supabase, oturum.user.id, hastaId))) return KOD.yok()
  const hekim = await hekimAdi(oturum.supabase, oturum.user.id, oturum.user.user_metadata)
  if (!hekim) return KOD.yok()
  const r = await belgeKaydet(belgeIslevi(oturum.supabase), { doktorId: oturum.user.id, hastaId, tur: g.tur === 'hasta_disa_aktarim' ? 'hasta_disa_aktarim' : 'arac_kaydi', kaynakId: String(g.kaynakId ?? ''), ozet: String(g.ozet ?? ''), hekim, gerekce: typeof g.gerekce === 'string' ? g.gerekce.slice(0, 500) : null })
  if (!('kunye' in r)) return r.durum === 'gecersiz' ? KOD.gecersiz() : KOD.basarisiz()
  if (r.durum === 'gerekce_gerekli') return cevap({ durum: r.durum, belgeNo: r.kunye.belgeNo, rev: r.kunye.rev })
  return cevap({ durum: r.durum, belgeNo: r.kunye.belgeNo, rev: r.kunye.rev, tarih: r.kunye.tarih, kod: r.kunye.dogrulamaKodu })
})
