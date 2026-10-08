/**
 * NOTYA-UZ-MUAYENE-01 — a visit: the recording becomes a transcript, stored with what was learned about its language.
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation:
 *   - the patient id comes from the request → proven to be THIS doctor's (hastaGetir: id and doctor in one query)
 *     BEFORE the recording is read or anything is written with it;
 *   - the recording's path comes from the request → it must lie in the folder named after THIS doctor's account id,
 *     checked as text before storage is touched (a path into another doctor's folder is refused, not looked up);
 *   - a visit id from a request is read with the doctor's id in the same query; a foreign id is "not found".
 *
 * THE RECORDING IS NOT KEPT. Once the path is known to be the caller's own, every way out of `muayeneKaydet` removes
 * the audio from storage — success, refusal or failure. The clinical record is the transcript and the note.
 *
 * Storage: the core `sessions` table, written as the rest of the product writes it (so later core features find
 * these visits), plus `muayene_dil_kaydi` (migration 132) for what the core table has no place for: consent, the
 * predicted language and its probability, whether a second pass ran, and whether confidence stayed low.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { MUAYENE_SES_KOVASI, type DilKodu } from '../tipler'
import { dilTercihleriniOku } from './dilTercihleri'
import { hastaGetir, type Hasta } from './hastalar'
import { konusmaTanimaHazir, konusmayiTani } from './konusmaTanima'
import { muayeneKotasiKullan } from './kota'

export type MuayeneGirdisi = { yol: string; hastaId: string; sablon: string; riza: boolean }
export type MuayeneRetKodu = 'RIZA_GEREKLI' | 'GECERSIZ' | 'NOT_FOUND' | 'HAZIR_DEGIL' | 'LIMIT' | 'SES_OKUNAMADI' | 'KISA_KAYIT' | 'BASARISIZ'
export type MuayeneSonucu =
  | { tamam: true; seansId: string; ikinciGecis: boolean; dusukGuven: boolean }
  | { tamam: false; kod: MuayeneRetKodu; alan?: string }

/** What the screens are told about the language of a visit. Never the provider's raw code or a number. */
export type KonusmaOzeti = {
  /** 'uz' | 'ru' (the pack's names), 'baska' for a language the country does not expect, '' when unknown. */
  dil: string
  /** false = the prediction was below the pack's threshold ("not determined, may be mixed"). */
  dilKesin: boolean
  ikinciGecis: boolean
  dusukGuven: boolean
}

export type MuayeneDetayi = {
  seansId: string
  baslangic: string
  sablon: string
  /** The transcript. */
  metin: string
  hasta: Pick<Hasta, 'id' | 'ad' | 'otaIsmi' | 'dogumTarihi'> | null
  notId: string | null
  notDurumu: 'taslak' | 'onayli' | 'notsuz'
  konusma: KonusmaOzeti | null
}

/** `<account id>/<file name>` and nothing else: no folders below, no dots that climb. */
export function sesYoluGecerli(doktorId: string, yol: unknown): yol is string {
  if (typeof yol !== 'string' || !yol.startsWith(`${doktorId}/`)) return false
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(yol.slice(doktorId.length + 1)) && !yol.includes('..')
}

/** The account's note language (and interface language), read by its own id. */
export async function hekimDilleri(supabase: SupabaseClient, doktorId: string): Promise<{ arayuzDili: DilKodu; notDili: DilKodu }> {
  const { data } = await supabase.from('users').select('ui_language').eq('id', doktorId).maybeSingle()
  const t = await dilTercihleriniOku(supabase, doktorId, (data as { ui_language?: unknown } | null)?.ui_language)
  return { arayuzDili: t.arayuzDili, notDili: t.notDili }
}

