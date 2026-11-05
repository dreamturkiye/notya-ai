/**
 * BELGE-NO-01 / REFERANS-01 / HASTA-DISA-AKTAR-01 (Kaan, 2026-11-05) — the country build's side of three CORE features
 * shared with Türkiye (lib/belge/, lib/billing/referans.ts; migration 188, the same functions in every database). Server
 * only. Every database call goes through `ulkeIslevi` / `ulkeTablosu` (this build's country is added there), and every
 * patient id is matched against the authenticated doctor before it is used (hastaGetir: hasta-izolasyon).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkeIslevi, ulkeTablosu, type UlkeIslevi } from '@/lib/ulke/uygulama/tablolar'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { unvanOku, unvanliAd } from '@/lib/ulke/uygulama/hekimUnvani'
import { hastaGetir, type Hasta } from '@/lib/ulke/uygulama/hastalar'
import { hastaninMuayeneleri } from '@/lib/ulke/uygulama/muayeneler'
import { notGetir } from '@/lib/ulke/uygulama/notlar'
import { hastaninAracKayitlari } from '@/lib/ulke/araclar/kayit'
import type { AracKaydi } from '@/lib/ulke/araclar/kayitTipleri'
import type { Islev } from '@/lib/belge/sunucu'
import type { ReferansIslevi } from '@/lib/billing/referans'

/** The database door of the shared functions, bound to this build's country. */
export const belgeIslevi = (sb: SupabaseClient): Islev => (ad, a) => ulkeIslevi(sb, ad as UlkeIslevi, a)
export const referansIslevi = (sb: SupabaseClient): ReferansIslevi => (ad, a) => ulkeIslevi(sb, ad as UlkeIslevi, a)

/** The doctor's name as the letterhead prints it (title and post-nominals from Settings). '' = no account row. */
export async function hekimAdi(sb: SupabaseClient, doktorId: string, meta: unknown): Promise<string> {
  const { data } = await ulkeTablosu(sb, 'ulke_hesaplari').select('full_name').eq('id', doktorId).maybeSingle()
  const ad = String((data as { full_name?: unknown } | null)?.full_name || '').trim()
  if (!ad) return ''
  const u = unvanOku(meta, ulkePaketi().hekimUnvani)
  return unvanliAd(ad, u.unvan, u.unvanEki, ulkePaketi().hekimUnvani, '').slice(0, 160)
}

/** The doctor's own patient, or null (another doctor's patient answers exactly as a missing one). */
export const kendiHastasi = (sb: SupabaseClient, doktorId: string, hastaId: string): Promise<Hasta | null> => hastaGetir(sb, doktorId, hastaId)

// ───────────────────────── HASTA-DISA-AKTAR-01: one patient's record ─────────────────────────

/** The most one export reads (performance budget: one patient, bounded). */
export const DISA_AKTARIM_SINIRI = { not: 50 } as const

export type UlkeDisaAktarim = {
  hasta: { id: string; ad: string; dogumTarihi: string; cinsiyet: string }
  notlar: { id: string; tarih: string; dil: string; bolumler: [string, string][]; ek: string }[]
  araclar: { id: string; arac: string; tarih: string; sonuc: unknown }[]
  olusturuldu: string
}

/**
 * Approved notes only (a draft is not part of the record), newest first, and the kept tool results. The national ID and
 * the telephone number are never exported. Null = not this doctor's patient.
 */
