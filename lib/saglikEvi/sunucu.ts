/**
 * HASTA-PORTALI-GUNLUK — patient-side data layer of the daily health home. Server only.
 *
 * hasta-izolasyon: every function takes the scope `{ doktorId, patientId }` that the caller resolved from the
 * PIN-unlocked portal token, and EVERY read and write below carries both columns. An id coming from the request body
 * (plan id, reading id, alert id, question id) is only ever used together with that scope, so a foreign id matches no
 * row. Performance (performans-butcesi-koruma): the Bugün load is two round trips — one batch of independent reads in
 * parallel, then at most one batch of writes (plan sync / new badges) — independent of the number of rows.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { arsivsizIlaclar, arsivsizNotlar } from '@/lib/doktor/arsiv'
import type { DozKaydi, DozPlani, EvOlcum, EvTercihler, EvUyari, GlukozBaglami, GunlukOlcum, IsaretliOlcum, OlcumTipi, UyariDuzeyi } from './tipler'
import { isaretliMi, PAYLASIM_ONAY_SURUMU, VARSAYILAN_TERCIHLER } from './tipler'
import { bransGunlukAyari, hedefProfili, type BransGunlukAyari } from './bransAyari'
import { etkinEsikler, hekimAyarlariniTemizle, type HedefProfili, type HekimAyarlari } from './hedefler'
import { olcumDogrula } from './olcumler'
import { siklikCoz, gunSlotlari, ERTELE_DK } from './dozPlani'
import { gurultuSuz, isaretKurallari, olcumKurallari, sekerAcilAlani, type KuralSonucu } from './kurallar'
import { hastaModulleri, hastaTercihiDegistir, hastaTercihiTemizle, type KlinikGirdi } from './moduller'
import { aktifIlacAdlari, ilacGirdileri, insulinVarMi, klinikGirdi } from './ilacSinifi'
import { hekimeBildir, varsayilanHekimGonderici, type YeniUyari } from './hekimBildirim'
import { arkaPlanda } from '@/lib/kurucu/denemeBildirimi'
import { gunlukOzeti, type GunlukDurum, type HamGunluk } from './ozet'
import { gunEkle, saatGecerliMi, trGun, trGunBasi, GUN_MS } from './zaman'

export interface Kapsam { doktorId: string; patientId: string }
type Sb = SupabaseClient

export const LDL_ANAHTARLARI = ['LDL', 'LDL-C', 'ldl', 'ldl-c']
export const GUNLUK_OLCUM_SINIRI = 60

// ─── row ↔ type ─────────────────────────────────────────────────────────────────────────────────────────────────
export const olcumSatiri = (r: Record<string, any>): EvOlcum => ({ id: String(r.id), tip: r.tip, deger: Number(r.deger), deger2: r.deger2 == null ? null : Number(r.deger2), baglam: r.baglam ?? null, olcumAt: new Date(r.olcum_at).toISOString(), kaynak: r.kaynak })
/** EV-ACIL-SEKER: the columns every ev_olcumleri read selects (isaret included). */
export const OLCUM_SECIMI = 'id, tip, deger, deger2, baglam, olcum_at, kaynak, isaret'
export const isaretliSatir = (r: Record<string, any>): IsaretliOlcum => ({ id: String(r.id), tip: 'glukoz', isaret: r.isaret === 'lo' ? 'lo' : 'hi', baglam: r.baglam ?? null, olcumAt: new Date(r.olcum_at).toISOString(), kaynak: r.kaynak })
/** Rows → numeric readings (every computation) + HI / LO flags (kept apart, never averaged). */
export function olcumSatirlari(rows: Array<Record<string, any>> | null | undefined): { sayisal: EvOlcum[]; isaretli: IsaretliOlcum[] } {
  const sayisal: EvOlcum[] = [], isaretli: IsaretliOlcum[] = []
  for (const r of rows || []) {
    if (r.isaret === 'hi' || r.isaret === 'lo') isaretli.push(isaretliSatir(r))
    else if (r.deger != null && Number.isFinite(Number(r.deger))) sayisal.push(olcumSatiri(r))
  }
  return { sayisal, isaretli }
}
export const planSatiri = (r: Record<string, any>): DozPlani => ({ id: String(r.id), ilacId: r.ilac_id ?? null, ad: String(r.ad), doz: r.doz ?? null, saatler: Array.isArray(r.saatler) ? r.saatler.filter(saatGecerliMi) : [], gerektikce: !!r.gerektikce, haftaGunu: r.hafta_gunu ?? null, kaynak: r.kaynak === 'hasta' ? 'hasta' : 'hekim', kritik: !!r.kritik, minAralikSaat: r.min_aralik_saat == null ? null : Number(r.min_aralik_saat), aktif: r.aktif !== false, baslangic: r.baslangic ?? null, bitis: r.bitis ?? null })
export const kayitSatiri = (r: Record<string, any>): DozKaydi => ({ id: String(r.id), planId: String(r.plan_id), planlananAt: new Date(r.planlanan_at).toISOString(), durum: r.durum, kayitAt: new Date(r.kayit_at).toISOString(), erteleUntil: r.ertele_until ? new Date(r.ertele_until).toISOString() : null })
export const uyariSatiri = (r: Record<string, any>): EvUyari => ({ id: String(r.id), kural: r.kural, anahtar: r.anahtar, duzey: r.duzey, metrik: r.metrik, hastaMetni: r.hasta_metni, hekimMetni: r.hekim_metni, olusturmaAt: new Date(r.olusturma_at).toISOString(), hastaGorduAt: r.hasta_gordu_at ?? null, hekimGorduAt: r.hekim_gordu_at ?? null, veri: r.veri || {} })
export const tercihSatiri = (r: Record<string, any> | null | undefined): EvTercihler => (r ? { paylasimOnayi: !!r.paylasim_onayi, onayAt: r.onay_at ?? null, sessizBas: r.sessiz_bas || '23:00', sessizBit: r.sessiz_bit || '07:00', hatirlatmaAcik: r.hatirlatma_acik !== false, moduller: hastaTercihiTemizle(r.moduller) } : { ...VARSAYILAN_TERCIHLER })

