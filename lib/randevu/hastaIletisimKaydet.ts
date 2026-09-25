/**
 * NOTYA-BETA-0925 — randevu penceresinden hastanın cep telefonu ve WhatsApp izni (doktor da sekreter de).
 *
 * Telefon, hasta kartının kullandığı alana yazılır (patients.phone_encrypted, şifreli). İzin kutusu işaretlendiyse
 * patients.iletisim_izni_whatsapp = true ve iletisim_izin_kayitlari'na bir geçmiş satırı (kim, ne zaman, kaynak
 * 'randevu'). 'randevu' kaynağı migration 100 ile açılır; uygulanmadan önce kısıt satırı reddederse aynı kayıt
 * 'gonder_dugmesi' kaynağıyla yazılır (personelin "İzin alındı olarak işaretle" dokunuşuyla aynı anlam) — geçmiş
 * hiçbir zaman kaybolmaz.
 *
 * HASTA-IZOLASYON-01: çağıran hastaSahibiMi ile doğrulamış olmalı; burada da her yazma id VE doctor_id ile.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/security/encryption'
import type { PratikRol } from '@/lib/doktor/pratikOturum'

export const IZIN_KAYNAGI_RANDEVU = 'randevu'

export interface RandevuIletisimGirdisi {
  doktorId: string
  patientId: string
  userId: string
  rol: PratikRol
  personelId?: string | null
  /** cepTelefonuDogrula'dan geçmiş, biçimlenmiş numara; null/undefined = dokunma. */
  telefon?: string | null
  /** true = hasta randevu ve form mesajlarını WhatsApp'tan almayı kabul etti. false/undefined = dokunma. */
  whatsappIzni?: boolean
}

export async function randevuIletisiminiKaydet(
  supabase: SupabaseClient,
  g: RandevuIletisimGirdisi,
): Promise<{ telefonKaydedildi: boolean; izinKaydedildi: boolean }> {
  const simdi = new Date().toISOString()
  let telefonKaydedildi = false
  let izinKaydedildi = false

  if (g.telefon) {
    const { error } = await supabase.from('patients')
      .update({ phone_encrypted: encrypt(g.telefon), updated_at: simdi })
      .eq('id', g.patientId).eq('doctor_id', g.doktorId)
    if (error) console.error(`[randevu] telefon kaydedilemedi: ${error.message}`)
    else telefonKaydedildi = true
  }

  if (g.whatsappIzni === true) {
    const { error } = await supabase.from('patients')
      .update({ iletisim_izni_whatsapp: true, iletisim_izni_guncelleme: simdi, iletisim_izni_guncelleyen: g.userId })
      .eq('id', g.patientId).eq('doctor_id', g.doktorId)
    if (error) {
      // migration 095 uygulanmamış: izin sütunu yok — randevu yine kaydedilir, izin sessizce atlanır.
      console.error(`[randevu] WhatsApp izni kaydedilemedi: ${error.message}`)
    } else {
      izinKaydedildi = true
      const satir = {
        doctor_id: g.doktorId,
        patient_id: g.patientId,
        kanal: 'whatsapp',
        izin: true,
        kaynak: IZIN_KAYNAGI_RANDEVU,
        kaydeden_user_id: g.userId,
        kaydeden_personel_id: g.rol === 'sekreter' ? g.personelId ?? null : null,
      }
      const { error: gecmisHata } = await supabase.from('iletisim_izin_kayitlari').insert(satir)
      if (gecmisHata) await supabase.from('iletisim_izin_kayitlari').insert({ ...satir, kaynak: 'gonder_dugmesi' })
    }
  }
  return { telefonKaydedildi, izinKaydedildi }
}
