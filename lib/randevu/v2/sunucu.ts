/**
 * NOTYA-RANDEVU-V2 — server operations (service-role client; every read and write scoped by doktor_id, and
 * patient-side operations additionally by patient_id). Called by:
 *   • the portal route   app/api/portal/hasta/[token]/randevu      (patient, token's doctor + patient)
 *   • the e-mail links   app/api/randevu/eylem                       (one signed appointment)
 *   • the practice route app/api/doktor/randevu-portal/talepler      (doktor + sekreter, pratikOturum)
 *   • the cron           app/api/cron/randevu-v2                     (jobs + escalation)
 * Fail-soft until migration 116 is applied: settings read as OFF, so nothing here is reachable.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { RESMI_TATILLER_2026 } from '@/lib/randevu/resmiTatiller'
import { doktorIletisimAyari, hastaAdiCoz, hastaIletisimi, tabloYokMu, type DoktorIletisimAyari } from '@/lib/iletisim/sunucu'
import { sessizSaatMi } from '@/lib/iletisim/otomatikGonderim'
import { siteAdresi } from '@/lib/iletisim/otomatik/eposta/ayar'
import { VARSAYILAN_AYAR, ayarNormalize, portalTuruMu, type PortalRandevuAyari } from './ayar'
import { bosSlotlar, slotUygunMu, type Aralik, type CalismaSaatleri, type Slot, type SlotGirdisi } from './slot'
import { aktifMi, eskalasyonGerekliMi, hastaIzinleri, oneriBekliyorMu, onayGerekirMi, v2Durum, V2_ETIKET, type HastaIzinleri, type V2Durum } from './durum'
import { DAKIKA_MS, GUN_MS, gunEtiketi, saatEtiketi } from './zaman'
import { disMesgulBloklari } from './disMesgul'
import { hatirlatmaZamanlari, isGecerliMi, onayIsleri } from './isPlani'
import { bekleyenIsleriIptal, cakismaHatasiMi, isEkle } from './isler'

export { bekleyenIsleriIptal, cakismaHatasiMi, isEkle }
import { randevuEpostasi, type RandevuEpostaTuru } from './eposta'
import { jetonSonu, randevuJetonu, type JetonEylemi } from './jeton'
import { randevuIcs } from './ics'
import { randevuKanallari, type KanalSonucu, type RandevuKanali } from './kanal'

type Sb = SupabaseClient

export const RANDEVU_ALANLARI =
  'id, doktor_id, patient_id, baslangic, bitis, tur, durum, kaynak, talep_at, oneri_at, hasta_teyit_at, eskalasyon_at, iptal_nedeni, hatirlatma_gonderildi'

export type V2Randevu = {
  id: string
  doktor_id: string
  patient_id: string | null
  baslangic: string
  bitis: string
  tur: string
  durum: string
  kaynak: string | null
  talep_at: string | null
  oneri_at: string | null
  hasta_teyit_at: string | null
  eskalasyon_at: string | null
  iptal_nedeni: string | null
  hatirlatma_gonderildi: boolean | null
}

export type Islem<T = V2Randevu> = { ok: true; randevu: T } | { ok: false; durum: number; hata: string }

export const MESAJ = {
  kapali: 'Online randevu şu an kapalı.',
  tur: 'Bu randevu türü online alınamıyor.',
  dolu: 'Bu saat artık uygun değil. Lütfen başka bir saat seçin.',
  yok: 'Randevu bulunamadı.',
  yanitlandi: 'Bu talep zaten yanıtlandı.',
  hata: 'İşlem şu an yapılamadı. Lütfen biraz sonra tekrar deneyin.',
  saat: 'Lütfen bir saat seçin.',
  cokTalep: 'Yanıt bekleyen randevu talepleriniz var. Lütfen önce onların sonucunu bekleyin.',
} as const

/** A patient may hold at most this many unanswered requests with one doctor (each one holds a slot). */
export const EN_FAZLA_ACIK_TALEP = 3

const hata = (durum: number, h: string): Islem<never> => ({ ok: false, durum, hata: h })

// ── Settings and inputs ──────────────────────────────────────────────────────────────────────────────