const coz = (v: unknown) => { try { return v ? decrypt(String(v)) : null } catch { return null } }
function yasAy(dobEnc: unknown, simdi: number): number | null {
  const iso = coz(dobEnc)
  const d = iso ? Date.parse(iso) : NaN
  return Number.isFinite(d) ? (simdi - d) / (30.4375 * GUN_MS) : null
}

/** Everything the rules need about this patient (branş config, thresholds profile, age, what the file says). */
export interface KuralKapsami { brans: { anahtar: string; ayar: BransGunlukAyari }; hekimAyar: HekimAyarlari | null; profil: HedefProfili; yasAy: number | null; notesEncrypted: unknown; notSatirlari: Array<Record<string, unknown>> }

/**
 * HASTA-MODULLERI: the approved notes' ICD-10 codes (latest 30, archived muayene hidden) — read in the same parallel batch
 * as everything else, so resolving the patient's modules adds no round trip. Scoped by doctor_id AND the session's patient.
 */
export const notIcdSorgusu = (sb: Sb, doktorId: string, patientId: string) =>
  arsivsizNotlar(sb, 'icd10_codes, created_at, sessions!inner(patient_id)').eq('doctor_id', doktorId).eq('sessions.patient_id', patientId).not('approved_at', 'is', null).order('created_at', { ascending: false }).limit(30)

async function kuralKapsami(sb: Sb, k: Kapsam, simdi: number): Promise<KuralKapsami> {
  const [brans, hedef, hasta, geb, notlar] = await Promise.all([
    hekimBransi(sb, k.doktorId).catch(() => null),
    sb.from('ev_hedefler').select('ayarlar').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).maybeSingle(),
    sb.from('patients').select('dob_encrypted, notes_encrypted').eq('id', k.patientId).eq('doctor_id', k.doktorId).maybeSingle(),
    sb.from('gebelikler').select('id').eq('patient_id', k.patientId).eq('doctor_id', k.doktorId).eq('durum', 'aktif').limit(1).maybeSingle(),
    notIcdSorgusu(sb, k.doktorId, k.patientId).then((r) => r, () => ({ data: [] })),
  ])
  const b = bransGunlukAyari(brans)
  return { brans: b, hekimAyar: hedef.data?.ayarlar ? hekimAyarlariniTemizle(hedef.data.ayarlar) : null, profil: hedefProfili(b.anahtar, !!geb.data), yasAy: yasAy(hasta.data?.dob_encrypted, simdi), notesEncrypted: hasta.data?.notes_encrypted ?? null, notSatirlari: ((notlar as { data?: unknown }).data || []) as Array<Record<string, unknown>> }
}

const AKTIF_ILAC_SECIMI = 'id, ilac_adi, doz, kullanim_sikli, aktif, baslangic_tarihi, bitis_tarihi'
const aktifIlacSorgusu = (sb: Sb, k: Kapsam) => arsivsizIlaclar(sb, AKTIF_ILAC_SECIMI).eq('patient_id', k.patientId).eq('doctor_id', k.doktorId).eq('onay_durumu', 'onayli').eq('aktif', true).limit(60)

