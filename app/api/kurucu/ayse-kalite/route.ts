/**
 * AKKS — the founder's "Ayşe Kalite" dashboard data (app/kurucu/ayse-kalite/page.tsx).
 *
 *   GET   200 AkksPanoVerisi (lib/akks/veri.ts): per branş scores + trend, runs, gate, failing items with reasons, the
 *         human review queue, gold-item review counts, the blind Prof. comparison, panel invites (never their tokens)
 *   POST  { islem: 'insan-inceleme', cevapId, durum: 'onaylandi'|'duzeltildi', puanlar?, zararli?, not? }
 *         { islem: 'soru-inceleme', soruId, durum: 'onaylandi'|'duzeltme-gerekli'|'cikarildi', not? }
 *         { islem: 'taban-kabul', kosuId }
 *         { islem: 'davet-olustur', rol, brans, kod, soruSayisi?, gun? }  → { token } ONCE (only its SHA-256 is stored)
 *         { islem: 'davet-iptal', id }
 *   404   everyone who is not on FOUNDER_EMAILS (lib/kurucu/erisim.ts)
 *
 * Takes no patient, note or session id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { kurucuOturumu, yokCevabi } from '@/lib/kurucu/erisim'
import { davetIptal, davetOlustur, insanIncelemeKaydet, panoVerisi, soruIncelemeKaydet, tabanKabul } from '@/lib/akks/veri'

export const dynamic = 'force-dynamic'

const BASLIK = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

export async function GET(req: NextRequest) {
  const sb = servisSupabase()
  if (!(await kurucuOturumu(req, sb))) return yokCevabi()
  return NextResponse.json(await panoVerisi(sb), { headers: BASLIK })
}

export async function POST(req: NextRequest) {
  const sb = servisSupabase()
  const kurucu = await kurucuOturumu(req, sb)
  if (!kurucu) return yokCevabi()
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const r = b?.islem === 'insan-inceleme' ? await insanIncelemeKaydet(sb, { cevapId: b.cevapId, durum: b.durum, puanlar: b.puanlar, zararli: b.zararli, not: b.not, userId: kurucu.id })
    : b?.islem === 'soru-inceleme' ? await soruIncelemeKaydet(sb, { soruId: b.soruId, durum: b.durum, not: b.not, userId: kurucu.id })
    : b?.islem === 'taban-kabul' ? await tabanKabul(sb, b.kosuId)
    : b?.islem === 'davet-olustur' ? await davetOlustur(sb, { rol: b.rol, brans: b.brans, kod: b.kod, soruSayisi: b.soruSayisi, gun: b.gun, userId: kurucu.id })
    : b?.islem === 'davet-iptal' ? await davetIptal(sb, b.id)
    : { hata: 'invalid body', durum: 400 }
  if ('hata' in r) return NextResponse.json({ error: r.hata }, { status: r.durum, headers: BASLIK })
  return NextResponse.json(r, { headers: BASLIK })
}
