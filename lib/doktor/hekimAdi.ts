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

/** DAH-PROMPTS-LOCK: users.specialty — branş kilitleri (ör. dahiliye prompts/) seans bağlamına güvenmeden uygulanır. */
export async function hekimBransi(sb: SupabaseClient, doctorId: string): Promise<string | null> {
  try {
    const { data } = await sb.from('users').select('specialty').eq('id', doctorId).maybeSingle()
    return data?.specialty ? String(data.specialty) : null
  } catch { return null }
}

/**
 * NOTYA-UNVAN-01 (Kaan, 2026-09-24) — "Dr. Dr. Gökhan Mamur" başlıkta çift görünüyordu. Kök neden bu
 * dosyanın kendi yukarıdaki notunda zaten yazılıydı: users.full_name bazı kayıtlarda unvanı
 * ZATEN içeriyor ("Dr. Gökhan Mamur"), bazılarında içermiyor ("Kaan Arıoğlu") — ayrı bir unvan
 * sütunu yok. Bir yerde körü körüne `Dr. ${ad}` yazmak, unvanı zaten taşıyan kayıtlarda çiftler.
 * Bu fonksiyon adın başında zaten bir unvan var mı diye bakar, varsa olduğu gibi bırakır, yoksa
 * "Dr. " ekler — tek kaynak, her yerde aynı sonuç. Daha önce notlar/[id]/yazdir/page.tsx'te aynı
 * mantık yerel bir fonksiyon olarak vardı (doktorUnvanli); o da buraya taşındı.
 */
const UNVAN_DESENI = /^(prof\.?\s*dr\.?|doç\.?\s*dr\.?|uzm\.?\s*dr\.?|op\.?\s*dr\.?|dr\.?|doç\.?|prof\.?|uzm\.?|op\.?)\s/i

export function hekimUnvanli(ad: string | null | undefined): string {
  const t = String(ad || '').trim()
  if (!t) return t
  return UNVAN_DESENI.test(t) ? t : `Dr. ${t}`
}
