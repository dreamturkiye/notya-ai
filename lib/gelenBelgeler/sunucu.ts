/**
 * NOTYA-GELEN-BELGELER — server half of the inbox: add, list, file, delete, clean up. Service-role client;
 * EVERY query is scoped by the practice's doktorId (hasta-izolasyon). Callers: app/api/doktor/gelen-belgeler/*,
 * the kvkk-imha cron, and — in phases 2 and 3 — the email and WhatsApp capture (gelenBelgeEkle, see README.md).
 *
 * Storage: private bucket `hasta-belgeler`, objects under `<doktorId>/gelen/<item id>.<ext>`; the browser only
 * ever gets short-lived signed URLs. Filing copies the file into the patient's encrypted document vault
 * (lib/vault — the same place the Belgeler tab and the lab / analysis pipeline read from), writes the
 * hasta_belgeler summary row, records who filed it and from where, and removes the inbox copy.
 *
 * What is stored on the inbox row is minimal and encrypted: the reading (summary, transcript, the identity the
 * document printed) and the sender live in *_sifreli columns (lib/security/encryption). Plain columns carry only
 * the type, the source, hashes and ids of the doctor's own patients.
 *
 * Fails soft before migration 099: listing answers empty, adding answers { durum: 'hazir_degil' }.
 */
