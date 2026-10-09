/**
 * NOTYA-ULKE-KLINIK-01 — THE FRONT DESK: what a front-desk member of a clinic may do for the doctors who gave them a
 * grant, and THE CLINIC'S SCHEDULE as its owner and an administrator see it. Server only.
 *
 * THREE CAPABILITIES, each given separately by the doctor (./yetki.ts):
 *   on-buro-randevu   see and manage THAT doctor's appointments; find a patient of that doctor by name or phone and
 *                     see the minimal card: name, second name, birth date, phone.
 *   on-buro-hasta     create a patient for that doctor, with identity and contact fields only.
 *   on-buro-portal    give a patient the portal link and PIN; ask a patient for the intake form.
 *
 * WHAT A FRONT-DESK MEMBER NEVER GETS, from any function here: a note, a transcript, a visit, the answers of an
 * intake form, a tool record, a summary, the reason of an appointment, a patient's sex, language or identity
 * number. Every answer is BUILT FIELD BY FIELD from a fixed list (`kart`, `randevu` below) — nothing a library
 * function returns is passed through, so a field added to a patient or an appointment tomorrow does not reach the
 * front desk by itself. lib/ulke/klinikHesabi/klinik.paket.test.ts asserts on the keys of every answer.
 *
 * EVERY FUNCTION: the check and the record first (yetkiyle), then the DOCTOR's own library function with the
 * DOCTOR's id — the same functions the doctor's routes use, which prove every patient and appointment id to be that
 * doctor's. A patient or an appointment of another doctor is "not found" here exactly as it is for that doctor.
 *
 * THE PORTAL LINK. Whoever hands a patient the link and the PIN has seen both: a front-desk member who is given
 * `on-buro-portal` could open that patient's page. It cannot be otherwise; it is why the capability is separate, why
 * each use is recorded with who did it, and why the patient's page records every sign-in for the doctor.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { formIste } from '../intake/form'
import type { HastaFormuIcerigi } from '../intake/tipler'
import { portalErisimVer } from '../portal/erisim'
import { ulkePaketi } from '../ulke'
import { hastaGetir, hastaGirdisiHatasi, hastaOlustur, hastalariListele, type Cinsiyet, type Hasta, type HastaGirdisi } from '../uygulama/hastalar'
import { randevuDurumDegistir, randevuGetir, randevuOlustur, randevuTasi, randevulariListele, type Randevu, type RandevuDurumu, type RandevuRetKodu, type ZamanGirdisi } from '../uygulama/randevular'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeTablosu } from '../uygulama/tablolar'
import { DAKIKA_MS, gunEkle, gunGecerli, saatYazDk, yerelAn, yerelUtc } from '../uygulama/zaman'
import { hesapAdlari, klinikAyarlari, uyelikOku } from './klinik'
import { alinanYetkiler, yetkiBul, yetkiyle, erisimKaydet } from './yetki'
import { ARAMA_ASGARI_KARAKTER, ARAMA_SONUC_AZAMI, hastaSahibiOlabilir, yoneticiMi, type HastaKarti, type KlinikTakvimDilimi, type KlinikYetkiTuru, type OnBuroRandevusu } from './tipler'

/** THE MINIMAL CARD, field by field. */
const kart = (h: Hasta): HastaKarti => ({ id: h.id, ad: h.ad, otaIsmi: h.otaIsmi, dogumTarihi: h.dogumTarihi, telefon: h.telefon })
/** AN APPOINTMENT FOR THE FRONT DESK, field by field: no reason, no visit. */
const randevu = (r: Randevu): OnBuroRandevusu => ({ id: r.id, hastaId: r.hastaId, hastaAdi: r.hastaAdi, baslangic: r.baslangic, bitis: r.bitis, gun: r.gun, saat: r.saat, sureDk: r.sureDk, durum: r.durum, mesaiDisi: r.mesaiDisi })

/** Statuses a front-desk member may set by hand. "Done" is the doctor's (it follows an approved note). */
export const ON_BURO_DURUMLARI: readonly RandevuDurumu[] = ['planlandi', 'geldi', 'gelmedi', 'iptal']

export type OnBuroRetKodu = RandevuRetKodu | 'ARAMA_KISA'
type Ret = { tamam: false; kod: OnBuroRetKodu; alan?: string }
const YOK: Ret = { tamam: false, kod: 'NOT_FOUND' }

