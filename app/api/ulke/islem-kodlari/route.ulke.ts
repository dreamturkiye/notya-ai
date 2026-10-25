/**
 * AU-QUICK-02 — /api/ulke/islem-kodlari: procedure-code lookup (MBS item to ACHI, server-side).
 *
 *   GET                 200 { hazir: boolean }                       is there data to search? (the Quick access tile asks this)
 *   GET ?q=<2..64 chars> 200 { hazir, sonuclar: [{ item, aciklama, achi: [{ kod, surum }], esleme: 'var'|'yok' }] }
 *   404 { code: 'NOT_FOUND' }  the country has no procedure-code extension     401 { code: 'OTURUM_YOK' }
 *   429 { code: 'LIMIT' }      daily search ceiling of the account              500 { code: 'BASARISIZ' }
 * A DOCTOR'S SESSION ONLY. TAKES NO PATIENT ID; the search term is not stored or logged. No model is called.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, KOD } from '@/lib/ulke/uygulama/cevap'
import { kovaKotasiKullan } from '@/lib/ulke/uygulama/kota'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { ISLEM_SORGU_AZAMI, ISLEM_SORGU_EN_AZ, islemKaynagi } from '@/lib/ulke/kayit/islemKaynagi'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GUNLUK_ARAMA = 3000

export const GET = sinirda('islem-kodlari GET', async (req: NextRequest) => {
  const t = ulkePaketi().uzanti?.islemKodlari
  if (!t) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const kaynak = islemKaynagi()
  const hazir = kaynak.hazir()
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (!q) return cevap({ hazir })
  if (q.length < ISLEM_SORGU_EN_AZ || q.length > ISLEM_SORGU_AZAMI) return KOD.gecersiz('q')
  if (!hazir) return cevap({ hazir, sonuclar: [] })
  if (!(await kovaKotasiKullan(oturum.supabase, oturum.user.id, 'islem-ara', GUNLUK_ARAMA))) return cevap({ code: 'LIMIT' }, 429)
  return cevap({ hazir, sonuclar: kaynak.ara(q) })
})
