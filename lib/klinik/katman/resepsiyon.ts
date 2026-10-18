/**
 * AI Resepsiyon eklentisinin yuvası. Çekirdek Klinik bunu çağırmaz.
 * Kapalıyken tutamak hiç çalışmaz; açıkken de bu dosya model çağırmaz.
 * Telefon, WhatsApp ve konuşma kaydı eklenti gelince bu ara yüze oturur.
 */

export type ResepsiyonGorev =
  | 'randevu'
  | 'intake'
  | 'takip'
  | 'paket'
  | 'devir'
  | 'stok'
  | 'mesai_disi'

export type ResepsiyonGirdi = { gorev: ResepsiyonGorev; metin: string }

export type ResepsiyonCikti = { metin: string; eskalasyon: boolean; kaynak: 'eklenti' }

export type ResepsiyonEklentisi = {
  id: 'ai-resepsiyon'
  cevapla(girdi: ResepsiyonGirdi): Promise<ResepsiyonCikti>
}

export type ResepsiyonSonuc =
  | { durum: 'kapali' }
  | { durum: 'eklenti_yok' }
  | { durum: 'cevap'; cikti: ResepsiyonCikti }

export async function resepsiyonCalistir(
  acik: boolean,
  eklenti: ResepsiyonEklentisi | null,
  girdi: ResepsiyonGirdi,
): Promise<ResepsiyonSonuc> {
  if (!acik) return { durum: 'kapali' }
  if (!eklenti) return { durum: 'eklenti_yok' }
  const cikti = await eklenti.cevapla(girdi)
  return { durum: 'cevap', cikti }
}