/** The doctors who gave THIS member a front-desk capability that stands now, with what each gave. Names of accounts; nothing of any patient. */
export async function onBuroHekimleri(supabase: SupabaseClient, benId: string, simdi = Date.now()): Promise<{ hekimId: string; ad: string; yetkiler: KlinikYetkiTuru[] }[]> {
  const hepsi = (await alinanYetkiler(supabase, benId, simdi)).filter((y) => y.tur === 'on-buro-randevu' || y.tur === 'on-buro-hasta' || y.tur === 'on-buro-portal')
  const harita = new Map<string, { hekimId: string; ad: string; yetkiler: KlinikYetkiTuru[] }>()
  for (const y of hepsi) {
    const h = harita.get(y.hekimId) ?? { hekimId: y.hekimId, ad: y.hekimAdi, yetkiler: [] }
    if (!h.yetkiler.includes(y.tur)) h.yetkiler.push(y.tur)
    harita.set(y.hekimId, h)
  }
  return [...harita.values()].sort((a, b) => a.ad.localeCompare(b.ad, ulkePaketi().bicim.yerel))
}

/** That doctor's appointments on the `gunSayisi` days from `ilkGun`, as the front desk sees them. null = no grant (or not readable). */
export async function onBuroRandevulari(supabase: SupabaseClient, benId: string, hekimId: string, ilkGun: string, gunSayisi: number, simdi = Date.now()): Promise<OnBuroRandevusu[] | null> {
  if (!gunGecerli(ilkGun)) return null
  if (!(await yetkiyle(supabase, benId, hekimId, 'on-buro-randevu', { olay: 'okuma', ne: 'randevu-listesi' }, simdi))) return null
  const liste = await randevulariListele(supabase, hekimId, ilkGun, gunSayisi)
  return liste ? liste.map(randevu) : null
}

/**
 * Finds patients OF THAT DOCTOR by name, second name or phone digits. Never the whole list: a search needs at least
 * ARAMA_ASGARI_KARAKTER characters and answers at most ARAMA_SONUC_AZAMI cards. The search runs over THE CARD's own
 * fields only — it cannot be used to test for a value the card does not show (an identity number).
 */
export async function onBuroHastaAra(supabase: SupabaseClient, benId: string, hekimId: string, q: string, simdi = Date.now()): Promise<{ tamam: true; hastalar: HastaKarti[] } | Ret> {
  const aranan = q.trim()
  const rakam = aranan.replace(/\D/g, '')
  if (aranan.length < ARAMA_ASGARI_KARAKTER) return { tamam: false, kod: 'ARAMA_KISA' }
  if (!(await yetkiyle(supabase, benId, hekimId, 'on-buro-randevu', { olay: 'okuma', ne: 'hasta-arama' }, simdi))) return YOK
  const hepsi = await hastalariListele(supabase, hekimId)
  if (!hepsi) return { tamam: false, kod: 'BASARISIZ' }
  const katla = ulkePaketi().uygulama?.aramaKatla ?? ((s: string) => s.toLowerCase())
  const sozcukler = katla(aranan).split(/\s+/).filter(Boolean)
  const uyan = hepsi.map(kart).filter((k) => {
    const metin = katla(`${k.ad} ${k.otaIsmi}`)
    if (sozcukler.length && sozcukler.every((s) => metin.includes(s))) return true
    return rakam.length >= 3 && k.telefon.replace(/\D/g, '').includes(rakam)
  })
  return { tamam: true, hastalar: uyan.slice(0, ARAMA_SONUC_AZAMI) }
}

/** The minimal card of one patient of that doctor. */
export async function onBuroHastaKarti(supabase: SupabaseClient, benId: string, hekimId: string, hastaId: string, simdi = Date.now()): Promise<HastaKarti | null> {
  const b = await yetkiBul(supabase, benId, hekimId, 'on-buro-randevu', null, simdi)
  if (!b) return null
  // ISOLATION: the patient must be THAT DOCTOR's — proven before the record names them and before anything is answered.
  const hasta = await hastaGetir(supabase, hekimId, hastaId)
  if (!hasta) return null
  if (!(await erisimKaydet(supabase, b, 'okuma', 'hasta-karti', hasta.id, simdi))) return null
  return kart(hasta)
}

export type OnBuroHastaGirdisi = { ad: string; otaIsmi: string; dogumTarihi: string; cinsiyet: Cinsiyet | ''; telefon: string; dil: string }

/**
 * Creates a patient FOR THAT DOCTOR, with identity and contact fields only: name, second name, birth date, sex,
 * phone and the patient's language. No identity number is taken here, whatever the request sends. The patient is
 * that doctor's from the first moment — the one who typed it owns nothing.
 */