import { createHash, randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { encrypt, decrypt, hashTCKimlik } from '@/lib/security/encryption'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { aiKotaKullan } from '@/lib/doktor/hizLimiti'
import { belgeTuruIzinliMi, belgeTurleriIcinBrans } from '@/lib/doktor/belgeTurleri'
import { uploadDocument, VaultValidationError, VaultAccessError } from '@/lib/vault/service'
import { hazirla, BicimHatasi, VARSAYILAN_DONUSTURUCULER, type Donusturuculer, type GelenDosya } from './donustur'
import { belgeyiOku, bosOkuma } from './okuma'
import { hastaOner, duzle, tarihNormalle, type Aday } from './eslesme'
import { mimeUzantisi } from './bicim'
import {
  EN_BUYUK_BAYT, IMZALI_URL_SN, KOVA, SAKLAMA_GUN, kaynakMi,
  type Bicim, type GelenKaynak, type GelenOge, type Gonderen, type KayitliOneri, type Okuma,
} from './tipler'

export type Ekleyen = { userId: string | null; personelId: string | null }

export type EklemeSonucu =
  | { durum: 'eklendi'; id: string }
  | { durum: 'zaten_var'; id: string; dosyalandi: boolean }
  | { durum: 'hazir_degil' }
  | { durum: 'gecersiz'; hata: string }

export type EklemeBagimliliklari = {
  donusturucu?: Donusturuculer
  okuyucu?: typeof belgeyiOku
}

export const sha256 = (b: Buffer | string) => createHash('sha256').update(b).digest('hex')

/** Both forms a stored tc_kimlik_hash exists in (hasta kaydı: plain sha256; encryption.ts: peppered). */
export const tcHashleri = (tc: string) => [sha256(tc), hashTCKimlik(tc)]

function guvenliCoz(v: unknown): string {
  if (!v) return ''
  try { return decrypt(String(v)) } catch { return '' }
}
function adCoz(v: unknown): string {
  const ham = guvenliCoz(v)
  if (!ham) return ''
  try { return String(JSON.parse(ham).ad || '') } catch { return ham }
}
function jsonCoz<T>(v: unknown): T | null {
  const ham = guvenliCoz(v)
  if (!ham) return null
  try { return JSON.parse(ham) as T } catch { return null }
}

/** The doctor's own roster, decrypted on the server. Never leaves this process as a list. */
export async function hastaKadrosu(sb: SupabaseClient, doktorId: string): Promise<Aday[]> {
  const { data, error } = await sb.from('patients')
    .select('id, name_encrypted, dob_encrypted, tc_kimlik_hash, phone_encrypted, email_encrypted')
    .eq('doctor_id', doktorId)
    .limit(5000)
  if (error || !data) return []
  return data.map((p) => ({
    id: String(p.id),
    ad: adCoz(p.name_encrypted),
    dogum: tarihNormalle(guvenliCoz(p.dob_encrypted)) || null,
    tcHash: p.tc_kimlik_hash ? String(p.tc_kimlik_hash) : null,
    telefon: guvenliCoz(p.phone_encrypted) || null,
    eposta: guvenliCoz(p.email_encrypted) || null,
  }))
}

/**
 * THE entry point for every way a document arrives — web app now, email (phase 2) and WhatsApp (phase 3) later.
 * Duplicate bytes for the same doctor are shown once (sha256 of the original file).
 */
export async function gelenBelgeEkle(g: {
  doktorId: string
  kaynak: GelenKaynak
  dosya: GelenDosya
  gonderen?: Gonderen | null
  ekleyen?: Ekleyen
  supabase?: SupabaseClient
  bagimlilik?: EklemeBagimliliklari
}): Promise<EklemeSonucu> {
  const sb = g.supabase ?? servisSupabase()
  if (!g.doktorId || !kaynakMi(g.kaynak)) return { durum: 'gecersiz', hata: 'Eksik bilgi.' }
  if (!g.dosya?.bytes?.length) return { durum: 'gecersiz', hata: 'Dosya boş.' }
  if (g.dosya.bytes.length > EN_BUYUK_BAYT) return { durum: 'gecersiz', hata: 'Bu dosya çok büyük (en fazla 4 MB).' }

  const ozet = sha256(g.dosya.bytes)
  const { data: mevcut, error: mevcutHata } = await sb.from('gelen_belgeler')
    .select('id, durum')
    .eq('doctor_id', g.doktorId)
    .eq('sha256', ozet)
    .neq('durum', 'silindi')
    .limit(1)
    .maybeSingle()
  if (mevcutHata) return { durum: 'hazir_degil' }
  if (mevcut) return { durum: 'zaten_var', id: String(mevcut.id), dosyalandi: mevcut.durum === 'dosyalandi' }

  let h
  try { h = await hazirla(g.dosya, g.bagimlilik?.donusturucu ?? VARSAYILAN_DONUSTURUCULER) } catch (e) {
    if (e instanceof BicimHatasi) return { durum: 'gecersiz', hata: e.message }
    throw e
  }
  if (h.bytes.length > EN_BUYUK_BAYT) return { durum: 'gecersiz', hata: 'Bu dosya çok büyük (en fazla 4 MB).' }

  // Read it (daily quota; over the limit the item still arrives, just unread).
  let okuma: Okuma = bosOkuma(h.bicim, h.metin)
  if (h.okuma) {
    const kota = await aiKotaKullan(sb, g.doktorId, 'belge')
    if (kota.izin) okuma = await (g.bagimlilik?.okuyucu ?? belgeyiOku)(h.okuma, h.bicim, { doctorId: g.doktorId, metin: h.metin })
  }

  // Suggest the patient — this doctor's roster only.
  const kimlikVar = !!(okuma.kimlik.ad || okuma.kimlik.dogum || okuma.kimlik.tc || g.gonderen?.telefon || g.gonderen?.eposta)
  const oneriler: KayitliOneri[] = kimlikVar
    ? hastaOner({ kimlik: okuma.kimlik, gonderen: g.gonderen, adaylar: await hastaKadrosu(sb, g.doktorId), tcHashleri })
    : []

  const id = randomUUID()
  const yol = `${g.doktorId}/gelen/${id}.${mimeUzantisi(h.mime)}`
  const { error: yukHata } = await sb.storage.from(KOVA).upload(yol, h.bytes, { contentType: h.mime, upsert: false })
  if (yukHata) return { durum: 'gecersiz', hata: 'Dosya kaydedilemedi. Lütfen yeniden deneyin.' }

  const { error: ekHata } = await sb.from('gelen_belgeler').insert({
    id,
    doctor_id: g.doktorId,
    kaynak: g.kaynak,
    durum: 'yeni',
    dosya_adi: h.ad.slice(0, 200),
    mime: h.mime,
    bicim: h.bicim,
    boyut: h.bytes.length,
    sha256: ozet,
    depo_yolu: yol,
    belge_turu: okuma.belgeTuru,
    okundu: okuma.okundu,
    okuma_sifreli: encrypt(JSON.stringify(okuma)),
    gonderen_sifreli: g.gonderen && (g.gonderen.telefon || g.gonderen.eposta || g.gonderen.ad) ? encrypt(JSON.stringify(g.gonderen)) : null,
    oneriler,
    ekleyen_user_id: g.ekleyen?.userId ?? null,
    ekleyen_personel_id: g.ekleyen?.personelId ?? null,
  })
  if (ekHata) {
    try { await sb.storage.from(KOVA).remove([yol]) } catch { /* best effort */ }
    // Unique (doctor_id, sha256) race: the same file arrived twice at once — show the one that won.
    if (/duplicate|unique/i.test(ekHata.message || '')) {
      const { data: kazanan } = await sb.from('gelen_belgeler').select('id, durum').eq('doctor_id', g.doktorId).eq('sha256', ozet).neq('durum', 'silindi').limit(1).maybeSingle()
      if (kazanan) return { durum: 'zaten_var', id: String(kazanan.id), dosyalandi: kazanan.durum === 'dosyalandi' }
    }
    return { durum: 'hazir_degil' }
  }
  return { durum: 'eklendi', id }
}

/** "N yeni belge" — 0 before migration 099. */
export async function yeniSayisi(sb: SupabaseClient, doktorId: string): Promise<number> {
  const { count, error } = await sb.from('gelen_belgeler').select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId).eq('durum', 'yeni')
  return error ? 0 : count || 0
}

