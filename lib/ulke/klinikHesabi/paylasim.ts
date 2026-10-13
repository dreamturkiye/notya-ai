/**
 * NOTYA-ULKE-KLINIK-01 — READING ANOTHER DOCTOR'S PATIENT through a grant: a SHARE with an allied professional (one
 * named patient) and COVER by another doctor (that doctor's patients, for a stated period). Server only.
 *
 * READ-ONLY, AND APPROVED NOTES ONLY. Nothing here writes a patient, a visit, a note or an appointment. What is
 * answered about a visit is the APPROVED note's four sections and the fields its template owns — built field by
 * field (`onayliNot`): never a draft, never the second-language draft, never the transcript, never the recording,
 * never an intake form, a tool record or a summary for the patient.
 *
 * COVER IS READ-ONLY IN THIS BUILD. A covering doctor cannot record a visit on the patient: a visit belongs, by the
 * key the visit table has always had, to the doctor who owns the patient, and no existing table is altered for clinic
 * accounts. Writing under cover is absent, and listed (docs/OPEN-COMMITMENTS.md, NOTYA-ULKE-KLINIK-01).
 *
 * WHAT COVER READS: approved notes and appointments (with the reason: the reader is a doctor standing in for the
 * doctor). WHAT A SHARE READS: the approved notes of the one patient it names, and that patient's name and birth
 * date. A share gives no appointment and no other patient.
 *
 * EVERY FUNCTION: the check and the record first (./yetki.ts), then the OWNING doctor's library functions with the
 * OWNING doctor's id, which prove every patient and note id to be that doctor's.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotIcerigi } from '../tipler'
import { ulkePaketi } from '../ulke'
import { hastaGetir, hastalariListele, type Hasta } from '../uygulama/hastalar'
import { hastaninMuayeneleri } from '../uygulama/muayeneler'
import { notGetir } from '../uygulama/notlar'
import { randevulariListele, type Randevu } from '../uygulama/randevular'
import { gunGecerli } from '../uygulama/zaman'
import { alinanYetkiler, erisimKaydet, yetkiBul, yetkiyle, type YetkiBaglami } from './yetki'
import { ARAMA_ASGARI_KARAKTER, ARAMA_SONUC_AZAMI, type KlinikYetkiTuru } from './tipler'

/** How many approved notes of one patient one request answers with, newest first. */
export const PAYLASILAN_NOT_AZAMI = 20

/** What a reader through a grant sees of the patient: who it is, and nothing by which to reach them. */
export type PaylasilanHasta = { id: string; ad: string; otaIsmi: string; dogumTarihi: string }
export const PAYLASILAN_HASTA_ALANLARI: readonly (keyof PaylasilanHasta)[] = ['id', 'ad', 'otaIsmi', 'dogumTarihi']
const hastaKimligi = (h: Pick<Hasta, 'id' | 'ad' | 'otaIsmi' | 'dogumTarihi'>): PaylasilanHasta => ({ id: h.id, ad: h.ad, otaIsmi: h.otaIsmi, dogumTarihi: h.dogumTarihi })

/** AN APPROVED NOTE as a reader through a grant sees it. */
export type PaylasilanNot = { notId: string; muayeneTarihi: string; onayTarihi: string; dil: string; sablon: string; icerik: NotIcerigi; alanAnahtarlari: readonly string[] }
export const PAYLASILAN_NOT_ALANLARI: readonly (keyof PaylasilanNot)[] = ['notId', 'muayeneTarihi', 'onayTarihi', 'dil', 'sablon', 'icerik', 'alanAnahtarlari']

/** An appointment as a covering doctor sees it: read-only, with its reason. */
export type VekaletRandevusu = { id: string; hastaId: string; hastaAdi: string; baslangic: string; bitis: string; gun: string; saat: string; sureDk: number; neden: string; durum: string }
export const VEKALET_RANDEVU_ALANLARI: readonly (keyof VekaletRandevusu)[] = ['id', 'hastaId', 'hastaAdi', 'baslangic', 'bitis', 'gun', 'saat', 'sureDk', 'neden', 'durum']
const vekaletRandevusu = (r: Randevu): VekaletRandevusu => ({ id: r.id, hastaId: r.hastaId, hastaAdi: r.hastaAdi, baslangic: r.baslangic, bitis: r.bitis, gun: r.gun, saat: r.saat, sureDk: r.sureDk, neden: r.neden, durum: r.durum })

export type PaylasilanSatir = { yetkiId: string; tur: Extract<KlinikYetkiTuru, 'paylasim' | 'vekalet'>; hekimId: string; hekimAdi: string; hastaId: string | null; bitis: string | null }

/**
 * What stands open to THIS member now: each share (the doctor and the patient's id) and each cover (the doctor and
 * when it ends). Doctor names are names of accounts; NOTHING OF A PATIENT but the id the grant itself names — the
 * patient's name is read, and recorded, by `paylasilanHasta`.
 */
export async function paylasilanlar(supabase: SupabaseClient, benId: string, simdi = Date.now()): Promise<PaylasilanSatir[]> {
  const hepsi = await alinanYetkiler(supabase, benId, simdi)
  const cikti: PaylasilanSatir[] = []
  for (const y of hepsi) {
    if (y.tur !== 'paylasim' && y.tur !== 'vekalet') continue
    // The full check, role included: a grant that stands for a member who no longer works in a fitting role opens nothing.
    if (!(await yetkiBul(supabase, benId, y.hekimId, y.tur, y.tur === 'paylasim' ? y.hastaId : null, simdi))) continue
    cikti.push({ yetkiId: y.id, tur: y.tur, hekimId: y.hekimId, hekimAdi: y.hekimAdi, hastaId: y.hastaId, bitis: y.bitis })
  }
  return cikti
}