/** Doctor medicines (approved, active, not archived) → dose plans the patient does not have yet; ended ones switched off. */
export function planSenkronu(mevcut: DozPlani[], ilaclar: Array<Record<string, any>>, bugun: string): { ekle: Array<Record<string, unknown>>; kapat: string[] } {
  const varOlan = new Map(mevcut.filter((p) => p.ilacId).map((p) => [p.ilacId as string, p]))
  const aktifIlac = new Set<string>()
  const ekle: Array<Record<string, unknown>> = []
  for (const i of ilaclar) {
    const bitti = i.aktif === false || (i.bitis_tarihi && String(i.bitis_tarihi) < bugun)
    if (bitti) continue
    aktifIlac.add(String(i.id))
    if (varOlan.has(String(i.id))) continue
    const s = siklikCoz(i.kullanim_sikli)
    const bas = i.baslangic_tarihi ? String(i.baslangic_tarihi) : null
    ekle.push({ ilac_id: String(i.id), ad: String(i.ilac_adi || 'İlaç').slice(0, 120), doz: [i.doz, i.kullanim_sikli].filter(Boolean).join(' · ').slice(0, 120) || null, saatler: s.saatler, gerektikce: s.gerektikce, hafta_gunu: s.haftalik ? (bas ? (new Date(`${bas}T00:00:00Z`).getUTCDay() + 6) % 7 : 0) : null, kaynak: 'hekim', baslangic: bas, bitis: i.bitis_tarihi ? String(i.bitis_tarihi) : null })
  }
  const kapat = mevcut.filter((p) => p.kaynak === 'hekim' && p.ilacId && p.aktif && !aktifIlac.has(p.ilacId)).map((p) => p.id)
  return { ekle, kapat }
}

/** The patient's Bugün state. */
export async function gunlukYukle(sb: Sb, k: Kapsam, simdiMs = Date.now()): Promise<GunlukDurum> {
  const simdi = new Date(simdiMs).toISOString()
  const bugun = trGun(simdiMs)
  const d90 = trGunBasi(gunEkle(bugun, -89)).toISOString()
  const d35 = trGunBasi(gunEkle(bugun, -34)).toISOString()
  const d14 = new Date(simdiMs - 14 * GUN_MS).toISOString()
  const [kk, tercih, planlar, ilaclar, olcumler, toplam, foto, kayitlar, uyarilar, rozetler, sorular, ldl] = await Promise.all([
    kuralKapsami(sb, k, simdiMs),
    sb.from('ev_tercihler').select('*').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).maybeSingle(),
    sb.from('ev_ilac_planlari').select('*').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).limit(200),
    aktifIlacSorgusu(sb, k),
    sb.from('ev_olcumleri').select(OLCUM_SECIMI).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).gte('olcum_at', d90).order('olcum_at', { ascending: false }).limit(1500),
    sb.from('ev_olcumleri').select('id', { count: 'exact', head: true }).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId),
    sb.from('ev_olcumleri').select('id', { count: 'exact', head: true }).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).eq('kaynak', 'portal_foto'),
    sb.from('ev_doz_kayitlari').select('id, plan_id, planlanan_at, durum, kayit_at, ertele_until').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).gte('planlanan_at', d35).limit(3000),
    sb.from('ev_uyarilar').select('*').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).gte('olusturma_at', d14).order('olusturma_at', { ascending: false }).limit(30),
    sb.from('ev_rozetler').select('rozet, kazanildi_at, hasta_gordu_at').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId),
    sb.from('ev_sorular').select('id, metin, created_at').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).is('kapandi_at', null).order('created_at', { ascending: false }).limit(20),
    sb.from('lab_satirlar').select('value_num, numune_tarihi').eq('patient_id', k.patientId).eq('doctor_id', k.doktorId).eq('onayli', true).in('canonical_key', LDL_ANAHTARLARI).order('numune_tarihi', { ascending: false }).limit(1).maybeSingle(),
  ])
  let planListesi = ((planlar.data || []) as Record<string, any>[]).map(planSatiri)

  // Second (and last) round: write-backs, all independent of each other.
  const yazilar: PromiseLike<unknown>[] = []
  const senk = planSenkronu(planListesi, (ilaclar.data || []) as Record<string, any>[], bugun)
  if (senk.ekle.length) {
    yazilar.push(sb.from('ev_ilac_planlari').insert(senk.ekle.map((x) => ({ ...x, doctor_id: k.doktorId, patient_id: k.patientId }))).select('*').then((r) => { if (r.data) planListesi = [...planListesi, ...(r.data as Record<string, any>[]).map(planSatiri)] }))
  }
  if (senk.kapat.length) {
    yazilar.push(sb.from('ev_ilac_planlari').update({ aktif: false, updated_at: simdi }).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).in('id', senk.kapat).then(() => { planListesi = planListesi.map((p) => (senk.kapat.includes(p.id) ? { ...p, aktif: false } : p)) }))
  }
  await Promise.all(yazilar)

  const ham: HamGunluk = {
    simdi, bransAnahtar: kk.brans.anahtar, ayar: kk.brans.ayar, hekimAyar: kk.hekimAyar, profil: kk.profil,
    ...(() => { const o = olcumSatirlari(olcumler.data as Record<string, any>[]); return { olcumler: o.sayisal, isaretliOlcumler: o.isaretli } })(),
    toplamOlcum: toplam.count || 0, fotoOlcum: foto.count || 0,
    planlar: planListesi,
    kayitlar: ((kayitlar.data || []) as Record<string, any>[]).map(kayitSatiri),
    uyarilar: ((uyarilar.data || []) as Record<string, any>[]).map(uyariSatiri).filter((u) => !u.hastaGorduAt || Date.parse(u.hastaGorduAt) > simdiMs - 2 * GUN_MS),
    kazanilanRozetler: ((rozetler.data || []) as Record<string, any>[]).map((r) => ({ rozet: String(r.rozet), kazanildiAt: String(r.kazanildi_at), hastaGorduAt: r.hasta_gordu_at ?? null })),
    tercihler: tercihSatiri(tercih.data),
    ldl: ldl.data?.value_num != null ? { deger: Number(ldl.data.value_num), tarih: String(ldl.data.numune_tarihi || '') } : null,
    sorular: ((sorular.data || []) as Record<string, any>[]).map((s) => ({ id: String(s.id), metin: String(s.metin), createdAt: String(s.created_at) })),
    klinik: klinikGirdi(kk.notesEncrypted, kk.notSatirlari, aktifIlacAdlari((ilaclar.data || []) as Record<string, any>[], bugun)),
  }
  const durum = gunlukOzeti(ham)
  if (durum.yeniKazanilan.length) {
    // Store newly earned badges (first time only — unique key); the patient still sees them as "yeni".
    await sb.from('ev_rozetler').upsert(durum.yeniKazanilan.map((r) => ({ doctor_id: k.doktorId, patient_id: k.patientId, rozet: r, kazanildi_at: simdi })), { onConflict: 'doctor_id,patient_id,rozet', ignoreDuplicates: true })
    durum.rozetler = durum.rozetler.map((r) => (durum.yeniKazanilan.includes(r.id) ? { ...r, kazanildiAt: simdi } : r))
  }
  return durum
}