async function imzaliUrl(sb: SupabaseClient, yol: string | null): Promise<string | null> {
  if (!yol) return null
  try {
    const { data, error } = await sb.storage.from(KOVA).createSignedUrl(yol, IMZALI_URL_SN)
    return error ? null : data?.signedUrl ?? null
  } catch {
    return null
  }
}

function gonderenEtiketi(v: unknown): string | null {
  const g = jsonCoz<Gonderen>(v)
  if (!g) return null
  return g.ad || g.telefon || g.eposta || null
}

/** Unfiled items, newest first. Suggested patients are re-resolved with doctor_id — a stale id cannot surface a name. */
export async function gelenleriListele(sb: SupabaseClient, doktorId: string): Promise<{ ogeler: GelenOge[]; hazir: boolean }> {
  const { data, error } = await sb.from('gelen_belgeler')
    .select('*')
    .eq('doctor_id', doktorId)
    .eq('durum', 'yeni')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return { ogeler: [], hazir: false }
  const satirlar = data || []

  const hastaIdleri = [...new Set(satirlar.flatMap((r) => ((r.oneriler as KayitliOneri[] | null) || []).map((o) => String(o.patient_id))))]
  const hastalar = new Map<string, { ad: string; dogum: string | null }>()
  if (hastaIdleri.length) {
    const { data: ph } = await sb.from('patients').select('id, name_encrypted, dob_encrypted').eq('doctor_id', doktorId).in('id', hastaIdleri)
    for (const p of ph || []) hastalar.set(String(p.id), { ad: adCoz(p.name_encrypted), dogum: tarihNormalle(guvenliCoz(p.dob_encrypted)) })
  }

  const ogeler = await Promise.all(satirlar.map(async (r): Promise<GelenOge> => {
    const okuma = jsonCoz<Okuma>(r.okuma_sifreli) || bosOkuma(r.bicim as Bicim, null)
    const oneriler = ((r.oneriler as KayitliOneri[] | null) || [])
      .filter((o) => hastalar.has(String(o.patient_id)))
      .map((o) => ({ patientId: String(o.patient_id), ad: hastalar.get(String(o.patient_id))!.ad, dogum: hastalar.get(String(o.patient_id))!.dogum, guven: Number(o.guven) || 0, kesinlik: o.kesinlik === 'eminim' ? 'eminim' as const : 'kontrol' as const }))
    return {
      id: String(r.id),
      kaynak: r.kaynak,
      durum: r.durum,
      dosyaAdi: String(r.dosya_adi || 'Belge'),
      bicim: r.bicim as Bicim,
      mime: String(r.mime || ''),
      boyut: Number(r.boyut) || 0,
      tarih: String(r.created_at),
      belgeTuru: String(r.belge_turu || okuma.belgeTuru || 'Diğer'),
      ozet: okuma.ozet,
      metin: okuma.metin ? okuma.metin.slice(0, 1200) : null,
      okundu: okuma.okundu,
      oneriler,
      url: await imzaliUrl(sb, r.depo_yolu ? String(r.depo_yolu) : null),
      gonderen: gonderenEtiketi(r.gonderen_sifreli),
    }
  }))
  return { ogeler, hazir: true }
}

