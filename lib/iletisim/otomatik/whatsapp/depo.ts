/**
 * NOTYA-ILETISIM-03 — doktor_whatsapp_baglantilari erişimi (service-role; her sorgu doctor_id ile kapsanır).
 * Anahtar yalnız burada çözülür ve yalnız sunucuda kullanılır; `BaglantiGorunumu` tarayıcıya giden
 * tek şekildir ve anahtar/kimlik içermez.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptPII, decryptPII } from '@/lib/security/encryption'
import { SABLON_KODLARI, type SablonDurumlari, type SablonKodu } from './sablonlar'
import type { olaylariAyikla } from './webhook'
import { gunlukYaz } from './gunluk'

export const TABLO = 'doktor_whatsapp_baglantilari'
export const TESLIM_TABLOSU = 'whatsapp_teslim_durumlari'

export interface BaglantiSatiri {
  doctor_id: string
  business_id: string | null
  waba_id: string
  phone_number_id: string
  gorunen_numara: string | null
  gorunen_ad: string | null
  token_encrypted: string
  sablon_durumlari: SablonDurumlari | null
  durum: 'bagli' | 'kaldirildi' | 'hata'
  son_hata: string | null
  /** Migration 169 (WHATSAPP-API-01); undefined/null before it is applied. */
  kalite_puani?: string | null
  mesaj_limiti_tier?: string | null
  saglik_guncellendi?: string | null
  kvkk_onay_at?: string | null
  uyari_at?: string | null
}

export interface Baglanti {
  doktorId: string
  wabaId: string
  phoneNumberId: string
  gorunenNumara: string | null
  gorunenAd: string | null
  token: string
  sablonlar: SablonDurumlari
  /** Meta `messaging_limit_tier` as last read (null = not read yet → the 250/24h starting tier applies). */
  tier: string | null
  kalite: string | null
  saglikGuncellendi: string | null
  kvkkOnayAt: string | null
}

const TEMEL_KOLONLAR = 'doctor_id, waba_id, phone_number_id, gorunen_numara, gorunen_ad, token_encrypted, sablon_durumlari, durum'
const YENI_KOLONLAR = 'kalite_puani, mesaj_limiti_tier, saglik_guncellendi, kvkk_onay_at, uyari_at'

export async function baglantiOku(sb: SupabaseClient, doktorId: string): Promise<Baglanti | null> {
  const oku = (kolonlar: string) => sb.from(TABLO).select(kolonlar).eq('doctor_id', doktorId).eq('durum', 'bagli').maybeSingle()
  // Migration 169 adds the tier/quality/consent columns. Before it is applied the select fails: fall back to the 097 columns.
  let r = await oku(`${TEMEL_KOLONLAR}, ${YENI_KOLONLAR}`)
  if (r.error) r = await oku(TEMEL_KOLONLAR)
  const s = r.data as unknown as BaglantiSatiri | null
  if (!s?.token_encrypted) return null
  let token = ''
  try { token = decryptPII(s.token_encrypted) } catch { return null }
  if (!token) return null
  return {
    doktorId: s.doctor_id, wabaId: s.waba_id, phoneNumberId: s.phone_number_id, gorunenNumara: s.gorunen_numara, gorunenAd: s.gorunen_ad, token,
    sablonlar: s.sablon_durumlari || {},
    tier: s.mesaj_limiti_tier ?? null, kalite: s.kalite_puani ?? null, saglikGuncellendi: s.saglik_guncellendi ?? null, kvkkOnayAt: s.kvkk_onay_at ?? null,
  }
}

/** Every connected doctor (maintenance cron). Token stays encrypted here; callers decrypt per row via baglantiOku. */
export async function bagliDoktorlar(sb: SupabaseClient): Promise<string[]> {
  const { data, error } = await sb.from(TABLO).select('doctor_id').eq('durum', 'bagli').limit(5000)
  if (error || !data) return []
  return data.map((r) => String((r as { doctor_id: string }).doctor_id))
}

/** The connection exists but Meta stopped accepting its token (190) — the card asks the doctor to reconnect. */
export async function baglantiSorunu(sb: SupabaseClient, doktorId: string): Promise<string | null> {
  const { data } = await sb.from(TABLO).select('durum, son_hata').eq('doctor_id', doktorId).eq('durum', 'hata').maybeSingle()
  return data ? String((data as { son_hata?: string | null }).son_hata || 'WhatsApp bağlantısının süresi dolmuş. Lütfen yeniden bağlayın.') : null
}

/** Marks the connection broken (token revoked/expired). The encrypted token is dropped from use, not from the row. */
export async function baglantiHatasiYaz(sb: SupabaseClient, doktorId: string, mesaj: string): Promise<void> {
  await sb.from(TABLO).update({ durum: 'hata', son_hata: mesaj.slice(0, 300), updated_at: new Date().toISOString() }).eq('doctor_id', doktorId)
}

export async function saglikYaz(sb: SupabaseClient, doktorId: string, g: { tier: string | null; kalite: string | null }): Promise<void> {
  const simdi = new Date().toISOString()
  await sb.from(TABLO).update({ mesaj_limiti_tier: g.tier, kalite_puani: g.kalite, saglik_guncellendi: simdi, updated_at: simdi }).eq('doctor_id', doktorId)
}