export async function hastaKaydiOku(sb: SupabaseClient, doktorId: string, hastaId: string): Promise<UlkeDisaAktarim | null> {
  const hasta = await kendiHastasi(sb, doktorId, hastaId)
  if (!hasta) return null
  const [muayeneler, kayitlar] = await Promise.all([hastaninMuayeneleri(sb, doktorId, hasta.id), hastaninAracKayitlari(sb, doktorId, hasta.id)])
  const onayli = (muayeneler ?? []).filter((m) => m.durum === 'onayli' && m.notId).slice(0, DISA_AKTARIM_SINIRI.not)
  const notlar = (await Promise.all(onayli.map((m) => notGetir(sb, doktorId, m.notId as string)))).flatMap((n, i) => {
    if (!n || !n.onayli) return []
    const ic = n.icerik as unknown as Record<string, unknown>
    const bolumler = (['s', 'o', 'a', 'p'] as const).map((k) => [k, typeof ic[k] === 'string' ? (ic[k] as string) : ''] as [string, string])
    const alanlar = ic.alanlar && typeof ic.alanlar === 'object' ? Object.entries(ic.alanlar as Record<string, unknown>).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v as string] as [string, string]) : []
    return [{ id: n.notId, tarih: n.onayTarihi ?? onayli[i].baslangic, dil: n.dil, bolumler: [...bolumler, ...alanlar].filter(([, v]) => v.trim()), ek: n.ekMetin }]
  })
  const araclar = ((kayitlar ?? []) as AracKaydi[]).map((k) => { const x = k as unknown as Record<string, unknown>; return { id: String(x.id), arac: String(x.arac), tarih: String(x.olusturuldu ?? ''), sonuc: x.sonuc ?? null } })
  return { hasta: { id: hasta.id, ad: hasta.ad, dogumTarihi: hasta.dogumTarihi, cinsiyet: hasta.cinsiyet }, notlar, araclar, olusturuldu: new Date().toISOString() }
}

const BOLUM_ADI: Record<string, string> = { s: 'Subjective', o: 'Objective', a: 'Assessment', p: 'Plan' }
/** The FHIR R4 `collection` Bundle of the export: Patient, an Encounter and a Composition per approved note, an Observation per kept tool result. */
export function fhirBundle(v: UlkeDisaAktarim): Record<string, unknown> {
  const hastaRef = { reference: `urn:uuid:${v.hasta.id}` }
  const giris = (id: string, resource: Record<string, unknown>) => ({ fullUrl: `urn:uuid:${id}`, resource: { id, ...resource } })
  const entry: Record<string, unknown>[] = [giris(v.hasta.id, { resourceType: 'Patient', name: [{ text: v.hasta.ad }], ...(v.hasta.dogumTarihi ? { birthDate: v.hasta.dogumTarihi } : {}), ...(v.hasta.cinsiyet ? { gender: v.hasta.cinsiyet } : {}) })]
  for (const n of v.notlar) {
    const enc = `${n.id}-encounter`
    entry.push(giris(enc, { resourceType: 'Encounter', status: 'finished', class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' }, subject: hastaRef, period: { start: n.tarih } }))
    entry.push(giris(n.id, { resourceType: 'Composition', status: 'final', type: { coding: [{ system: 'http://loinc.org', code: '11506-3', display: 'Progress note' }] }, subject: hastaRef, encounter: { reference: `urn:uuid:${enc}` }, date: n.tarih, title: 'Visit note', language: n.dil, section: [...n.bolumler.map(([k, m]) => ({ title: BOLUM_ADI[k] ?? k, text: { status: 'generated', div: `<div xmlns="http://www.w3.org/1999/xhtml">${m.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))}</div>` } })), ...(n.ek ? [{ title: 'Addendum', text: { status: 'generated', div: `<div xmlns="http://www.w3.org/1999/xhtml">${n.ek.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))}</div>` } }] : [])] }))
  }
  for (const a of v.araclar) entry.push(giris(a.id, { resourceType: 'Observation', status: 'final', code: { text: a.arac }, subject: hastaRef, effectiveDateTime: a.tarih, note: [{ text: JSON.stringify(a.sonuc) }] }))
  return { resourceType: 'Bundle', type: 'collection', timestamp: v.olusturuldu, meta: { tag: [{ system: 'https://notya.io/fhir/tag', code: 'hasta-disa-aktarim' }] }, entry }
}