/** "Başka hasta seç": up to 8 of the doctor's own patients by name. */
export async function hastaAra(sb: SupabaseClient, doktorId: string, sorgu: string): Promise<{ id: string; ad: string; dogum: string | null }[]> {
  const q = duzle(sorgu)
  if (q.length < 2) return []
  const kadro = await hastaKadrosu(sb, doktorId)
  const parca = q.split(' ')
  return kadro
    .filter((h) => { const d = duzle(h.ad); return parca.every((p) => d.includes(p)) })
    .sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))
    .slice(0, 8)
    .map((h) => ({ id: h.id, ad: h.ad, dogum: h.dogum }))
}

export type Isleyen = { userId: string; personelId: string | null; rol: 'doktor' | 'sekreter' }

export type DosyalamaSonucu =
  | { ok: true; belgeId: string; patientId: string; belgeTuru: string }
  | { ok: false; durum: number; hata: string }

const OGE_YOK: DosyalamaSonucu = { ok: false, durum: 404, hata: 'Belge bulunamadı.' }

async function yeniOge(sb: SupabaseClient, doktorId: string, id: unknown) {
  if (typeof id !== 'string' || !id) return null
  const { data } = await sb.from('gelen_belgeler').select('*').eq('id', id).eq('doctor_id', doktorId).eq('durum', 'yeni').maybeSingle()
  return data
}

/** "Dosyaya ekle". */
export async function dosyala(sb: SupabaseClient, g: {
  doktorId: string; id: unknown; patientId: unknown; belgeTuru?: unknown; isleyen: Isleyen; brans: string | null
}): Promise<DosyalamaSonucu> {
  const r = await yeniOge(sb, g.doktorId, g.id)
  if (!r) return OGE_YOK
  const patientId = typeof g.patientId === 'string' ? g.patientId : ''
  if (!(await hastaSahibiMi(sb, g.doktorId, patientId))) return { ok: false, durum: 404, hata: 'Hasta bulunamadı.' }

  let tur = String(r.belge_turu || 'Diğer')
  if (typeof g.belgeTuru === 'string' && g.belgeTuru.trim()) {
    const secilen = g.belgeTuru.trim()
    // BRANŞ-ALAN-SIZMASI: only the types this doctor's branş offers (Yenidoğan Taburculuk Epikrizi = pediatri / KD).
    if (!belgeTurleriIcinBrans(g.brans).includes(secilen) || !belgeTuruIzinliMi(secilen, g.brans)) {
      return { ok: false, durum: 400, hata: 'Bu belge türü branşınız için kullanılamaz.' }
    }
    tur = secilen
  }

  const yol = r.depo_yolu ? String(r.depo_yolu) : ''
  const { data: blob, error: indirHata } = yol ? await sb.storage.from(KOVA).download(yol) : { data: null, error: { message: 'yol yok' } }
  if (indirHata || !blob) return { ok: false, durum: 410, hata: 'Dosya artık bulunamıyor. Lütfen belgeyi yeniden ekleyin.' }
  const bytes = typeof (blob as Blob).arrayBuffer === 'function' ? Buffer.from(await (blob as Blob).arrayBuffer()) : Buffer.from(blob as unknown as Uint8Array)

  const okuma = jsonCoz<Okuma>(r.okuma_sifreli)
  const notParca = [okuma?.ozet || null]
  if (r.bicim === 'ses' && okuma?.metin) notParca.push(`Sesli mesajın yazıya dökülmüş hali:\n${okuma.metin}`)
  const notlar = notParca.filter(Boolean).join('\n\n').slice(0, 4000) || null

  let belgeId: string
  try {
    const meta = await uploadDocument({ supabase: sb }, {
      doctorId: g.doktorId, patientId, visitId: null,
      fileName: String(r.dosya_adi || 'belge'), fileType: String(r.mime), bytes,
      notes: notlar, category: tur, uploadedBy: g.isleyen.userId,
    })
    belgeId = meta.id
  } catch (e) {
    if (e instanceof VaultValidationError) return { ok: false, durum: 400, hata: e.message }
    if (e instanceof VaultAccessError) return { ok: false, durum: 404, hata: 'Hasta bulunamadı.' }
    return { ok: false, durum: 500, hata: 'Belge dosyaya eklenemedi. Lütfen yeniden deneyin.' }
  }

  const simdi = new Date().toISOString()
  // The hasta_belgeler summary row (the patient file's AI context reads it). Reference, not a URL: bytes are in the vault.
  try {
    await sb.from('hasta_belgeler').insert({
      doctor_id: g.doktorId, patient_id: patientId, belge_turu: tur, dosya_url: `kasa:${belgeId}`,
      ai_ozet: { ozet: okuma?.ozet || tur, kaynak: 'gelen_belgeler', medical_document_id: belgeId, ...(okuma?.belgeTarihi ? { tarih: okuma.belgeTarihi } : {}) },
      inceleme_bekliyor: true,
    })
  } catch { /* the vault copy is what matters */ }

  const { error: gunHata } = await sb.from('gelen_belgeler').update({
    durum: 'dosyalandi', patient_id: patientId, medical_document_id: belgeId, belge_turu: tur,
    dosyalayan_user_id: g.isleyen.userId, dosyalayan_personel_id: g.isleyen.personelId, dosyalandi_at: simdi,
    depo_yolu: null, okuma_sifreli: null, updated_at: simdi,
  }).eq('id', String(r.id)).eq('doctor_id', g.doktorId)
  if (gunHata) console.error('[gelen-belgeler] dosyalandı işareti', gunHata.message)
  try { await sb.storage.from(KOVA).remove([yol]) } catch { /* the cron sweeps leftovers */ }

  // Audit (KVKK md. 12): who filed which item into which patient file, when, from which source.
  try {
    await sb.from('audit_logs').insert({
      user_id: g.doktorId, action: 'create', resource_type: 'gelen_belge', resource_id: String(r.id),
      new_values: { islem: 'dosyalandi', kaynak: r.kaynak, patient_id: patientId, medical_document_id: belgeId, belge_turu: tur, isleyen_user_id: g.isleyen.userId, isleyen_personel_id: g.isleyen.personelId, rol: g.isleyen.rol, zaman: simdi },
    })
  } catch { /* audit write never blocks filing; the row itself carries who/when/source */ }

  return { ok: true, belgeId, patientId, belgeTuru: tur }
}