export async function ayarGetir(sb: Sb, doktorId: string): Promise<PortalRandevuAyari> {
  const { data, error } = await sb.from('randevu_portal_ayarlari').select('*').eq('doktor_id', doktorId).maybeSingle()
  if (error || !data) return { ...VARSAYILAN_AYAR, turler: { ...VARSAYILAN_AYAR.turler } }
  return ayarNormalize(data)
}

/** Same default the 008 migration writes — read only, never inserted from the patient side. */
const VARSAYILAN_CALISMA: CalismaSaatleri = {
  '0': { acik: false, baslangic: '09:00', bitis: '18:00' },
  '1': { acik: true, baslangic: '09:00', bitis: '18:00' },
  '2': { acik: true, baslangic: '09:00', bitis: '18:00' },
  '3': { acik: true, baslangic: '09:00', bitis: '18:00' },
  '4': { acik: true, baslangic: '09:00', bitis: '18:00' },
  '5': { acik: true, baslangic: '09:00', bitis: '18:00' },
  '6': { acik: false, baslangic: '09:00', bitis: '18:00' },
}

export async function calismaSaatleriGetir(sb: Sb, doktorId: string): Promise<{ gunler: CalismaSaatleri; slotDakika: number }> {
  const { data } = await sb.from('doktor_calisma_saatleri').select('gunler, slot_dakika').eq('doktor_id', doktorId).maybeSingle()
  const gunler = data?.gunler && typeof data.gunler === 'object' ? (data.gunler as CalismaSaatleri) : VARSAYILAN_CALISMA
  return { gunler, slotDakika: Number(data?.slot_dakika) > 0 ? Number(data?.slot_dakika) : 20 }
}

/** Everything the slot engine needs. null when a busy-time read failed — never treat that as "free". */
export async function slotGirdisi(
  sb: Sb,
  doktorId: string,
  ayar: PortalRandevuAyari,
  sureDk: number,
  simdi: number,
  haricRandevuId?: string | null,
): Promise<SlotGirdisi | null> {
  const son = simdi + (ayar.maxIleriGun + 1) * GUN_MS
  const [cs, rv, ist, dis] = await Promise.all([
    calismaSaatleriGetir(sb, doktorId),
    sb.from('randevular').select('id, baslangic, bitis').eq('doktor_id', doktorId).neq('durum', 'iptal')
      .lt('baslangic', new Date(son).toISOString()).gt('bitis', new Date(simdi - GUN_MS).toISOString()).limit(5000),
    sb.from('randevu_istisnalari').select('baslangic, bitis').eq('doktor_id', doktorId)
      .lt('baslangic', new Date(son).toISOString()).gt('bitis', new Date(simdi).toISOString()).limit(1000),
    disMesgulBloklari(sb, doktorId, simdi, son),
  ])
  if (rv.error) return null
  if (ist.error && !tabloYokMu(ist.error)) return null
  const aralik = (x: { baslangic: string; bitis: string }): Aralik => ({ bas: Date.parse(x.baslangic), son: Date.parse(x.bitis) })
  return {
    calismaSaatleri: cs.gunler,
    adimDk: cs.slotDakika,
    sureDk,
    tamponDk: ayar.tamponDk,
    minBildirimDk: ayar.minBildirimSaat * 60,
    maxIleriGun: ayar.maxIleriGun,
    simdi,
    istisnalar: (ist.data || []).map(aralik),
    mesgul: [...(rv.data || []).filter((r) => r.id !== haricRandevuId).map(aralik), ...dis],
    resmiTatiller: RESMI_TATILLER_2026,
  }
}

export async function musaitSlotlar(sb: Sb, doktorId: string, ayar: PortalRandevuAyari, sureDk: number, simdi: number, haricId?: string | null): Promise<Slot[] | null> {
  const g = await slotGirdisi(sb, doktorId, ayar, sureDk, simdi, haricId)
  return g ? bosSlotlar(g) : null
}

function sureDk(r: Pick<V2Randevu, 'baslangic' | 'bitis'>): number {
  return Math.max(5, Math.round((Date.parse(r.bitis) - Date.parse(r.baslangic)) / DAKIKA_MS))
}

/** "Existing patient" for auto-confirm = at least one completed visit with this doctor. */
export async function mevcutHastaMi(sb: Sb, doktorId: string, patientId: string): Promise<boolean> {
  const { data } = await sb.from('randevular').select('id').eq('doktor_id', doktorId).eq('patient_id', patientId).eq('durum', 'tamamlandi').limit(1)
  return !!data?.length
}

