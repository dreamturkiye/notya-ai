/**
 * NOTYA-ULKE-INTAKE-01 — THE INTAKE FORM on the server: the doctor asks for it, the patient fills it in, the doctor
 * reads it.
 *
 * THE DOCTOR'S SIDE. From a patient's file or from an appointment the doctor asks the patient to fill in the form.
 * ONE database function (migration 138) creates the form and, in the same transaction, gives the patient portal
 * access where they have no link that works — so the doctor is never left with a form nobody can reach. A new link
 * and its PIN are answered ONCE, exactly as when access is given by hand (lib/ulke/portal/erisim.ts): the database
 * keeps only hashes. NOTHING IS SENT TO ANYBODY: the doctor copies an invitation text and sends it themselves.
 *
 * THE PATIENT'S SIDE. Every function takes a signed-in portal session and NO id: the form is the open form of THAT
 * session's doctor and patient. Answers are saved as the patient goes (a draft), submitted ONCE, and read-only
 * afterwards; only the doctor reopens a form. The database holds the same rule in a trigger.
 *
 * WHICH QUESTIONS. Decided by ./sorular.ts from what the form's own row says: the role it was asked with, whether it
 * is the guardian form, and the patient's recorded sex. A question of another role is never sent to the page, and an
 * answer to one is never stored or shown — whatever a browser sends.
 *
 * ANSWERS ARE HEALTH DATA. One value, encrypted with the same helper as the rest of a patient's data
 * (lib/security/encryption.ts). The country, the doctor and the patient are INSIDE the encrypted value as well as in
 * the row's key: an encrypted value that is not this row's own is read as "no answers". Every statement carries the
 * doctor's id and the patient's, and is bound to this build's country (lib/ulke/uygulama/tablolar.ts).
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation:
 * a patient id or a form id from a doctor's request is matched against the authenticated doctor in the same
 * statement that reads the row; another doctor's patient or form answers exactly like one that does not exist.
 *
 * NOT GIVEN TO THE MODEL. Nothing here is read by the note-writing path (lib/ulke/uygulama/notlar.ts); whether it
 * ever should be is a later decision (docs/OPEN-COMMITMENTS.md).
 *
 * The pack's questions come in as an argument (`icerik`), so these rules are proven with questions of no country.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { formMetni, hastaIcinBicim, rolAdi, veliYasindaMi } from '../arayuz'
import { sayiYaz } from '../arayuz/sayi'
import { anahtarHash, anahtarUret, pinHashle, pinUret } from '../portal/pin'
import { baglantiGecerlilikGun } from '../portal/erisim'
import type { PortalKimligi } from '../portal/giris'
import { PORTAL_SAYFASI } from '../portal/sabitler'
import type { Birimler, DilKodu } from '../tipler'
import { aktifUlke, ulkePaketi } from '../ulke'
import { hastaGetir, type Hasta } from '../uygulama/hastalar'
import { hekimDilleri } from '../uygulama/muayeneKaydi'
import { hekimRolunuOku } from '../uygulama/rol'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeIslevi, ulkeTablosu } from '../uygulama/tablolar'
import { yerelAn } from '../uygulama/zaman'
import { CEVAPLAR_AZAMI, cevaplariSuz, cevapMetni, eksikZorunlular, formBolumleri, formGorunumu, formSorulari, type FormBaglami } from './sorular'
import type { Cevaplar, FormDurumu, FormIstegiSonucu, HastaFormuGorunumu, HastaFormuIcerigi, HekimFormu } from './tipler'

const TABLO = 'ulke_hasta_formlari'
const KOLONLAR = 'id, patient_id, randevu_id, rol, soru_surumu, veli, durum, cevaplar_encrypted, dil, riza_surumu, riza_at, gonderildi_at, yeniden_acildi_at, created_at, updated_at'
type Satir = {
  id: string; patient_id: string; randevu_id: string | null; rol: string | null; soru_surumu: string; veli: boolean; durum: string
  cevaplar_encrypted: string | null; dil: string | null; riza_surumu: string | null; riza_at: string | null
  gonderildi_at: string | null; yeniden_acildi_at: string | null; created_at: string; updated_at: string | null
}
const ACIK: readonly FormDurumu[] = ['bekliyor', 'taslak']
const TEKIL_IHLALI = '23505'
const GUN_MS = 86_400_000
/** How many forms of a patient the doctor's screens list, newest first. */
export const FORM_LISTE_AZAMI = 10

