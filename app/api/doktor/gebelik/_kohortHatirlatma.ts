/**
 * KD kohort hasta-güvenli hatırlatma YAZMA yolu.
 * NOTYA-EYLEM-24: bilerek _kohort.ts'ten ayrı bir dosyada — bkz. pediatri/_kohortHatirlatma.ts üstündeki not.
 * Yalnız kohort/route.ts çağırır (hekimin kohort ekranından tetiklenen HTTP rotası).
 */
import { notifyPatientNewPracticeMessage } from '@/lib/portal/notifyPatientEmail'
import { kdHatirlatmaMesaji, KD_HATIRLATMA_KONU, type KdKohortBayrak } from '@/specialties/kadin-dogum/engines/kd-kohort'
import type { Sb } from './_kohort'

/** Tek hastaya hatırlatma. Çağıran, patientId'nin hekime ait olduğunu ÖNCE kdKohortVerisi(doctorId) ile doğrulamış olmalı. */
export async function kdHatirlatmaGonder(sb: Sb, doctorId: string, patientId: string, bayraklar: KdKohortBayrak[]): Promise<'gonderildi' | 'yakin' | 'hata'> {
  const { data: yakin } = await sb.from('hasta_mesaj_konulari').select('id').eq('doctor_id', doctorId).eq('patient_id', patientId).eq('konu', KD_HATIRLATMA_KONU).gte('son_mesaj_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(1)
  if (yakin?.length) return 'yakin'
  const m = kdHatirlatmaMesaji(bayraklar)
  const { data: konu, error } = await sb.from('hasta_mesaj_konulari').insert({ doctor_id: doctorId, patient_id: patientId, konu: m.konu, hasta_klasor: 'gelen', son_mesaj_at: new Date().toISOString(), okundu_hasta: false, okundu_pratik: true }).select('id').single()
  if (error || !konu) return 'hata'
  await sb.from('hasta_mesajlar').insert({ konu_id: konu.id, taraf: 'doktor', yazar_user_id: doctorId, metin: m.metin })
  try { await notifyPatientNewPracticeMessage(sb, { doctorId, patientId }) } catch { /* e-posta hatası gönderimi bozmaz */ }
  return 'gonderildi'
}
