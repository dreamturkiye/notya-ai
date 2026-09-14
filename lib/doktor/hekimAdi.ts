/**
 * Hekimin görünen adı — veli özeti/uyarılarda "Doktorunuz" yerine (Kaan 2026-09-10: "çok şık olur").
 *
 * NOTYA-EPIKRIZ-02 (Kaan 2026-09-14) düzeltmesi: bu fonksiyon var olmayan sütunlar
 * (first_name, last_name, title) sorguluyordu — PostgREST "column does not exist" hatası
 * veriyordu, try/catch bunu yutup HER ZAMAN boş string döndürüyordu. Sessizce kırıktı;
 * epikriz imza bloğunu kurarken fark edildi. Gerçek şema: users.full_name zaten "Dr. Ad
 * Soyad" biçiminde tam isim tutuyor (unvan dahil), ayrı first/last_name yok.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export async function hekimAdi(sb: SupabaseClient, doctorId: string): Promise<string> {
  try {
    const { data } = await sb.from('users').select('full_name, unvan').eq('id', doctorId).maybeSingle()
    if (!data) return ''
    const tamAd = String(data.full_name || '').trim()
    if (tamAd) return tamAd
    const unvan = String(data.unvan || 'Dr.').trim()
    return unvan
  } catch { return '' }
}