const durumMu = (ham: unknown): ham is FormDurumu => ham === 'bekliyor' || ham === 'taslak' || ham === 'gonderildi' || ham === 'iptal'
const birimler = (): Birimler => ulkePaketi().uygulama?.birimler ?? { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }

/** Who the form of a row is for. The role counts only while the pack still has questions for it. */
const baglam = (s: Pick<Satir, 'rol' | 'veli'>, hasta: Pick<Hasta, 'cinsiyet'>, icerik: HastaFormuIcerigi): FormBaglami => ({
  rol: s.rol && Object.prototype.hasOwnProperty.call(icerik.roller, s.rol) ? s.rol : null,
  veli: s.veli === true,
  cinsiyet: hasta.cinsiyet,
})

// ───────────────────────── the encrypted value ─────────────────────────

type Zarf = { v: 1; u: string; d: string; h: string; c: unknown }
/** The answers with the country, the doctor and the patient they belong to, as one encrypted value. */
const sifrele = (doktorId: string, hastaId: string, cevaplar: Cevaplar): string => encrypt(JSON.stringify({ v: 1, u: aktifUlke(), d: doktorId, h: hastaId, c: cevaplar } satisfies Zarf))
/** What a row's value holds — or nothing at all when it is not THIS country's, doctor's and patient's own value. */
function coz(ham: unknown, doktorId: string, hastaId: string): unknown {
  if (typeof ham !== 'string' || !ham) return null
  try {
    const z = JSON.parse(decrypt(ham)) as Partial<Zarf> | null
    return z && z.v === 1 && z.u === aktifUlke() && z.d === doktorId && z.h === hastaId ? z.c ?? null : null
  } catch { return null }
}

// ───────────────────────── the doctor's side ─────────────────────────

export type FormRetKodu = 'NOT_FOUND' | 'HAZIR_DEGIL' | 'DURUM' | 'ACIK_VAR' | 'BASARISIZ'

/**
 * The doctor asks one of THEIR patients to fill in the form, optionally for one of that patient's appointments.
 * An open form is kept as it is. Portal access is given in the same step where the patient has no link that works,
 * or where the doctor asks for a new one (`yeniBaglanti`: the link before it stops working at once).
 */
