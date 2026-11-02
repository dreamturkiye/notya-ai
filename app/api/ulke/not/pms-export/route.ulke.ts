/**
 * AU-GAP-CLOSE-01/02 — /api/ulke/not/pms-export: structured export pack for ONE approved note of THIS doctor.
 *
 *   POST { notId, mektuplar?, mbsOnerileri? }   200 { paket }
 *
 * Letters / MBS rows are included only when the doctor sent `hekimOnayi: true` (clinician sign-off on the draft).
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
    if (!mektupTuruMu(k)) continue
    // AU-GAP-CLOSE-02: accept either plain string (legacy) gated off, or { metin, hekimOnayi: true }.
    if (typeof v === 'string' && v.trim()) {
      // Unsigned plain strings are refused for export inclusion.
      continue
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const b = v as Record<string, unknown>
      const metin = typeof b.metin === 'string' ? b.metin.trim() : ''
      if (metin && b.hekimOnayi === true) out[k] = metin.slice(0, 12_000)
    }
  }
  return Object.keys(out).length ? out : undefined
}

function mbsOku(ham: unknown): readonly MbsOneri[] | undefined {
  if (!Array.isArray(ham)) return undefined
  const out: MbsOneri[] = []
  for (const x of ham.slice(0, 8)) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    if (o.hekimOnayi !== true) continue
    const item = typeof o.item === 'string' ? o.item.trim() : ''
    if (!/^\d{1,6}[A-Za-z]{0,2}$/.test(item)) continue
    out.push({
      item: item.toUpperCase(),
      aciklama: typeof o.aciklama === 'string' ? o.aciklama.slice(0, 240) : '',
      gerekce: typeof o.gerekce === 'string' ? o.gerekce.slice(0, 400) : '',
      lodgeEdilmez: true,
      hekimOnayi: true,
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
