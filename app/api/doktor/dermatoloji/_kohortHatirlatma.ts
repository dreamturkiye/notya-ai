/**
 * DERM-EXCEPTIONAL-01 — derm hasta-güvenli hatırlatma YAZMA yolu.
 * NOTYA-EYLEM-24: bilerek _kohort.ts'ten ayrı bir dosyada — bkz. pediatri/_kohortHatirlatma.ts üstündeki not.
 * Yalnız kohort/route.ts çağırır (hekimin kohort ekranından tetiklenen HTTP rotası).
 */
import { notifyPatientNewPracticeMessage } from '@/lib/portal/notifyPatientEmail'
import { dermHatirlatmaMesaji, DERM_HATIRLATMA_KONU, type DermKohortBayrak } from '@/specialties/dermatoloji/engines/kohort'
import type { Sb } from './_kohort'

/**
 * Tek hastaya hatırlatma. Çağıran, patientId'nin hekime ait olduğunu ÖNCE doğrulamış olmalı (kohort filtresi).
 * 7 gün içinde aynı konu gönderildiyse atlar. Gönderince açık "hatirlatma_takip" derm görevi açar (dönüş takibi, in-app).
 */
export async function dermHatirlatmaGonder(sb: Sb, doctorId: string, patientId: string, bayraklar: DermKohortBayrak[], bugun: string): Promise<'gonderildi' | 'yakin' | 'hata'> {
  const { data: yakin } = await sb.from('hasta_mesaj_konulari').select('id').eq('doctor_id', doctorId).eq('patient_id', patientId).eq('konu', DERM_HATIRLATMA_KONU).gte('son_mesaj_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(1)
  if (yakin?.length) return 'yakin'
  const m = dermHatirlatmaMesaji(bayraklar)
  const simdi = new Date().toISOString()
  const { data: konu, error } = await sb.from('hasta_mesaj_konulari').insert({ doctor_id: doctorId, patient_id: patientId, konu: m.konu, hasta_klasor: 'gelen', son_mesaj_at: simdi, okundu_hasta: false, okundu_pratik: true }).select('id').single()
  if (error || !konu) return 'hata'
  await sb.from('hasta_mesajlar').insert({ konu_id: konu.id, taraf: 'doktor', yazar_user_id: doctorId, metin: m.metin })
  try { await notifyPatientNewPracticeMessage(sb, { doctorId, patientId }) } catch { /* e-posta hatası gönderimi bozmaz */ }
  const due = new Date(Date.parse(`${bugun}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10)
  const { data: acik } = await sb.from('derm_gorevleri').select('id').eq('doctor_id', doctorId).eq('patient_id', patientId).eq('kod', 'hatirlatma_takip').eq('durum', 'acik').maybeSingle()
  if (!acik) await sb.from('derm_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: 'hatirlatma_takip', ad: 'Hatırlatma gönderildi — randevu dönüşünü takip edin', due, kaynak: 'hatirlatma' })
  return 'gonderildi'
}