/** Claims the right to alert the admin about this doctor's connection: at most one alert per `saat` hours. */
export async function uyariHakkiAl(sb: SupabaseClient, doktorId: string, saat = 12, simdi: Date = new Date()): Promise<boolean> {
  const sinir = new Date(simdi.getTime() - saat * 3600_000).toISOString()
  const { data, error } = await sb.from(TABLO).update({ uyari_at: simdi.toISOString() }).eq('doctor_id', doktorId).or(`uyari_at.is.null,uyari_at.lt.${sinir}`).select('doctor_id')
  return !error && (data || []).length > 0
}

export async function baglantiKaydet(
  sb: SupabaseClient,
  g: { doktorId: string; businessId: string | null; wabaId: string; phoneNumberId: string; gorunenNumara: string | null; gorunenAd: string | null; token: string; sablonlar: SablonDurumlari; kvkkOnayAt?: string | null; kvkkOnaySurum?: string | null }
): Promise<{ ok: true } | { ok: false; hata: string }> {
  const simdi = new Date().toISOString()
  const satir = {
      doctor_id: g.doktorId,
      business_id: g.businessId,
      waba_id: g.wabaId,
      phone_number_id: g.phoneNumberId,
      gorunen_numara: g.gorunenNumara,
      gorunen_ad: g.gorunenAd,
      token_encrypted: encryptPII(g.token),
      sablon_durumlari: g.sablonlar,
      durum: 'bagli',
      son_hata: null,
      baglandi_at: simdi,
      updated_at: simdi,
  }
  // Consent columns exist from migration 169. Written first with them; before 169 the 097 columns alone are written.
  const yeni = g.kvkkOnayAt ? { ...satir, kvkk_onay_at: g.kvkkOnayAt, kvkk_onay_surum: g.kvkkOnaySurum ?? null, uyari_at: null } : satir
  let { error } = await sb.from(TABLO).upsert(yeni, { onConflict: 'doctor_id' })
  if (error && yeni !== satir) ({ error } = await sb.from(TABLO).upsert(satir, { onConflict: 'doctor_id' }))
  return error ? { ok: false, hata: error.message } : { ok: true }
}

export async function sablonlariGuncelle(sb: SupabaseClient, doktorId: string, sablonlar: SablonDurumlari): Promise<void> {
  await sb.from(TABLO).update({ sablon_durumlari: sablonlar, updated_at: new Date().toISOString() }).eq('doctor_id', doktorId)
}

/** Bağlantıyı kaldırır: anahtar satırdan silinir (yeniden bağlamada yenisi alınır). */
export async function baglantiSil(sb: SupabaseClient, doktorId: string): Promise<void> {
  await sb.from(TABLO).delete().eq('doctor_id', doktorId)
}

/**
 * Webhook olaylarını yazar. Doktor, olaydaki Meta kimliğinden (phone_number_id / waba_id) kendi
 * satırımızla çözülür — webhook'un gövdesi imzalı Meta verisidir, ama yine de bilinmeyen kimlik = atla.
 */
export async function webhookOlaylariniIsle(sb: SupabaseClient, o: ReturnType<typeof olaylariAyikla>): Promise<void> {
  const numaraDoktor = new Map<string, string | null>()
  for (const t of o.teslim) {
    if (!numaraDoktor.has(t.phoneNumberId)) {
      const { data } = await sb.from(TABLO).select('doctor_id').eq('phone_number_id', t.phoneNumberId).maybeSingle()
      numaraDoktor.set(t.phoneNumberId, (data as { doctor_id?: string } | null)?.doctor_id || null)
    }
    const doktorId = numaraDoktor.get(t.phoneNumberId)
    if (!doktorId) continue
    await sb.from(TESLIM_TABLOSU).upsert(
      { doctor_id: doktorId, mesaj_id: t.mesajId, durum: t.durum, hata_kodu: t.hataKodu, olay_zamani: t.zaman },
      { onConflict: 'mesaj_id,durum', ignoreDuplicates: true }
    )
  }
  for (const s of o.sablon) {
    if (!SABLON_KODLARI.includes(s.sablonAdi as SablonKodu)) continue
    const { data } = await sb.from(TABLO).select('doctor_id, sablon_durumlari').eq('waba_id', s.wabaId)
    for (const satir of (data || []) as Pick<BaglantiSatiri, 'doctor_id' | 'sablon_durumlari'>[]) {
      const d: SablonDurumlari = { ...(satir.sablon_durumlari || {}) }
      d[s.sablonAdi as SablonKodu] = { id: s.sablonId ?? d[s.sablonAdi as SablonKodu]?.id ?? null, durum: s.durum.toUpperCase(), guncellendi: new Date().toISOString() }
      await sablonlariGuncelle(sb, satir.doctor_id, d)
    }
  }
  // Doktor bağlantıyı uygulamadan kopardı: satır (ve şifreli anahtar) silinir; kart "bağlı değil"e döner.
  for (const wabaId of o.kaldirilanWabalar) {
    const { data } = await sb.from(TABLO).select('doctor_id').eq('waba_id', wabaId)
    for (const r of (data || []) as { doctor_id: string }[]) {
      await gunlukYaz(sb, { doktorId: r.doctor_id, yon: 'olay', tur: 'baglanti_kaldirildi', durum: 'olay', ayrinti: { neden: 'meta' } }).catch(() => undefined)
    }
    await sb.from(TABLO).delete().eq('waba_id', wabaId)
  }
}