// ── Event log and jobs ───────────────────────────────────────────────────────────────────────────────

export type Yapan = 'hasta' | 'doktor' | 'sekreter' | 'sistem'

export async function olayYaz(sb: Sb, o: { randevuId: string; doktorId: string; olay: string; yapan: Yapan; yapanId?: string | null; detay?: Record<string, unknown> }): Promise<void> {
  await sb.from('randevu_olaylari').insert({
    randevu_id: o.randevuId,
    doktor_id: o.doktorId,
    olay: o.olay,
    yapan: o.yapan,
    yapan_id: o.yapanId ?? null,
    detay: o.detay ?? {},
  }).then(() => undefined, () => undefined)
}

async function satirGetir(sb: Sb, doktorId: string, randevuId: string, patientId?: string): Promise<V2Randevu | null> {
  let q = sb.from('randevular').select(RANDEVU_ALANLARI).eq('id', randevuId).eq('doktor_id', doktorId)
  if (patientId) q = q.eq('patient_id', patientId)
  const { data, error } = await q.maybeSingle()
  if (error || !data) return null
  return data as unknown as V2Randevu
}

async function kosulluGuncelle(sb: Sb, r: V2Randevu, alanlar: Record<string, unknown>): Promise<Islem> {
  const { data, error } = await sb.from('randevular').update(alanlar)
    .eq('id', r.id).eq('doktor_id', r.doktor_id).eq('durum', r.durum)
    .select(RANDEVU_ALANLARI)
  if (error) return cakismaHatasiMi(error) ? hata(409, MESAJ.dolu) : hata(500, MESAJ.hata)
  const satir = (data || [])[0] as unknown as V2Randevu | undefined
  if (!satir) return hata(409, MESAJ.yanitlandi)
  return { ok: true, randevu: satir }
}

// ── Patient: request ─────────────────────────────────────────────────────────────────────────────────

export async function talepOlustur(sb: Sb, g: { doktorId: string; patientId: string; tur: string; baslangic: string; simdi?: number }): Promise<Islem> {
  const simdi = g.simdi ?? Date.now()
  const ayar = await ayarGetir(sb, g.doktorId)
  if (!ayar.acik) return hata(403, MESAJ.kapali)
  if (!portalTuruMu(g.tur) || !ayar.turler[g.tur].acik) return hata(400, MESAJ.tur)
  if (!g.baslangic) return hata(400, MESAJ.saat)

  const { data: acik, error: acikHata } = await sb.from('randevular').select('id')
    .eq('doktor_id', g.doktorId).eq('patient_id', g.patientId).eq('durum', 'talep')
    .gt('baslangic', new Date(simdi).toISOString()).limit(EN_FAZLA_ACIK_TALEP)
  if (acikHata) return hata(500, MESAJ.hata)
  if ((acik || []).length >= EN_FAZLA_ACIK_TALEP) return hata(429, MESAJ.cokTalep)

  const girdi = await slotGirdisi(sb, g.doktorId, ayar, ayar.turler[g.tur].sure, simdi)
  if (!girdi) return hata(500, MESAJ.hata)
  const slot = slotUygunMu(girdi, g.baslangic)
  if (!slot) return hata(409, MESAJ.dolu)

  const onay = onayGerekirMi(ayar, await mevcutHastaMi(sb, g.doktorId, g.patientId))
  const { data, error } = await sb.from('randevular').insert({
    doktor_id: g.doktorId,
    patient_id: g.patientId,
    baslangic: slot.bas,
    bitis: slot.son,
    tur: g.tur,
    durum: onay ? 'talep' : 'onaylandi',
    kaynak: 'portal',
    talep_at: new Date(simdi).toISOString(),
  }).select(RANDEVU_ALANLARI).single()
  if (error || !data) return cakismaHatasiMi(error) ? hata(409, MESAJ.dolu) : hata(500, MESAJ.hata)
  const r = data as unknown as V2Randevu
  await olayYaz(sb, { randevuId: r.id, doktorId: g.doktorId, olay: onay ? 'talep' : 'otomatik_onay', yapan: 'hasta', detay: { baslangic: r.baslangic, tur: r.tur } })
  if (!onay) await isEkle(sb, r, onayIsleri(r.baslangic, simdi))
  return { ok: true, randevu: r }
}

