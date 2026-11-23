/**
 * ESNEK-MUAYENE-A — POST { kaynakId, cevaplar: [{ anahtar, cevap|null, ogrenme? }] } → answers reading questions (doctor or
 * staff with 'elnotu.hazirla'); POST { noteId, celiski: { anahtar, secim } } → a conflict answer (doctor only).
 * HASTA-IZOLASYON: kaynak / note by id AND doctor_id; question rows by doctor_id + kaynak_id.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { kaynakAl } from '@/lib/elNotu/sunucu'
import { cevaplariUygula, celiskiCevapla, type Cevap } from '@/lib/elNotu/dogrulaServisi'
import { EL_NOTU_TR } from '@/core/elNotu/metinTr'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (b?.celiski) {
    if (o.rol !== 'doktor') return json({ error: 'Kaynaklar arasındaki çelişkiyi yalnız hekim çözer.' }, 403)
    const c = b.celiski as { anahtar?: unknown; secim?: unknown }
    if (!uuidMu(b.noteId) || typeof c.anahtar !== 'string' || typeof c.secim !== 'string') return json({ error: 'Geçersiz istek.' }, 400)
    const ok = await celiskiCevapla(o.supabase, { doktorId: o.doktorId, noteId: b.noteId, anahtar: c.anahtar, secim: c.secim, aktor: o.aktor })
    return ok ? json({ ok: true }) : json({ error: 'Soru bulunamadı.' }, 404)
  }
  const kaynak = await kaynakAl(o.supabase, o.doktorId, b?.kaynakId)
  if (!kaynak) return json({ error: 'Kaynak bulunamadı.' }, 404)
  if (!Array.isArray(b?.cevaplar) || !b!.cevaplar.length) return json({ error: 'Cevap yok.' }, 400)
  const { data: s } = kaynak.session_id ? await o.supabase.from('sessions').select('specialty').eq('id', kaynak.session_id).eq('doctor_id', o.doktorId).maybeSingle() : { data: null }
  const r = await cevaplariUygula(o.supabase, { doktorId: o.doktorId, kaynak, cevaplar: (b!.cevaplar as Cevap[]).slice(0, 200), aktor: o.aktor, brans: (s?.specialty as string) || null, okunamadiMetni: EL_NOTU_TR.dogrula.okunamadi })
  return json(r)
}
