/**
 * PEDI-ARACLAR-02 — hasta-güvenli hatırlatma YAZMA yolu.
 * NOTYA-EYLEM-24: bilerek _kohort.ts'ten ayrı bir dosyada. _kohort.ts salt-okunur kohort verisi toplar
 * ve sohbet/ses arama yolundan (lib/doktor/hastaDosyaAra.ts) da içe aktarılır; hasta_mesaj_konulari /
 * hasta_mesajlar'a YAZAN bu fonksiyon aynı dosyada olsaydı NOTYA-EYLEM-24 muhafız testinin statik
 * ithalat-grafiği o yazmayı sohbet/ses girişinden "erişilebilir" sayardı (dosya bazlı analiz).
 * Yalnız kohort/route.ts çağırır — hekimin kohort ekranından tetiklenen ayrı bir HTTP rotası, sohbet/ses
 * girişi (GIRIS_NOKTALARI) değil.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyPatientNewPracticeMessage } from '@/lib/portal/notifyPatientEmail'
import { pediHatirlatmaMesaji, PEDI_HATIRLATMA_KONU, type PediKohortBayrak } from '@/specialties/pediatri/engines/kohort'

/**
 * Tek hastaya hatırlatma. Çağıran, patientId'nin hekimin kohortunda (doctor_id süzgeci) olduğunu ÖNCE doğrulamış olmalı.
 * 7 gün içinde aynı konu gönderildiyse atlar.
 */
export async function pediHatirlatmaGonder(sb: SupabaseClient, doktorId: string, patientId: string, bayraklar: PediKohortBayrak[]): Promise<'gonderildi' | 'yakin' | 'hata'> {
  const { data: yakin } = await sb.from('hasta_mesaj_konulari').select('id').eq('doctor_id', doktorId).eq('patient_id', patientId).eq('konu', PEDI_HATIRLATMA_KONU).gte('son_mesaj_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(1)
  if (yakin?.length) return 'yakin'
  const m = pediHatirlatmaMesaji(bayraklar)
  const { data: konu, error } = await sb.from('hasta_mesaj_konulari').insert({ doctor_id: doktorId, patient_id: patientId, konu: m.konu, hasta_klasor: 'gelen', son_mesaj_at: new Date().toISOString(), okundu_hasta: false, okundu_pratik: true }).select('id').single()
  if (error || !konu) return 'hata'
  await sb.from('hasta_mesajlar').insert({ konu_id: konu.id, taraf: 'doktor', yazar_user_id: doktorId, metin: m.metin })
  try { await notifyPatientNewPracticeMessage(sb, { doctorId: doktorId, patientId }) } catch { /* e-posta hatası gönderimi bozmaz */ }
  return 'gonderildi'
}
