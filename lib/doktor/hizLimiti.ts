/**
 * NOTYA-KOTA-01 — Hesap başına günlük AI kotası.
 * Amaç ikili: (1) bozuk bir istemci döngüsünün ya da kötü niyetli bir hesabın Anthropic
 * bakiyesini bir gecede eritmesini engellemek, (2) çıktı-hasadı (rakibin toplu üretimle
 * kalitemizi damıtması) yolunu kapatmak. Sayaçlar Postgres'te (ai_kullanim) — sunucusuz
 * ortamda bellek-içi sayaç güvenilmez. Gün TRT'ye göre döner.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export const KOVA_LIMITLERI: Record<string, number> = {
  sohbet: 300,   // asistan yazılı sohbet mesajı / gün
  konsult: 200,  // hasta dosyası + not konsultları / gün
  soap: 80,      // not üretimi (canlı + ses yükleme) / gün
}

export async function aiKotaKullan(
  supabase: SupabaseClient,
  doctorId: string,
  kova: keyof typeof KOVA_LIMITLERI
): Promise<{ izin: boolean; kalan: number }> {
  const limit = KOVA_LIMITLERI[kova] ?? 100
  const gun = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  try {
    const { data: satir } = await supabase
      .from('ai_kullanim')
      .select('sayac')
      .eq('doctor_id', doctorId).eq('gun', gun).eq('kova', kova)
      .maybeSingle()
    const mevcut = satir?.sayac || 0
    if (mevcut >= limit) return { izin: false, kalan: 0 }
    await supabase.from('ai_kullanim').upsert(
      { doctor_id: doctorId, gun, kova, sayac: mevcut + 1 },
      { onConflict: 'doctor_id,gun,kova' }
    )
    return { izin: true, kalan: limit - mevcut - 1 }
  } catch {
    // Kota altyapısı çökerse klinik akışı DURDURMA — açık geç (fail-open), alarm ayrı yakalar.
    return { izin: true, kalan: limit }
  }
}

export const KOTA_MESAJI = 'Günlük yapay zekâ kullanım sınırına ulaşıldı. Sınır her gece (TRT) yenilenir; acil ihtiyaçta yöneticinizle görüşün.'
