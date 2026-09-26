/**
 * NOTYA-PAKET-01 — paketi doldurur. hasta_ilaclar burada değişmez
 * (kesen yer Kalkan Onayla ve hekimin SOAP onayındaki mevcut sonlandırma).
 * Tablo yoksa susar.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptPII, decryptPII } from '@/lib/security/encryption'
import { tabloYokMu } from '@/lib/iletisim/sunucu'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import {
  klinikMetin, icdListe, yasAyHesapla, ilaciIsaretle, fisiltiOnayiPaketeGirer,
  type SeansPaketGovde, type IlacEylem, type EnabizIzin, type PaketKaynak,
} from './tip'

type Sb = SupabaseClient

export function bosGovde(kismi: Partial<SeansPaketGovde> = {}): SeansPaketGovde {
  return {
    sikayet: '', fizikOzeti: '', icd10: [], ilaclar: [], islemTaslak: [],
    yasAy: null, kilo: null, brans: null, enabizIzin: 'bilinmiyor', kalkanFisiltiId: null,
    ...kismi,
  }
}

export function soapGovdesi(g: {
  sikayet?: unknown
  fizik?: unknown
  icd?: unknown
  ilaclar?: { ad?: string; sure?: string | null; eylem?: IlacEylem }[]
  islem?: string[]
  yasAy?: number | null
  kilo?: number | null
  brans?: string | null
  enabizIzin?: EnabizIzin
}): SeansPaketGovde {
  const govde = bosGovde({
    sikayet: klinikMetin(g.sikayet),
    fizikOzeti: klinikMetin(g.fizik),
    icd10: icdListe(g.icd),
    islemTaslak: (g.islem || []).map((s) => klinikMetin(s)).filter(Boolean).slice(0, 20),
    yasAy: g.yasAy ?? null,
    kilo: g.kilo ?? null,
    brans: g.brans ?? null,
    enabizIzin: g.enabizIzin ?? 'bilinmiyor',
  })
  let sonuc = govde
  for (const i of g.ilaclar || []) {
    const ad = String(i.ad || '').trim()
    if (!ad) continue
    sonuc = ilaciIsaretle(sonuc, { ad, eylem: i.eylem || 'basla', sure: i.sure || null, kaynak: 'vizit' })
  }
  return sonuc
}

function coz(ham: string | null | undefined): SeansPaketGovde | null {
  if (!ham) return null
  try { return JSON.parse(decryptPII(ham)) as SeansPaketGovde } catch { return null }
}

export async function paketYaz(sb: Sb, g: {
  doktorId: string
  patientId: string
  noteId?: string | null
  seansId?: string | null
  kaynak: PaketKaynak
  govde: SeansPaketGovde
  onaylayan: string
}): Promise<boolean> {
  const simdi = new Date().toISOString()
  const satir = {
    doctor_id: g.doktorId,
    patient_id: g.patientId,
    note_id: g.noteId || null,
    seans_id: g.seansId || null,
    kaynak: g.kaynak,
    durum: 'hekim_onayli',
    json_encrypted: encryptPII(JSON.stringify(g.govde)),
    onaylayan_user_id: g.onaylayan,
    onay_at: simdi,
    updated_at: simdi,
  }
  try {
    if (g.noteId) {
      const { data: varMi, error: okuHata } = await sb.from('seans_paketleri').select('id, kaynak').eq('doctor_id', g.doktorId).eq('note_id', g.noteId).maybeSingle()
      if (okuHata) return !tabloYokMu(okuHata) ? false : false
      if (varMi) {
        const kaynak = varMi.kaynak === 'fisilti_onay' && g.kaynak === 'soap' ? 'ikisi' : varMi.kaynak === 'soap' && g.kaynak === 'fisilti_onay' ? 'ikisi' : g.kaynak
        const { error } = await sb.from('seans_paketleri').update({ ...satir, kaynak }).eq('id', varMi.id).eq('doctor_id', g.doktorId)
        return !error
      }
    }
    const { error } = await sb.from('seans_paketleri').insert(satir)
    if (error && tabloYokMu(error)) return false
    return !error
  } catch (e) {
    if (!tabloYokMu(e)) console.error('[seans-paketi]', e instanceof Error ? e.message : 'bilinmeyen')
    return false
  }
}

/** Onaylı SOAP. İlaç listesini ikinci kez kesmez; sonlandırılmış adlar pakette durdur olarak durur. */
export async function paketSoapKaydet(sb: Sb, g: {
  doktorId: string
  patientId: string
  noteId: string
  seansId?: string | null
  not: { sikayet?: unknown; fizik?: unknown; icd?: unknown; ilaclar?: { ad?: string; sure?: string | null }[]; vitaller?: { kilo?: number | null } | null; brans?: string | null; dogum?: string | null }
  duranAdlar?: string[]
}): Promise<boolean> {
  let izin: EnabizIzin = 'bilinmiyor'
  try {
    const { data, error } = await sb.from('patients').select('enabiz_gonderilmesin').eq('id', g.patientId).eq('doctor_id', g.doktorId).maybeSingle()
    if (!error && data && data.enabiz_gonderilmesin === true) izin = false
    else if (!error && data && data.enabiz_gonderilmesin === false) izin = true
  } catch { /* kolon yok */ }
  let govde = soapGovdesi({
    sikayet: g.not.sikayet,
    fizik: g.not.fizik,
    icd: g.not.icd,
    ilaclar: g.not.ilaclar,
    yasAy: yasAyHesapla(g.not.dogum),
    kilo: g.not.vitaller?.kilo ?? null,
    brans: g.not.brans ?? null,
    enabizIzin: izin,
  })
  for (const ad of g.duranAdlar || []) govde = ilaciIsaretle(govde, { ad, eylem: 'durdur', kaynak: 'vizit' })
  return paketYaz(sb, { doktorId: g.doktorId, patientId: g.patientId, noteId: g.noteId, seansId: g.seansId, kaynak: 'soap', govde, onaylayan: g.doktorId })
}

