/**
 * ESNEK-MUAYENE-A — finishing a hand-note draft (Kaan, requirement 3).
 * POST { noteId, islem: 'kesinlestir' | 'hekime_gonder' | 'iade', duzenlemeler? }
 *  - kesinlestir: the doctor always; a secretary only when the doctor turned "hekim onayı gerekli" OFF. Runs the ONE approval
 *    path (lib/doktor/notOnayla.ts) with approved_by = who finalized; refused while any reading is unconfirmed (protected
 *    items included) or a source conflict is open. Audit: drafted / confirmed / finalized, by whom.
 *  - hekime_gonder (staff): into the doctor's "Onay bekleyen notlar" queue.
 *  - iade (doctor): back to the secretary.
 * e-Reçete is never sent from here (doctor's e-imza). HASTA-IZOLASYON: note by id AND doctor_id.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { denetimYaz, elNotuTaslagiMi, kesinlestirebilirMi } from '@/lib/elNotu/sunucu'
import { notOnayla } from '@/lib/doktor/notOnayla'
import type { KaynakOzeti } from '@/lib/elNotu/derlemeServisi'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const o = await elNotuIstegi(req, 'hazirla')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { noteId?: unknown; islem?: unknown; duzenlemeler?: unknown } | null
  if (!uuidMu(b?.noteId)) return json({ error: 'Not gerekli.' }, 400)
  const { data: n } = await o.supabase.from('notes').select('id, session_id, approved_at, kaynak_ozeti, sessions(patient_id)').eq('id', b!.noteId as string).eq('doctor_id', o.doktorId).maybeSingle()
  if (!n || (o.rol !== 'doktor' && !elNotuTaslagiMi(n.kaynak_ozeti as KaynakOzeti))) return json({ error: 'Not bulunamadı.' }, 404)
  if (n.approved_at) return json({ error: 'Not zaten kesinleşmiş.' }, 409)
  const hastaId = ((n as { sessions?: { patient_id?: string } | null }).sessions?.patient_id) || null
  const islem = b?.islem
  if (islem === 'iade') {
    if (o.rol !== 'doktor') return json({ error: 'Bu işlem yalnızca doktor hesabı içindir.' }, 403)
    await o.supabase.from('notes').update({ hekim_onayi_bekliyor: false }).eq('id', n.id).eq('doctor_id', o.doktorId)
    await denetimYaz(o.supabase, { doktorId: o.doktorId, patientId: hastaId, noteId: String(n.id), sessionId: n.session_id as string, eylem: 'iade', aktor: o.aktor })
    return json({ ok: true, durum: 'iade' })
  }
  // every reading of the visit's sources and every source conflict must be answered first
  const kaynakIdleri = ((n.kaynak_ozeti as KaynakOzeti | null)?.kaynaklar || []).map((k) => k.id).filter((x) => uuidMu(x))
  const { data: aciklar } = await o.supabase.from('okuma_dogrulamalari').select('sinif').eq('doctor_id', o.doktorId).in('kaynak_id', [...kaynakIdleri, String(n.id)]).eq('durum', 'acik')
  if (islem === 'hekime_gonder') {
    if (o.rol === 'doktor') return json({ error: 'Geçersiz işlem.' }, 400)
    await o.supabase.from('notes').update({ hekim_onayi_bekliyor: true }).eq('id', n.id).eq('doctor_id', o.doktorId)
    await denetimYaz(o.supabase, { doktorId: o.doktorId, patientId: hastaId, noteId: String(n.id), sessionId: n.session_id as string, eylem: 'hekime_gonderildi', aktor: o.aktor, ayrinti: { acikSoru: (aciklar || []).length } })
    return json({ ok: true, durum: 'hekime_gonderildi' })
  }
  if (islem !== 'kesinlestir') return json({ error: 'Geçersiz işlem.' }, 400)
  if (!kesinlestirebilirMi(o.rol, o.ayar)) return json({ error: 'Hekim onayı gerekiyor; notu hekime gönderin.' }, 403)
  if ((aciklar || []).length) {
    const korumali = (aciklar || []).some((r) => r.sinif === 'korumali' || r.sinif === 'celiski')
    return json({ error: korumali ? 'Sağ/sol, var/yok, sayı, doz, ilaç ve alerji okumaları doğrulanmadan not kesinleşmez.' : 'Önce doğrulama sorularını cevaplayın.', acik: (aciklar || []).length }, 409)
  }
  const yanit = await notOnayla(o.supabase, { noteId: String(n.id), doktorId: o.doktorId, onaylayanId: o.user.id, govde: { duzenlemeler: b?.duzenlemeler || {} }, ogrenme: o.rol === 'doktor' })
  if (yanit.status !== 200) return yanit
  await o.supabase.from('notes').update({ kesinlestiren_user_id: o.user.id, kesinlestiren_rol: o.rol, kesinlestirme_at: new Date().toISOString(), hekim_onayi_bekliyor: false }).eq('id', n.id).eq('doctor_id', o.doktorId)
  await denetimYaz(o.supabase, { doktorId: o.doktorId, patientId: hastaId, noteId: String(n.id), sessionId: n.session_id as string, eylem: o.rol === 'doktor' ? 'hekim_onayi' : 'kesinlestirme', aktor: o.aktor })
  return json({ ok: true, durum: 'kesinlesti', ...(await yanit.json()) })
}