// ─── writes ─────────────────────────────────────────────────────────────────────────────────────────────────────
export type IslemSonucu = { ok: true; [k: string]: unknown } | { ok: false; status: number; hata: string }
const hata = (status: number, h: string): IslemSonucu => ({ ok: false, status, hata: h })

/** Patient-facing alert view (never the doctor text). */
export const hastaUyarisi = (u: KuralSonucu) => ({ duzey: u.duzey as UyariDuzeyi, metrik: u.metrik, hastaMetni: u.hastaMetni, kural: u.kural, ...sekerAcilAlani(u.veri) })


/** Save one reading, then run the rules on it (single-value + the trend of that metric) with dedupe / cool-down. */
export async function olcumKaydet(sb: Sb, k: Kapsam, ham: { tip?: unknown; deger?: unknown; deger2?: unknown; baglam?: unknown; isaret?: unknown; olcumAt?: unknown; foto?: unknown }, simdiMs = Date.now()): Promise<IslemSonucu> {
  const v = olcumDogrula(ham)
  if (!v.ok) return hata(422, v.hata)
  let olcumAt = new Date(simdiMs).toISOString()
  if (typeof ham.olcumAt === 'string') {
    const t = Date.parse(ham.olcumAt)
    if (!Number.isFinite(t) || t > simdiMs + 5 * 60_000 || t < simdiMs - 7 * GUN_MS) return hata(422, 'Ölçüm zamanı son 7 gün içinde olmalı.')
    olcumAt = new Date(t).toISOString()
  }
  const gunBas = trGunBasi(trGun(simdiMs)).toISOString()
  const { count } = await sb.from('ev_olcumleri').select('id', { count: 'exact', head: true }).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).gte('created_at', gunBas)
  if ((count || 0) >= GUNLUK_OLCUM_SINIRI) return hata(429, 'Bugün için ölçüm sınırına ulaşıldı. Yarın yeniden deneyebilirsiniz.')
  const { data: satir, error } = await sb.from('ev_olcumleri').insert({ doctor_id: k.doktorId, patient_id: k.patientId, tip: v.tip, deger: v.deger, deger2: v.deger2, baglam: v.baglam, olcum_at: olcumAt, kaynak: ham.foto === true ? 'portal_foto' : 'portal', ...(v.isaret ? { isaret: v.isaret } : {}) }).select(OLCUM_SECIMI).single()
  if (error || !satir) return hata(500, 'Ölçüm kaydedilemedi. Lütfen yeniden deneyin.')
  const olcum: GunlukOlcum = v.isaret ? isaretliSatir(satir as Record<string, any>) : olcumSatiri(satir as Record<string, any>)
  const uyarilar = await kurallariCalistir(sb, k, olcum, simdiMs)
  return { ok: true, olcum, uyarilar: uyarilar.map(hastaUyarisi) }
}