export async function onBuroHastaOlustur(supabase: SupabaseClient, benId: string, hekimId: string, g: OnBuroHastaGirdisi, simdi = Date.now()): Promise<{ tamam: true; hasta: HastaKarti } | Ret> {
  const girdi: HastaGirdisi = { ad: g.ad, otaIsmi: g.otaIsmi, dogumTarihi: g.dogumTarihi, cinsiyet: g.cinsiyet, telefon: g.telefon, dil: g.dil, ulusalKimlik: '' }
  const b = await yetkiBul(supabase, benId, hekimId, 'on-buro-hasta', null, simdi)
  if (!b) return YOK
  const hata = hastaGirdisiHatasi(girdi)
  if (hata) return { tamam: false, kod: 'GECERSIZ', alan: hata }
  if (!(await erisimKaydet(supabase, b, 'yazma', 'hasta-olusturma', null, simdi))) return YOK
  const hasta = await hastaOlustur(supabase, hekimId, girdi)
  if (!hasta) return { tamam: false, kod: 'BASARISIZ' }
  return { tamam: true, hasta: kart(hasta) }
}

/** Books an appointment with that doctor for one of that doctor's patients. No reason is taken from the front desk. */
export async function onBuroRandevuOlustur(supabase: SupabaseClient, benId: string, hekimId: string, g: ZamanGirdisi & { hastaId: string }, simdi = Date.now()): Promise<{ tamam: true; randevu: OnBuroRandevusu } | Ret> {
  const b = await yetkiBul(supabase, benId, hekimId, 'on-buro-randevu', null, simdi)
  if (!b) return YOK
  const hasta = await hastaGetir(supabase, hekimId, g.hastaId)
  if (!hasta) return YOK
  if (!(await erisimKaydet(supabase, b, 'yazma', 'randevu-olusturma', hasta.id, simdi))) return YOK
  const r = await randevuOlustur(supabase, hekimId, { gun: g.gun, saatDk: g.saatDk, sureDk: g.sureDk, yineDe: g.yineDe, hastaId: hasta.id, neden: '' }, simdi)
  return r.tamam ? { tamam: true, randevu: randevu(r.randevu) } : r
}

/** Moves an appointment of that doctor, or sets its status (arrived, did not come, cancelled, planned — never "done"). */
export async function onBuroRandevuDegistir(supabase: SupabaseClient, benId: string, hekimId: string, randevuId: string, d: { durum: RandevuDurumu } | { zaman: ZamanGirdisi }, simdi = Date.now()): Promise<{ tamam: true; randevu: OnBuroRandevusu } | Ret> {
  if ('durum' in d && !ON_BURO_DURUMLARI.includes(d.durum)) return { tamam: false, kod: 'GECIS_YOK' }
  const b = await yetkiBul(supabase, benId, hekimId, 'on-buro-randevu', null, simdi)
  if (!b) return YOK
  // ISOLATION: the appointment must be THAT DOCTOR's (id and doctor in one query) before the record names its patient.
  const mevcut = await randevuGetir(supabase, hekimId, randevuId)
  if (!mevcut) return YOK
  if (!(await erisimKaydet(supabase, b, 'yazma', 'randevu-degisiklik', mevcut.hastaAdi ? mevcut.hastaId : null, simdi))) return YOK
  const r = 'durum' in d ? await randevuDurumDegistir(supabase, hekimId, randevuId, d.durum) : await randevuTasi(supabase, hekimId, randevuId, d.zaman, simdi)
  return r.tamam ? { tamam: true, randevu: randevu(r.randevu) } : r
}