// ── Practice: answer a request ───────────────────────────────────────────────────────────────────────

export type PratikIslemi = 'onayla' | 'oner' | 'reddet'

export async function pratikIslem(sb: Sb, g: { doktorId: string; randevuId: string; islem: PratikIslemi; baslangic?: string; yapan: 'doktor' | 'sekreter'; yapanId: string; simdi?: number }): Promise<Islem> {
  const simdi = g.simdi ?? Date.now()
  const r = await satirGetir(sb, g.doktorId, g.randevuId)
  if (!r) return hata(404, MESAJ.yok)
  if (r.durum !== 'talep') return hata(409, MESAJ.yanitlandi)

  if (g.islem === 'onayla') {
    const s = await kosulluGuncelle(sb, r, { oneri_at: null, durum: 'onaylandi' })
    if (!s.ok) return s
    await bekleyenIsleriIptal(sb, g.doktorId, r.id)
    await isEkle(sb, s.randevu, onayIsleri(s.randevu.baslangic, simdi))
    await olayYaz(sb, { randevuId: r.id, doktorId: g.doktorId, olay: 'onaylandi', yapan: g.yapan, yapanId: g.yapanId })
    return s
  }

  if (g.islem === 'reddet') {
    const s = await kosulluGuncelle(sb, r, { durum: 'iptal', iptal_nedeni: 'Talep karşılanamadı' })
    if (!s.ok) return s
    await bekleyenIsleriIptal(sb, g.doktorId, r.id)
    await isEkle(sb, s.randevu, [{ tur: 'red_eposta', zaman: new Date(simdi).toISOString() }])
    await olayYaz(sb, { randevuId: r.id, doktorId: g.doktorId, olay: 'reddedildi', yapan: g.yapan, yapanId: g.yapanId })
    return s
  }

  // 'oner' — the practice moves the request to another free time; it stays a request until the patient accepts.
  if (!g.baslangic) return hata(400, MESAJ.saat)
  const ayar = await ayarGetir(sb, g.doktorId)
  const girdi = await slotGirdisi(sb, g.doktorId, ayar, sureDk(r), simdi, r.id)
  if (!girdi) return hata(500, MESAJ.hata)
  // The practice may propose inside its own notice window (it is answering now), but never outside hours.
  const slot = slotUygunMu({ ...girdi, minBildirimDk: 0 }, g.baslangic)
  if (!slot) return hata(409, MESAJ.dolu)
  const s = await kosulluGuncelle(sb, r, { baslangic: slot.bas, bitis: slot.son, oneri_at: new Date(simdi).toISOString() })
  if (!s.ok) return s
  await bekleyenIsleriIptal(sb, g.doktorId, r.id)
  await isEkle(sb, s.randevu, [{ tur: 'oneri_eposta', zaman: new Date(simdi).toISOString() }])
  await olayYaz(sb, { randevuId: r.id, doktorId: g.doktorId, olay: 'oneri', yapan: g.yapan, yapanId: g.yapanId, detay: { eski: r.baslangic, yeni: slot.bas } })
  return s
}

// ── Patient: act on own appointment ──────────────────────────────────────────────────────────────────

export type HastaIslemi = 'iptal' | 'ertele' | 'teyit' | 'kabul'

