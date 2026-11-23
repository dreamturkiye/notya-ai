/**
 * ESNEK-MUAYENE-A — GET → the doctor's "Onay bekleyen notlar": hand-note drafts the secretary sent for approval.
 * Doctor only. HASTA-IZOLASYON: rows by doctor_id; patient names decrypted only for the doctor's own patients.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json } from '@/lib/elNotu/rota'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await elNotuIstegi(req, 'doktor')
  if ('hata' in o) return o.hata
  const { data } = await o.supabase.from('notes').select('id, session_id, created_at, taslak_hazirlayan_rol, basvuru_yakinmasi, sessions(patient_id)').eq('doctor_id', o.doktorId).eq('hekim_onayi_bekliyor', true).is('approved_at', null).order('created_at', { ascending: false }).limit(100)
  const hastaIdleri = [...new Set((data || []).map((n) => (n as { sessions?: { patient_id?: string } | null }).sessions?.patient_id).filter(Boolean) as string[])]
  const { data: hastalar } = hastaIdleri.length ? await o.supabase.from('patients').select('id, name_encrypted').eq('doctor_id', o.doktorId).in('id', hastaIdleri) : { data: [] }
  const ad = (id?: string) => { const h = (hastalar || []).find((x) => x.id === id); if (!h) return ''; try { const v = decrypt(String(h.name_encrypted)); try { return String(JSON.parse(v).ad || v) } catch { return v } } catch { return '' } }
  return json({ notlar: (data || []).map((n) => { const pid = (n as { sessions?: { patient_id?: string } | null }).sessions?.patient_id; return { id: n.id, sessionId: n.session_id, tarih: n.created_at, hazirlayan: n.taslak_hazirlayan_rol, sikayet: n.basvuru_yakinmasi, patientId: pid || null, hasta: ad(pid) } }) })
}
