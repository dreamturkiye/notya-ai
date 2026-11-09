/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — server side of the four KD records (thyroid in pregnancy, HPV vaccination, SMA carrier
 * screening, PMS/PMDD diary). KADIN HASTALIKLARI VE DOĞUM ONLY (brans-alan-sizmasi): every route asks `kdTaramaBransi`
 * of the doctor's OWN branch (users.specialty), never a request parameter.
 *
 * HASTA-IZOLASYON: the patient is proven to be the doctor's (hastaSahibiMi) before anything is read or written; every
 * statement carries doctor_id AND patient_id; a diary id from a request is read only together with both. A foreign id
 * answers exactly like a missing one (null → 404). Every record is validated by the shared engine first.
 * PERF: one GET = 1 ownership check + 4 reads in parallel (Promise.all), all on (doctor_id, patient_id) indexes.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { decrypt } from '@/lib/security/encryption'
import { aktifGebelikDurumu } from '@/lib/clinical/gebelikDurum'
import { gebelikYasi } from '@/lib/clinical/gebelik'
import { kadinDogumBransi } from '@/lib/doktor/hastaDosyaSekmeleri'
import {
  HPV_ASI_TIPLERI, PMDD_KRITERLERI, PMDD_YONETIM_SECENEKLERI, TIROID_DURUMLARI, TIROID_RISK_FAKTORLERI,
  hpvPlani, lt4NotuDogrula, pmddGunDogrula, pmddKontrolListesi, pmddOzeti, smaDegerlendir, tiroidDegerlendir,
  tiroidTakipNoktalari, tiroidTaramaIstemi, yasTarihte, type HpvDoz, type PmddGunGirdisi, type TiroidDurumu,
} from '@/lib/clinical/kdTaramalar'
import { TR_HPV_KURALI, TR_TIROID_KURALI } from '@/specialties/kadin-dogum/protocols/kd-taramalar-tr'

export const T_KAYIT = 'kd_tarama_kayitlari'
export const T_GUNLUK = 'kd_semptom_gunlugu'
export const KD_TARAMA_TURLERI = ['tiroid_olcum', 'tiroid_durum', 'lt4_not', 'hpv_doz', 'sma', 'pmdd_gunluk', 'pmdd_kontrol'] as const
export type KdTaramaTuru = (typeof KD_TARAMA_TURLERI)[number]
const LISTE_AZAMI = 300
const GUNLUK_AZAMI = 400

/** THE one branch decision: Kadın Hastalıkları ve Doğum (any stored spelling) and nothing else. */
export const kdTaramaBransi = (specialtyHam: string | null | undefined): boolean => kadinDogumBransi(specialtyHam)

export async function doktorBransi(sb: SupabaseClient, doktorId: string): Promise<string | null> {
  const { data } = await sb.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  return data?.specialty ? String(data.specialty) : null
}

export const bugunTr = (): string => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)
const gun = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)
const sayi = (x: unknown): number | null => {
  if (typeof x === 'number' && Number.isFinite(x)) return x
  if (typeof x === 'string' && x.trim() !== '' && Number.isFinite(Number(x.replace(',', '.')))) return Number(x.replace(',', '.'))
  return null
}

export type KdKayit = { id: string; tur: KdTaramaTuru; tarih: string; gebelik_id: string | null; veri: Record<string, unknown>; created_at: string }

type Hata = { ok: false; status: number; hata: string }
type Tamam = { ok: true; kayit: KdKayit }

