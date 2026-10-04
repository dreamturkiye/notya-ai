/**
 * NOTYA-RANDEVU-V2 PR2 — Google Takvim two-way sync (server; service-role client, every query scoped by doktor_id).
 *
 *   Notya → Google  confirmed appointments (durum 'onaylandi', from now − 1 day to + 90 days) are inserted/patched;
 *                   anything else that has an event (cancelled, moved out, deleted) loses it. Notya wins on its own
 *                   appointments: a re-push overwrites a Google-side edit once the doctor said "Yoksay".
 *   Google → Notya  incremental (syncToken; 410 → full resync). Other events → busy blocks (start/end only) that
 *                   feed the slot engine. One of OUR events moved or deleted in Google → a proposal
 *                   (randevu_takvim_onerileri), never applied silently.
 *   Push channel    events.watch, renewed a day before expiry; the webhook triggers an import. A cron tick
 *                   (randevu-v2) does the catch-up for every connected doctor in case a notification was missed.
 */
import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptPII } from '@/lib/security/encryption'
import { hastaAdiCoz, tabloYokMu } from '@/lib/iletisim/sunucu'
import { bildirimAdresi, erisimAl, googleTakvimHazirMi, iptalEt, takvimApi } from './istemci'
import { cakismaKarari, etkinlikBasligi, etkinlikKimligi, gelenEtkinlik, googleGovdesi, saklanirMi, type GoogleEtkinligi } from './donustur'
import { bekleyenIsleriIptal, cakismaHatasiMi, isEkle, olayYaz, RANDEVU_ALANLARI, type V2Randevu } from '../sunucu'
import { onayIsleri } from '../isPlani'

type Sb = SupabaseClient

export type Baglanti = {
  doktor_id: string
  adres: string | null
  refresh_token_encrypted: string
  takvim_id: string
  durum: 'bagli' | 'yenilenmeli'
  tam_ad: boolean
  sync_token: string | null
  sayfa_jetonu: string | null
  kanal_id: string | null
  kanal_kaynak_id: string | null
  kanal_jeton_hash: string | null
  kanal_bitis: string | null
  son_senk: string | null
  son_hata: string | null
}

const GUN = 86_400_000
const ileri = (simdi: number) => new Date(simdi + 90 * GUN).toISOString()
const geri = (simdi: number) => new Date(simdi - GUN).toISOString()

export async function baglantiGetir(sb: Sb, doktorId: string): Promise<Baglanti | null> {
  const { data, error } = await sb.from('google_takvim_baglantilari').select('*').eq('doktor_id', doktorId).maybeSingle()
  if (error || !data) return null
  return data as Baglanti
}

async function guncelle(sb: Sb, doktorId: string, alanlar: Partial<Baglanti>): Promise<void> {
  await sb.from('google_takvim_baglantilari').update({ ...alanlar, updated_at: new Date().toISOString() }).eq('doktor_id', doktorId)
    .then(() => undefined, () => undefined)
}

/** Fresh access token, or null (connection marked 'yenilenmeli' when Google revoked it). */
async function erisim(sb: Sb, b: Baglanti): Promise<string | null> {
  if (b.durum !== 'bagli' || !googleTakvimHazirMi()) return null
  let yenileme: string
  try { yenileme = decryptPII(b.refresh_token_encrypted) } catch {
    await guncelle(sb, b.doktor_id, { durum: 'yenilenmeli', son_hata: 'decrypt_failed' })
    return null
  }
  const e = await erisimAl(yenileme)
  if (e.ok) return e.jeton
  await guncelle(sb, b.doktor_id, e.iptal ? { durum: 'yenilenmeli', son_hata: e.hata } : { son_hata: e.hata })
  return null
}

