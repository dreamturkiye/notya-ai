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
import type { DoctorTitle } from '@/lib/address'

/**
 * OP-DR-01 (Kaan, 2026-11-05): the name every printout and letterhead carries is the doctor's name WITH THE STORED
 * TITLE (users.title, the onboarding / Hesabım choice; the legacy users.unvan column as a fallback) — "Op. Dr. Ad Soyad",
 * never a hard-coded "Uzm. Dr.". Plain "Dr." only when no title is stored.
 */
export async function hekimAdi(sb: SupabaseClient, doctorId: string): Promise<string> {
  try {
    const { data } = await sb.from('users').select('full_name, unvan, title').eq('id', doctorId).maybeSingle()
    if (!data) return ''
    const unvan = kayitliUnvan(data.title) || kayitliUnvan(data.unvan)
    const tamAd = String(data.full_name || '').trim()
    if (tamAd) return hekimUnvanli(tamAd, unvan)
    return unvan || 'Dr.'
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

/** The five titles, spelled as users.title stores them (lib/address.ts DOKTOR_UNVANLARI). */
const UNVAN_YAZIMI: ReadonlyArray<[RegExp, DoctorTitle]> = [
  [/^prof\.?\s*dr\.?$/i, 'Prof. Dr.'],
  [/^do[çc]\.?\s*dr\.?$/i, 'Doç. Dr.'],
  [/^op\.?\s*dr\.?$/i, 'Op. Dr.'],
  [/^uzm\.?\s*dr\.?$/i, 'Uzm. Dr.'],
  [/^dr\.?$/i, 'Dr.'],
]

/** A stored title (users.title or the legacy users.unvan) in its canonical spelling, or null when none / not a title. */
export function kayitliUnvan(ham: unknown): DoctorTitle | null {
  const t = typeof ham === 'string' ? ham.trim() : ''
  if (!t) return null
  return UNVAN_YAZIMI.find(([re]) => re.test(t))?.[1] ?? null
}

/**
 * OP-DR-01: with a STORED title (`unvan`), that title wins — a title typed into the name is replaced by it, never
 * doubled ("Dr. Ayşe Kaya" + 'Op. Dr.' → "Op. Dr. Ayşe Kaya"). Without one, the old rule: keep a title the name already
 * carries, otherwise "Dr. ".
 */
export function hekimUnvanli(ad: string | null | undefined, unvan?: string | null): string {
  const t = String(ad || '').trim()
  if (!t) return t
  const kayitli = kayitliUnvan(unvan)
  if (kayitli) {
    let yalinAd = t
    while (UNVAN_DESENI.test(yalinAd)) yalinAd = yalinAd.replace(UNVAN_DESENI, '').trim()
    return yalinAd ? `${kayitli} ${yalinAd}` : kayitli
  }
  return UNVAN_DESENI.test(t) ? t : `Dr. ${t}`
}

/** A users row → the titled name (users.title, then users.unvan). */
export function hekimUnvanliSatirdan(row: { full_name?: unknown; title?: unknown; unvan?: unknown } | null | undefined): string {
  if (!row) return ''
  return hekimUnvanli(String(row.full_name ?? ''), kayitliUnvan(row.title) || kayitliUnvan(row.unvan))
}