/** Validate one record with the shared engine. Returns the clean `veri` to store, or the reason it is refused. */
export function kayitDogrula(tur: string, ham: unknown): { ok: true; veri: Record<string, unknown>; tarih: string } | { ok: false; hata: string } {
  const v = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = gun(v.tarih) ? v.tarih : bugunTr()
  if (tarih > bugunTr()) return { ok: false, hata: 'gelecek_tarih' }
  switch (tur) {
    case 'tiroid_olcum': {
      const hafta = sayi(v.hafta)
      const tsh = sayi(v.tsh), ft4 = sayi(v.ft4)
      if (tsh === null && ft4 === null) return { ok: false, hata: 'deger_yok' }
      if (hafta === null || hafta < 0 || hafta > 45) return { ok: false, hata: 'hafta' }
      const alanlar = ['labTshAlt', 'labTshUst', 'gebelikDisiTshAlt', 'gebelikDisiTshUst', 'labFt4Alt', 'labFt4Ust'] as const
      const temiz: Record<string, unknown> = { tarih, hafta, tsh, ft4, ft4Birim: typeof v.ft4Birim === 'string' ? v.ft4Birim.slice(0, 16) : null }
      for (const a of alanlar) temiz[a] = sayi(v[a])
      if ([tsh, ft4, ...alanlar.map((a) => temiz[a] as number | null)].some((x) => x !== null && (x < 0 || x > 1000))) return { ok: false, hata: 'deger_araligi' }
      return { ok: true, veri: temiz, tarih }
    }
    case 'tiroid_durum': {
      const durum = String(v.durum || '')
      if (!(TIROID_DURUMLARI as readonly string[]).includes(durum)) return { ok: false, hata: 'durum' }
      const riskler = Array.isArray(v.riskler) ? v.riskler.filter((r): r is string => typeof r === 'string' && (TIROID_RISK_FAKTORLERI as readonly string[]).includes(r)) : []
      return { ok: true, veri: { tarih, durum, riskler }, tarih }
    }
    case 'lt4_not': {
      const n = lt4NotuDogrula(v.metin)
      if (!n.ok) return { ok: false, hata: `lt4_${n.hata}` }
      return { ok: true, veri: { tarih, metin: n.metin, hafta: sayi(v.hafta) }, tarih }
    }
    case 'hpv_doz': {
      const no = sayi(v.no)
      if (no === null || !Number.isInteger(no) || no < 1 || no > 3) return { ok: false, hata: 'doz_no' }
      if (!gun(v.tarih)) return { ok: false, hata: 'tarih' }
      const tip = (HPV_ASI_TIPLERI as readonly string[]).includes(String(v.tip)) ? String(v.tip) : 'bilinmiyor'
      const immun = v.immun === 'baskilanmis' ? 'baskilanmis' : 'normal'
      return { ok: true, veri: { tarih: v.tarih, no, tip, immun, urun: typeof v.urun === 'string' ? v.urun.trim().slice(0, 80) : null }, tarih: v.tarih }
    }
    case 'sma': {
      const r = smaDegerlendir(v as never)
      if (!r.ok) return { ok: false, hata: `sma_${r.hata}` }
      return { ok: true, veri: { ...r.kayit, tarih: r.kayit.tarih || tarih }, tarih: r.kayit.tarih || tarih }
    }
    case 'pmdd_gunluk': return { ok: true, veri: { tarih, durum: 'acik' }, tarih }
    case 'pmdd_kontrol': {
      const isaretli = Array.isArray(v.kriterler) ? v.kriterler.filter((k): k is string => typeof k === 'string' && (PMDD_KRITERLERI as readonly string[]).includes(k)) : []
      const yonetim = Array.isArray(v.yonetim) ? v.yonetim.filter((k): k is string => typeof k === 'string' && (PMDD_YONETIM_SECENEKLERI as readonly string[]).includes(k)) : []
      const not = typeof v.not === 'string' ? v.not.trim().slice(0, 500) : ''
      return { ok: true, veri: { tarih, kriterler: isaretli, durum: pmddKontrolListesi(isaretli).durum, yonetim, not }, tarih }
    }
    default: return { ok: false, hata: 'tur' }
  }
}

async function aktifGebelik(sb: SupabaseClient, doktorId: string, patientId: string) {
  const { data } = await sb.from('gebelikler').select('id, sat, tdt, durum').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false })
  return ((data || []) as Array<{ id: string; sat: string | null; tdt: string | null; durum: string }>).find((g) => aktifGebelikDurumu(g.durum)) || null
}

/** Insert one validated record. 404 = not the doctor's patient. */
export async function kayitEkle(sb: SupabaseClient, doktorId: string, patientId: string, tur: unknown, veri: unknown): Promise<Tamam | Hata> {
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return { ok: false, status: 404, hata: 'bulunamadi' }
  const t = String(tur || '')
  const d = kayitDogrula(t, veri)
  if (!d.ok) return { ok: false, status: 422, hata: d.hata }
  const gebelik = t === 'tiroid_olcum' || t === 'tiroid_durum' || t === 'lt4_not' || t === 'sma' ? await aktifGebelik(sb, doktorId, patientId) : null
  const { data, error } = await sb.from(T_KAYIT).insert({ doctor_id: doktorId, patient_id: patientId, gebelik_id: gebelik?.id ?? null, tur: t, kayit_tarihi: d.tarih, veri: d.veri }).select('id, tur, kayit_tarihi, gebelik_id, veri, created_at').single()
  if (error || !data) return { ok: false, status: 500, hata: 'yazilamadi' }
  const r = data as { id: string; tur: KdTaramaTuru; kayit_tarihi: string; gebelik_id: string | null; veri: Record<string, unknown>; created_at: string }
  return { ok: true, kayit: { id: r.id, tur: r.tur, tarih: r.kayit_tarihi, gebelik_id: r.gebelik_id, veri: r.veri, created_at: r.created_at } }
}