export async function formIste(supabase: SupabaseClient, doktorId: string, g: { hastaId: string; randevuId?: string | null; yeniBaglanti?: boolean }, icerik: HastaFormuIcerigi, simdi = Date.now()): Promise<({ tamam: true } & FormIstegiSonucu) | { tamam: false; kod: FormRetKodu }> {
  const gun = baglantiGecerlilikGun()
  if (gun === null) return { tamam: false, kod: 'HAZIR_DEGIL' }
  // ISOLATION: the patient must be this doctor's before anything is written for them.
  const hasta = await hastaGetir(supabase, doktorId, g.hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  // The questions that follow the core ones are those of the doctor's own role — today's role, fixed on the form.
  const hekimRolu = await hekimRolunuOku(supabase, doktorId)
  const rol = hekimRolu && Object.prototype.hasOwnProperty.call(icerik.roller, hekimRolu) ? hekimRolu : null
  // The guardian form: the kit's one age rule, on today's date in the doctor's own time zone.
  const bugun = yerelAn(simdi, await hesapSaatDilimi(supabase, doktorId)).gun
  const veli = veliYasindaMi(rol, hasta.dogumTarihi, bugun)
  // A link and a PIN are made ready every time; the database uses them only where a new link is given.
  const token = anahtarUret()
  const pin = pinUret()
  const { data, error } = await ulkeIslevi(supabase, 'ulke_hasta_formu_iste', {
    p_doctor_id: doktorId, p_patient_id: hasta.id, p_randevu_id: g.randevuId ?? null, p_rol: rol, p_soru_surumu: icerik.surum, p_veli: veli,
    p_yeni_baglanti: g.yeniBaglanti === true, p_token_hash: anahtarHash(token), p_pin_hash: await pinHashle(pin),
    p_son_gecerlilik: new Date(simdi + gun * GUN_MS).toISOString(), p_simdi: new Date(simdi).toISOString(),
  })
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  const d = data as { durum?: string; form_id?: string; yeni_form?: boolean; erisim?: string } | null
  if (d?.durum === 'NOT_FOUND') return { tamam: false, kod: 'NOT_FOUND' }
  if (d?.durum !== 'TAMAM' || !d.form_id) return { tamam: false, kod: 'BASARISIZ' }
  const h = await hekimDilleri(supabase, doktorId)
  const davetDili = hastaIcinBicim(hasta.dil, { dil: h.arayuzDili, notDili: h.notDili })
  const yeni = d.erisim === 'YENI'
  return {
    tamam: true, formId: d.form_id, yeniForm: d.yeni_form === true, erisim: yeni ? 'yeni' : 'var', davetDili,
    // The token and the PIN leave the server only when the database really made the link with them.
    ...(yeni ? { yol: `${PORTAL_SAYFASI}?dil=${encodeURIComponent(davetDili)}#${token}`, pin } : {}),
  }
}

/**
 * The forms of one of THIS doctor's patients, newest first, withdrawn ones left out. A SUBMITTED form carries its
 * answers as text in the doctor's own form; an open one carries none (it is the patient's working copy).
 * null = not this doctor's patient.
 */
export async function hastaninFormlari(supabase: SupabaseClient, doktorId: string, hastaId: string, icerik: HastaFormuIcerigi): Promise<HekimFormu[] | null> {
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return null
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('doctor_id', doktorId).eq('patient_id', hasta.id).neq('durum', 'iptal').order('created_at', { ascending: false }).limit(FORM_LISTE_AZAMI)
  if (error || !data) throw new Error('[ulke/intake] the forms of a patient could not be read')
  const dil = (await hekimDilleri(supabase, doktorId)).arayuzDili
  const f = formMetni(dil)
  const soz = { evet: f.hasta.evet, hayir: f.hasta.hayir, birim: f.birim }
  return (data as Satir[]).filter((s) => durumMu(s.durum) && s.patient_id === hasta.id).map((s): HekimFormu => {
    const k = baglam(s, hasta, icerik)
    let bolumler: HekimFormu['bolumler'] = null
    if (s.durum === 'gonderildi') {
      const cevaplar = cevaplariSuz(formSorulari(icerik, k), coz(s.cevaplar_encrypted, doktorId, hasta.id), birimler())
      bolumler = formBolumleri(icerik, k)
        .map((b) => ({
          baslik: Object.prototype.hasOwnProperty.call(b.baslik, dil) ? b.baslik[dil] : '',
          satirlar: b.sorular.map((q) => ({ soru: (k.veli && q.veliMetni?.[dil]) || q.metin[dil] || '', cevap: cevapMetni(q, cevaplar[q.anahtar], dil, soz, (n) => sayiYaz(n, Number.isInteger(n) ? 0 : 1)) })).filter((x) => x.cevap),
        }))
        .filter((b) => b.satirlar.length > 0)
    }
    return {
      id: s.id, durum: s.durum as FormDurumu, veli: k.veli, rolAdi: (k.rol ? rolAdi(k.rol, dil) : null) ?? '', randevuId: s.randevu_id ?? null,
      olusturuldu: s.created_at, gonderildi: s.gonderildi_at ?? null, yenidenAcildi: s.yeniden_acildi_at ?? null,
      surumFarkli: s.soru_surumu !== icerik.surum, bolumler,
    }
  })
}

/** One form of THIS doctor, by its id and the doctor in the same statement. */
async function hekimFormu(supabase: SupabaseClient, doktorId: string, formId: string): Promise<Satir | null> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('id', formId).eq('doctor_id', doktorId).maybeSingle()
  const s = error || !data ? null : (data as Satir)
  // Second line: the form's patient must be this doctor's as well (the key makes anything else impossible).
  return s && (await hastaGetir(supabase, doktorId, s.patient_id)) ? s : null
}

/**
 * The doctor REOPENS a submitted form: it is a draft again, with the same answers, and the patient may change them
 * and must submit again. 'DURUM' = the form is not a submitted one; 'ACIK_VAR' = the patient has another open form.
 */
