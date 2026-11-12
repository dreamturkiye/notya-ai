/**
 * GERI-CAGIRMA-01 — ONE RECALL SOURCE. Server only (Türkiye's tables).
 *
 * Asks the doctor's own branş's EXISTING due/overdue logic (./nedenler.ts, ./yukleyiciler.ts) and the universal
 * source — the doctor's own recorded follow-up date (NOTYA-TAKIP-01 `takip_isleri`, an open, unconditional
 * "kontrol" case whose date has passed) — and normalises both to GeriCagirmaAdayi. No formula is duplicated and no
 * interval is added here.
 *
 * EXCLUSIONS
 *   • a patient with an upcoming appointment (planned, confirmed or requested)      → not listed
 *   • an inactive patient record (`patients.is_active = false`; the schema has no separate archived or deceased
 *     mark — a practice records both by deactivating the record)                    → not listed
 *   • recalled for the same reason within the doctor's cool-down                    → not listed
 *   • no messaging consent on any channel, or the patient opted out                 → LISTED, kanal null
 *     ("izin yok — arayın"), never messaged
 *
 * HASTA-IZOLASYON: every query carries the doctor id; patient-derived rows are read with the doctor id AND the
 * patient ids together. Names are decrypted only from `patients` rows of this doctor.
 *
 * PERFORMANCE (.cursor/skills/performans-butcesi-koruma): a fixed number of batched queries whatever the number of
 * patients (no per-patient round trip; geriCagirma-sunucu.test.ts asserts it), a hard cap on candidates, and a
 * short per-doctor cache. Never called from a page load: the home card reads stored counters (./sayac.ts).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { doktorAracBransi } from '@/lib/doktor/doktorAraclari'
import { gonderilebilirMi } from '@/lib/iletisim/izin'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import { tabloYokMu } from '@/lib/iletisim/sunucu'
import { ozelKohortBirlestir, type PlanKohortSatiri } from '@/lib/klinik/ozelKohort'
import { decrypt } from '@/lib/security/encryption'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'
import { veliOnamGerekliMi } from '@/lib/specialties/kapsam'
import { kohortKaynagi, nedenAnahtari, OZEL_BRANS_KAYNAGI, OZEL_BRANS_NEDENI } from './nedenler'
import { KOHORT_YUKLEYICILERI, type KohortYukleyici } from './yukleyiciler'
import { beklemeGunTemizle, gunFarki, KONTROL_KAYNAGI, KONTROL_NEDENI, VARSAYILAN_BEKLEME_GUN, type GeriCagirmaAdayi, type GeriCagirmaKanali, type GeriCagirmaListesi, type NedenSatiri } from './tipler'

export const ULKE = 'tr'
export const SAAT_DILIMI = 'Europe/Istanbul'
/** Hard cap on patients a single list holds; the screen says so when it is reached. */
export const ADAY_UST_SINIRI = 600
export const KONTROL_ETIKETI = 'Kontrol tarihi geçti'
export const OZEL_VADE_ETIKETI = 'Planlı izlem tarihi geçti'

const GUN_MS = 86_400_000

/** Which automatic senders the doctor has connected (per doctor, not per patient). */
export type GondericiDurumu = Record<GeriCagirmaKanali, boolean>

export type KaynakBagimliliklari = {
  yukleyiciler: Record<string, KohortYukleyici>
  gondericiDurumu: (sb: SupabaseClient, doktorId: string) => Promise<GondericiDurumu>
}

async function varsayilanGondericiDurumu(sb: SupabaseClient, doktorId: string): Promise<GondericiDurumu> {
  const [{ hazirOtomatikGonderici }, { hazirSmsGonderici }, { vazgecAnahtariVarMi }] = await Promise.all([
    import('@/lib/iletisim/otomatik'), import('@/lib/iletisim/sms/gonderici'), import('@/lib/iletisim/vazgecJetonu'),
  ])
  const guvenli = async (f: () => Promise<unknown>) => { try { return !!(await f()) } catch { return false } }
  const [whatsapp, sms, eposta] = await Promise.all([
    guvenli(() => hazirOtomatikGonderici(doktorId, 'whatsapp')),
    guvenli(() => hazirSmsGonderici(sb, doktorId)),
    // No unsubscribe secret → no bulk e-mail at all (the existing bulk engine fails closed the same way).
    vazgecAnahtariVarMi() ? guvenli(() => hazirOtomatikGonderici(doktorId, 'eposta')) : Promise.resolve(false),
  ])
  return { whatsapp, sms, eposta }
}