async function hastaAdi(sb: Sb, doktorId: string, patientId: string | null): Promise<string> {
  if (!patientId) return ''
  const { data } = await sb.from('patients').select('name_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  return data ? hastaAdiCoz(data.name_encrypted) : ''
}

type Eslesme = { randevu_id: string; google_event_id: string; baslangic: string; bitis: string; durum: 'aktif' | 'silindi' }

async function eslesmeYaz(sb: Sb, doktorId: string, e: Eslesme): Promise<void> {
  await sb.from('randevu_google_eslesme').upsert({ ...e, doktor_id: doktorId, updated_at: new Date().toISOString() }, { onConflict: 'randevu_id' })
    .then(() => undefined, () => undefined)
}

/** Brings one appointment's Google event in line with Notya. Returns false on a Google error. */
async function birRandevu(sb: Sb, b: Baglanti, jeton: string, r: Pick<V2Randevu, 'id' | 'patient_id' | 'baslangic' | 'bitis' | 'durum'> | null, e: Eslesme | null, simdi: number, zorla = false): Promise<boolean> {
  const gonderilmeli = !!r && r.durum === 'onaylandi' && Date.parse(r.bitis) > simdi - GUN
  if (!gonderilmeli) {
    if (!e || e.durum !== 'aktif') return true
    // Mark first so the cancellation echo from Google is not read as "deleted in Google".
    await eslesmeYaz(sb, b.doktor_id, { ...e, durum: 'silindi' })
    const s = await takvimApi.sil(jeton, b.takvim_id, e.google_event_id)
    return s.durum < 300 || s.durum === 404 || s.durum === 410
  }
  if (!zorla && e && e.durum === 'aktif' && Date.parse(e.baslangic) === Date.parse(r!.baslangic) && Date.parse(e.bitis) === Date.parse(r!.bitis)) return true
  const govde = googleGovdesi(r!, etkinlikBasligi(await hastaAdi(sb, b.doktor_id, r!.patient_id), b.tam_ad))
  const yeniEslesme = (id: string): Eslesme => ({ randevu_id: r!.id, google_event_id: id, baslangic: r!.baslangic, bitis: r!.bitis, durum: 'aktif' })
  // Record before the call: the push's own echo then matches and is not mistaken for a Google-side move.
  if (e) {
    await eslesmeYaz(sb, b.doktor_id, yeniEslesme(e.google_event_id))
    const g = await takvimApi.guncelle(jeton, b.takvim_id, e.google_event_id, govde)
    if (g.durum < 300) return true
    if (g.durum !== 404 && g.durum !== 410) return false
  }
  const id = etkinlikKimligi(r!.id)
  await eslesmeYaz(sb, b.doktor_id, yeniEslesme(id))
  const ek = await takvimApi.ekle(jeton, b.takvim_id, { ...govde, id })
  if (ek.durum < 300) return true
  if (ek.durum === 409) {
    // Our id already exists (a retry, or an earlier event the doctor deleted): patch it back to life.
    const g = await takvimApi.guncelle(jeton, b.takvim_id, id, govde)
    return g.durum < 300
  }
  return false
}

/** Push every confirmed appointment in the window, and remove events whose appointment is no longer confirmed. */
export async function gonderimTara(sb: Sb, b: Baglanti, jeton: string, simdi: number, bitis: number): Promise<number> {
  const [rv, es] = await Promise.all([
    sb.from('randevular').select('id, patient_id, baslangic, bitis, durum').eq('doktor_id', b.doktor_id).eq('durum', 'onaylandi')
      .gt('bitis', geri(simdi)).lt('baslangic', ileri(simdi)).limit(2000),
    sb.from('randevu_google_eslesme').select('randevu_id, google_event_id, baslangic, bitis, durum').eq('doktor_id', b.doktor_id).eq('durum', 'aktif').limit(5000),
  ])
  if (rv.error || es.error) return 0
  const eslesmeler = new Map((es.data || []).map((e) => [String(e.randevu_id), e as Eslesme]))
  const randevular = (rv.data || []) as V2Randevu[]
  let n = 0
  for (const r of randevular) {
    if (Date.now() > bitis) break
    if (await birRandevu(sb, b, jeton, r, eslesmeler.get(r.id) || null, simdi)) n++
    eslesmeler.delete(r.id)
  }
  // Events whose appointment left the confirmed window: re-read the row (it may be cancelled, deleted or moved far).
  for (const e of Array.from(eslesmeler.values())) {
    if (Date.now() > bitis) break
    const { data: r } = await sb.from('randevular').select('id, patient_id, baslangic, bitis, durum').eq('id', e.randevu_id).eq('doktor_id', b.doktor_id).maybeSingle()
    if (r && r.durum === 'onaylandi' && Date.parse(r.baslangic) >= Date.parse(ileri(simdi))) continue // far future: keep
    if (await birRandevu(sb, b, jeton, (r as V2Randevu) || null, e, simdi)) n++
  }
  return n
}

/** Google → Notya, incremental. Busy blocks for foreign events; proposals for our own events edited in Google. */
export async function iceAktar(sb: Sb, b: Baglanti, jeton: string, simdi: number, bitis: number): Promise<{ islenen: number; oneri: number }> {
  let syncToken = b.sync_token
  let pageToken = b.sayfa_jetonu
  let islenen = 0
  let oneri = 0
  for (let tur = 0; tur < 20; tur++) {
    if (Date.now() > bitis) break
    const y = await takvimApi.listele(jeton, b.takvim_id, { syncToken: pageToken ? null : syncToken, pageToken })
    if (y.durum === 410) {
      // Sync token expired: full resync from scratch.
      await sb.from('randevu_dis_mesgul').delete().eq('doktor_id', b.doktor_id).then(() => undefined, () => undefined)
      await guncelle(sb, b.doktor_id, { sync_token: null, sayfa_jetonu: null })
      syncToken = null
      pageToken = null
      continue
    }
    if (y.durum >= 300) {
      await guncelle(sb, b.doktor_id, { son_hata: `list_http_${y.durum}` })
      break
    }
    if (!b.adres && typeof y.veri.summary === 'string') await guncelle(sb, b.doktor_id, { adres: y.veri.summary.slice(0, 200) })
    for (const ham of y.veri.items || []) {
      const g = gelenEtkinlik(ham as GoogleEtkinligi)
      islenen++
      if (g.tur === 'mesgul') {
        if (!saklanirMi(g.bas, g.son, simdi)) {
          await sb.from('randevu_dis_mesgul').delete().eq('doktor_id', b.doktor_id).eq('dis_id', g.disId).then(() => undefined, () => undefined)
          continue
        }
        await sb.from('randevu_dis_mesgul').upsert(
          { doktor_id: b.doktor_id, kaynak: 'google', dis_id: g.disId, baslangic: new Date(g.bas).toISOString(), bitis: new Date(g.son).toISOString(), updated_at: new Date().toISOString() },
          { onConflict: 'doktor_id,kaynak,dis_id' },
        ).then(() => undefined, () => undefined)
      } else if (g.tur === 'mesgul_sil') {
        await sb.from('randevu_dis_mesgul').delete().eq('doktor_id', b.doktor_id).eq('dis_id', g.disId).then(() => undefined, () => undefined)
      } else if (g.tur === 'notya') {
        // Only this doctor's own appointment ids are honoured (the property could be copied into another calendar).
        const { data: e } = await sb.from('randevu_google_eslesme').select('randevu_id, google_event_id, baslangic, bitis, durum')
          .eq('randevu_id', g.randevuId).eq('doktor_id', b.doktor_id).maybeSingle()
        const k = cakismaKarari(e as Eslesme | null, g)
        if (k.tur === 'yok') continue
        const satir = {
          doktor_id: b.doktor_id, randevu_id: g.randevuId, tur: k.tur,
          yeni_baslangic: k.tur === 'tasindi' ? new Date(k.bas).toISOString() : null,
          yeni_bitis: k.tur === 'tasindi' ? new Date(k.son).toISOString() : null,
          updated_at: new Date().toISOString(),
        }
        const { data: mevcut } = await sb.from('randevu_takvim_onerileri').select('id').eq('doktor_id', b.doktor_id).eq('randevu_id', g.randevuId).eq('durum', 'bekliyor').maybeSingle()
        const s = mevcut
          ? await sb.from('randevu_takvim_onerileri').update(satir).eq('id', mevcut.id).eq('doktor_id', b.doktor_id)
          : await sb.from('randevu_takvim_onerileri').insert({ ...satir, durum: 'bekliyor' })
        if (!s.error) {
          oneri++
          if (!mevcut) await olayYaz(sb, { randevuId: g.randevuId, doktorId: b.doktor_id, olay: `google_${k.tur}`, yapan: 'sistem' })
        }
      }
    }
    if (y.veri.nextPageToken) {
      pageToken = y.veri.nextPageToken
      await guncelle(sb, b.doktor_id, { sayfa_jetonu: pageToken })
      continue
    }
    await guncelle(sb, b.doktor_id, { sync_token: y.veri.nextSyncToken || syncToken, sayfa_jetonu: null, son_senk: new Date().toISOString(), son_hata: null })
    break
  }
  return { islenen, oneri }
}

export function jetonOzeti(jeton: string): string {
  return createHash('sha256').update(jeton).digest('hex')
}

export function ayniOzetMi(a: string | null | undefined, b: string): boolean {
  if (!a) return false
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Opens a push channel when there is none or it expires within a day; stops the old one. */
export async function kanalYenile(sb: Sb, b: Baglanti, jeton: string, simdi: number): Promise<boolean> {
  if (b.kanal_id && b.kanal_bitis && Date.parse(b.kanal_bitis) > simdi + GUN) return false
  const id = randomUUID()
  const gizli = randomBytes(24).toString('base64url')
  const y = await takvimApi.izle(jeton, b.takvim_id, { id, token: gizli, adres: bildirimAdresi() })
  if (y.durum >= 300 || !y.veri.resourceId) {
    await guncelle(sb, b.doktor_id, { son_hata: `watch_http_${y.durum}` })
    return false
  }
  if (b.kanal_id && b.kanal_kaynak_id) await takvimApi.durdur(jeton, { id: b.kanal_id, resourceId: b.kanal_kaynak_id }).catch(() => undefined)
  const son = Number(y.veri.expiration)
  await guncelle(sb, b.doktor_id, {
    kanal_id: id, kanal_kaynak_id: y.veri.resourceId, kanal_jeton_hash: jetonOzeti(gizli),
    kanal_bitis: new Date(Number.isFinite(son) && son > 0 ? son : simdi + 7 * GUN).toISOString(),
  })
  return true
}

export type SenkOzeti = { gonderilen: number; islenen: number; oneri: number; kanal: boolean; hata?: string }

export async function doktoruSenkle(sb: Sb, doktorId: string, o: { bitis: number; sadeceIce?: boolean; simdi?: number }): Promise<SenkOzeti> {
  const simdi = o.simdi ?? Date.now()
  const b = await baglantiGetir(sb, doktorId)
  if (!b) return { gonderilen: 0, islenen: 0, oneri: 0, kanal: false, hata: 'bagli_degil' }
  const jeton = await erisim(sb, b)
  if (!jeton) return { gonderilen: 0, islenen: 0, oneri: 0, kanal: false, hata: 'erisim_yok' }
  try {
    const gonderilen = o.sadeceIce ? 0 : await gonderimTara(sb, b, jeton, simdi, o.bitis)
    const ice = await iceAktar(sb, b, jeton, simdi, o.bitis)
    const kanal = o.sadeceIce ? false : await kanalYenile(sb, b, jeton, simdi)
    return { gonderilen, ...ice, kanal }
  } catch (e) {
    await guncelle(sb, doktorId, { son_hata: `senk: ${(e as Error).message}`.slice(0, 200) })
    return { gonderilen: 0, islenen: 0, oneri: 0, kanal: false, hata: 'beklenmeyen' }
  }
}

/** Cron catch-up for every connected doctor, within the time budget. */
export async function googleTara(sb: Sb, o: { bitis: number }): Promise<{ doktor: number }> {
  if (!googleTakvimHazirMi()) return { doktor: 0 }
  const { data, error } = await sb.from('google_takvim_baglantilari').select('doktor_id').eq('durum', 'bagli').order('son_senk', { ascending: true, nullsFirst: true }).limit(200)
  if (error || !data) return { doktor: 0 }
  let n = 0
  for (const d of data) {
    if (Date.now() > o.bitis) break
    await doktoruSenkle(sb, String(d.doktor_id), { bitis: o.bitis })
    n++
  }
  return { doktor: n }
}

/** Best-effort push right after a V2 change; never throws, never blocks the answer for long. */
export async function googleaGonder(sb: Sb, doktorId: string, randevuId: string, zorla = false): Promise<void> {
  try {
    if (!googleTakvimHazirMi()) return
    const b = await baglantiGetir(sb, doktorId)
    if (!b || b.durum !== 'bagli') return
    const jeton = await erisim(sb, b)
    if (!jeton) return
    const [{ data: r }, { data: e }] = await Promise.all([
      sb.from('randevular').select('id, patient_id, baslangic, bitis, durum').eq('id', randevuId).eq('doktor_id', doktorId).maybeSingle(),
      sb.from('randevu_google_eslesme').select('randevu_id, google_event_id, baslangic, bitis, durum').eq('randevu_id', randevuId).eq('doktor_id', doktorId).maybeSingle(),
    ])
    await birRandevu(sb, b, jeton, (r as V2Randevu) || null, (e as Eslesme) || null, Date.now(), zorla)
  } catch {
    /* the cron catch-up retries */
  }
}

export type OneriOzeti = { id: string; randevuId: string; tur: 'tasindi' | 'silindi'; eskiBaslangic: string | null; yeniBaslangic: string | null; yeniBitis: string | null }

export async function bekleyenOneriler(sb: Sb, doktorId: string): Promise<OneriOzeti[]> {
  const { data, error } = await sb.from('randevu_takvim_onerileri').select('id, randevu_id, tur, yeni_baslangic, yeni_bitis')
    .eq('doktor_id', doktorId).eq('durum', 'bekliyor').order('created_at', { ascending: true }).limit(50)
  if (error) return tabloYokMu(error) ? [] : []
  const ids = (data || []).map((x) => String(x.randevu_id))
  const eski = new Map<string, string>()
  if (ids.length) {
    const { data: r } = await sb.from('randevular').select('id, baslangic').eq('doktor_id', doktorId).in('id', ids)
    for (const x of r || []) eski.set(String(x.id), String(x.baslangic))
  }
  return (data || []).map((x) => ({
    id: String(x.id), randevuId: String(x.randevu_id), tur: x.tur as 'tasindi' | 'silindi',
    eskiBaslangic: eski.get(String(x.randevu_id)) || null, yeniBaslangic: x.yeni_baslangic, yeniBitis: x.yeni_bitis,
  }))
}

/**
 * The doctor's answer to a Google-side change of a Notya appointment.
 *   uygula  → Notya takes the Google change (move = new time, overlap-checked; delete = cancel), patient jobs re-planned.
 *   yoksay  → Notya wins: the event is pushed back as Notya has it.
 */
export async function oneriYanitla(sb: Sb, doktorId: string, oneriId: string, islem: 'uygula' | 'yoksay', yapanId: string): Promise<{ ok: true } | { ok: false; durum: number; hata: string }> {
  const { data: o } = await sb.from('randevu_takvim_onerileri').select('id, randevu_id, tur, yeni_baslangic, yeni_bitis, durum')
    .eq('id', oneriId).eq('doktor_id', doktorId).maybeSingle()
  if (!o || o.durum !== 'bekliyor') return { ok: false, durum: 404, hata: 'Öneri bulunamadı.' }
  const { data: r } = await sb.from('randevular').select(RANDEVU_ALANLARI).eq('id', o.randevu_id).eq('doktor_id', doktorId).maybeSingle()
  const kapat = (durum: 'uygulandi' | 'yoksayildi') =>
    sb.from('randevu_takvim_onerileri').update({ durum, updated_at: new Date().toISOString() }).eq('id', o.id).eq('doktor_id', doktorId)

  if (islem === 'uygula' && r) {
    const satir = r as unknown as V2Randevu
    if (o.tur === 'silindi') {
      const { error } = await sb.from('randevular').update({ durum: 'iptal', iptal_nedeni: 'Google Takvim’de silindi' }).eq('id', satir.id).eq('doktor_id', doktorId)
      if (error) return { ok: false, durum: 500, hata: 'Randevu güncellenemedi.' }
      await bekleyenIsleriIptal(sb, doktorId, satir.id)
      if (satir.patient_id) await isEkle(sb, satir, [{ tur: 'iptal_eposta', zaman: new Date().toISOString() }])
    } else {
      // Same overlap rule as the calendar (non-cancelled rows); a new-flow row is also guarded by migration 116.
      const { data: cak } = await sb.from('randevular').select('id').eq('doktor_id', doktorId).neq('durum', 'iptal').neq('id', satir.id)
        .lt('baslangic', o.yeni_bitis).gt('bitis', o.yeni_baslangic).limit(1)
      if (cak?.length) return { ok: false, durum: 409, hata: 'Google’daki yeni saat başka bir randevuyla çakışıyor.' }
      const { error } = await sb.from('randevular').update({ baslangic: o.yeni_baslangic, bitis: o.yeni_bitis, hatirlatma_gonderildi: false, hasta_teyit_at: null }).eq('id', satir.id).eq('doktor_id', doktorId)
      if (error) return cakismaHatasiMi(error) ? { ok: false, durum: 409, hata: 'Google’daki yeni saat başka bir randevuyla çakışıyor.' } : { ok: false, durum: 500, hata: 'Randevu güncellenemedi.' }
      await bekleyenIsleriIptal(sb, doktorId, satir.id)
      if (satir.durum === 'onaylandi' && satir.patient_id) await isEkle(sb, satir, onayIsleri(String(o.yeni_baslangic), Date.now()))
      // The event already shows the new time; record it as ours so it is not proposed again.
      await sb.from('randevu_google_eslesme').update({ baslangic: o.yeni_baslangic, bitis: o.yeni_bitis, updated_at: new Date().toISOString() })
        .eq('randevu_id', satir.id).eq('doktor_id', doktorId).then(() => undefined, () => undefined)
    }
    await kapat('uygulandi')
    await olayYaz(sb, { randevuId: satir.id, doktorId, olay: `google_${o.tur}_uygulandi`, yapan: 'doktor', yapanId })
    if (o.tur === 'silindi') await googleaGonder(sb, doktorId, satir.id)
    return { ok: true }
  }

  // yoksay (or the appointment is gone): Notya wins — push our version back.
  await kapat('yoksayildi')
  if (r) {
    // Forced: the stored mirror equals Notya's times while Google differs.
    await googleaGonder(sb, doktorId, String(o.randevu_id), true)
    await olayYaz(sb, { randevuId: String(o.randevu_id), doktorId, olay: `google_${o.tur}_yoksayildi`, yapan: 'doktor', yapanId })
  }
  return { ok: true }
}

/** Disconnect: remove our future events (best effort), stop the channel, revoke, forget everything Google-side. */
export async function baglantiyiKes(sb: Sb, doktorId: string): Promise<void> {
  const b = await baglantiGetir(sb, doktorId)
  if (!b) return
  const jeton = await erisim(sb, b).catch(() => null)
  if (jeton) {
    const { data: es } = await sb.from('randevu_google_eslesme').select('google_event_id, bitis').eq('doktor_id', doktorId).eq('durum', 'aktif').gt('bitis', new Date().toISOString()).limit(200)
    const son = Date.now() + 20_000
    for (const e of es || []) {
      if (Date.now() > son) break
      await takvimApi.sil(jeton, b.takvim_id, String(e.google_event_id)).catch(() => undefined)
    }
    if (b.kanal_id && b.kanal_kaynak_id) await takvimApi.durdur(jeton, { id: b.kanal_id, resourceId: b.kanal_kaynak_id }).catch(() => undefined)
  }
  try { await iptalEt(decryptPII(b.refresh_token_encrypted)) } catch { /* token unreadable: deleting it is the disconnect */ }
  await Promise.all([
    sb.from('randevu_dis_mesgul').delete().eq('doktor_id', doktorId),
    sb.from('randevu_google_eslesme').delete().eq('doktor_id', doktorId),
    sb.from('randevu_takvim_onerileri').update({ durum: 'yoksayildi' }).eq('doktor_id', doktorId).eq('durum', 'bekliyor'),
  ]).catch(() => undefined)
  await sb.from('google_takvim_baglantilari').delete().eq('doktor_id', doktorId)
}