/** Close an open diary (the doctor's own patient and the doctor's own diary only). */
export async function gunlukKapat(sb: SupabaseClient, doktorId: string, patientId: string, gunlukId: string): Promise<boolean> {
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return false
  const { data } = await sb.from(T_KAYIT).select('id, veri').eq('id', gunlukId).eq('doctor_id', doktorId).eq('patient_id', patientId).eq('tur', 'pmdd_gunluk').maybeSingle()
  if (!data) return false
  const { error } = await sb.from(T_KAYIT).update({ veri: { ...((data as { veri: Record<string, unknown> }).veri || {}), durum: 'kapali', kapanis: bugunTr() }, updated_at: new Date().toISOString() }).eq('id', gunlukId).eq('doctor_id', doktorId).eq('patient_id', patientId)
  return !error
}

/** A diary day entered at the clinic (from a paper diary). The diary must be this doctor's, for this patient, open. */
export async function gunlukGunuYaz(sb: SupabaseClient, g: { doktorId: string; patientId: string; gunlukId: string; gun: unknown; kaynak: 'portal' | 'klinik' }): Promise<{ ok: true } | Hata> {
  const { data: gl } = await sb.from(T_KAYIT).select('id, veri').eq('id', g.gunlukId).eq('doctor_id', g.doktorId).eq('patient_id', g.patientId).eq('tur', 'pmdd_gunluk').maybeSingle()
  if (!gl) return { ok: false, status: 404, hata: 'bulunamadi' }
  if (((gl as { veri: { durum?: string } }).veri || {}).durum !== 'acik') return { ok: false, status: 409, hata: 'gunluk_kapali' }
  const d = pmddGunDogrula(g.gun)
  if (!d.ok) return { ok: false, status: 422, hata: `gun_${d.hata}` }
  if (d.gun.tarih > bugunTr()) return { ok: false, status: 422, hata: 'gelecek_tarih' }
  const { error } = await sb.from(T_GUNLUK).upsert({ doctor_id: g.doktorId, patient_id: g.patientId, gunluk_id: g.gunlukId, tarih: d.gun.tarih, adet: d.gun.adet, puan: d.gun.puan, islev: d.gun.islev || {}, kaynak: g.kaynak, updated_at: new Date().toISOString() }, { onConflict: 'gunluk_id,tarih' })
  return error ? { ok: false, status: 500, hata: 'yazilamadi' } : { ok: true }
}

export type KdTaramaOzeti = {
  kayitlar: KdKayit[]
  gebelik: { id: string; hafta: number | null; metin: string | null } | null
  tiroid: { olcumler: Array<KdKayit & { degerlendirme: ReturnType<typeof tiroidDegerlendir> }>; durum: TiroidDurumu; riskler: string[]; tarama: ReturnType<typeof tiroidTaramaIstemi>; takip: ReturnType<typeof tiroidTakipNoktalari>; lt4Notlari: KdKayit[] }
  hpv: { dozlar: KdKayit[]; ilkDozYasi: number | null; plan: ReturnType<typeof hpvPlani>; serviks: Array<{ id: string; tarih: string; pap: string | null; hpv: string | null; plan: string | null }> }
  sma: { son: KdKayit | null; degerlendirme: ReturnType<typeof smaDegerlendir> | null }
  pmdd: { gunluk: KdKayit | null; gunler: PmddGunGirdisi[]; ozet: ReturnType<typeof pmddOzeti> | null; kontrol: KdKayit | null }
}

