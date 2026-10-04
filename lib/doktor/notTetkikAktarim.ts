/**
 * NOTYA-TETKIK-NOT-01 — not onayı = tetkik istemi kaydı.
 * Aynı kapı: lib/doktor/receteAktarim / notAsiAktarim. `content_tetkikler` → hasta_tetkik_istemleri.
 * İdempotent: bu notun (kaynak_note_id) satırları eşitlenir; başka kaynaklara dokunulmaz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { arsivsizTetkikler } from '@/lib/doktor/arsiv'
import { notTetkikleriniTemizle, type NotTetkik } from '@/lib/doktor/notTetkikler'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export interface TetkikAktarimSonucu {
  yazilan: number
  guncellenen: number
  silinen: number
  hata: string | null
}

function istemGunu(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date()
  return (Number.isNaN(d.getTime()) ? new Date() : d).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

export async function nottanTetkikAktar(
  sb: SupabaseClient,
  o: { noteId: string; doctorId: string; patientId: string; tetkikler: unknown; notTarihi?: string | null },
): Promise<TetkikAktarimSonucu> {
  const sonuc: TetkikAktarimSonucu = { yazilan: 0, guncellenen: 0, silinen: 0, hata: null }
  const liste = notTetkikleriniTemizle(o.tetkikler)
  const gun = istemGunu(o.notTarihi)

  try {
    const { data: mevcutHam, error: okumaHata } = await arsivsizTetkikler(sb, 'id, tetkik_adi, kaynak_note_id')
      .eq('doctor_id', o.doctorId)
      .eq('patient_id', o.patientId)
      .eq('kaynak_note_id', o.noteId)
      .limit(100)
    if (okumaHata) {
      // Tablo henüz migrate edilmemiş olabilir — onayı bloklama.
      if (/hasta_tetkik_istemleri|does not exist|schema cache/i.test(okumaHata.message || '')) {
        sonuc.hata = 'Tetkik tablosu henüz hazır değil (migration 114).'
        return sonuc
      }
      throw okumaHata
    }
    const mevcut = (mevcutHam || []) as { id: string; tetkik_adi: string; kaynak_note_id: string | null }[]
    const mevcutMap = new Map(mevcut.map((r) => [trAramaNormalize(r.tetkik_adi), r]))
    const gelenAnahtarlar = new Set(liste.map((t) => trAramaNormalize(t.ad)))

    for (const t of liste) {
      const anahtar = trAramaNormalize(t.ad)
      const eski = mevcutMap.get(anahtar)
      const satir = {
        doctor_id: o.doctorId,
        patient_id: o.patientId,
        kaynak_note_id: o.noteId,
        tetkik_adi: t.ad,
        numune: t.numune || null,
        aclik: !!t.aclik,
        notlar: t.not || null,
        istem_tarihi: gun,
        durum: 'istendi',
      }
      if (eski) {
        const { error } = await sb.from('hasta_tetkik_istemleri').update({
          tetkik_adi: satir.tetkik_adi,
          numune: satir.numune,
          aclik: satir.aclik,
          notlar: satir.notlar,
          istem_tarihi: satir.istem_tarihi,
          durum: 'istendi',
        }).eq('id', eski.id).eq('doctor_id', o.doctorId).eq('patient_id', o.patientId)
        if (error) throw error
        sonuc.guncellenen++
      } else {
        const { error } = await sb.from('hasta_tetkik_istemleri').insert(satir)
        if (error) throw error
        sonuc.yazilan++
      }
    }

    for (const eski of mevcut) {
      if (gelenAnahtarlar.has(trAramaNormalize(eski.tetkik_adi))) continue
      const { error } = await sb.from('hasta_tetkik_istemleri').delete()
        .eq('id', eski.id)
        .eq('doctor_id', o.doctorId)
        .eq('patient_id', o.patientId)
        .eq('kaynak_note_id', o.noteId)
      if (error) throw error
      sonuc.silinen++
    }
  } catch (e) {
    sonuc.hata = e instanceof Error ? e.message : 'Tetkik aktarımı başarısız'
  }
  return sonuc
}

/** Onay öncesi / yazdırma için liste (temiz). */
export function tetkikAktarimListesi(ham: unknown): NotTetkik[] {
  return notTetkikleriniTemizle(ham)
}
