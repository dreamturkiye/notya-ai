/**
 * AU-GAP-CLOSE-02 — /api/ulke/pms/kuyruk
 *   GET → recent outbox rows for THIS doctor
 *   POST { notId, hedef, mektuplar?, mbsOnerileri? } → enqueue export pack for write-back attempt
 *   PATCH { id } → re-attempt a queued row
 *
 * Without a live partner adapter the row stays hazirlandi + PARTNER_YOK — never fake gonderildi.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD, metinAlani, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { pmsKuyrugaAl, pmsKuyrukDene, pmsKuyrukListele } from '@/lib/ulke/pms/kuyruk'
import type { MbsOneri } from '@/lib/ulke/mektup/tipler'
import type { MektupTuru } from '@/lib/ulke/mektup/sabitler'
import type { PmsRetKodu } from '@/lib/ulke/pms/tipler'

export const dynamic = 'force-dynamic'

const DURUM: Record<PmsRetKodu, number> = {
  GECERSIZ: 400, NOT_FOUND: 404, ONAYSIZ: 409, PARTNER_YOK: 503, BAGLANTI_YOK: 400, BASARISIZ: 500,
}

function pmsAcik(): boolean {
  return ozellikAcik('cekirdekMuayene') && !!ulkePaketi().uzanti?.pmsEntegrasyon
}

function mbsOku(ham: unknown): readonly MbsOneri[] | undefined {
  if (!Array.isArray(ham)) return undefined
  const out: MbsOneri[] = []
  for (const x of ham) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const item = metinAlani(o.item, 20)
    const aciklama = metinAlani(o.aciklama, 200)
    const gerekce = metinAlani(o.gerekce, 400)
    if (!item || o.hekimOnayi !== true) continue
    out.push({ item, aciklama, gerekce, lodgeEdilmez: true })
  }
  return out.length ? out : undefined
}

function mektupOku(ham: unknown): Partial<Record<MektupTuru, string>> | undefined {
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return undefined
  const out: Partial<Record<MektupTuru, string>> = {}
  for (const tur of ['gp', 'referral', 'patient'] as const) {
    const blok = (ham as Record<string, unknown>)[tur]
    if (!blok || typeof blok !== 'object') continue
    const b = blok as Record<string, unknown>
    const metin = metinAlani(b.metin, 50_000)
    if (metin && b.hekimOnayi === true) out[tur] = metin
  }
  return Object.keys(out).length ? out : undefined
}

export const GET = sinirda('pms/kuyruk GET', async (req: NextRequest) => {
  if (!pmsAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  return cevap({ kuyruk: await pmsKuyrukListele(oturum.supabase, oturum.user.id) })
})

export const POST = sinirda('pms/kuyruk POST', async (req: NextRequest) => {
  if (!pmsAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.gecersiz('notId')
  const r = await pmsKuyrugaAl(oturum.supabase, oturum.user.id, {
    notId: g.notId,
    hedef: g.hedef,
    mektuplar: mektupOku(g.mektuplar),
    mbsOnerileri: mbsOku(g.mbsOnerileri),
  })
  if (!r.tamam) return cevap({ code: r.kod }, DURUM[r.kod])
  return cevap({ kuyruk: r.ozet })
})

export const PATCH = sinirda('pms/kuyruk PATCH', async (req: NextRequest) => {
  if (!pmsAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.id)) return KOD.gecersiz('id')
  const r = await pmsKuyrukDene(oturum.supabase, oturum.user.id, g.id)
  if (!r.tamam) return cevap({ code: r.kod }, DURUM[r.kod])
  return cevap({ kuyruk: r.ozet })
})