/** Everything the KD screen shows, for the doctor's own patient. null = not the doctor's patient (→ 404). */
export async function ozetGetir(sb: SupabaseClient, doktorId: string, patientId: string): Promise<KdTaramaOzeti | null> {
  if (!(await hastaSahibiMi(sb, doktorId, patientId))) return null
  const [kayitR, gebelik, serviksR, hastaR] = await Promise.all([
    sb.from(T_KAYIT).select('id, tur, kayit_tarihi, gebelik_id, veri, created_at').eq('doctor_id', doktorId).eq('patient_id', patientId).order('created_at', { ascending: false }).limit(LISTE_AZAMI),
    aktifGebelik(sb, doktorId, patientId),
    sb.from('serviks_taramalari').select('id, tarih, pap_sonuc, hpv, resmi_plan').eq('patient_id', patientId).eq('doctor_id', doktorId).order('tarih', { ascending: false }).limit(10),
    sb.from('patients').select('dob_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle(),
  ])
  const kayitlar: KdKayit[] = ((kayitR.data || []) as Array<{ id: string; tur: KdTaramaTuru; kayit_tarihi: string; gebelik_id: string | null; veri: Record<string, unknown>; created_at: string }>).map((r) => ({ id: r.id, tur: r.tur, tarih: r.kayit_tarihi, gebelik_id: r.gebelik_id, veri: r.veri || {}, created_at: r.created_at }))
  const yas = gebelik ? gebelikYasi(gebelik.sat, gebelik.tdt) : null
  const tur = (t: KdTaramaTuru) => kayitlar.filter((k) => k.tur === t)
  // thyroid
  const durumKaydi = tur('tiroid_durum').find((k) => !gebelik || k.gebelik_id === gebelik.id) || null
  const durum = (durumKaydi?.veri.durum as TiroidDurumu) || 'yok'
  const lt4 = durum === 'hipotiroidi'
  const olcumler = tur('tiroid_olcum').filter((k) => !gebelik || k.gebelik_id === gebelik.id).map((k) => ({ ...k, degerlendirme: tiroidDegerlendir({ ...(k.veri as object), lt4Tedavisi: lt4 } as never, TR_TIROID_KURALI) }))
  const tshKayitli = olcumler.some((o) => typeof o.veri.tsh === 'number')
  const riskler = (durumKaydi?.veri.riskler as string[]) || []
  // HPV
  const dozKayitlari = tur('hpv_doz').sort((a, b) => a.tarih.localeCompare(b.tarih))
  let dob: string | null = null
  try { const h = hastaR.data as { dob_encrypted?: string } | null; dob = h?.dob_encrypted ? decrypt(String(h.dob_encrypted)).slice(0, 10) : null } catch { dob = null }
  const ilkDozYasi = dozKayitlari.length ? yasTarihte(dob, dozKayitlari[0].tarih) : null
  const immun = dozKayitlari.some((d) => d.veri.immun === 'baskilanmis') ? 'baskilanmis' : 'normal'
  const dozlar: HpvDoz[] = dozKayitlari.map((d) => ({ no: Number(d.veri.no), tarih: d.tarih, tip: d.veri.tip as HpvDoz['tip'] }))
  // SMA
  const smaSon = tur('sma')[0] || null
  // PMDD
  const gunluk = tur('pmdd_gunluk')[0] || null
  let gunler: PmddGunGirdisi[] = []
  if (gunluk) {
    const { data } = await sb.from(T_GUNLUK).select('tarih, adet, puan, islev').eq('doctor_id', doktorId).eq('patient_id', patientId).eq('gunluk_id', gunluk.id).order('tarih', { ascending: true }).limit(GUNLUK_AZAMI)
    gunler = ((data || []) as Array<{ tarih: string; adet: boolean; puan: PmddGunGirdisi['puan']; islev: PmddGunGirdisi['islev'] }>).map((g) => ({ tarih: String(g.tarih).slice(0, 10), adet: !!g.adet, puan: g.puan || {}, islev: g.islev || {} }))
  }
  return {
    kayitlar,
    gebelik: gebelik ? { id: gebelik.id, hafta: yas?.hafta ?? null, metin: yas?.metin ?? null } : null,
    tiroid: {
      olcumler, durum, riskler,
      tarama: tiroidTaramaIstemi(TR_TIROID_KURALI, { tshKayitli, riskler }),
      takip: tiroidTakipNoktalari(durum, yas?.hafta ?? null, TR_TIROID_KURALI),
      lt4Notlari: tur('lt4_not'),
    },
    hpv: {
      dozlar: dozKayitlari, ilkDozYasi, plan: hpvPlani({ ilkDozYasi, immun, dozlar }, TR_HPV_KURALI),
      serviks: ((serviksR.data || []) as Array<{ id: string; tarih: string; pap_sonuc: string | null; hpv: string | null; resmi_plan: string | null }>).map((s) => ({ id: s.id, tarih: String(s.tarih).slice(0, 10), pap: s.pap_sonuc, hpv: s.hpv, plan: s.resmi_plan })),
    },
    sma: { son: smaSon, degerlendirme: smaSon ? smaDegerlendir(smaSon.veri as never) : null },
    pmdd: { gunluk, gunler, ozet: gunluk ? pmddOzeti(gunler) : null, kontrol: tur('pmdd_kontrol')[0] || null },
  }
}

/** PORTAL: the patient's open diary with this doctor (token → patient + doctor). null = none open. */
export async function acikGunluk(sb: SupabaseClient, doktorId: string, patientId: string): Promise<{ id: string } | null> {
  const { data } = await sb.from(T_KAYIT).select('id, veri').eq('doctor_id', doktorId).eq('patient_id', patientId).eq('tur', 'pmdd_gunluk').order('created_at', { ascending: false }).limit(1)
  const r = ((data || []) as Array<{ id: string; veri: { durum?: string } }>)[0]
  return r && r.veri?.durum === 'acik' ? { id: r.id } : null
}
