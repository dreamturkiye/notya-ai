/**
 * NOTYA-RANDEVU-05 — bir randevu KAYITSIZ (walk-in) bir isim için ayrılınca, o hasta için gerçek
 * bir `patients` kaydı ve dolayısıyla bir hasta dosyası açar.
 *
 * Neden gerekliydi: /api/doktor/randevular öncesinde patientId yoksa hasta adı/telefonu yalnızca
 * randevunun kendi üzerinde serbest metin olarak duruyordu — hastalar listesinde görünmüyordu,
 * dosyası yoktu, bir sonraki ziyarette yeniden "kayıtsız" olarak aranıyordu. Sekreter telefonda
 * randevu alırken doktor muayenehanelerinin gerçek iş akışı bu: isim + telefon yeter, TC Kimlik
 * hasta gelince tamamlanır. Bu yüzden TC Kimlik burada ZORUNLU DEĞİL — /api/doktor/hastalar'ın
 * POST'u (elle "Hasta Ekle" akışı) TC ister, ama bu otomatik akış istemez; `patients` şemasında
 * zaten yalnızca name_encrypted NOT NULL, tc_kimlik_hash nullable.
 *
 * Hem POST /api/doktor/randevular (yeni randevu) hem PATCH /api/doktor/randevular/[id] (mevcut
 * kayıtsız bir randevuyu düzenlerken de aynı yükseltme uygulanır) bu tek fonksiyonu kullanır.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/security/encryption'

export async function otomatikHastaKaydiOlustur(
  supabase: SupabaseClient,
  doktorId: string,
  ad: string,
  telefon?: string | null
): Promise<{ id: string } | null> {
  const temizAd = ad.trim()
  if (!temizAd) return null
  const { data, error } = await supabase
    .from('patients')
    .insert({
      doctor_id: doktorId,
      name_encrypted: encrypt(JSON.stringify({ ad: temizAd })),
      phone_encrypted: telefon?.trim() ? encrypt(telefon.trim()) : null,
      is_active: true,
    })
    .select('id')
    .single()
  if (error || !data) return null
  return { id: data.id }
}