export async function hastaIslem(sb: Sb, g: { doktorId: string; patientId: string; randevuId: string; islem: HastaIslemi; baslangic?: string; kanal: 'portal' | 'eposta'; simdi?: number }): Promise<Islem> {
  const simdi = g.simdi ?? Date.now()
  const ayar = await ayarGetir(sb, g.doktorId)
  if (!ayar.acik) return hata(403, MESAJ.kapali)
  const r = await satirGetir(sb, g.doktorId, g.randevuId, g.patientId)
  if (!r) return hata(404, MESAJ.yok)
  const izin = hastaIzinleri(r, ayar, simdi)
  const detay = { kanal: g.kanal }

  if (g.islem === 'teyit') {
    if (r.durum === 'onaylandi' && r.hasta_teyit_at) return { ok: true, randevu: r }
    if (!izin.teyit) return hata(409, izin.neden || 'Bu randevu için teyit gerekmiyor.')
    const s = await kosulluGuncelle(sb, r, { hasta_teyit_at: new Date(simdi).toISOString() })
    if (s.ok) await olayYaz(sb, { randevuId: r.id, doktorId: g.doktorId, olay: 'teyit', yapan: 'hasta', detay })
    return s
  }

  if (g.islem === 'kabul') {
    if (r.durum === 'onaylandi') return { ok: true, randevu: r }
    if (!oneriBekliyorMu(r) || !(Date.parse(r.baslangic) > simdi)) return hata(409, 'Bu öneri artık geçerli değil.')
    const s = await kosulluGuncelle(sb, r, { durum: 'onaylandi', oneri_at: null })
    if (!s.ok) return s
    await bekleyenIsleriIptal(sb, g.doktorId, r.id)
    await isEkle(sb, s.randevu, onayIsleri(s.randevu.baslangic, simdi))
    await olayYaz(sb, { randevuId: r.id, doktorId: g.doktorId, olay: 'oneri_kabul', yapan: 'hasta', detay })
    return s
  }

  if (g.islem === 'iptal') {
    if (r.durum === 'iptal') return { ok: true, randevu: r }
    if (!izin.iptal) return hata(409, izin.neden || 'Bu randevu iptal edilemez.')
    const s = await kosulluGuncelle(sb, r, { durum: 'iptal', iptal_nedeni: r.oneri_at ? 'Hasta öneriyi kabul etmedi' : 'Hasta iptal etti' })
    if (!s.ok) return s
    await bekleyenIsleriIptal(sb, g.doktorId, r.id)
    await isEkle(sb, s.randevu, [{ tur: 'iptal_eposta', zaman: new Date(simdi).toISOString() }])
    await olayYaz(sb, { randevuId: r.id, doktorId: g.doktorId, olay: 'iptal', yapan: 'hasta', detay })
    return s
  }

  // 'ertele' — move to another free slot of the same length; the approval mode decides whether it is a request again.
  if (!izin.ertele) return hata(409, izin.neden || 'Bu randevu ertelenemez.')
  if (!g.baslangic) return hata(400, MESAJ.saat)
  const girdi = await slotGirdisi(sb, g.doktorId, ayar, sureDk(r), simdi, r.id)
  if (!girdi) return hata(500, MESAJ.hata)
  const slot = slotUygunMu(girdi, g.baslangic)
  if (!slot) return hata(409, MESAJ.dolu)
  const onay = onayGerekirMi(ayar, await mevcutHastaMi(sb, g.doktorId, g.patientId))
  const s = await kosulluGuncelle(sb, r, {
    baslangic: slot.bas,
    bitis: slot.son,
    kaynak: 'portal',
    durum: onay ? 'talep' : 'onaylandi',
    talep_at: onay ? new Date(simdi).toISOString() : r.talep_at,
    oneri_at: null,
    eskalasyon_at: null,
    hasta_teyit_at: null,
    hatirlatma_gonderildi: false,
  })
  if (!s.ok) return s
  await bekleyenIsleriIptal(sb, g.doktorId, r.id)
  if (!onay) await isEkle(sb, s.randevu, onayIsleri(s.randevu.baslangic, simdi))
  await olayYaz(sb, { randevuId: r.id, doktorId: g.doktorId, olay: 'ertelendi', yapan: 'hasta', detay: { ...detay, eski: r.baslangic, yeni: slot.bas, onayBekliyor: onay } })
  return s
}

// ── Read models ──────────────────────────────────────────────────────────────────────────────────────

export type PortalRandevusu = {
  id: string
  baslangic: string
  bitis: string
  gun: string
  saat: string
  tur: string
  durum: V2Durum
  etiket: string
  oneri: boolean
  izinler: HastaIzinleri
}