export async function muayeneKaydet(supabase: SupabaseClient, doktorId: string, g: MuayeneGirdisi): Promise<MuayeneSonucu> {
  const klinik = AKTIF_KLINIK
  if (!klinik) return { tamam: false, kod: 'HAZIR_DEGIL' }
  // A path that is not in the caller's own folder is refused as text: storage is not touched for it at all.
  if (!sesYoluGecerli(doktorId, g.yol)) return { tamam: false, kod: 'GECERSIZ', alan: 'yol' }
  const sesiSil = async () => { try { await supabase.storage.from(MUAYENE_SES_KOVASI).remove([g.yol]) } catch { /* nothing more to do */ } }

  try {
    // Consent first: without the tick-box the recording is not read, only removed.
    if (g.riza !== true) return { tamam: false, kod: 'RIZA_GEREKLI' }
    if (!klinik.sablonlar.includes(g.sablon)) return { tamam: false, kod: 'GECERSIZ', alan: 'sablon' }
    // ISOLATION: the patient must be this doctor's before the recording is read or a visit is written for them.
    const hasta = await hastaGetir(supabase, doktorId, g.hastaId)
    if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
    if (!konusmaTanimaHazir()) return { tamam: false, kod: 'HAZIR_DEGIL' }
    if (!(await muayeneKotasiKullan(supabase, doktorId, klinik.gunlukMuayeneLimiti))) return { tamam: false, kod: 'LIMIT' }

    const { data: ses, error: sesHatasi } = await supabase.storage.from(MUAYENE_SES_KOVASI).download(g.yol)
    if (sesHatasi || !ses) return { tamam: false, kod: 'SES_OKUNAMADI' }

    const { notDili } = await hekimDilleri(supabase, doktorId)
    const t = await konusmayiTani(ses, notDili)
    if (t.durum === 'hazir-degil') return { tamam: false, kod: 'HAZIR_DEGIL' }
    if (t.durum === 'okunamadi') return { tamam: false, kod: 'SES_OKUNAMADI' }
    if (t.secilen.metin.length < klinik.konusma.asgariKarakter) return { tamam: false, kod: 'KISA_KAYIT' }

    const rizaAni = new Date().toISOString()
    const { data: seans, error: seansHatasi } = await supabase
      .from('sessions')
      .insert({
        doctor_id: doktorId,
        patient_id: hasta.id,
        // The core table's own consent columns, so that core code reading a visit sees the consent too.
        patient_consent_given: true,
        patient_consent_at: rizaAni,
        ...(t.secilen.sureSn ? { duration_seconds: Math.round(t.secilen.sureSn) } : {}),
        // Core columns keep the core's own identifiers: the template key, and the core's word for an ordinary visit
        // (the only values its check constraint accepts are the pre-split application's). Neither is ever shown.
        specialty: g.sablon,
        session_type: 'muayene',
        status: 'completed',
        transcript_cleaned: t.secilen.metin,
      })
      .select('id')
      .single()
    const seansId = (seans as { id?: string } | null)?.id
    if (seansHatasi || !seansId) return { tamam: false, kod: 'BASARISIZ' }

    const { error: kayitHatasi } = await supabase.from('muayene_dil_kaydi').insert({
      session_id: seansId,
      doctor_id: doktorId,
      patient_id: hasta.id,
      riza_at: rizaAni,
      riza_surumu: klinik.riza.surum,
      stt_model: klinik.konusma.model,
      taninan_dil: t.taninanDil || null,
      dil_olasiligi: t.dilOlasiligi,
      ortalama_log_olasilik: t.secilen.ortalamaLogOlasilik,
      ikinci_gecis: t.ikinciGecis,
      ikinci_gecis_dili: t.ikinciGecisDili,
      secilen_gecis: t.secilenGecis,
      gecis_sayisi: t.gecisSayisi,
      dusuk_guven: t.dusukGuven,
      ses_suresi_sn: t.secilen.sureSn,
      not_dili: notDili,
      sablon: g.sablon,
    })
    if (kayitHatasi) {
      // A visit without its consent and language record is not kept.
      try { await supabase.from('sessions').delete().eq('id', seansId).eq('doctor_id', doktorId) } catch { /* reported as a failure either way */ }
      return { tamam: false, kod: 'BASARISIZ' }
    }
    return { tamam: true, seansId, ikinciGecis: t.ikinciGecis, dusukGuven: t.dusukGuven }
  } finally {
    await sesiSil()
  }
}

type KayitSatiri = { taninan_dil: string | null; dil_olasiligi: number | null; ikinci_gecis: boolean | null; dusuk_guven: boolean | null }

/** The language facts of a visit as the screens may know them. */
export function konusmaOzeti(k: KayitSatiri | null | undefined): KonusmaOzeti | null {
  const ayar = AKTIF_KLINIK?.konusma
  if (!k || !ayar) return null
  const kod = String(k.taninan_dil ?? '')
  return {
    dil: !kod ? '' : ayar.beklenenDiller[kod] ?? 'baska',
    dilKesin: typeof k.dil_olasiligi !== 'number' || k.dil_olasiligi >= ayar.dilOlasiligiEsigi,
    ikinciGecis: k.ikinci_gecis === true,
    dusukGuven: k.dusuk_guven === true,
  }
}

/** One visit of THIS doctor with its transcript, or null — for a foreign id exactly as for one that does not exist. */
export async function muayeneGetir(supabase: SupabaseClient, doktorId: string, seansId: string): Promise<MuayeneDetayi | null> {
  const { data: s, error } = await supabase
    .from('sessions')
    .select('id, patient_id, started_at, created_at, specialty, transcript_cleaned')
    .eq('id', seansId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (error || !s) return null
  const seans = s as { id: string; patient_id: string | null; started_at: string | null; created_at: string | null; specialty: string | null; transcript_cleaned: string | null }
  const { data: kayit } = await supabase.from('muayene_dil_kaydi').select('taninan_dil, dil_olasiligi, ikinci_gecis, dusuk_guven').eq('session_id', seansId).eq('doctor_id', doktorId).maybeSingle()
  const { data: notlar } = await supabase.from('notes').select('id, approved_at').eq('session_id', seansId).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(1)
  const not = ((notlar as { id: string; approved_at: string | null }[] | null) ?? [])[0]
  // The patient is read by doctor AND id: a visit row pointing at somebody else's patient shows no patient.
  const hasta = seans.patient_id ? await hastaGetir(supabase, doktorId, seans.patient_id) : null
  return {
    seansId: seans.id,
    baslangic: String(seans.started_at ?? seans.created_at ?? ''),
    sablon: String(seans.specialty ?? ''),
    metin: String(seans.transcript_cleaned ?? ''),
    hasta: hasta ? { id: hasta.id, ad: hasta.ad, otaIsmi: hasta.otaIsmi, dogumTarihi: hasta.dogumTarihi } : null,
    notId: not?.id ?? null,
    notDurumu: !not ? 'notsuz' : not.approved_at ? 'onayli' : 'taslak',
    konusma: konusmaOzeti(kayit as KayitSatiri | null),
  }
}