/**
 * Kalkan Onayla bittikten sonra. Taslak bekliyorsa girmez.
 * hasta_ilaclar'a yazmaz — ilaç zaten kesilmişse pakette eylem=durdur.
 */
export async function paketKalkanIsle(sb: Sb, g: {
  doktorId: string
  patientId: string
  taslakDurum: string
  taslakId: string
  ilacAd: string
  eylem: IlacEylem
}): Promise<boolean> {
  if (!fisiltiOnayiPaketeGirer(g.taslakDurum)) return false
  const bugun = bugunTrIso()
  try {
    const { data, error } = await sb.from('seans_paketleri').select('id, note_id, seans_id, kaynak, json_encrypted, onay_at').eq('doctor_id', g.doktorId).eq('patient_id', g.patientId).eq('durum', 'hekim_onayli').order('onay_at', { ascending: false }).limit(5)
    if (error) return false
    const ayniGun = (data || []).find((r) => {
      try { return new Date(String(r.onay_at)).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }) === bugun } catch { return false }
    })
    if (ayniGun) {
      const govde = coz(String(ayniGun.json_encrypted || ''))
      if (!govde) return false
      const yeni = ilaciIsaretle(govde, { ad: g.ilacAd, eylem: g.eylem, kaynak: 'whatsapp', fisiltiId: g.taslakId })
      const kaynak = ayniGun.kaynak === 'soap' ? 'ikisi' : ayniGun.kaynak
      const { error: yazHata } = await sb.from('seans_paketleri').update({
        json_encrypted: encryptPII(JSON.stringify(yeni)),
        kaynak,
        updated_at: new Date().toISOString(),
      }).eq('id', ayniGun.id).eq('doctor_id', g.doktorId)
      return !yazHata
    }
    const govde = ilaciIsaretle(bosGovde({ enabizIzin: 'bilinmiyor' }), { ad: g.ilacAd, eylem: g.eylem, kaynak: 'whatsapp', fisiltiId: g.taslakId })
    return paketYaz(sb, { doktorId: g.doktorId, patientId: g.patientId, kaynak: 'fisilti_onay', govde, onaylayan: g.doktorId })
  } catch (e) {
    if (!tabloYokMu(e)) console.error('[seans-paketi] kalkan', e instanceof Error ? e.message : 'bilinmeyen')
    return false
  }
}