/** The grant by which THIS member may read THAT patient of THAT doctor now: a share of the patient, else cover. null = none. */
async function okumaYetkisi(supabase: SupabaseClient, benId: string, hekimId: string, hastaId: string, simdi: number): Promise<YetkiBaglami | null> {
  return (await yetkiBul(supabase, benId, hekimId, 'paylasim', hastaId, simdi)) ?? (await yetkiBul(supabase, benId, hekimId, 'vekalet', null, simdi))
}

/** Who a patient is, for a reader through a grant. null = no grant, or not that doctor's patient. */
export async function paylasilanHasta(supabase: SupabaseClient, benId: string, hekimId: string, hastaId: string, simdi = Date.now()): Promise<PaylasilanHasta | null> {
  const b = await okumaYetkisi(supabase, benId, hekimId, hastaId, simdi)
  if (!b) return null
  // ISOLATION: the patient must be THAT DOCTOR's — proven before the record names them and before anything is answered.
  const hasta = await hastaGetir(supabase, hekimId, hastaId)
  if (!hasta) return null
  if (!(await erisimKaydet(supabase, b, 'okuma', 'hasta-karti', hasta.id, simdi))) return null
  return hastaKimligi(hasta)
}

/** THE APPROVED NOTES of one patient of that doctor, newest first, with who the patient is. null = no grant, or not that doctor's patient. */
export async function paylasilanNotlar(supabase: SupabaseClient, benId: string, hekimId: string, hastaId: string, simdi = Date.now()): Promise<{ hasta: PaylasilanHasta; notlar: PaylasilanNot[] } | null> {
  const b = await okumaYetkisi(supabase, benId, hekimId, hastaId, simdi)
  if (!b) return null
  const hasta = await hastaGetir(supabase, hekimId, hastaId)
  if (!hasta) return null
  if (!(await erisimKaydet(supabase, b, 'okuma', 'not-listesi', hasta.id, simdi))) return null
  const muayeneler = await hastaninMuayeneleri(supabase, hekimId, hasta.id)
  const notlar: PaylasilanNot[] = []
  for (const m of (muayeneler ?? []).filter((x) => x.durum === 'onayli' && x.notId).slice(0, PAYLASILAN_NOT_AZAMI)) {
    const n = await notGetir(supabase, hekimId, m.notId as string)
    // APPROVED ONLY — asked of the note itself, not of the list that named it; and the note must be this patient's.
    if (!n || !n.onayli || !n.onayTarihi || n.muayene.hasta?.id !== hasta.id) continue
    notlar.push({ notId: n.notId, muayeneTarihi: n.muayene.baslangic, onayTarihi: n.onayTarihi, dil: n.dil, sablon: n.muayene.sablon, icerik: { s: n.icerik.s, o: n.icerik.o, a: n.icerik.a, p: n.icerik.p, ...(n.icerik.alanlar ? { alanlar: n.icerik.alanlar } : {}) }, alanAnahtarlari: [...n.alanAnahtarlari] })
  }
  return { hasta: hastaKimligi(hasta), notlar }
}

/** COVER: finds patients of the doctor covered for, by name or second name. At least ARAMA_ASGARI_KARAKTER characters; never the whole list. */
export async function vekaletHastaAra(supabase: SupabaseClient, benId: string, hekimId: string, q: string, simdi = Date.now()): Promise<{ tamam: true; hastalar: PaylasilanHasta[] } | { tamam: false; kod: 'NOT_FOUND' | 'ARAMA_KISA' | 'BASARISIZ' }> {
  const aranan = q.trim()
  if (aranan.length < ARAMA_ASGARI_KARAKTER) return { tamam: false, kod: 'ARAMA_KISA' }
  if (!(await yetkiyle(supabase, benId, hekimId, 'vekalet', { olay: 'okuma', ne: 'hasta-arama' }, simdi))) return { tamam: false, kod: 'NOT_FOUND' }
  const hepsi = await hastalariListele(supabase, hekimId)
  if (!hepsi) return { tamam: false, kod: 'BASARISIZ' }
  const katla = ulkePaketi().uygulama?.aramaKatla ?? ((s: string) => s.toLowerCase())
  const sozcukler = katla(aranan).split(/\s+/).filter(Boolean)
  const uyan = hepsi.map(hastaKimligi).filter((k) => sozcukler.length > 0 && sozcukler.every((s) => katla(`${k.ad} ${k.otaIsmi}`).includes(s)))
  return { tamam: true, hastalar: uyan.slice(0, ARAMA_SONUC_AZAMI) }
}

/** COVER: the appointments of the doctor covered for on the `gunSayisi` days from `ilkGun`. Read-only. null = no cover now. */
export async function vekaletRandevulari(supabase: SupabaseClient, benId: string, hekimId: string, ilkGun: string, gunSayisi: number, simdi = Date.now()): Promise<VekaletRandevusu[] | null> {
  if (!gunGecerli(ilkGun)) return null
  if (!(await yetkiyle(supabase, benId, hekimId, 'vekalet', { olay: 'okuma', ne: 'randevu-listesi' }, simdi))) return null
  const liste = await randevulariListele(supabase, hekimId, ilkGun, gunSayisi)
  return liste ? liste.map(vekaletRandevusu) : null
}
