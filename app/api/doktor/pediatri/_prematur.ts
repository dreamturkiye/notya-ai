/**
 * PREMATURE-MODUL — Pediatri prematüre takip planı sunucu ortakları (route.ts yalnız handler export edebilir).
 * Her sorgu doctor_id ile kapsanır; hasta kimliği çağıranda pediHasta() sahiplik denetiminden geçmiş olmalıdır.
 * Saklanan: pedi_prematur_kayit (profil = hekimin NICU öyküsü, ogeler = hekimin öğe işaretleri). Plan türetilmiştir, saklanmaz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { profilTemizle, type PrematurProfil } from '@/lib/clinical/prematur/protokol'
import type { OgeKaydi } from '@/lib/clinical/prematur/takipPlani'
import { prematurProtokolu } from '@/lib/clinical/prematur/protokolTR'
import { gunFarki } from '@/specialties/pediatri/engines/girdi'
import type { ErkenDogumOzeti, PrematurKaynakVeri, PrematurKohortGirdi } from '@/specialties/pediatri/engines/prematurKohort'
import { guvenliCoz } from './_ortak'

const gun = (v: unknown) => String(v || '').slice(0, 10)
const bool = (v: unknown): boolean | null => (v === true ? true : v === false ? false : null)

export function ozetTemizle(ham: unknown): ErkenDogumOzeti | null {
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return null
  const r = ham as Record<string, unknown>
  const n = Number(r.gestasyonHafta)
  return { gestasyonHafta: Number.isFinite(n) && n >= 20 && n <= 45 ? n : null, steroidKuru: bool(r.steroidKuru), pprom: bool(r.pprom), magnezyum: bool(r.magnezyum) }
}

/** ogeler jsonb → yalnız bilinen biçimdeki işaretler. */
export function ogelerTemizle(ham: unknown): Record<string, OgeKaydi> {
  const out: Record<string, OgeKaydi> = {}
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return out
  for (const [id, v] of Object.entries(ham as Record<string, unknown>).slice(0, 200)) {
    if (!/^[a-z0-9-]{1,40}:[a-z0-9-]{1,40}$/.test(id) || !v || typeof v !== 'object') continue
    const r = v as Record<string, unknown>
    if (r.durum !== 'plana_alindi' && r.durum !== 'yapildi' && r.durum !== 'uygulanmaz') continue
    out[id] = { durum: r.durum, tarih: /^\d{4}-\d{2}-\d{2}$/.test(String(r.tarih || '')) ? String(r.tarih) : null, not: r.not ? String(r.not).slice(0, 300) : null }
  }
  return out
}

export async function prematurKaynakVeri(sb: SupabaseClient, doktorId: string, hasta: { id: string; dogumIso: string }): Promise<PrematurKaynakVeri> {
  const [kartQ, kayitQ, tarQ] = await Promise.all([
    sb.from('bebek_kartlari').select('gebelik_haftasi, kilo_gram, erken_dogum_ozeti').eq('doctor_id', doktorId).eq('bebek_patient_id', hasta.id).order('created_at', { ascending: false }).limit(1),
    sb.from('pedi_prematur_kayit').select('profil, ogeler').eq('doctor_id', doktorId).eq('patient_id', hasta.id).maybeSingle(),
    sb.from('pedi_taramalar').select('tur, tarih').eq('doctor_id', doktorId).eq('patient_id', hasta.id).limit(500),
  ])
  const k = kartQ.data?.[0] as { gebelik_haftasi?: number | null; kilo_gram?: number | null; erken_dogum_ozeti?: unknown } | undefined
  return {
    dogumIso: hasta.dogumIso,
    kartGestasyonHafta: k?.gebelik_haftasi != null ? Number(k.gebelik_haftasi) : null,
    kartDogumKiloGr: k?.kilo_gram != null ? Number(k.kilo_gram) : null,
    kartOzet: ozetTemizle(k?.erken_dogum_ozeti),
    profil: profilTemizle(kayitQ.data?.profil),
    durumlar: ogelerTemizle(kayitQ.data?.ogeler),
    taramalar: ((tarQ.data || []) as Array<{ tur: string; tarih: string }>).map((t) => ({ tur: String(t.tur), tarih: gun(t.tarih) })),
  }
}

export async function profilKaydet(sb: SupabaseClient, doktorId: string, patientId: string, profil: PrematurProfil): Promise<boolean> {
  const { data: onceki } = await sb.from('pedi_prematur_kayit').select('id').eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
  const alanlar = { profil: { ...profil, kaynak: 'elle' }, updated_at: new Date().toISOString() }
  const q = onceki
    ? sb.from('pedi_prematur_kayit').update(alanlar).eq('id', onceki.id).eq('doctor_id', doktorId)
    : sb.from('pedi_prematur_kayit').insert({ doctor_id: doktorId, patient_id: patientId, ...alanlar })
  const { error } = await q
  return !error
}

