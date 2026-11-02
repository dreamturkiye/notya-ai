/**
 * AU-GAP-CLOSE-02 — write-back outbox. Enqueues an approved-note export pack for a PMS target.
 * Worker attempts `pmsYaz` only when the partner flag is on; otherwise the row stays
 * `hazirlandi` / `hata:PARTNER_YOK` — never silently `gonderildi`.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { pmsExportPaket } from '@/lib/ulke/mektup/mektup'
import type { MbsOneri } from '@/lib/ulke/mektup/tipler'
import type { MektupTuru } from '@/lib/ulke/mektup/sabitler'
import { ulkeTablosu } from '@/lib/ulke/uygulama/tablolar'
import { pmsYaz } from './adapter'
import { pmsKimlikOku } from './baglanti'
import { pmsSaglayiciMi, type PmsKuyrukDurum, type PmsKuyrukOzet, type PmsRetKodu, type PmsSaglayici } from './tipler'

export async function pmsKuyrukListele(supabase: SupabaseClient, doktorId: string, limit = 20): Promise<PmsKuyrukOzet[]> {
  const { data } = await ulkeTablosu(supabase, 'ulke_pms_yazma_kuyrugu')
    .select('id, note_id, hedef, durum, paket_surum, created_at')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50))
  return ((data ?? []) as Array<{
    id: string; note_id: string; hedef: PmsSaglayici; durum: PmsKuyrukDurum; paket_surum: string; created_at: string
  }>).map((s) => ({
    id: s.id,
    noteId: s.note_id,
    hedef: s.hedef,
    durum: s.durum,
    paketSurum: s.paket_surum,
    createdAt: s.created_at,
  }))
}

export async function pmsKuyrugaAl(
  supabase: SupabaseClient,
  doktorId: string,
  g: {
    notId: string
    hedef: unknown
    mektuplar?: Partial<Record<MektupTuru, string>>
    mbsOnerileri?: readonly MbsOneri[]
  },
): Promise<{ tamam: true; ozet: PmsKuyrukOzet } | { tamam: false; kod: PmsRetKodu }> {
  if (!pmsSaglayiciMi(g.hedef)) return { tamam: false, kod: 'GECERSIZ' }
  const kimlik = await pmsKimlikOku(supabase, doktorId, g.hedef)
  if (!kimlik) return { tamam: false, kod: 'BAGLANTI_YOK' }

  const paketSonuc = await pmsExportPaket(supabase, doktorId, g.notId, {
    mektuplar: g.mektuplar,
    mbsOnerileri: g.mbsOnerileri,
  })
  if (!paketSonuc.tamam) return { tamam: false, kod: paketSonuc.kod === 'ONAYSIZ' ? 'ONAYSIZ' : paketSonuc.kod === 'NOT_FOUND' ? 'NOT_FOUND' : 'BASARISIZ' }

  const { data, error } = await ulkeTablosu(supabase, 'ulke_pms_yazma_kuyrugu')
    .insert({
      doctor_id: doktorId,
      note_id: g.notId,
      hedef: g.hedef,
      paket_surum: paketSonuc.paket.surum,
      govde_encrypted: encrypt(JSON.stringify(paketSonuc.paket)),
      durum: 'hazirlandi',
    })
    .select('id, note_id, hedef, durum, paket_surum, created_at')
    .single()
  if (error || !data) return { tamam: false, kod: 'BASARISIZ' }

  const satir = data as { id: string; note_id: string; hedef: PmsSaglayici; durum: PmsKuyrukDurum; paket_surum: string; created_at: string }
  // Attempt send now: without partner flag this records PARTNER_YOK and leaves durum = hazirlandi (not gonderildi).
  const yaz = await pmsYaz(g.hedef, kimlik, paketSonuc.paket)
  if (yaz.tamam) {
    await ulkeTablosu(supabase, 'ulke_pms_yazma_kuyrugu')
      .update({ durum: 'gonderildi', hata_kodu: null, updated_at: new Date().toISOString() })
      .eq('id', satir.id)
      .eq('doctor_id', doktorId)
    return {
      tamam: true,
      ozet: { id: satir.id, noteId: satir.note_id, hedef: satir.hedef, durum: 'gonderildi', paketSurum: satir.paket_surum, createdAt: satir.created_at },
    }
  }
  await ulkeTablosu(supabase, 'ulke_pms_yazma_kuyrugu')
    .update({ durum: 'hazirlandi', hata_kodu: yaz.kod, updated_at: new Date().toISOString() })
    .eq('id', satir.id)
    .eq('doctor_id', doktorId)
  return {
    tamam: true,
    ozet: { id: satir.id, noteId: satir.note_id, hedef: satir.hedef, durum: 'hazirlandi', paketSurum: satir.paket_surum, createdAt: satir.created_at },
  }
}

/** Re-attempt a queued row (partner flag may have flipped). Isolation: doctor_id in the same query. */
export async function pmsKuyrukDene(
  supabase: SupabaseClient,
  doktorId: string,
  kuyrukId: string,
): Promise<{ tamam: true; ozet: PmsKuyrukOzet } | { tamam: false; kod: PmsRetKodu }> {
  const { data } = await ulkeTablosu(supabase, 'ulke_pms_yazma_kuyrugu')
    .select('id, note_id, hedef, durum, paket_surum, govde_encrypted, created_at')
    .eq('id', kuyrukId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  const s = data as {
    id: string; note_id: string; hedef: PmsSaglayici; durum: PmsKuyrukDurum
    paket_surum: string; govde_encrypted: string; created_at: string
  } | null
  if (!s) return { tamam: false, kod: 'NOT_FOUND' }
  const kimlik = await pmsKimlikOku(supabase, doktorId, s.hedef)
  if (!kimlik) return { tamam: false, kod: 'BAGLANTI_YOK' }
  let paket
  try { paket = JSON.parse(decrypt(s.govde_encrypted)) } catch { return { tamam: false, kod: 'BASARISIZ' } }
  const yaz = await pmsYaz(s.hedef, kimlik, paket)
  const durum: PmsKuyrukDurum = yaz.tamam ? 'gonderildi' : 'hazirlandi'
  await ulkeTablosu(supabase, 'ulke_pms_yazma_kuyrugu')
    .update({ durum, hata_kodu: yaz.tamam ? null : yaz.kod, updated_at: new Date().toISOString() })
    .eq('id', s.id)
    .eq('doctor_id', doktorId)
  return {
    tamam: true,
    ozet: { id: s.id, noteId: s.note_id, hedef: s.hedef, durum, paketSurum: s.paket_surum, createdAt: s.created_at },
  }
}
