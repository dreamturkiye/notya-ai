/**
 * NOTYA-HASTA-ILETISIMI-01 — applies an opt-out: flips the SAME consent column every send already
 * gates on (lib/iletisim/izin.ts) to false, and logs it exactly like any other consent change
 * (iletisim_izin_kayitlari, kaynak = 'vazgecme'). Called from the public unsubscribe link
 * (app/api/iletisim/vazgec/[jeton]/route.ts) and the inbound SMS STOP/DUR webhook
 * (app/api/iletisim/sms/webhook/route.ts). Idempotent — opting out twice is a no-op, not an error.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { IletisimKanali } from './tipler'

const SUTUN: Record<IletisimKanali, string> = {
  whatsapp: 'iletisim_izni_whatsapp',
  eposta: 'iletisim_izni_eposta',
  sms: 'iletisim_izni_sms',
}

export async function vazgecUygula(supabase: SupabaseClient, doktorId: string, patientId: string, kanal: IletisimKanali): Promise<boolean> {
  const simdi = new Date().toISOString()
  const { error } = await supabase
    .from('patients')
    .update({ [SUTUN[kanal]]: false, iletisim_izni_guncelleme: simdi, iletisim_izni_guncelleyen: null })
    .eq('id', patientId)
    .eq('doctor_id', doktorId)
  if (error) return false
  await supabase.from('iletisim_izin_kayitlari').insert({
    doctor_id: doktorId, patient_id: patientId, kanal, izin: false, kaynak: 'vazgecme',
    kaydeden_user_id: null, kaydeden_personel_id: null,
  })
  return true
}