export async function formYenidenAc(supabase: SupabaseClient, doktorId: string, formId: string, simdi = Date.now()): Promise<{ tamam: true } | { tamam: false; kod: FormRetKodu }> {
  const s = await hekimFormu(supabase, doktorId, formId)
  if (!s) return { tamam: false, kod: 'NOT_FOUND' }
  const an = new Date(simdi).toISOString()
  const { data, error } = await ulkeTablosu(supabase, TABLO)
    .update({ durum: 'taslak', gonderildi_at: null, yeniden_acildi_at: an, updated_at: an })
    .eq('id', s.id).eq('doctor_id', doktorId).eq('patient_id', s.patient_id).eq('durum', 'gonderildi')
    .select('id')
  if (error) return { tamam: false, kod: (error as { code?: string }).code === TEKIL_IHLALI ? 'ACIK_VAR' : 'BASARISIZ' }
  return (data as unknown[] | null)?.length ? { tamam: true } : { tamam: false, kod: 'DURUM' }
}

/** The doctor WITHDRAWS a form that was not submitted: it disappears from the patient's page. A submitted form is never withdrawn. */
export async function formGeriCek(supabase: SupabaseClient, doktorId: string, formId: string, simdi = Date.now()): Promise<{ tamam: true } | { tamam: false; kod: FormRetKodu }> {
  const s = await hekimFormu(supabase, doktorId, formId)
  if (!s) return { tamam: false, kod: 'NOT_FOUND' }
  const an = new Date(simdi).toISOString()
  const { data, error } = await ulkeTablosu(supabase, TABLO)
    .update({ durum: 'iptal', iptal_at: an, updated_at: an })
    .eq('id', s.id).eq('doctor_id', doktorId).eq('patient_id', s.patient_id).in('durum', [...ACIK])
    .select('id')
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  return (data as unknown[] | null)?.length ? { tamam: true } : { tamam: false, kod: 'DURUM' }
}

// ───────────────────────── the patient's side ─────────────────────────

/** The form's language: the patient's own; where it has several scripts, the one the doctor uses. Decided by the server. */
async function hastaBicimi(supabase: SupabaseClient, doktorId: string, hasta: Hasta): Promise<DilKodu> {
  const h = await hekimDilleri(supabase, doktorId)
  return hastaIcinBicim(hasta.dil, { dil: h.arayuzDili, notDili: h.notDili })
}

/** The rows of the session's own doctor AND patient that the patient may see: open and submitted, newest first. */
async function hastaninSatirlari(supabase: SupabaseClient, kim: Pick<PortalKimligi, 'doktorId' | 'hastaId'>): Promise<Satir[]> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('doctor_id', kim.doktorId).eq('patient_id', kim.hastaId).in('durum', ['bekliyor', 'taslak', 'gonderildi']).order('created_at', { ascending: false }).limit(FORM_LISTE_AZAMI)
  return error || !data ? [] : (data as Satir[]).filter((s) => s.patient_id === kim.hastaId)
}

function gorunum(s: Satir, hasta: Hasta, dil: DilKodu, doktorId: string, icerik: HastaFormuIcerigi): HastaFormuGorunumu {
  const k = baglam(s, hasta, icerik)
  const riza = k.veli ? icerik.riza.veliMetni : icerik.riza.metin
  return {
    id: s.id, durum: s.durum as HastaFormuGorunumu['durum'], veli: k.veli, dil,
    riza: { metin: Object.prototype.hasOwnProperty.call(riza, dil) ? riza[dil] : '', kabul: Boolean(s.riza_at) },
    bolumler: formGorunumu(icerik, k, dil, birimler(), formMetni(dil).birim),
    cevaplar: cevaplariSuz(formSorulari(icerik, k), coz(s.cevaplar_encrypted, doktorId, hasta.id), birimler()),
    gonderildi: s.gonderildi_at ?? null,
  }
}

/** What the patient's page shows about forms before it opens one: is one waiting, and was one sent? No question, no answer. */
export type HastaFormuOzeti = { durum: 'bekliyor' | 'taslak' | 'gonderildi'; veli: boolean; gonderildi: string | null; yenidenAcildi: boolean }
export async function hastaFormuOzeti(supabase: SupabaseClient, kim: Pick<PortalKimligi, 'doktorId' | 'hastaId'>): Promise<HastaFormuOzeti | null> {
  const satirlar = await hastaninSatirlari(supabase, kim)
  const s = satirlar.find((x) => (ACIK as readonly string[]).includes(x.durum)) ?? satirlar.find((x) => x.durum === 'gonderildi')
  return s ? { durum: s.durum as HastaFormuOzeti['durum'], veli: s.veli === true, gonderildi: s.gonderildi_at ?? null, yenidenAcildi: Boolean(s.yeniden_acildi_at) && s.durum !== 'gonderildi' } : null
}