async function kurallariCalistir(sb: Sb, k: Kapsam, o: GunlukOlcum, simdiMs: number): Promise<KuralSonucu[]> {
  const d28 = new Date(simdiMs - 29 * GUN_MS).toISOString()
  const [kk, gecmis, onceki, ilaclar, tercih, kendi] = await Promise.all([
    kuralKapsami(sb, k, simdiMs),
    sb.from('ev_olcumleri').select(OLCUM_SECIMI).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).eq('tip', o.tip).gte('olcum_at', d28).limit(600),
    sb.from('ev_uyarilar').select('anahtar, duzey, olusturma_at').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).gte('olusturma_at', new Date(simdiMs - 3 * GUN_MS).toISOString()).limit(200),
    aktifIlacSorgusu(sb, k),
    sb.from('ev_tercihler').select('moduller, paylasim_onayi').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).maybeSingle().then((r) => r, () => ({ data: null })),
    // EV-ACIL-SEKER: the patient's own active medicines count for the insulin check too (same batch, no extra round trip).
    sb.from('ev_ilac_planlari').select('ad').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).eq('kaynak', 'hasta').eq('aktif', true).limit(40).then((r) => r, () => ({ data: [] })),
  ])
  const esikler = etkinEsikler(kk.profil, kk.hekimAyar)
  // HASTA-MODULLERI: a kind the patient is not followed for is stored and still checked for an urgent value only.
  const doktorIlaclari = aktifIlacAdlari((ilaclar.data || []) as Record<string, any>[], trGun(simdiMs))
  const klinik: KlinikGirdi = klinikGirdi(kk.notesEncrypted, kk.notSatirlari, doktorIlaclari)
  const tercihV = (tercih as { data?: Record<string, unknown> | null }).data
  const mod = hastaModulleri({ bransAnahtar: kk.brans.anahtar, ayar: kk.brans.ayar, hekim: kk.hekimAyar, klinik, hasta: hastaTercihiTemizle(tercihV?.moduller) })
  const kendiAdlari = (((kendi as { data?: unknown }).data || []) as Array<{ ad?: unknown }>).map((r) => String(r.ad || ''))
  const insulinAktif = insulinVarMi([...klinik.ilaclar, ...ilacGirdileri(kendiAdlari)])
  const b = { yasAy: kk.yasAy, kiloHekimeBildir: mod.kiloHekimeBildir, insulinAktif }
  let adaylar: KuralSonucu[]
  if (isaretliMi(o)) {
    // EV-ACIL-SEKER: a meter "HI" / "LO" is always urgent, whether or not the glucose module is on.
    adaylar = isaretKurallari(o, b)
  } else {
    const liste = olcumSatirlari(gecmis.data as Record<string, any>[]).sayisal
    if (!liste.some((x) => x.id === o.id)) liste.push(o)
    adaylar = olcumKurallari(o, liste, esikler, simdiMs, b, mod.olcumler.includes(o.tip))
  }
  const yeni = gurultuSuz(adaylar, ((onceki.data || []) as Record<string, any>[]).map((r) => ({ anahtar: String(r.anahtar), duzey: r.duzey as UyariDuzeyi, olusturmaAt: String(r.olusturma_at) })), simdiMs)
  if (yeni.length) {
    const { data: eklenen } = await sb.from('ev_uyarilar').insert(yeni.map((r) => ({ doctor_id: k.doktorId, patient_id: k.patientId, kural: r.kural, anahtar: r.anahtar, duzey: r.duzey, metrik: r.metrik, hasta_metni: r.hastaMetni, hekim_metni: r.hekimMetni, veri: r.veri, olusturma_at: new Date(simdiMs).toISOString() }))).select('id, doctor_id, patient_id, duzey, kural')
    // HEKIM-PUSH: the doctor's phone hears about acil / hekime_bildir — after the response (waitUntil), never on this request.
    const doktoraGiden = ((eklenen || []) as YeniUyari[]).filter((u) => u.duzey === 'acil' || u.duzey === 'hekime_bildir')
    if (doktoraGiden.length && tercihV?.paylasim_onayi === true) {
      const gonder = varsayilanHekimGonderici()
      if (gonder) arkaPlanda(() => hekimeBildir(sb, gonder, doktoraGiden.map((u) => ({ ...u, id: String(u.id), doctor_id: String(u.doctor_id), patient_id: String(u.patient_id) })), simdiMs), 'hekim-push')
    }
  }
  return yeni
}