const VARSAYILAN: KaynakBagimliliklari = { yukleyiciler: KOHORT_YUKLEYICILERI, gondericiDurumu: varsayilanGondericiDurumu }

const coz = (v: unknown): string => { if (!v) return ''; try { return String(decrypt(String(v)) || '').trim() } catch { return '' } }
function adCoz(v: unknown): string {
  try { const j = JSON.parse(coz(v) || '{}') as { ad?: string; soyad?: string }; return `${j.ad || ''} ${j.soyad || ''}`.replace(/\s+/g, ' ').trim() } catch { return '' }
}

/** WhatsApp first, then SMS, then e-posta — a channel needs the patient's consent, an address AND a connected sender. */
export function kanalSec(
  h: { telefon: string | null; eposta: string | null; izinWhatsapp: boolean | null; izinSms: boolean | null; izinEposta: boolean | null },
  g: GondericiDurumu,
): { kanal: GeriCagirmaKanali | null; izin: GeriCagirmaAdayi['izin'] } {
  const sira: GeriCagirmaKanali[] = ['whatsapp', 'sms', 'eposta']
  const izinli = sira.filter((k) => gonderilebilirMi(h, k))
  if (!izinli.length) return { kanal: null, izin: 'izin_yok' }
  const hazir = izinli.find((k) => g[k])
  return hazir ? { kanal: hazir, izin: 'hazir' } : { kanal: null, izin: 'gonderici_yok' }
}

export type HamNeden = NedenSatiri & { patientId: string; ad?: string; sonVizit?: string | null }

/**
 * Pure: applies the exclusions and builds the list. `sonCagrilar` are this doctor's earlier recalls of these
 * patients that LEFT (or are in flight): patient → reason keys → latest instant.
 */
export function adaylariSuz(g: {
  nedenler: readonly HamNeden[]
  hastalar: ReadonlyMap<string, { ad: string; veliDili: boolean; aktif: boolean; telefon: string | null; eposta: string | null; izinWhatsapp: boolean | null; izinSms: boolean | null; izinEposta: boolean | null }>
  randevusuOlanlar: ReadonlySet<string>
  sonCagrilar: ReadonlyMap<string, ReadonlyMap<string, number>>
  sonVizitler: ReadonlyMap<string, string>
  baglantisiOlanlar: ReadonlySet<string>
  gonderici: GondericiDurumu
  beklemeGun: number
  simdi: number
}): { adaylar: GeriCagirmaAdayi[]; disarida: GeriCagirmaListesi['disarida'] } {
  const disarida = { randevusuVar: 0, beklemede: 0, pasif: 0 }
  const hastaNedenleri = new Map<string, HamNeden[]>()
  for (const n of g.nedenler) {
    const l = hastaNedenleri.get(n.patientId) || []
    if (!l.some((x) => x.anahtar === n.anahtar)) l.push(n)
    hastaNedenleri.set(n.patientId, l)
  }
  const esik = g.simdi - g.beklemeGun * GUN_MS
  const adaylar: GeriCagirmaAdayi[] = []
  for (const [patientId, ham] of hastaNedenleri) {
    const h = g.hastalar.get(patientId)
    // Not this doctor's patient (or the record is gone): never listed. Inactive: counted, not listed.
    if (!h) continue
    if (!h.aktif) { disarida.pasif++; continue }
    if (g.randevusuOlanlar.has(patientId)) { disarida.randevusuVar++; continue }
    const cagrilar = g.sonCagrilar.get(patientId)
    const kalan = ham.filter((n) => !((cagrilar?.get(n.anahtar) ?? 0) > esik))
    if (!kalan.length) { disarida.beklemede++; continue }
    const vadeler = kalan.map((n) => n.vade).filter((v): v is string => !!v).sort()
    const gecikmeler = kalan.map((n) => n.gunGecikme).filter((v): v is number => v != null)
    const sonCagriMs = cagrilar ? Math.max(0, ...cagrilar.values()) : 0
    const { kanal, izin } = kanalSec(h, g.gonderici)
    adaylar.push({
      patientId,
      ad: h.ad || 'Hasta',
      veliDili: h.veliDili,
      nedenler: kalan.map(({ patientId: _p, ad: _a, sonVizit: _s, ...n }) => n),
      vade: vadeler[0] ?? null,
      gunGecikme: gecikmeler.length ? Math.max(...gecikmeler) : null,
      sonVizit: g.sonVizitler.get(patientId) ?? ham.find((n) => n.sonVizit)?.sonVizit ?? null,
      kanal,
      izin,
      sonCagri: sonCagriMs ? new Date(sonCagriMs).toISOString() : null,
      baglanti: g.baglantisiOlanlar.has(patientId),
    })
  }
  // Longest overdue first; patients without a date after those with one; then by name.
  adaylar.sort((a, b) => (b.gunGecikme ?? -1) - (a.gunGecikme ?? -1) || a.ad.localeCompare(b.ad, 'tr'))
  return { adaylar, disarida }
}