/** The patient's own appointments with this doctor: upcoming ones plus those answered in the last 14 days. */
export async function hastaRandevulari(sb: Sb, doktorId: string, patientId: string, ayar: PortalRandevuAyari, simdi: number = Date.now()): Promise<PortalRandevusu[] | null> {
  const { data, error } = await sb.from('randevular').select(RANDEVU_ALANLARI)
    .eq('doktor_id', doktorId).eq('patient_id', patientId)
    .gte('baslangic', new Date(simdi - 14 * GUN_MS).toISOString())
    .order('baslangic', { ascending: true }).limit(50)
  if (error) return null
  return ((data || []) as unknown as V2Randevu[])
    .filter((r) => (aktifMi(r) ? Date.parse(r.bitis) > simdi : r.durum === 'iptal' && Date.parse(r.baslangic) > simdi))
    .map((r) => {
      const d = v2Durum(r)
      const oneri = oneriBekliyorMu(r)
      return {
        id: r.id,
        baslangic: r.baslangic,
        bitis: r.bitis,
        gun: gunEtiketi(r.baslangic),
        saat: saatEtiketi(r.baslangic),
        tur: r.tur,
        durum: d,
        etiket: oneri ? 'Yeni saat önerildi' : r.durum === 'iptal' && r.iptal_nedeni === 'Talep karşılanamadı' ? 'Talep karşılanamadı' : V2_ETIKET[d],
        oneri,
        izinler: hastaIzinleri(r, ayar, simdi),
      }
    })
}

export type TalepOzeti = {
  id: string
  hastaAdi: string
  patientId: string | null
  baslangic: string
  bitis: string
  gun: string
  saat: string
  tur: string
  talepAt: string | null
  oneriBekliyor: boolean
  gecikti: boolean
  zamaniGecti: boolean
}

/** Open requests for the practice (doktor + sekreter). Nothing expires silently: past ones stay listed. */
export async function talepListesi(sb: Sb, doktorId: string, simdi: number = Date.now()): Promise<{ acik: boolean; talepler: TalepOzeti[] } | null> {
  const ayar = await ayarGetir(sb, doktorId)
  const { data, error } = await sb.from('randevular').select(RANDEVU_ALANLARI)
    .eq('doktor_id', doktorId).eq('durum', 'talep').order('baslangic', { ascending: true }).limit(200)
  // Before migration 116 the new columns do not exist → no requests can exist either.
  if (error) return tabloYokMu(error) ? { acik: ayar.acik, talepler: [] } : null
  const satirlar = (data || []) as unknown as V2Randevu[]
  const ids = Array.from(new Set(satirlar.map((r) => r.patient_id).filter(Boolean))) as string[]
  const adlar = new Map<string, string>()
  if (ids.length) {
    const { data: p } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doktorId).in('id', ids)
    for (const x of p || []) adlar.set(String(x.id), hastaAdiCoz(x.name_encrypted) || 'Hasta')
  }
  const talepler = satirlar
    .map((r) => ({
      id: r.id,
      hastaAdi: (r.patient_id && adlar.get(r.patient_id)) || 'Hasta',
      patientId: r.patient_id && adlar.has(r.patient_id) ? r.patient_id : null,
      baslangic: r.baslangic,
      bitis: r.bitis,
      gun: gunEtiketi(r.baslangic),
      saat: saatEtiketi(r.baslangic),
      tur: r.tur,
      talepAt: r.talep_at,
      oneriBekliyor: !!r.oneri_at,
      gecikti: !!r.eskalasyon_at || eskalasyonGerekliMi(r, ayar, simdi),
      zamaniGecti: Date.parse(r.baslangic) <= simdi,
    }))
    // Escalated and past-due first, then by appointment time.
    .sort((a, b) => Number(b.gecikti || b.zamaniGecti) - Number(a.gecikti || a.zamaniGecti) || a.baslangic.localeCompare(b.baslangic))
  return { acik: ayar.acik, talepler }
}

// ── Cron: escalation + due jobs ──────────────────────────────────────────────────────────────────────

export async function eskalasyonTara(sb: Sb, simdi: number = Date.now()): Promise<number> {
  const { data, error } = await sb.from('randevular').select('id, doktor_id, durum, talep_at, oneri_at')
    .eq('durum', 'talep').is('eskalasyon_at', null).is('oneri_at', null)
    .lt('talep_at', new Date(simdi - 3_600_000).toISOString()).limit(500)
  if (error || !data?.length) return 0
  const ayarlar = new Map<string, PortalRandevuAyari>()
  let n = 0
  for (const r of data) {
    const doktorId = String(r.doktor_id)
    if (!ayarlar.has(doktorId)) ayarlar.set(doktorId, await ayarGetir(sb, doktorId))
    if (!eskalasyonGerekliMi(r, ayarlar.get(doktorId)!, simdi)) continue
    const { data: g } = await sb.from('randevular').update({ eskalasyon_at: new Date(simdi).toISOString() })
      .eq('id', r.id).eq('doktor_id', doktorId).eq('durum', 'talep').is('eskalasyon_at', null).select('id')
    if (g?.length) {
      n++
      await olayYaz(sb, { randevuId: String(r.id), doktorId, olay: 'eskalasyon', yapan: 'sistem' })
    }
  }
  return n
}