export async function olcumSil(sb: Sb, k: Kapsam, id: unknown): Promise<IslemSonucu> {
  if (typeof id !== 'string' || !id) return hata(422, 'Ölçüm bulunamadı.')
  const { data } = await sb.from('ev_olcumleri').delete().eq('id', id).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).select('id')
  return data && data.length ? { ok: true } : hata(404, 'Ölçüm bulunamadı.')
}

async function planBul(sb: Sb, k: Kapsam, planId: unknown): Promise<DozPlani | null> {
  if (typeof planId !== 'string' || !planId) return null
  const { data } = await sb.from('ev_ilac_planlari').select('*').eq('id', planId).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).maybeSingle()
  return data ? planSatiri(data as Record<string, any>) : null
}

/** "Aldım / Atladım / Ertele" for one or more slots at the same time; "geri" removes the mark. */
export async function dozIsaretle(sb: Sb, k: Kapsam, ham: { planIds?: unknown; planId?: unknown; planlananAt?: unknown; durum?: unknown }, simdiMs = Date.now()): Promise<IslemSonucu> {
  const idler = (Array.isArray(ham.planIds) ? ham.planIds : [ham.planId]).filter((x): x is string => typeof x === 'string').slice(0, 20)
  const durum = ham.durum
  if (!idler.length || !['alindi', 'atlandi', 'ertelendi', 'geri'].includes(String(durum))) return hata(422, 'Geçersiz işlem.')
  const { data: planRows } = await sb.from('ev_ilac_planlari').select('*').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).in('id', idler)
  const planlar = ((planRows || []) as Record<string, any>[]).map(planSatiri)
  if (planlar.length !== new Set(idler).size) return hata(404, 'İlaç bulunamadı.')
  const simdi = new Date(simdiMs).toISOString()
  const satirlar: Array<Record<string, unknown>> = []
  for (const p of planlar) {
    let an: string
    if (p.gerektikce) {
      if (durum !== 'alindi' && durum !== 'geri') return hata(422, 'Gerektiğinde alınan ilaç yalnız "Aldım" ile işaretlenir.')
      an = durum === 'geri' && typeof ham.planlananAt === 'string' ? new Date(ham.planlananAt).toISOString() : simdi
    } else {
      if (typeof ham.planlananAt !== 'string' || !Number.isFinite(Date.parse(ham.planlananAt))) return hata(422, 'Doz saati eksik.')
      an = new Date(ham.planlananAt).toISOString()
      // Only today's and yesterday's real slots of this plan can be marked (no backfilling a month).
      const bugun = trGun(simdiMs)
      const gecerli = [...gunSlotlari(p, bugun), ...gunSlotlari(p, gunEkle(bugun, -1))].map((s) => new Date(s).toISOString())
      if (!gecerli.includes(an)) return hata(422, 'Bu doz saati bugünün planında yok.')
    }
    satirlar.push({ doctor_id: k.doktorId, patient_id: k.patientId, plan_id: p.id, planlanan_at: an, durum, kayit_at: simdi, ertele_until: durum === 'ertelendi' ? new Date(simdiMs + ERTELE_DK * 60_000).toISOString() : null })
  }
  if (durum === 'geri') {
    await sb.from('ev_doz_kayitlari').delete().eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).in('plan_id', planlar.map((p) => p.id)).eq('planlanan_at', satirlar[0].planlanan_at as string)
    return { ok: true }
  }
  const { error } = await sb.from('ev_doz_kayitlari').upsert(satirlar, { onConflict: 'plan_id,planlanan_at' })
  if (error) return hata(500, 'Kaydedilemedi. Lütfen yeniden deneyin.')
  return { ok: true }
}