const onbellek = new Map<string, { an: number; liste: GeriCagirmaListesi; portal: Map<string, string> }>()
export const ONBELLEK_MS = 5 * 60_000
export function onbellegiTemizle(doktorId?: string): void { if (doktorId) onbellek.delete(doktorId); else onbellek.clear() }

export type ToplamaSecenegi = {
  /** Restrict to these patients (the send path re-validates its selection with this). Never cached. */
  sadece?: string[]
  /** Skip the cache (the "Yenile" button, the background refresh). */
  taze?: boolean
  simdi?: number
}

export type ToplamaSonucu = { liste: GeriCagirmaListesi; /** patient → portal token (server only, for the booking link). */ portal: Map<string, string>; doktorAdi: string }

/** The doctor's signature name, as lib/iletisim/sunucu.ts doktorIletisimAyari builds it. */
function doktorAdiYap(u: { full_name?: unknown; first_name?: unknown; last_name?: unknown; title?: unknown } | null): string {
  const ad = [u?.title, u?.first_name, u?.last_name].filter(Boolean).join(' ').trim()
  const tam = String(u?.full_name || '').trim()
  return ad && (u?.first_name || u?.last_name) ? ad : tam ? (/^(dr|doç|prof|uzm)\.?\s/i.test(tam) ? tam : `Dr. ${tam}`) : ''
}

