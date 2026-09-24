/**
 * NOTYA-ASI-NOT-01 (Kaan + Dr. Gökhan, 2026-09-23) — a vaccine given in the muayene reaches the aşı kartı on note
 * approval. Same gate as the drugs (lib/doktor/receteAktarim, "not onayı = ilaç onayı"): the approved note's
 * `content_asilar` is synced into `asilar` on first approval AND every re-approval.
 *
 *  • Row: kaynak 'kayit' (given in this practice), hekim_onay_at now, kategori by age at the visit (karneKategorisi),
 *    kaynak_note_id = the note, sonraki_doz_tarihi from the pediatric vaccine engine (asiPlani) when the patient is a
 *    child and the vaccine is on the national schedule.
 *  • Idempotent per note: rows of THIS note (kaynak_note_id) are updated in place, rows the doctor removed from the
 *    note are deleted — only rows whose kaynak_note_id is this note. Nothing is ever duplicated.
 *  • Other sources (manual form, voice Ayşe, karne, other notes) are never changed. Against them (notAsisiKartDurumu):
 *    same vaccine + date → not inserted (kartta_var); same dose on another date / other dose on the same date →
 *    not written, returned as a conflict (the note form already warned before approval).
 *  • A row hidden because its note's muayene is archived and that matches exactly is re-claimed by this note
 *    (kaynak_note_id moves here, NOTYA-ARSIV-02 pattern) instead of creating a second row that would double up on unarchive.
 *
 * HASTA-IZOLASYON: the caller proved patientId is this doctor's (hastaSahibiMi); every read/write is also scoped by
 * doktor_id + patient_id, deletes additionally by kaynak_note_id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { arsivsizAsilar } from '@/lib/doktor/arsiv'
import { karneKategorisi } from '@/lib/asi/karneOkuma'
import { asiPlani, kayitSerisi, onerilenDonem, SERI_AD, type AsiKaydi } from '@/specialties/pediatri/engines/asiPlan'
import {
  asiSeriAnahtari,
  dozlariTamamla,
  notAsilariniTemizle,
  notAsisiKartDurumu,
  uygulananAsilariSuz,
  type KartAsisi,
  type NotAsisi,
} from '@/lib/doktor/notAsilari'

/** Visit day (Europe/Istanbul) of a timestamp — a backdated muayene uses its own date. */
export function ziyaretGunu(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date()
  return (Number.isNaN(d.getTime()) ? new Date() : d).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

/**
 * SOAP generation (sessions/[id]/end, ses-yukle): model list → only vaccines the transcript says were given this visit,
 * dated the visit day; a dose not spoken is computed from the patient's (archive-filtered) card and flagged.
 */
export async function muayeneAsilariniHazirla(
  sb: SupabaseClient,
  g: { doktorId: string; patientId: string | null; transcript: string; ham: unknown; ziyaretIso?: string | null },
): Promise<NotAsisi[]> {
  const gun = ziyaretGunu(g.ziyaretIso)
  let liste: NotAsisi[] = uygulananAsilariSuz(notAsilariniTemizle(g.ham), g.transcript).map((a) => ({ ...a, uygulama_tarihi: gun }))
  if (!liste.length || !g.patientId || !liste.some((a) => a.doz_no == null)) return liste
  try {
    const { data } = await arsivsizAsilar(sb, 'asi_adi, doz_no, uygulama_tarihi').eq('doktor_id', g.doktorId).eq('patient_id', g.patientId).limit(300)
    liste = dozlariTamamla(liste, (data || []) as KartAsisi[])
  } catch (e) { console.error('[asi-not] doz hesabı', e) }
  return liste
}

/** The patient's visible card minus this note's own rows — the note form warns from it (duplicate / conflict). */
export async function notAsiKarti(sb: SupabaseClient, doktorId: string, patientId: string, noteId: string): Promise<KartAsisi[]> {
  const { data } = await arsivsizAsilar(sb, 'id, asi_adi, doz_no, uygulama_tarihi, kaynak, kaynak_note_id')
    .eq('doktor_id', doktorId).eq('patient_id', patientId).limit(300)
  return ((data || []) as KartAsisi[])
    .filter((k) => k.kaynak_note_id !== noteId)
    .map((k) => ({ id: k.id, asi_adi: k.asi_adi, doz_no: k.doz_no ?? null, uygulama_tarihi: k.uygulama_tarihi ?? null, kaynak: k.kaynak ?? null }))
}

/** Next dose date from the national-schedule engine (child, schedule vaccine, birth date known); otherwise null. */
export function sonrakiDozTarihi(dogumIso: string | null, a: NotAsisi, kart: KartAsisi[]): string | null {
  const seri = kayitSerisi(a.asi_adi)
  const dogum = String(dogumIso || '').slice(0, 10)
  if (!seri || !(seri in SERI_AD) || !/^\d{4}-\d{2}-\d{2}$/.test(dogum) || !a.uygulama_tarihi) return null
  try {
    const kayitlar: AsiKaydi[] = [...kart, a].filter((k) => k.asi_adi).map((k, i) => ({
      id: String(i), ad: String(k.asi_adi), dozNo: k.doz_no ?? null, tarih: k.uygulama_tarihi ? String(k.uygulama_tarihi).slice(0, 10) : null, kaynak: 'kayit',
    }))
    const plan = asiPlani({ dogumIso: dogum, bugunIso: a.uygulama_tarihi, donem: onerilenDonem(dogum, kayitlar), kayitlar })
    const sonraki = plan.seriler.find((s) => s.seri === seri)?.dozlar
      .find((d) => d.durum !== 'yapildi' && d.durum !== 'yas_disi' && !!d.plan && d.plan > a.uygulama_tarihi!)
    return sonraki?.plan ?? null
  } catch { return null }
}

export interface AsiAktarimSonucu {
  yazilan: number
  guncellenen: number
  silinen: number
  karttaVar: { asi_adi: string; doz_no: number | null }[]
  catisma: { asi_adi: string; doz_no: number | null; mesaj: string }[]
  hata: string | null
}

type HamSatir = KartAsisi & { id: string; sonraki_doz_tarihi?: string | null }

export async function nottanAsiAktar(
  sb: SupabaseClient,
  o: { noteId: string; doctorId: string; patientId: string; asilar: unknown; notTarihi?: string | null; dogumIso: string | null },
): Promise<AsiAktarimSonucu> {
  const sonuc: AsiAktarimSonucu = { yazilan: 0, guncellenen: 0, silinen: 0, karttaVar: [], catisma: [], hata: null }
  const gun = ziyaretGunu(o.notTarihi)
  const liste = notAsilariniTemizle(o.asilar).map((a) => ({ ...a, uygulama_tarihi: a.uygulama_tarihi || gun }))

  // Raw read on purpose (archive guard allowlist): this note's own rows and rows hidden by an archived note must be
  // seen so re-approval updates / deletes / re-claims them instead of duplicating.
  const [hamQ, gorunurQ] = await Promise.all([
    sb.from('asilar').select('id, asi_adi, doz_no, uygulama_tarihi, kaynak, kaynak_note_id, sonraki_doz_tarihi')
      .eq('doktor_id', o.doctorId).eq('patient_id', o.patientId).limit(500),
    arsivsizAsilar(sb, 'id').eq('doktor_id', o.doctorId).eq('patient_id', o.patientId).limit(500),
  ])
  if (hamQ.error) return { ...sonuc, hata: hamQ.error.message }
  if (gorunurQ.error) return { ...sonuc, hata: gorunurQ.error.message }
  const ham = (hamQ.data || []) as HamSatir[]
  const gorunur = new Set(((gorunurQ.data || []) as { id: string }[]).map((r) => String(r.id)))
  const kendi = ham.filter((k) => k.kaynak_note_id === o.noteId)
  const diger = ham.filter((k) => k.kaynak_note_id !== o.noteId && gorunur.has(String(k.id)))
  const gizli = ham.filter((k) => k.kaynak_note_id !== o.noteId && !gorunur.has(String(k.id)))
  const kullanilan = new Set<string>()
  const simdi = new Date().toISOString()
  const bugun = ziyaretGunu()

  for (const a of liste) {
    const anahtar = asiSeriAnahtari(a.asi_adi)
    const eslesenKendi = (dozBirebir: boolean) => kendi.find((k) => !kullanilan.has(k.id) && asiSeriAnahtari(k.asi_adi) === anahtar && (!dozBirebir || (k.doz_no ?? null) === a.doz_no))
    const durum = notAsisiKartDurumu(a, diger)
    if (durum.tur === 'kartta_var') { sonuc.karttaVar.push({ asi_adi: a.asi_adi, doz_no: a.doz_no }); continue }
    if (durum.tur === 'catisma') {
      sonuc.catisma.push({ asi_adi: a.asi_adi, doz_no: a.doz_no, mesaj: durum.mesaj })
      // Not written — an earlier approval's row for this vaccine is left as it was (never deleted on a conflict).
      const k = eslesenKendi(false)
      if (k) kullanilan.add(k.id)
      continue
    }
    let hedef: HamSatir | undefined = eslesenKendi(true) || eslesenKendi(false)
    if (!hedef) hedef = gizli.find((k) => !kullanilan.has(k.id) && notAsisiKartDurumu(a, [k]).tur === 'kartta_var')

    const kategori = karneKategorisi(o.dogumIso, a.uygulama_tarihi, bugun, a.asi_adi)
    const sonraki = kategori === 'pediatrik' ? sonrakiDozTarihi(o.dogumIso, a, [...diger, ...liste.filter((x) => x !== a)]) : null
    const notlar = [
      a.notlar || '',
      a.lot_no ? `Lot: ${a.lot_no}` : '',
      a.uygulama_yeri ? `Uygulama yeri: ${a.uygulama_yeri}` : '',
      'Muayene notundan aktarıldı (hekim onaylı).',
    ].filter(Boolean).join(' · ')
    const satir: Record<string, unknown> = {
      asi_adi: a.asi_adi, doz_no: a.doz_no, kategori, uygulama_tarihi: a.uygulama_tarihi, sonraki_doz_tarihi: sonraki,
      kaynak: 'kayit', notlar, hekim_onay_at: simdi, kaynak_note_id: o.noteId,
    }
    if (hedef) {
      kullanilan.add(hedef.id)
      if (String(hedef.sonraki_doz_tarihi || '').slice(0, 10) !== String(sonraki || '')) satir.hatirlatma_gonderildi = false
      const { error } = await sb.from('asilar').update(satir).eq('id', hedef.id).eq('doktor_id', o.doctorId).eq('patient_id', o.patientId)
      if (error) return { ...sonuc, hata: error.message }
      sonuc.guncellenen += 1
      continue
    }
    const { error } = await sb.from('asilar').insert({ doktor_id: o.doctorId, patient_id: o.patientId, ...satir })
    if (error) return { ...sonuc, hata: error.message }
    sonuc.yazilan += 1
  }

  const silinecek = kendi.filter((k) => !kullanilan.has(k.id)).map((k) => k.id)
  if (silinecek.length) {
    const { error } = await sb.from('asilar').delete().in('id', silinecek).eq('doktor_id', o.doctorId).eq('patient_id', o.patientId).eq('kaynak_note_id', o.noteId)
    if (error) return { ...sonuc, hata: error.message }
    sonuc.silinen = silinecek.length
  }
  return sonuc
}
