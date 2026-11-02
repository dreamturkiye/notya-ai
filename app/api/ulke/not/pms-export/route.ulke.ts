/**
 * AU-GAP-CLOSE-01 — /api/ulke/not/pms-export: structured export pack for ONE approved note of THIS doctor.
 *
 *   POST { notId, mektuplar?, mbsOnerileri? }   200 { paket }
 *
 * Honest export only. No Best Practice / Genie / Gentu connection. PATIENT ISOLATION via notGetir.
 */
import { NextRequest } from 'next/server'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { MEKTUP_DURUMU, pmsExportPaket, type MektupRetKodu } from '@/lib/ulke/mektup/mektup'
import { mektupTuruMu, type MektupTuru } from '@/lib/ulke/mektup/sabitler'
import type { MbsOneri } from '@/lib/ulke/mektup/tipler'

export const dynamic = 'force-dynamic'

const ret = (kod: MektupRetKodu) => cevap({ code: kod }, MEKTUP_DURUMU[kod])

function mektuplariOku(ham: unknown): Partial<Record<MektupTuru, string>> | undefined {
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return undefined
  const out: Partial<Record<MektupTuru, string>> = {}
  for (const [k, v] of Object.entries(ham as Record<string, unknown>)) {
    if (mektupTuruMu(k) && typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 12_000)
  }
  return Object.keys(out).length ? out : undefined
}

function mbsOku(ham: unknown): readonly MbsOneri[] | undefined {
  if (!Array.isArray(ham)) return undefined
  const out: MbsOneri[] = []
  for (const x of ham.slice(0, 8)) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const item = typeof o.item === 'string' ? o.item.trim() : ''
    if (!/^\d{1,6}[A-Za-z]{0,2}$/.test(item)) continue
    out.push({
      item: item.toUpperCase(),
      aciklama: typeof o.aciklama === 'string' ? o.aciklama.slice(0, 240) : '',
      gerekce: typeof o.gerekce === 'string' ? o.gerekce.slice(0, 400) : '',
      lodgeEdilmez: true,
    })
  }
  return out.length ? out : undefined
}

export const POST = sinirda('not/pms-export POST', async (req: NextRequest) => {
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  if (!uuidMi(g.notId)) return KOD.yok()
  const r = await pmsExportPaket(oturum.supabase, oturum.user.id, g.notId, {
    mektuplar: mektuplariOku(g.mektuplar),
    mbsOnerileri: mbsOku(g.mbsOnerileri),
  })
  if (!r.tamam) return ret(r.kod)
  return cevap({ paket: r.paket })
})