/** A NEW portal link and PIN for one of that doctor's patients, answered once. The link before it stops working at once. */
export async function onBuroPortalVer(supabase: SupabaseClient, benId: string, hekimId: string, hastaId: string, simdi = Date.now()): Promise<{ tamam: true; yol: string; pin: string; sonGecerlilik: string } | { tamam: false; kod: 'NOT_FOUND' | 'HAZIR_DEGIL' | 'BASARISIZ' }> {
  const b = await yetkiBul(supabase, benId, hekimId, 'on-buro-portal', null, simdi)
  if (!b) return { tamam: false, kod: 'NOT_FOUND' }
  const hasta = await hastaGetir(supabase, hekimId, hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  if (!(await erisimKaydet(supabase, b, 'yazma', 'portal-baglantisi', hasta.id, simdi))) return { tamam: false, kod: 'NOT_FOUND' }
  const r = await portalErisimVer(supabase, hekimId, hasta.id, simdi)
  return r.tamam ? { tamam: true, yol: r.yol, pin: r.pin, sonGecerlilik: r.sonGecerlilik } : r
}

/**
 * Asks one of that doctor's patients for the intake form (and gives access in the same step where the patient has
 * no link that works). The answer says whether a form and a link were made and carries a NEW link's address and
 * PIN — never a question, never an answer of the form.
 */
export async function onBuroFormIste(supabase: SupabaseClient, benId: string, hekimId: string, g: { hastaId: string; randevuId?: string | null }, icerik: HastaFormuIcerigi, simdi = Date.now()): Promise<{ tamam: true; yeniForm: boolean; erisim: 'yeni' | 'var'; davetDili: string; yol?: string; pin?: string } | { tamam: false; kod: 'NOT_FOUND' | 'HAZIR_DEGIL' | 'DURUM' | 'ACIK_VAR' | 'BASARISIZ' }> {
  const b = await yetkiBul(supabase, benId, hekimId, 'on-buro-portal', null, simdi)
  if (!b) return { tamam: false, kod: 'NOT_FOUND' }
  const hasta = await hastaGetir(supabase, hekimId, g.hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  if (!(await erisimKaydet(supabase, b, 'yazma', 'form-istegi', hasta.id, simdi))) return { tamam: false, kod: 'NOT_FOUND' }
  const r = await formIste(supabase, hekimId, { hastaId: hasta.id, randevuId: g.randevuId ?? null, yeniBaglanti: false }, icerik, simdi)
  if (!r.tamam) return r
  return { tamam: true, yeniForm: r.yeniForm, erisim: r.erisim, davetDili: r.davetDili, ...(r.yol && r.pin ? { yol: r.yol, pin: r.pin } : {}) }
}

// ───────────────────────── the clinic's schedule: owner and administrator ─────────────────────────

/**
 * THE CLINIC'S SCHEDULE for its owner and an administrator: for each member who sees patients, WHEN that member has
 * an appointment and whether it still holds its time. BY POSITION, so it carries NOTHING OF ANY PATIENT — not a
 * name, not an id, not a reason: the row is built from four columns and the patient's is not among them.
 * Times are written in the VIEWER's own time zone. null = not theirs to see.
 */
export async function klinikTakvimi(supabase: SupabaseClient, benId: string, ilkGun: string, gunSayisi: number): Promise<{ hekimler: { hekimId: string; ad: string }[]; dilimler: KlinikTakvimDilimi[] } | null> {
  if (!klinikAyarlari() || !gunGecerli(ilkGun) || !Number.isInteger(gunSayisi) || gunSayisi < 1 || gunSayisi > 7) return null
  const ben = await uyelikOku(supabase, benId)
  if (!ben || !yoneticiMi(ben.konum)) return null
  const { data: uyeler } = await ulkeTablosu(supabase, 'ulke_klinik_uyeleri').select('doctor_id, konum').eq('klinik_id', ben.klinikId).limit(500)
  const hekimIdleri = ((uyeler as { doctor_id: string; konum: string }[] | null) ?? []).filter((u) => hastaSahibiOlabilir(u.konum as never)).map((u) => u.doctor_id)
  const adlar = await hesapAdlari(supabase, hekimIdleri)
  const dilim = await hesapSaatDilimi(supabase, benId)
  const bas = new Date(yerelUtc(ilkGun, 0, dilim)).toISOString(), bit = new Date(yerelUtc(gunEkle(ilkGun, gunSayisi), 0, dilim)).toISOString()
  const dilimler: KlinikTakvimDilimi[] = []
  for (const hekimId of hekimIdleri) {
    const { data } = await ulkeTablosu(supabase, 'ulke_randevulari').select('doctor_id, baslangic, bitis, durum').eq('doctor_id', hekimId).gte('baslangic', bas).lt('baslangic', bit).order('baslangic', { ascending: true }).limit(500)
    for (const s of (data as { baslangic: string; bitis: string; durum: string }[] | null) ?? []) {
      const b0 = new Date(s.baslangic).getTime(), b1 = new Date(s.bitis).getTime()
      const y = yerelAn(b0, dilim)
      dilimler.push({ hekimId, baslangic: new Date(b0).toISOString(), bitis: new Date(b1).toISOString(), gun: y.gun, saat: saatYazDk(y.dakika), sureDk: Math.round((b1 - b0) / DAKIKA_MS), durum: String(s.durum) })
    }
  }
  return { hekimler: hekimIdleri.map((id) => ({ hekimId: id, ad: adlar.get(id) ?? '' })), dilimler: dilimler.sort((a, b) => (a.baslangic < b.baslangic ? -1 : a.baslangic > b.baslangic ? 1 : 0)) }
}