export async function adaylariTopla(sb: SupabaseClient, doktorId: string, s: ToplamaSecenegi = {}, bag: Partial<KaynakBagimliliklari> = {}): Promise<ToplamaSonucu> {
  const b = { ...VARSAYILAN, ...bag }
  const simdi = s.simdi ?? Date.now()
  const bugun = bugunTrIso(new Date(simdi))
  const bos = (kurulu: boolean, beklemeGun = VARSAYILAN_BEKLEME_GUN): GeriCagirmaListesi => ({ kurulu, adaylar: [], disarida: { randevusuVar: 0, beklemede: 0, pasif: 0 }, beklemeGun, uretildi: new Date(simdi).toISOString() })

  // ── Round 1: who the doctor is, the doctor's recall settings, the universal source ─────────────────────────
  let takipQ = sb.from('takip_isleri').select('patient_id, vade, kosullu').eq('doktor_id', doktorId).eq('durum', 'acik').eq('tur', 'kontrol').lte('vade', bugun).order('vade', { ascending: true }).limit(ADAY_UST_SINIRI)
  if (s.sadece) takipQ = takipQ.in('patient_id', s.sadece)
  const [uQ, aQ, tQ] = await Promise.all([
    sb.from('users').select('full_name, first_name, last_name, title, specialty').eq('id', doktorId).maybeSingle(),
    sb.from('geri_cagirma_ayarlari').select('bekleme_gun').eq('ulke', ULKE).eq('doctor_id', doktorId).maybeSingle(),
    takipQ,
  ])
  // Migration 196 not applied → the feature reads as off: nothing listed, nothing sent, no card.
  if (aQ.error && tabloYokMu(aQ.error)) return { liste: bos(false), portal: new Map(), doktorAdi: '' }
  const beklemeGun = aQ.data ? beklemeGunTemizle((aQ.data as { bekleme_gun?: unknown }).bekleme_gun) : VARSAYILAN_BEKLEME_GUN
  const doktorAdi = doktorAdiYap(uQ.data as Record<string, unknown> | null)
  const hamBrans = (uQ.data as { specialty?: string | null } | null)?.specialty ?? null

  if (!s.sadece && !s.taze) {
    const o = onbellek.get(doktorId)
    if (o && simdi - o.an < ONBELLEK_MS && o.liste.beklemeGun === beklemeGun) return { liste: o.liste, portal: o.portal, doktorAdi }
  }

  const nedenler: HamNeden[] = []
  for (const t of (tQ.error ? [] : tQ.data || []) as { patient_id: string; vade: string | null; kosullu: boolean | null }[]) {
    // A conditional follow-up ("düzelmezse gelsin") is not a due date; the takip desk shows it, the recall list does not.
    if (!t.vade || t.kosullu) continue
    const vade = String(t.vade).slice(0, 10)
    nedenler.push({ patientId: String(t.patient_id), anahtar: KONTROL_NEDENI, etiket: KONTROL_ETIKETI, kaynak: KONTROL_KAYNAGI, vade, gunGecikme: Math.max(0, gunFarki(vade, bugun)) })
  }

  // ── Round 2: the doctor's OWN branş — one loader, never another branş's ─────────────────────────────────
  const brans = doktorAracBransi(hamBrans)
  const kayit = kohortKaynagi(brans)
  const ozelDal = klinikSlugCoz(hamBrans)
  if (kayit && b.yukleyiciler[kayit.brans]) {
    try {
      const { veri, etiket } = await b.yukleyiciler[kayit.brans]()
      const { satirlar } = await veri(sb, doktorId, bugun, s.sadece)
      for (const r of satirlar || []) {
        const tarih = r.enErkenTarih && /^\d{4}-\d{2}-\d{2}/.test(r.enErkenTarih) && r.enErkenTarih.slice(0, 10) <= bugun ? r.enErkenTarih.slice(0, 10) : null
        for (const f of r.bayraklar || []) {
          if (!kayit.nedenler.includes(f)) continue
          nedenler.push({ patientId: String(r.patientId), ad: r.ad, sonVizit: r.sonVizit ?? null, anahtar: nedenAnahtari(kayit.brans, f), etiket: etiket[f] || f, kaynak: kayit.kaynak, vade: tarih, gunGecikme: tarih ? Math.max(0, gunFarki(tarih, bugun)) : null })
        }
      }
    } catch (e) {
      console.error('[geri-cagirma] kohort kaynağı okunamadı', kayit.brans, (e as Error)?.message)
    }
  } else if (ozelDal) {
    let pQ = sb.from('ozel_brans_plan').select('patient_id, slug, arac, vadeler, acil, riza').eq('doctor_id', doktorId).eq('slug', ozelDal).order('updated_at', { ascending: false }).limit(500)
    if (s.sadece) pQ = pQ.in('patient_id', s.sadece)
    const { data: planlar, error } = await pQ
    if (!error) {
      const satirlar = ozelKohortBirlestir([], (planlar || []) as PlanKohortSatiri[], new Map(), bugun)
      for (const r of satirlar) {
        if (r.durum !== 'gecikti' && r.durum !== 'bugun') continue
        const vade = r.vade ? String(r.vade).slice(0, 10) : null
        nedenler.push({ patientId: String(r.patientId), anahtar: nedenAnahtari(ozelDal, OZEL_BRANS_NEDENI), etiket: OZEL_VADE_ETIKETI, kaynak: OZEL_BRANS_KAYNAGI, vade, gunGecikme: vade ? Math.max(0, gunFarki(vade, bugun)) : null })
      }
    }
  }

  const idler = [...new Set(nedenler.map((n) => n.patientId))].slice(0, ADAY_UST_SINIRI)
  if (!idler.length) {
    const liste = bos(true, beklemeGun)
    if (!s.sadece) onbellek.set(doktorId, { an: simdi, liste, portal: new Map() })
    return { liste, portal: new Map(), doktorAdi }
  }
  const idKumesi = new Set(idler)
  const simdiIso = new Date(simdi).toISOString()
  const vizitsiz = idler.filter((id) => !nedenler.some((n) => n.patientId === id && n.sonVizit))

  // ── Round 3: everything else about these patients, in one parallel batch ────────────────────────────────
  const [hQ, rQ, cQ, pQ, payQ, vQ, gonderici] = await Promise.all([
    sb.from('patients').select('id, name_encrypted, dob_encrypted, phone_encrypted, email_encrypted, iletisim_izni_whatsapp, iletisim_izni_eposta, iletisim_izni_sms, is_active').eq('doctor_id', doktorId).in('id', idler),
    sb.from('randevular').select('patient_id').eq('doktor_id', doktorId).in('patient_id', idler).gt('baslangic', simdiIso).in('durum', ['planlandi', 'onaylandi', 'talep']).limit(5000),
    sb.from('geri_cagirma_kayitlari').select('patient_id, nedenler, durum, gonderildi_at, created_at').eq('ulke', ULKE).eq('doctor_id', doktorId).in('patient_id', idler).in('durum', ['gonderildi', 'bekliyor']).gte('created_at', new Date(simdi - 366 * GUN_MS).toISOString()).order('created_at', { ascending: false }).limit(5000),
    sb.from('hasta_portal_tokens').select('patient_id, token_hash, expires_at').eq('doctor_id', doktorId).in('patient_id', idler).gt('expires_at', simdiIso).not('pin_hash', 'is', null).order('expires_at', { ascending: false }).limit(5000),
    sb.from('randevu_portal_ayarlari').select('acik').eq('doktor_id', doktorId).maybeSingle(),
    vizitsiz.length
      ? arsivsizSeanslar(sb, 'patient_id, created_at').eq('doctor_id', doktorId).in('patient_id', vizitsiz).order('created_at', { ascending: false }).limit(3000)
      : Promise.resolve({ data: [] as { patient_id: string; created_at: string }[], error: null }),
    b.gondericiDurumu(sb, doktorId),
  ])

  const hastalar = new Map<string, { ad: string; veliDili: boolean; aktif: boolean; telefon: string | null; eposta: string | null; izinWhatsapp: boolean | null; izinSms: boolean | null; izinEposta: boolean | null }>()
  for (const p of (hQ.data || []) as Record<string, unknown>[]) {
    const dob = coz(p.dob_encrypted).slice(0, 10)
    hastalar.set(String(p.id), {
      ad: adCoz(p.name_encrypted),
      veliDili: veliOnamGerekliMi(/^\d{4}-\d{2}-\d{2}$/.test(dob) ? dob : null, simdi),
      aktif: p.is_active !== false,
      telefon: coz(p.phone_encrypted) || null,
      eposta: coz(p.email_encrypted) || null,
      izinWhatsapp: (p.iletisim_izni_whatsapp as boolean | null) ?? null,
      izinSms: (p.iletisim_izni_sms as boolean | null) ?? null,
      izinEposta: (p.iletisim_izni_eposta as boolean | null) ?? null,
    })
  }
  const randevusuOlanlar = new Set(((rQ.data || []) as { patient_id: string | null }[]).map((r) => String(r.patient_id)))
  const sonCagrilar = new Map<string, Map<string, number>>()
  for (const c of ((cQ.error ? [] : cQ.data) || []) as { patient_id: string; nedenler: string[] | null; gonderildi_at: string | null; created_at: string }[]) {
    const an = Date.parse(c.gonderildi_at || c.created_at)
    if (!Number.isFinite(an)) continue
    const m = sonCagrilar.get(String(c.patient_id)) || new Map<string, number>()
    for (const n of c.nedenler || []) if ((m.get(n) ?? 0) < an) m.set(n, an)
    sonCagrilar.set(String(c.patient_id), m)
  }
  const portalAcik = (payQ.data as { acik?: boolean } | null)?.acik === true
  const portal = new Map<string, string>()
  if (portalAcik) for (const t of ((pQ.error ? [] : pQ.data) || []) as { patient_id: string; token_hash: string | null }[]) {
    if (t.token_hash && !portal.has(String(t.patient_id))) portal.set(String(t.patient_id), String(t.token_hash))
  }
  const sonVizitler = new Map<string, string>()
  for (const v of ((vQ.error ? [] : vQ.data) || []) as { patient_id: string; created_at: string }[]) {
    if (!sonVizitler.has(String(v.patient_id))) sonVizitler.set(String(v.patient_id), String(v.created_at).slice(0, 10))
  }

  const { adaylar, disarida } = adaylariSuz({
    nedenler: nedenler.filter((n) => idKumesi.has(n.patientId)), hastalar, randevusuOlanlar, sonCagrilar, sonVizitler,
    baglantisiOlanlar: new Set(portal.keys()), gonderici, beklemeGun, simdi,
  })
  const liste: GeriCagirmaListesi = { kurulu: true, adaylar, disarida, beklemeGun, uretildi: simdiIso }
  if (!s.sadece) onbellek.set(doktorId, { an: simdi, liste, portal })
  return { liste, portal, doktorAdi }
}
