/**
 * AU-BETA-01 — /api/ulke/gizlilik: the DOCTOR's side of privacy (pack extension `uzanti.gizlilik`). Doctor's session only.
 *   GET                                 200 { talepler (with days left), rizalar }
 *   PATCH { id, durum, yanit? }         move an access/correction request to islemde / tamamlandi / reddedildi
 *   POST  { hastaId }                   record a consent the patient gave the doctor in person or on paper (kaynak 'hekim')
 * Initial compliance draft – external legal review later.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { hastaAdlari, hastaGetir } from '@/lib/ulke/uygulama/hastalar'
import { hekimTalepleri, talepGuncelle } from '@/lib/ulke/gizlilik/talep'
import { hekimRizaListesi, rizaEkle } from '@/lib/ulke/gizlilik/riza'

export const dynamic = 'force-dynamic'

export const GET = sinirda('gizlilik GET', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.gizlilik) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const [talepler, rizalar] = await Promise.all([hekimTalepleri(oturum.supabase, oturum.user.id), hekimRizaListesi(oturum.supabase, oturum.user.id)])
  const adlar = await hastaAdlari(oturum.supabase, oturum.user.id, rizalar.map((r) => r.hastaId))
  return cevap({ talepler, rizalar: rizalar.map((r) => ({ ...r, hastaAdi: adlar.get(r.hastaId) ?? '' })) })
})

export const PATCH = sinirda('gizlilik PATCH', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.gizlilik) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.id)) return KOD.gecersiz('id')
  const r = await talepGuncelle(oturum.supabase, oturum.user.id, g.id, { durum: g.durum, yanit: g.yanit })
  if (r === 'TAMAM') return cevap({ ok: true })
  return cevap({ code: r }, r === 'NOT_FOUND' ? 404 : r === 'GECERSIZ' ? 400 : 500)
})

export const POST = sinirda('gizlilik POST', async (req: NextRequest) => {
  if (!ulkePaketi().uzanti?.gizlilik) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.hastaId)) return KOD.gecersiz('hastaId')
  if (!(await hastaGetir(oturum.supabase, oturum.user.id, g.hastaId))) return KOD.yok()
  const k = await rizaEkle(oturum.supabase, oturum.user.id, g.hastaId, 'hekim')
  return k ? cevap({ ok: true, riza: k }) : KOD.basarisiz()
})
