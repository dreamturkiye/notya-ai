/**
 * NOTYA-ILETISIM-03 — doktor_whatsapp_baglantilari erişimi (service-role; her sorgu doctor_id ile kapsanır).
 * Anahtar yalnız burada çözülür ve yalnız sunucuda kullanılır; `BaglantiGorunumu` tarayıcıya giden
 * tek şekildir ve anahtar/kimlik içermez.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptPII, decryptPII } from '@/lib/security/encryption'
import { SABLON_KODLARI, type SablonDurumlari, type SablonKodu } from './sablonlar'
import type { olaylariAyikla } from './webhook'

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
}

export interface Baglanti {
  doktorId: string
  wabaId: string
  phoneNumberId: string
  gorunenNumara: string | null
  token: string
  sablonlar: SablonDurumlari
}

export async function baglantiOku(sb: SupabaseClient, doktorId: string): Promise<Baglanti | null> {
  const { data } = await sb
    .from(TABLO)
    .select('doctor_id, waba_id, phone_number_id, gorunen_numara, token_encrypted, sablon_durumlari, durum')
    .eq('doctor_id', doktorId)
    .eq('durum', 'bagli')
    .maybeSingle()
  const s = data as BaglantiSatiri | null
  if (!s?.token_encrypted) return null
  let token = ''
  try { token = decryptPII(s.token_encrypted) } catch { return null }
  if (!token) return null
  return { doktorId: s.doctor_id, wabaId: s.waba_id, phoneNumberId: s.phone_number_id, gorunenNumara: s.gorunen_numara, token, sablonlar: s.sablon_durumlari || {} }
}

export async function baglantiKaydet(
  sb: SupabaseClient,
  g: { doktorId: string; businessId: string | null; wabaId: string; phoneNumberId: string; gorunenNumara: string | null; gorunenAd: string | null; token: string; sablonlar: SablonDurumlari }
): Promise<{ ok: true } | { ok: false; hata: string }> {
  const simdi = new Date().toISOString()
  const { error } = await sb.from(TABLO).upsert(
    {
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
    },
    { onConflict: 'doctor_id' }
  )
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
    await sb.from(TABLO).delete().eq('waba_id', wabaId)
  }
}
