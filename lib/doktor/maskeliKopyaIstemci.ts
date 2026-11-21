/**
 * NOTYA-BELGE-DEID-03 (2026-11-20) — browser helper: a document already in the vault (Belgeler / Kasa) -> its masked outbound copy.
 * Downloads the doctor's own original (doctor-scoped route), masks it ON THIS DEVICE (image: OCR mask; PDF: every page drawn and
 * masked — core/belgeler/deid.ts belgeyiOtomatikKimliksizlestir). Only `gidenDeid(sonuc.gorsel)` may be sent, and only when
 * `sonuc.maske.durum === 'maskelendi'` (or after the doctor's explicit attestation on a Belgeler page).
 */
import { belgeyiOtomatikKimliksizlestir, type OtomatikDeId } from '@/core/belgeler/deid'
import { doktorFetch } from '@/lib/doktor/oturumFetch'

export async function kasaBelgesiniMaskele(belgeId: string, o: { ad?: string; modalite?: string } = {}): Promise<OtomatikDeId | null> {
  const r = await doktorFetch(`/api/doktor/documents/${encodeURIComponent(belgeId)}/download`, { cache: 'no-store' })
  if (!r.ok) return null
  return belgeyiOtomatikKimliksizlestir(await r.blob(), o)
}

/** Masking could not produce any picture at all (PDF damaged / too long): there is nothing the doctor could attest to either. */
export const maskeKopyasiYok = (m: OtomatikDeId | null) => !m || m.maske.durum === 'pdf_okunamadi' || m.maske.durum === 'cok_buyuk' || !m.gorsel.base64
