/**
 * ESNEK-MUAYENE-A — the doctor's El Notu preferences (profile setting, changeable any time).
 * GET → { ayar, rol, kesinlestirebilir } (doctor and staff: the UI shows staff whether they may finalize) · PUT (doctor only).
 * HASTA-IZOLASYON: no patient id; the row is keyed by doctor_id.
 * ESNEK-GELISIM: `gelistirmeOnayi` (doctor only, default OFF) — consent to the de-identified regression set; turning it
 * off deletes every page of his in the set at once (lib/elNotu/regresyon.ts).
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json } from '@/lib/elNotu/rota'
import { kesinlestirebilirMi } from '@/lib/elNotu/sunucu'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { ayarYukle } from '@/lib/elNotu/sunucu'
import { gelistirmeOnayiniGeriCek } from '@/lib/elNotu/regresyon'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return o.hata
  const ayar = await ayarYukle(o.supabase, o.doktorId)
  return json({ ayar, rol: o.rol, kesinlestirebilir: kesinlestirebilirMi(o.rol, ayar), hazirlayabilir: o.rol === 'doktor' || ayar.hazirlayan === 'sekreter' })
}

export async function PUT(req: NextRequest) {
  const o = await elNotuIstegi(req, 'doktor')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b) return json({ error: 'Geçersiz istek.' }, 400)
  const yeni = {
    hekim_onayi_gerekli: typeof b.hekimOnayiGerekli === 'boolean' ? b.hekimOnayiGerekli : o.ayar.hekimOnayiGerekli,
    el_notu_hazirlayan: b.hazirlayan === 'sekreter' || b.hazirlayan === 'doktor' ? b.hazirlayan : o.ayar.hazirlayan,
    taban_dakika_not: b.tabanDk === null ? null : Number.isFinite(Number(b.tabanDk)) && Number(b.tabanDk) > 0 && Number(b.tabanDk) <= 120 ? Math.round(Number(b.tabanDk) * 10) / 10 : o.ayar.tabanDk,
  }
  const onayDegisti = typeof b.gelistirmeOnayi === 'boolean' && b.gelistirmeOnayi !== (o.ayar.gelistirmeOnayi === true)
  const onay = typeof b.gelistirmeOnayi === 'boolean' ? b.gelistirmeOnayi : o.ayar.gelistirmeOnayi === true
  const ek = onayDegisti ? { gelistirme_onayi: onay, gelistirme_onayi_at: new Date().toISOString() } : {}
  const { error } = await o.supabase.from('esnek_muayene_ayarlari').upsert({ doctor_id: o.doktorId, ...yeni, ...ek, guncelleyen_user_id: o.user.id, updated_at: new Date().toISOString() }, { onConflict: 'doctor_id' })
  if (error) return json({ error: 'Kaydedilemedi.' }, 500)
  if (onayDegisti && !onay) await gelistirmeOnayiniGeriCek(o.supabase, o.doktorId)
  return json({ ayar: { hekimOnayiGerekli: yeni.hekim_onayi_gerekli, hazirlayan: yeni.el_notu_hazirlayan, tabanDk: yeni.taban_dakika_not, gelistirmeOnayi: onay } })
}