/**
 * The patient's form: the open one (to fill in), else the last one they submitted (to read). null = the patient has
 * neither, or the session's patient is not there any more.
 */
export async function hastaFormuOku(supabase: SupabaseClient, kim: Pick<PortalKimligi, 'doktorId' | 'hastaId'>, icerik: HastaFormuIcerigi): Promise<HastaFormuGorunumu | null> {
  const hasta = await hastaGetir(supabase, kim.doktorId, kim.hastaId)
  if (!hasta) return null
  const satirlar = await hastaninSatirlari(supabase, kim)
  const s = satirlar.find((x) => (ACIK as readonly string[]).includes(x.durum)) ?? satirlar.find((x) => x.durum === 'gonderildi')
  return s ? gorunum(s, hasta, await hastaBicimi(supabase, kim.doktorId, hasta), kim.doktorId, icerik) : null
}

export type HastaFormuRetKodu = 'NOT_FOUND' | 'RIZA_GEREKLI' | 'EKSIK' | 'GECERSIZ' | 'BASARISIZ'
export type HastaFormuSonucu = { tamam: true; form: HastaFormuGorunumu } | { tamam: false; kod: HastaFormuRetKodu; eksik?: string[] }

/**
 * SAVES (a draft) or SUBMITS (once) the open form of the session's own doctor and patient. The statement that writes
 * carries "still open": a form that was submitted or withdrawn a moment ago is not written to ('NOT_FOUND').
 * Nothing is saved before the consent sentence is accepted; a form with a required question unanswered is not submitted.
 */
export async function hastaFormuYaz(supabase: SupabaseClient, kim: Pick<PortalKimligi, 'doktorId' | 'hastaId'>, g: { cevaplar: unknown; riza: unknown; gonder: boolean }, icerik: HastaFormuIcerigi, simdi = Date.now()): Promise<HastaFormuSonucu> {
  // The patient, by the session's doctor AND patient: a session without its patient writes nothing.
  const hasta = await hastaGetir(supabase, kim.doktorId, kim.hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  const s = (await hastaninSatirlari(supabase, kim)).find((x) => (ACIK as readonly string[]).includes(x.durum))
  if (!s) return { tamam: false, kod: 'NOT_FOUND' }
  if (!s.riza_at && g.riza !== true) return { tamam: false, kod: 'RIZA_GEREKLI' }
  const sorular = formSorulari(icerik, baglam(s, hasta, icerik))
  // Only answers to THIS form's questions, each in its stored shape: anything else a browser sent is dropped here.
  const cevaplar = cevaplariSuz(sorular, g.cevaplar, birimler())
  if (JSON.stringify(cevaplar).length > CEVAPLAR_AZAMI) return { tamam: false, kod: 'GECERSIZ' }
  if (g.gonder) {
    const eksik = eksikZorunlular(sorular, cevaplar)
    if (eksik.length) return { tamam: false, kod: 'EKSIK', eksik }
  }
  const an = new Date(simdi).toISOString()
  const dil = await hastaBicimi(supabase, kim.doktorId, hasta)
  const { data, error } = await ulkeTablosu(supabase, TABLO)
    .update({
      cevaplar_encrypted: sifrele(kim.doktorId, hasta.id, cevaplar), dil,
      riza_surumu: s.riza_surumu ?? icerik.riza.surum, riza_at: s.riza_at ?? an,
      ...(g.gonder ? { durum: 'gonderildi', gonderildi_at: an } : { durum: 'taslak' }), updated_at: an,
    })
    .eq('id', s.id).eq('doctor_id', kim.doktorId).eq('patient_id', hasta.id).in('durum', [...ACIK])
    .select(KOLONLAR)
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  const yeni = ((data as Satir[] | null) ?? [])[0]
  if (!yeni) return { tamam: false, kod: 'NOT_FOUND' }
  return { tamam: true, form: gorunum(yeni, hasta, dil, kim.doktorId, icerik) }
}
