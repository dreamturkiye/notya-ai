/**
 * MUAYENE-EKLERI-01 — seans bitişinde eklerin doğrulanıp rapora hazırlanması (end rotası kullanır).
 *
 * Güven sınırı: istemci yalnız belge kimliklerini ve (varsa) ekranda gösterilen sonuçları gönderir. Burada
 *  1) her belge bu doktora + BU seansa + seansın hastasına ait olmalı (aksi hâlde sessizce düşer),
 *  2) sonuç önce sunucu kaydından (şifreli önbellek) alınır; yoksa istemci sonucu sonucuDogrula ile şemaya zorlanır,
 *  3) hiçbir şey fırlatmaz: bozuk/eksik ek atlanır, not üretimi ASLA bu adım yüzünden engellenmez.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { getDocumentMeta } from '@/lib/vault/service'
import { degerlendirmeOku } from './saklama'
import { sonucuDogrula } from './guvence'
import { ekleriNumarala, type AsiOnayGirdisi } from './rapor'
import { AZAMI_EK, type EkDegerlendirme } from './tipler'

export interface BelgeSahiplikBilgisi { id: string; visitId: string | null; patientId: string | null; fileName: string }
export type SahiplikCozucu = (belgeId: string) => Promise<BelgeSahiplikBilgisi | null>

export interface HazirEkler { ekler: EkDegerlendirme[]; asiOnaylari: AsiOnayGirdisi[]; dusen: number }

const BOS: HazirEkler = { ekler: [], asiOnaylari: [], dusen: 0 }

export function vaultSahiplik(sb: SupabaseClient, doktorId: string): SahiplikCozucu {
  return async (belgeId) => {
    try {
      const m = await getDocumentMeta({ supabase: sb }, doktorId, belgeId)
      return { id: m.id, visitId: m.visitId ?? null, patientId: m.patientId ?? null, fileName: m.fileName }
    } catch { return null }
  }
}

const UUID = /^[0-9a-f-]{32,40}$/i

export async function seansEkleriniHazirla(
  sb: SupabaseClient,
  doktorId: string,
  seans: { id: string; patient_id: string | null },
  yuk: { ekler?: unknown; asiOnay?: unknown } | null | undefined,
  sahiplik: SahiplikCozucu = vaultSahiplik(sb, doktorId),
): Promise<HazirEkler> {
  try {
    if (!yuk || !Array.isArray(yuk.ekler) || !yuk.ekler.length || !seans.patient_id) return BOS
    const istek = (yuk.ekler as unknown[]).slice(0, AZAMI_EK).filter((x): x is { belgeId: string; sonuc?: unknown } =>
      !!x && typeof x === 'object' && typeof (x as { belgeId?: unknown }).belgeId === 'string' && UUID.test((x as { belgeId: string }).belgeId))
    const goruldu = new Set<string>()
    const hazir: { belgeId: string; dosyaAdi: string; sonuc: NonNullable<ReturnType<typeof sonucuDogrula>> }[] = []
    let dusen = 0
    for (const e of istek) {
      if (goruldu.has(e.belgeId)) continue
      goruldu.add(e.belgeId)
      const m = await sahiplik(e.belgeId)
      if (!m || m.visitId !== seans.id || m.patientId !== seans.patient_id) { dusen++; continue }
      let sonuc = null
      try {
        const kayit = await degerlendirmeOku(sb, doktorId, e.belgeId)
        if (kayit?.sonuc && kayit.sessionId === seans.id) sonuc = kayit.sonuc
      } catch { sonuc = null }
      if (!sonuc) sonuc = sonucuDogrula(e.sonuc, 'EK-0')
      if (!sonuc) { dusen++; continue }
      hazir.push({ belgeId: e.belgeId, dosyaAdi: String(m.fileName || 'belge').slice(0, 120), sonuc })
    }
    const ekler = ekleriNumarala(hazir)
    const uygun = new Set(ekler.map((e) => e.belgeId))
    const asiOnaylari = Array.isArray(yuk.asiOnay)
      ? (yuk.asiOnay as unknown[]).filter((a): a is AsiOnayGirdisi => !!a && typeof a === 'object'
          && typeof (a as AsiOnayGirdisi).belgeId === 'string' && uygun.has((a as AsiOnayGirdisi).belgeId) && Array.isArray((a as AsiOnayGirdisi).satirlar))
      : []
    return { ekler, asiOnaylari, dusen }
  } catch {
    console.error('[muayene-ekleri] ek hazirlama basarisiz — not eksiz uretilecek')
    return BOS
  }
}