/** The patient moves times of any plan, or adds / removes their own medicine (never edits the doctor's dose text). */
export async function planDuzenle(sb: Sb, k: Kapsam, ham: { islem?: unknown; planId?: unknown; saatler?: unknown; ad?: unknown; doz?: unknown; gerektikce?: unknown }): Promise<IslemSonucu> {
  const saatler = Array.isArray(ham.saatler) ? [...new Set(ham.saatler.filter(saatGecerliMi))].sort().slice(0, 8) : null
  const simdi = new Date().toISOString()
  if (ham.islem === 'ekle') {
    const ad = String(ham.ad || '').trim().slice(0, 120)
    if (!ad) return hata(422, 'İlacın adını yazın.')
    const gerektikce = ham.gerektikce === true
    if (!gerektikce && !saatler?.length) return hata(422, 'En az bir saat seçin.')
    const { count } = await sb.from('ev_ilac_planlari').select('id', { count: 'exact', head: true }).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).eq('kaynak', 'hasta').eq('aktif', true)
    if ((count || 0) >= 20) return hata(429, 'En fazla 20 ilaç ekleyebilirsiniz.')
    const { data, error } = await sb.from('ev_ilac_planlari').insert({ doctor_id: k.doktorId, patient_id: k.patientId, ad, doz: String(ham.doz || '').trim().slice(0, 120) || null, saatler: gerektikce ? [] : saatler, gerektikce, kaynak: 'hasta', baslangic: trGun(Date.now()) }).select('*').single()
    if (error || !data) return hata(500, 'İlaç eklenemedi.')
    return { ok: true, plan: planSatiri(data as Record<string, any>) }
  }
  const p = await planBul(sb, k, ham.planId)
  if (!p) return hata(404, 'İlaç bulunamadı.')
  if (ham.islem === 'kaldir') {
    if (p.kaynak !== 'hasta') return hata(403, 'Doktorunuzun yazdığı ilacı yalnız doktorunuz sonlandırabilir.')
    await sb.from('ev_ilac_planlari').update({ aktif: false, updated_at: simdi }).eq('id', p.id).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId)
    return { ok: true }
  }
  if (ham.islem === 'saat') {
    if (p.gerektikce) return hata(422, 'Gerektiğinde alınan ilacın saati yoktur.')
    if (!saatler?.length) return hata(422, 'En az bir saat seçin.')
    await sb.from('ev_ilac_planlari').update({ saatler, updated_at: simdi }).eq('id', p.id).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId)
    return { ok: true }
  }
  return hata(422, 'Geçersiz işlem.')
}

export async function tercihKaydet(sb: Sb, k: Kapsam, ham: { sessizBas?: unknown; sessizBit?: unknown; hatirlatmaAcik?: unknown; paylasimOnayi?: unknown; modul?: unknown }): Promise<IslemSonucu> {
  const g: Record<string, unknown> = { doctor_id: k.doktorId, patient_id: k.patientId, updated_at: new Date().toISOString() }
  if (ham.modul !== undefined) {
    // HASTA-MODULLERI: the patient adds an optional module or switches a branş-default one off / back on. Stored as the
    // patient's wish; the resolver (moduller.ts) never lets it remove a doctor-enabled or diagnosis / drug-derived module.
    const m = (ham.modul && typeof ham.modul === 'object' ? ham.modul : {}) as { anahtar?: unknown; acik?: unknown }
    if (typeof m.acik !== 'boolean') return hata(422, 'Geçersiz seçim.')
    const { data: mevcut } = await sb.from('ev_tercihler').select('moduller').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).maybeSingle()
    const yeni = hastaTercihiDegistir(hastaTercihiTemizle((mevcut as Record<string, unknown> | null)?.moduller), m.anahtar, m.acik)
    if (!yeni) return hata(422, 'Geçersiz seçim.')
    g.moduller = yeni
  }
  if (ham.sessizBas !== undefined) { if (!saatGecerliMi(ham.sessizBas)) return hata(422, 'Saat geçersiz.'); g.sessiz_bas = ham.sessizBas }
  if (ham.sessizBit !== undefined) { if (!saatGecerliMi(ham.sessizBit)) return hata(422, 'Saat geçersiz.'); g.sessiz_bit = ham.sessizBit }
  if (typeof ham.hatirlatmaAcik === 'boolean') g.hatirlatma_acik = ham.hatirlatmaAcik
  if (typeof ham.paylasimOnayi === 'boolean') {
    // KVKK açık rıza: explicit, versioned, withdrawable. Withdrawal hides home data from the doctor from now on.
    g.paylasim_onayi = ham.paylasimOnayi
    if (ham.paylasimOnayi) { g.onay_at = g.updated_at; g.onay_surumu = PAYLASIM_ONAY_SURUMU; g.geri_cekme_at = null } else g.geri_cekme_at = g.updated_at
  }
  const { error } = await sb.from('ev_tercihler').upsert(g, { onConflict: 'doctor_id,patient_id' })
  return error ? hata(500, 'Kaydedilemedi.') : { ok: true }
}