export async function ogeKaydet(sb: SupabaseClient, doktorId: string, patientId: string, ogeId: string, kayit: OgeKaydi | null): Promise<boolean> {
  const { data: onceki } = await sb.from('pedi_prematur_kayit').select('id, ogeler').eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
  const ogeler = ogelerTemizle(onceki?.ogeler)
  if (kayit) ogeler[ogeId] = kayit; else delete ogeler[ogeId]
  const alanlar = { ogeler, updated_at: new Date().toISOString() }
  const q = onceki
    ? sb.from('pedi_prematur_kayit').update(alanlar).eq('id', onceki.id).eq('doctor_id', doktorId)
    : sb.from('pedi_prematur_kayit').insert({ doctor_id: doktorId, patient_id: patientId, ...alanlar })
  const { error } = await q
  return !error
}

const parcala = <T,>(x: T[], n = 150): T[][] => { const out: T[][] = []; for (let i = 0; i < x.length; i += n) out.push(x.slice(i, i + n)); return out }

/** Kohort girdileri: hekimin kendi hastalarından, kronolojik yaşı plan üst sınırının altındakiler. */
export async function prematurKohortGirdileri(sb: SupabaseClient, doktorId: string, bugun: string): Promise<PrematurKohortGirdi[]> {
  const ustGun = Math.ceil(prematurProtokolu('tr').urun.planUstAy * 30.4375) + 31
  const { data: hastalar } = await sb.from('patients').select('id, name_encrypted, dob_encrypted, is_active').eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(3000)
  const bebekler: Array<{ id: string; ad: string; dogumIso: string }> = []
  for (const p of hastalar || []) {
    if (p.is_active === false) continue
    const dob = guvenliCoz(p.dob_encrypted as string).slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || dob > bugun || gunFarki(dob, bugun) > ustGun) continue
    let ad = 'Hasta'
    try { const j = JSON.parse(guvenliCoz(p.name_encrypted as string)); ad = `${j.ad || ''} ${j.soyad || ''}`.trim() || 'Hasta' } catch { /* varsayılan */ }
    bebekler.push({ id: String(p.id), ad, dogumIso: dob })
  }
  if (!bebekler.length) return []
  const ids = bebekler.map((b) => b.id)
  const topla = async <R,>(sorgu: (p: string[]) => PromiseLike<{ data: R[] | null }>): Promise<R[]> => (await Promise.all(parcala(ids).map((p) => sorgu(p)))).flatMap((r) => r.data || [])
  const [kartlar, kayitlar, taramalar] = await Promise.all([
    topla<{ bebek_patient_id: string; gebelik_haftasi: number | null; kilo_gram: number | null; erken_dogum_ozeti: unknown }>((p) => sb.from('bebek_kartlari').select('bebek_patient_id, gebelik_haftasi, kilo_gram, erken_dogum_ozeti').eq('doctor_id', doktorId).in('bebek_patient_id', p).limit(5000)),
    topla<{ patient_id: string; profil: unknown; ogeler: unknown }>((p) => sb.from('pedi_prematur_kayit').select('patient_id, profil, ogeler').eq('doctor_id', doktorId).in('patient_id', p).limit(5000)),
    topla<{ patient_id: string; tur: string; tarih: string }>((p) => sb.from('pedi_taramalar').select('patient_id, tur, tarih').eq('doctor_id', doktorId).in('patient_id', p).in('tur', ['rop', 'isitme', 'demir']).limit(20000)),
  ])
  const kartG = new Map<string, (typeof kartlar)[number]>()
  for (const k of kartlar) if (!kartG.has(String(k.bebek_patient_id))) kartG.set(String(k.bebek_patient_id), k)
  const kayitG = new Map(kayitlar.map((k) => [String(k.patient_id), k]))
  const tarG = new Map<string, Array<{ tur: string; tarih: string }>>()
  for (const t of taramalar) { const a = tarG.get(String(t.patient_id)) || []; a.push({ tur: String(t.tur), tarih: gun(t.tarih) }); tarG.set(String(t.patient_id), a) }
  return bebekler.map((b) => {
    const k = kartG.get(b.id), r = kayitG.get(b.id)
    return {
      patientId: b.id, ad: b.ad, dogumIso: b.dogumIso,
      kartGestasyonHafta: k?.gebelik_haftasi != null ? Number(k.gebelik_haftasi) : null,
      kartDogumKiloGr: k?.kilo_gram != null ? Number(k.kilo_gram) : null,
      kartOzet: ozetTemizle(k?.erken_dogum_ozeti),
      profil: profilTemizle(r?.profil), durumlar: ogelerTemizle(r?.ogeler), taramalar: tarG.get(b.id) || [],
    }
  })
}
