/**
 * MUAYENE-EKLERI-01 — hekim notu ONAYLADIKTAN sonra ekleri ilgili bölümlere yönlendirir (kaynak bağlantısı korunur).
 *
 *  - Orijinal dosya zaten Kasa'dadır (visit_id = seans, kategori tür sınıflandırmasıyla yazılmıştır): yeniden yüklenmez.
 *  - Röntgen / EKG → hasta görüntü bölümü (goruntu_calisma): belge_id + seans_id ile; AYNI belge için ikinci satır açılmaz.
 *  - Aşı: 'bu muayenede uygulandı' satırları notun content_asilar'ına girer ve onayda mevcut nottanAsiAktar yazar; geçmiş
 *    karne satırları yalnız karne rotasındaki açık hekim onayıyla yazılır. Burada aşı YAZILMAZ.
 *  - Lab: sonuçlar Kasa'da kalır; ayrıştırılmış lab satırları mevcut lab onay akışından geçer (burada yazılmaz).
 *
 * Best effort: hiçbir hata onayı bozmaz; HASTA-IZOLASYON: tüm okuma/yazmalar doctor_id + patient_id ile kapsanır.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { seansDegerlendirmeleri } from './saklama'
import { goruntuTipi } from './kategori'

export interface YonlendirSonucu { goruntu: number; atlanan: number }

const bugun = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)

export async function onayliEkleriYonlendir(
  sb: SupabaseClient,
  g: { doktorId: string; patientId: string; sessionId: string; noteId: string },
): Promise<YonlendirSonucu> {
  const sonuc: YonlendirSonucu = { goruntu: 0, atlanan: 0 }
  try {
    const satirlar = (await seansDegerlendirmeleri(sb, g.doktorId, g.sessionId))
      .filter((s) => s.patientId === g.patientId && s.durum === 'tamam' && (s.tur === 'rontgen' || s.tur === 'ekg'))
    for (const s of satirlar) {
      try {
        const { data: belge } = await sb.from('medical_documents').select('id, category, created_at')
          .eq('id', s.belgeId).eq('doctor_id', g.doktorId).eq('patient_id', g.patientId).eq('visit_id', g.sessionId).maybeSingle()
        const tip = goruntuTipi(belge?.category as string | undefined)
        if (!belge || !tip) { sonuc.atlanan++; continue }
        const { data: var_ } = await sb.from('goruntu_calisma').select('id').eq('doctor_id', g.doktorId).eq('patient_id', g.patientId).eq('belge_id', s.belgeId).maybeSingle()
        if (var_?.id) { sonuc.atlanan++; continue }
        const { error } = await sb.from('goruntu_calisma').insert({
          patient_id: g.patientId, doctor_id: g.doktorId, tip, modalite: tip === 'ekg' ? 'EKG' : 'Röntgen',
          tarih: String(belge.created_at || '').slice(0, 10) || bugun(), kaynak: 'klinik_yukleme', belge_id: s.belgeId,
          dicom_var: false, onay_durum: 'taslak', seans_id: g.sessionId,
        })
        if (error) sonuc.atlanan++
        else sonuc.goruntu++
      } catch { sonuc.atlanan++ }
    }
  } catch { console.error('[muayene-ekleri] yonlendirme atlandi') }
  return sonuc
}
