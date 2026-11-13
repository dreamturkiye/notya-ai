/**
 * AYSE-OGRENME-V3 / 3 — Klinik ortak üslup (Notya Klinik). Doktor başına AÇIK RIZA, varsayılan KAPALI.
 *
 * Paylaşılan: yalnız üslup kuralları — terim, uzunluk, bölüm sırası. Asla: hasta verisi, not metni, ilaç, doz,
 * silme/ekleme/yeniden yazma kalıpları (not metninden alıntı taşırlar). Havuza giren satırda yazar kimliği SAKLANIR
 * (ayrılınca satırları silmek için) ama hiçbir istemci yanıtına konmaz: alan doktor kuralı kimden aldığını göremez.
 * Branş alan sızması: havuz branşa göre bölünür; yalnız aynı branştaki üyeler birbirinin kuralını alır.
 * Ayrılma: katilim kapanır + havuzdaki tüm satırları silinir. Doktor kapsamı: doctor_id her sorguda.
 * LLM yok; kural yazımı waitUntil yolunda, okuma tek indeksli sorgu.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { anahtarSlug } from '@/lib/doktor/hafiza'

export interface PaylasilacakKural {
  anahtar: string
  kategori: string
  deger: string
  kaynak: string
  kanit_sayisi: number
  durum: string
  aktif: boolean
}

export const KLINIK_SLUG_ONEKI = 'klinik:'
const IZINLI_ONEKLER = ['terim-', 'uzunluk-', 'sira-']
const TERIM_MIN_KANIT = 3
/** Dozu / sayıyı / ilaç ekini düşündüren değerler asla paylaşılmaz. */
const SAYI_DOZ = /\d|\b(mg|mcg|µg|μg|ml|iu|ünite|unite)\b/i
/**
 * Terim kuralları YALNIZ bu KAPALI listedeki genel düzyazı sözcükleriyle paylaşılır (izin listesi, yasak listesi değil):
 * ilaç/etken adı yasak listesiyle güvenilir yakalanamaz (amoksisilin, parasetamol…). Liste klinik gözden geçirmeyle
 * genişler (docs/OPEN-COMMITMENTS.md AYSE-OGRENME-V3). Dil başına tek küme; ülke build'leri kendi sözcüklerini ekler.
 */
export const TERIM_IZIN_LISTESI: ReadonlySet<string> = new Set([
  // tr
  'gerektiğinde', 'gerekirse', 'lüzumlu', 'halde', 'halinde', 'kontrol', 'denetim', 'takip', 'izlem', 'muayene', 'tetkik', 'tahlil',
  'şikayet', 'yakınma', 'öneri', 'tavsiye', 'hasta', 'danışan', 'başvurun', 'başvurunuz', 'uygulayın', 'kullanın', 'veriniz', 'verin',
  'yazınız', 'bulgu', 'bulgular', 'değerlendirme', 'sonuç', 'sonuçlar', 'tedavi', 'plan', 'hafta', 'gün', 'ay', 'sonra', 'önce',
  // en
  'review', 'follow-up', 'followup', 'follow', 'check', 'advise', 'recommend', 'monitor', 'patient', 'client', 'complaint', 'symptoms',
  'examination', 'assessment', 'results', 'result', 'week', 'day', 'month', 'needed', 'required', 'appropriate', 'as', 'when', 'if',
  // uz
  'kerak', 'nazorat', 'kuzatuv', 'tekshiruv', 'shikoyat', 'tavsiya', 'bemor', 'natija', 'natijalar', 'davolash', 'hafta', 'kun', 'oy',
])

function tirnakIci(deger: string): string[] {
  return [...deger.matchAll(/"([^"]+)"/g)].map((m) => m[1])
}