/** "Sil": the file goes now; the row stays without content (who deleted, when) until the cron removes it. */
export async function sil(sb: SupabaseClient, g: { doktorId: string; id: unknown; isleyen: Isleyen }): Promise<{ ok: boolean }> {
  const r = await yeniOge(sb, g.doktorId, g.id)
  if (!r) return { ok: false }
  if (r.depo_yolu) { try { await sb.storage.from(KOVA).remove([String(r.depo_yolu)]) } catch { /* cron sweeps */ } }
  const simdi = new Date().toISOString()
  const { error } = await sb.from('gelen_belgeler').update({
    durum: 'silindi', depo_yolu: null, okuma_sifreli: null, gonderen_sifreli: null, oneriler: [],
    silen_user_id: g.isleyen.userId, silen_personel_id: g.isleyen.personelId, silindi_at: simdi, updated_at: simdi,
  }).eq('id', String(r.id)).eq('doctor_id', g.doktorId)
  return { ok: !error }
}

/** Daily (kvkk-imha): unfiled items older than 30 days are destroyed with their files; deleted rows too. */
export async function gelenleriTemizle(sb: SupabaseClient, simdi: Date = new Date()): Promise<{ silinen: number; hata?: string }> {
  const esik = new Date(simdi.getTime() - SAKLAMA_GUN * 86400e3).toISOString()
  const { data, error } = await sb.from('gelen_belgeler').select('id, depo_yolu').eq('durum', 'yeni').lt('created_at', esik).limit(1000)
  if (error) return { silinen: 0, hata: error.message }
  const yollar = (data || []).map((r) => r.depo_yolu).filter((y): y is string => !!y)
  for (let i = 0; i < yollar.length; i += 100) {
    try { await sb.storage.from(KOVA).remove(yollar.slice(i, i + 100)) } catch { /* next run retries the rows below */ }
  }
  const idler = (data || []).map((r) => String(r.id))
  let silinen = 0
  if (idler.length) {
    const { data: s } = await sb.from('gelen_belgeler').delete().in('id', idler).select('id')
    silinen += s?.length || 0
  }
  const { data: s2 } = await sb.from('gelen_belgeler').delete().eq('durum', 'silindi').lt('silindi_at', esik).select('id')
  silinen += s2?.length || 0
  return { silinen }
}