export async function soruEkle(sb: Sb, k: Kapsam, metin: unknown): Promise<IslemSonucu> {
  const m = String(metin || '').trim().slice(0, 500)
  if (!m) return hata(422, 'Sorunuzu yazın.')
  const { count } = await sb.from('ev_sorular').select('id', { count: 'exact', head: true }).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).is('kapandi_at', null)
  if ((count || 0) >= 20) return hata(429, 'En fazla 20 açık soru tutulur.')
  const { data, error } = await sb.from('ev_sorular').insert({ doctor_id: k.doktorId, patient_id: k.patientId, metin: m }).select('id, metin, created_at').single()
  return error || !data ? hata(500, 'Kaydedilemedi.') : { ok: true, soru: { id: String(data.id), metin: String(data.metin), createdAt: String(data.created_at) } }
}

export async function soruSil(sb: Sb, k: Kapsam, id: unknown): Promise<IslemSonucu> {
  if (typeof id !== 'string') return hata(422, 'Soru bulunamadı.')
  await sb.from('ev_sorular').delete().eq('id', id).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId)
  return { ok: true }
}

export async function goruldu(sb: Sb, k: Kapsam, tur: 'rozet' | 'uyari', idler?: unknown): Promise<IslemSonucu> {
  const simdi = new Date().toISOString()
  if (tur === 'rozet') {
    await sb.from('ev_rozetler').update({ hasta_gordu_at: simdi }).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).is('hasta_gordu_at', null)
    return { ok: true }
  }
  const ids = Array.isArray(idler) ? idler.filter((x): x is string => typeof x === 'string').slice(0, 50) : []
  if (!ids.length) return { ok: true }
  await sb.from('ev_uyarilar').update({ hasta_gordu_at: simdi }).eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).in('id', ids).is('hasta_gordu_at', null)
  return { ok: true }
}

// ─── KVKK: export / delete ───────────────────────────────────────────────────────────────────────────────────────
const KVKK_TABLOLARI = ['ev_olcumleri', 'ev_doz_kayitlari', 'ev_ilac_planlari', 'ev_uyarilar', 'ev_rozetler', 'ev_sorular', 'ev_tercihler'] as const

export async function veriDisaAktar(sb: Sb, k: Kapsam): Promise<Record<string, unknown[]>> {
  const sonuc = await Promise.all(KVKK_TABLOLARI.map((t) => sb.from(t).select('*').eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).limit(20000)))
  const out: Record<string, unknown[]> = {}
  KVKK_TABLOLARI.forEach((t, i) => { out[t] = ((sonuc[i].data || []) as Record<string, unknown>[]).map(({ doctor_id: _d, patient_id: _p, ...r }) => r) })
  return out
}

export function olcumlerCsv(satirlar: unknown[]): string {
  const kac = (x: unknown) => { const s = x == null ? '' : String(x); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const rows = (satirlar as Record<string, unknown>[]).map((r) => [r.olcum_at, r.tip, r.deger, r.deger2, r.baglam, r.kaynak, r.isaret ? String(r.isaret).toUpperCase() : ''].map(kac).join(';'))
  return ['olcum_zamani;tur;deger;deger2;baglam;kaynak;cihaz_isareti', ...rows].join('\n')
}

/** Delete everything the patient entered (readings, dose marks, own medicines, alerts, badges, questions, push). */
export async function veriSil(sb: Sb, k: Kapsam): Promise<IslemSonucu> {
  const tablolar = ['ev_doz_kayitlari', 'ev_olcumleri', 'ev_uyarilar', 'ev_rozetler', 'ev_sorular', 'ev_push_abonelikleri', 'ev_bildirim_gunlugu', 'ev_kontrol_ozetleri']
  for (const t of tablolar) {
    const { error } = await sb.from(t).delete().eq('doctor_id', k.doktorId).eq('patient_id', k.patientId)
    if (error) return hata(500, 'Silme tamamlanamadı. Lütfen yeniden deneyin.')
  }
  await sb.from('ev_ilac_planlari').delete().eq('doctor_id', k.doktorId).eq('patient_id', k.patientId).eq('kaynak', 'hasta')
  await sb.from('ev_tercihler').upsert({ doctor_id: k.doktorId, patient_id: k.patientId, paylasim_onayi: false, geri_cekme_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'doctor_id,patient_id' })
  return { ok: true }
}

export type { GunlukDurum, OlcumTipi, GlukozBaglami }
