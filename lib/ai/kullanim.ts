/**
 * NOTYA-MALIYET-01 (E) — her Claude çağrısının token sayaçlarını ai_token_kullanim tablosuna yazar.
 *
 * YALNIZ SAYAÇ: hekim kimliği (varsa), görev, model, kademe, yükseltme nedeni (NOTYA-MODEL-LUNA-01) ve usage sayıları. Prompt, yanıt, hasta adı/kimliği
 * veya herhangi bir içerik YAZILMAZ — kullanimSatiri() şekli lib/ai/cagir.test.ts'te kilitli.
 * Kayıt hatası çağrıyı asla düşürmez (ölçüm kritik yol değildir).
 */
import type { Gorev, Kademe, YukseltmeNedeni } from './modeller'

export interface HamKullanim {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}

export interface KullanimSatiri {
  doctor_id: string | null
  gorev: Gorev
  model: string
  input_tokens: number
  output_tokens: number
  cache_read: number
  cache_creation: number
  kesildi: boolean
  /** Etkin kademe (guclu | hizli) — migration 105 */
  kademe: Kademe | null
  /** Neden GÜÇLÜ gitti (transport | onayla | safety | vision | low_conf | uzman); HIZLI kaldıysa null — migration 105 */
  neden: YukseltmeNedeni | null
}

const sayi = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.round(x) : 0)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Saf: API yanıtının usage alanından tabloya gidecek satır. doctor_id UUID değilse null (FK güvenli). */
export function kullanimSatiri(g: {
  doctorId?: string | null; gorev: Gorev; model: string; usage?: HamKullanim | null; stopReason?: string | null
  kademe?: Kademe | null; neden?: YukseltmeNedeni | null
}): KullanimSatiri {
  const u = g.usage || {}
  return {
    doctor_id: g.doctorId && UUID.test(g.doctorId) ? g.doctorId : null,
    gorev: g.gorev,
    model: String(g.model || '').slice(0, 80),
    input_tokens: sayi(u.input_tokens),
    output_tokens: sayi(u.output_tokens),
    cache_read: sayi(u.cache_read_input_tokens),
    cache_creation: sayi(u.cache_creation_input_tokens),
    kesildi: g.stopReason === 'max_tokens',
    kademe: g.kademe ?? null,
    neden: g.neden ?? null,
  }
}

type Yazici = { from: (t: string) => { insert: (r: Partial<KullanimSatiri>) => PromiseLike<{ error: unknown }> } }
let yazici: Yazici | null | undefined

async function yaziciAl(): Promise<Yazici | null> {
  if (yazici !== undefined) return yazici
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anahtar = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anahtar) { yazici = null; return null }
  const { createClient } = await import('@supabase/supabase-js')
  yazici = createClient(url, anahtar, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }) as unknown as Yazici
  return yazici
}

/** PostgREST "kolon yok" hatası (PGRST204 / 42703). */
function kolonYok(e: unknown): boolean {
  const h = e as { code?: string; message?: string }
  return h?.code === 'PGRST204' || h?.code === '42703' || /column/i.test(String(h?.message || ''))
}

/** Servis rolüyle tek satır ekler; her hata yutulur (yalnız konsola sayaçsız bir uyarı). */
export async function kullanimKaydet(satir: KullanimSatiri): Promise<void> {
  try {
    const sb = await yaziciAl()
    if (!sb) return
    let { error } = await sb.from('ai_token_kullanim').insert(satir)
    if (error && kolonYok(error)) {
      // Migration 105 henüz uygulanmadıysa sayaçlar kaybolmasın: kademe/neden olmadan tekrar yaz.
      const { kademe: _k, neden: _n, ...eski } = satir
      ;({ error } = await sb.from('ai_token_kullanim').insert(eski))
    }
    if (error) console.warn('[ai_token_kullanim] kayıt yazılamadı', { gorev: satir.gorev, model: satir.model })
  } catch {
    /* ölçüm kritik değil */
  }
}
