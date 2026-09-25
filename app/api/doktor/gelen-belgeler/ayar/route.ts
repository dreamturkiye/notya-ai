/**
 * NOTYA-GELEN-BELGELER — Ayarlar › Gelen Belgeler: "Sekreterim gelen belgeleri görebilir ve dosyalayabilir".
 * GET  → { acik, kaydedilebilir }   POST { acik: boolean } → { ok, acik }
 * Doctor only (sadeceDoktor). Reads/writes only the doctor's own users row; takes no patient id.
 * Before migration 099: GET → { acik: false, kaydedilebilir: false }; POST → 503 with a plain sentence.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return o.hata
  const yasak = sadeceDoktor(o)
  if (yasak) return yasak
  const { data, error } = await o.supabase.from('users').select('gelen_belge_sekreter').eq('id', o.doktorId).maybeSingle()
  if (error) return NextResponse.json({ acik: false, kaydedilebilir: false })
  return NextResponse.json({ acik: data?.gelen_belge_sekreter === true, kaydedilebilir: true })
}

export async function POST(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return o.hata
  const yasak = sadeceDoktor(o)
  if (yasak) return yasak
  const b = (await req.json().catch(() => null)) as { acik?: unknown } | null
  if (typeof b?.acik !== 'boolean') return NextResponse.json({ error: 'Eksik bilgi.' }, { status: 400 })
  const { error } = await o.supabase.from('users').update({ gelen_belge_sekreter: b.acik }).eq('id', o.doktorId)
  if (error) return NextResponse.json({ error: 'Bu ayar şu an kaydedilemiyor. Lütfen biraz sonra yeniden deneyin.' }, { status: 503 })
  return NextResponse.json({ ok: true, acik: b.acik })
}