/** Saf: bu kural klinik havuzuna girebilir mi? */
export function uslupPaylasilabilirMi(k: PaylasilacakKural): boolean {
  if (k.kaynak !== 'duzeltme' || k.durum !== 'uygulanir' || !k.aktif || k.kategori !== 'uslup') return false
  const slug = String(k.anahtar || '')
  if (!IZINLI_ONEKLER.some((o) => slug.startsWith(o))) return false
  const deger = String(k.deger || '')
  if (!deger || deger.length > 300) return false
  if (slug.startsWith('terim-')) {
    if ((k.kanit_sayisi || 0) < TERIM_MIN_KANIT) return false
    const sozler = tirnakIci(deger)
    if (sozler.length !== 2) return false
    for (const s of sozler) {
      if (s.length > 40 || SAYI_DOZ.test(s)) return false
      const kelimeler = s.toLocaleLowerCase('tr').split(/\s+/).filter(Boolean)
      if (!kelimeler.length || !kelimeler.every((w) => TERIM_IZIN_LISTESI.has(w))) return false
    }
  }
  return !SAYI_DOZ.test(deger.replace(/"[^"]*"/g, ''))
}

export interface KlinikDurumu {
  uye: boolean
  clinicId: string | null
  aktif: boolean
}

export async function klinikDurumu(sb: SupabaseClient, doctorId: string): Promise<KlinikDurumu> {
  const { data: uye } = await sb
    .from('clinic_members')
    .select('clinic_id')
    .eq('user_id', doctorId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  const clinicId = uye?.clinic_id ? String(uye.clinic_id) : null
  if (!clinicId) return { uye: false, clinicId: null, aktif: false }
  const { data: k } = await sb
    .from('klinik_uslup_katilim')
    .select('aktif, clinic_id')
    .eq('doctor_id', doctorId)
    .maybeSingle()
  return { uye: true, clinicId, aktif: Boolean(k?.aktif) && String(k?.clinic_id || '') === clinicId }
}

async function bransOku(sb: SupabaseClient, doctorId: string): Promise<string> {
  const { data } = await sb.from('users').select('specialty').eq('id', doctorId).maybeSingle()
  return String((data as { specialty?: string } | null)?.specialty || '').trim().toLowerCase()
}

/** Havuzdaki kendi satırlarını doktorun şu anki paylaşılabilir kurallarıyla değiştirir. Yalnız açık rızada. */
export async function klinikHavuzuSenkronla(sb: SupabaseClient, doctorId: string): Promise<void> {
  try {
    const d = await klinikDurumu(sb, doctorId)
    if (!d.uye || !d.aktif || !d.clinicId) return
    const brans = await bransOku(sb, doctorId)
    if (!brans) return
    const { data } = await sb
      .from('doktor_hafiza')
      .select('anahtar, kategori, deger, kaynak, kanit_sayisi, durum, aktif')
      .eq('doctor_id', doctorId)
      .eq('kaynak', 'duzeltme')
      .eq('durum', 'uygulanir')
      .eq('aktif', true)
      .eq('kategori', 'uslup')
      .limit(80)
    const uygun = ((data || []) as PaylasilacakKural[]).filter(uslupPaylasilabilirMi).slice(0, 40)
    await sb.from('klinik_ortak_uslup').delete().eq('kaynak_doctor_id', doctorId)
    if (!uygun.length) return
    await sb.from('klinik_ortak_uslup').insert(uygun.map((k) => ({
      clinic_id: d.clinicId,
      kaynak_doctor_id: doctorId,
      brans,
      anahtar: k.anahtar,
      deger: k.deger,
    })))
  } catch (e) {
    console.error('[klinik-uslup] senkron', e)
  }
}

/** Açık rıza: katılım kaydı + ilk havuz yazımı. Klinik üyeliği yoksa reddedilir. */
export async function klinikUslupAc(sb: SupabaseClient, doctorId: string): Promise<{ ok: boolean; neden?: 'uye_degil' }> {
  const d = await klinikDurumu(sb, doctorId)
  if (!d.uye || !d.clinicId) return { ok: false, neden: 'uye_degil' }
  const simdi = new Date().toISOString()
  await sb.from('klinik_uslup_katilim').upsert({
    doctor_id: doctorId,
    clinic_id: d.clinicId,
    aktif: true,
    onay_at: simdi,
    ayrildi_at: null,
    updated_at: simdi,
  }, { onConflict: 'doctor_id' })
  await klinikHavuzuSenkronla(sb, doctorId)
  return { ok: true }
}

/** İstediği an ayrılır: rıza kapanır, havuzdaki TÜM satırları silinir. */
export async function klinikUslupKapat(sb: SupabaseClient, doctorId: string): Promise<void> {
  const simdi = new Date().toISOString()
  await sb.from('klinik_ortak_uslup').delete().eq('kaynak_doctor_id', doctorId)
  await sb.from('klinik_uslup_katilim').update({ aktif: false, ayrildi_at: simdi, updated_at: simdi }).eq('doctor_id', doctorId)
}

export interface HavuzSatiri {
  anahtar: string
  deger: string
}

/** Saf: havuzdan alınan satırları süzer — kendi kuralı ve kendi kapattıkları çıkar, anahtar tekilleşir. */
export function havuzKurallariniSec(
  havuz: HavuzSatiri[],
  kendiAnahtarlar: Set<string>,
  kapatilanlar: Set<string>,
  limit: number,
): { slug: string; satir: string }[] {
  const out: { slug: string; satir: string }[] = []
  const gorulen = new Set<string>()
  for (const h of havuz) {
    if (!h.anahtar || !h.deger || gorulen.has(h.anahtar) || kendiAnahtarlar.has(h.anahtar)) continue
    const slug = `${KLINIK_SLUG_ONEKI}${h.anahtar}`
    if (kapatilanlar.has(kapaliAnahtar(slug))) continue
    gorulen.add(h.anahtar)
    out.push({ slug, satir: h.deger })
    if (out.length >= limit) break
  }
  return out
}

/** kuralKapat'ın `klinik:` slug'ı için yazdığı anahtarla aynı biçim. */
export function kapaliAnahtar(slug: string): string {
  return `kapali-${anahtarSlug(slug)}`.slice(0, 60)
}

/** Alan doktorun uygulayacağı klinik kuralları. Açık rıza yoksa [] (alan da paylaşmayan almaz). Yazar kimliği okunmaz. */
export async function klinikKurallariYukle(
  sb: SupabaseClient,
  doctorId: string,
  limit: number,
): Promise<{ slug: string; satir: string }[]> {
  if (limit <= 0) return []
  try {
    // Hızlı yol: rıza vermemiş doktor için tek PK sorgusu, başka bir şey yok.
    const { data: kat } = await sb.from('klinik_uslup_katilim').select('aktif').eq('doctor_id', doctorId).maybeSingle()
    if (!kat?.aktif) return []
    const d = await klinikDurumu(sb, doctorId)
    if (!d.uye || !d.aktif || !d.clinicId) return []
    const brans = await bransOku(sb, doctorId)
    if (!brans) return []
    // Kaynak hâlâ hem klinik üyesi hem rızalı olmalı (üyelikten çıkan birinin kuralı, silme başarısız olsa bile okunmaz).
    const { data: uyeler } = await sb.from('clinic_members').select('user_id').eq('clinic_id', d.clinicId).eq('is_active', true).limit(500)
    const uyeIdler = ((uyeler || []) as { user_id: string }[]).map((u) => u.user_id).filter((id) => id !== doctorId)
    if (!uyeIdler.length) return []
    const { data: rizali } = await sb.from('klinik_uslup_katilim').select('doctor_id').eq('clinic_id', d.clinicId).eq('aktif', true).in('doctor_id', uyeIdler)
    const kaynaklar = ((rizali || []) as { doctor_id: string }[]).map((r) => r.doctor_id)
    if (!kaynaklar.length) return []
    const [havuzRes, kendiRes, kapaliRes] = await Promise.all([
      sb.from('klinik_ortak_uslup').select('anahtar, deger').eq('clinic_id', d.clinicId).eq('brans', brans).in('kaynak_doctor_id', kaynaklar).order('created_at', { ascending: false }).limit(60),
      sb.from('doktor_hafiza').select('anahtar').eq('doctor_id', doctorId).limit(300),
      sb.from('doktor_hafiza').select('anahtar').eq('doctor_id', doctorId).like('anahtar', 'kapali-klinik-%').limit(100),
    ])
    const kendi = new Set(((kendiRes.data || []) as { anahtar: string }[]).map((r) => r.anahtar))
    const kapali = new Set(((kapaliRes.data || []) as { anahtar: string }[]).map((r) => r.anahtar))
    return havuzKurallariniSec((havuzRes.data || []) as HavuzSatiri[], kendi, kapali, limit)
  } catch {
    return []
  }
}

/** `klinik:` slug'larının metnini alan doktorun KENDİ klinik havuzundan çözer. */
export async function klinikSlugMetinleri(
  sb: SupabaseClient,
  doctorId: string,
  slugs: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const anahtarlar = slugs.filter((s) => s.startsWith(KLINIK_SLUG_ONEKI)).map((s) => s.slice(KLINIK_SLUG_ONEKI.length))
  if (!anahtarlar.length) return map
  try {
    const d = await klinikDurumu(sb, doctorId)
    if (!d.clinicId) return map
    const { data } = await sb.from('klinik_ortak_uslup').select('anahtar, deger').eq('clinic_id', d.clinicId).in('anahtar', anahtarlar)
    for (const r of (data || []) as HavuzSatiri[]) map.set(`${KLINIK_SLUG_ONEKI}${r.anahtar}`, r.deger)
  } catch { /* çözülemezse slug kalır */ }
  return map
}
