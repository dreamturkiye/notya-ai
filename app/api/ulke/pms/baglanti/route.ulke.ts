/**
 * AU-GAP-CLOSE-02 — /api/ulke/pms/baglanti
 *   GET  → { baglantilar: PmsBaglantiOzet[] }  (no secrets)
 *   POST { saglayici, anahtar, etiket? } → save encrypted credentials (partner-bekleniyor until adapter live)
 *   DELETE { saglayici } → remove connection
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, govdeOku, KOD } from '@/lib/ulke/uygulama/cevap'
import { pmsBaglantiKaydet, pmsBaglantilariListele, pmsBaglantiSil } from '@/lib/ulke/pms/baglanti'
import type { PmsRetKodu } from '@/lib/ulke/pms/tipler'

export const dynamic = 'force-dynamic'

const DURUM: Record<PmsRetKodu, number> = {
  GECERSIZ: 400, NOT_FOUND: 404, ONAYSIZ: 409, PARTNER_YOK: 503, BAGLANTI_YOK: 400, BASARISIZ: 500,
}

function pmsAcik(): boolean {
  return ozellikAcik('cekirdekMuayene') && !!ulkePaketi().uzanti?.pmsEntegrasyon
}

export const GET = sinirda('pms/baglanti GET', async (req: NextRequest) => {
  if (!pmsAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const baglantilar = await pmsBaglantilariListele(oturum.supabase, oturum.user.id)
  return cevap({ baglantilar })
})

export const POST = sinirda('pms/baglanti POST', async (req: NextRequest) => {
  if (!pmsAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await pmsBaglantiKaydet(oturum.supabase, oturum.user.id, g)
  if (!r.tamam) return cevap({ code: r.kod }, DURUM[r.kod])
  return cevap({ baglanti: r.ozet })
})

export const DELETE = sinirda('pms/baglanti DELETE', async (req: NextRequest) => {
  if (!pmsAcik()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const r = await pmsBaglantiSil(oturum.supabase, oturum.user.id, g.saglayici)
  if (!r.tamam) return cevap({ code: r.kod }, DURUM[r.kod])
  return cevap({ ok: true })
})