/**
 * A confirmed new-flow appointment moved or re-activated from the existing calendar (PATCH /api/doktor/randevular,
 * which V2 does not touch) has no reminder jobs for its new time. Re-plan the next two days' reminders; the
 * upsert is idempotent, so running it every tick never doubles a job.
 */
export async function hatirlatmalariTamamla(sb: Sb, simdi: number = Date.now()): Promise<number> {
  const { data, error } = await sb.from('randevular').select('id, doktor_id, baslangic')
    .not('kaynak', 'is', null).eq('durum', 'onaylandi')
    .gt('baslangic', new Date(simdi).toISOString()).lt('baslangic', new Date(simdi + 2 * GUN_MS).toISOString()).limit(1000)
  if (error || !data?.length) return 0
  let n = 0
  for (const r of data) {
    const isler = hatirlatmaZamanlari(String(r.baslangic), simdi)
    if (!isler.length) continue
    await isEkle(sb, { id: String(r.id), doktor_id: String(r.doktor_id) }, isler)
    n++
  }
  return n
}

function linkler(randevuId: string, baslangic: string, eylemler: JetonEylemi[]): Partial<Record<JetonEylemi, string>> {
  const out: Partial<Record<JetonEylemi, string>> = {}
  for (const e of eylemler) {
    const j = randevuJetonu(randevuId, e, jetonSonu(baslangic))
    if (j) out[e] = `${siteAdresi()}/randevu/${j}`
  }
  return out
}

const TUR_LINKLERI: Record<RandevuEpostaTuru, JetonEylemi[]> = {
  onay_eposta: ['geliyorum', 'ertele', 'iptal'],
  oneri_eposta: ['kabul', 'ertele', 'iptal'],
  red_eposta: [],
  iptal_eposta: [],
  gun_once: ['geliyorum', 'ertele', 'iptal'],
  sabah: ['geliyorum', 'iptal'],
  bekleme_teklif: ['teklif'],
}

export type IsOzeti = { islenen: number; gonderilen: number; kuyruga: number; atlanan: number; hatali: number; sessiz: boolean }

/** Runs due jobs. Idempotent: a job is claimed (bekliyor → isleniyor) before anything leaves. Never throws. */
export async function isleriCalistir(
  sb: Sb,
  o: { simdi?: number; limit?: number; bitis?: number; randevuId?: string; doktorId?: string; kanallar?: RandevuKanali[] } = {},
): Promise<IsOzeti> {
  const simdi = o.simdi ?? Date.now()
  const ozet: IsOzeti = { islenen: 0, gonderilen: 0, kuyruga: 0, atlanan: 0, hatali: 0, sessiz: false }
  // Same quiet hours as the NOTYA-ILETISIM-04 dispatcher: nothing leaves at night; jobs wait for the morning.
  if (sessizSaatMi(new Date(simdi))) return { ...ozet, sessiz: true }
  let q = sb.from('randevu_isleri').select('id, randevu_id, doktor_id, tur, zaman')
    .eq('durum', 'bekliyor').lte('zaman', new Date(simdi).toISOString())
  if (o.randevuId && o.doktorId) q = q.eq('randevu_id', o.randevuId).eq('doktor_id', o.doktorId)
  const { data: isler, error } = await q.order('zaman', { ascending: true }).limit(o.limit ?? 100)
  if (error || !isler?.length) return ozet

  const kanallar = o.kanallar ?? randevuKanallari()
  const doktorlar = new Map<string, { ayar: PortalRandevuAyari; iletisim: DoktorIletisimAyari }>()
  for (const is of isler) {
    if (o.bitis && Date.now() >= o.bitis) break
    const doktorId = String(is.doktor_id)
    const tur = is.tur as RandevuEpostaTuru
    const bitir = (durum: string, sonuc: string) =>
      sb.from('randevu_isleri').update({ durum, sonuc: sonuc.slice(0, 300), updated_at: new Date().toISOString() })
        .eq('id', is.id).eq('doktor_id', doktorId).then(() => undefined, () => undefined)
    try {
      const { data: alinan } = await sb.from('randevu_isleri').update({ durum: 'isleniyor', updated_at: new Date().toISOString() })
        .eq('id', is.id).eq('doktor_id', doktorId).eq('durum', 'bekliyor').select('id')
      if (!alinan?.length) continue
      ozet.islenen++

      const r = await satirGetir(sb, doktorId, String(is.randevu_id))
      if (!r || !r.patient_id || !isGecerliMi(tur, String(is.zaman), r, simdi)) { ozet.atlanan++; await bitir('atlandi', 'gecersiz'); continue }
      if (!doktorlar.has(doktorId)) doktorlar.set(doktorId, { ayar: await ayarGetir(sb, doktorId), iletisim: await doktorIletisimAyari(sb, doktorId) })
      const d = doktorlar.get(doktorId)!
      if (!d.ayar.acik) { ozet.atlanan++; await bitir('atlandi', 'kapali'); continue }
      const hasta = await hastaIletisimi(sb, doktorId, r.patient_id, d.iletisim.brans)
      if (!hasta) { ozet.atlanan++; await bitir('atlandi', 'hasta_yok'); continue }

      const metin = randevuEpostasi(tur, {
        hastaAdi: hasta.ad, veliDili: hasta.veliDili, doktorAdi: d.iletisim.doktorAdi, randevuIso: r.baslangic,
        linkler: linkler(r.id, r.baslangic, TUR_LINKLERI[tur]),
      })
      const ekler = tur === 'onay_eposta'
        ? [{ ad: 'randevu.ics', tur: 'text/calendar; charset=UTF-8; method=PUBLISH', icerik: randevuIcs({
            randevuId: r.id, baslangic: r.baslangic, bitis: r.bitis,
            baslik: d.iletisim.doktorAdi ? `Randevu · ${d.iletisim.doktorAdi}` : 'Randevu',
            simdi, sira: Math.floor(simdi / 1000),
          }) }]
        : undefined

      const sonuclar: { kanal: string; s: KanalSonucu }[] = []
      for (const k of kanallar.filter((x) => x.tasirMi(tur))) {
        // An automatic reminder already went out for this appointment (dispatcher or an earlier run) — no second e-mail.
        if (k.kanal === 'eposta' && tur === 'gun_once' && r.hatirlatma_gonderildi) { sonuclar.push({ kanal: k.kanal, s: { durum: 'atlandi', neden: 'zaten_hatirlatildi' } }); continue }
        sonuclar.push({ kanal: k.kanal, s: await k.gonder(sb, { doktorId, randevuId: r.id, baslangicIso: r.baslangic, tur, hasta, konu: metin.konu, metin: metin.metin, ekler }) })
      }
      const eposta = sonuclar.find((x) => x.kanal === 'eposta' && x.s.durum === 'gonderildi')
      if (eposta && tur === 'gun_once') {
        // Same mark the dispatcher sets after an automatic reminder, so the 17:00 run does not e-mail again.
        await sb.from('randevular').update({ hatirlatma_gonderildi: true }).eq('id', r.id).eq('doktor_id', doktorId).then(() => undefined, () => undefined)
      }
      const gitti = sonuclar.some((x) => x.s.durum === 'gonderildi')
      const kuyrukta = sonuclar.some((x) => x.s.durum === 'kuyrukta')
      const hatali = sonuclar.some((x) => x.s.durum === 'hata')
      if (gitti) ozet.gonderilen++
      if (kuyrukta) ozet.kuyruga++
      const ozetMetni = sonuclar.map((x) => `${x.kanal}:${x.s.durum}${'neden' in x.s ? `(${x.s.neden})` : ''}`).join(' ')
      if (gitti || kuyrukta) await bitir('gonderildi', ozetMetni)
      else if (hatali) { ozet.hatali++; await bitir('hata', ozetMetni) }
      else { ozet.atlanan++; await bitir('atlandi', ozetMetni || 'kanal_yok') }
      await olayYaz(sb, { randevuId: r.id, doktorId, olay: 'bildirim', yapan: 'sistem', detay: { tur, kanallar: sonuclar.map((x) => ({ kanal: x.kanal, durum: x.s.durum })) } })
    } catch {
      ozet.hatali++
      await bitir('hata', 'beklenmeyen_hata')
    }
  }
  return ozet
}
