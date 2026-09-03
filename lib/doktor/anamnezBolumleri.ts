/**
 * NOTYA-BASLIK-01 (canlı defter, Dr. Gökhan) — Not, 3 referans linkteki Türk klinik
 * akışının BAŞLIKLARIYLA gösterilir: Anamnez bölümleri (Şikayet, Şikayetin Hikayesi,
 * Özgeçmiş, Soygeçmiş, Alışkanlıklar, Sistem Sorgusu) → Fizik Muayene → Laboratuvar →
 * Görüntüleme → Tanı → Tedavi. Ayrıştırma görüntü katmanındadır; veri alanları tek parça
 * kalır (düzenleme/öğrenme/PDF sözleşmesi bozulmaz). Etiketsiz eski notlar tek blok düşer.
 */
export interface AnamnezBolumu { baslik: string; metin: string }

const ETIKETLER = ['Şikayetin Hikayesi', 'Şikayet', 'Hikaye', 'Özgeçmiş', 'Soygeçmiş', 'Alışkanlıklar', 'Sistem Sorgusu']

function parcala(kaynakHam: string, etiketler: string[], varsayilanBaslik: string, esAdlar?: Record<string, string>): AnamnezBolumu[] {
  const kaynak = String(kaynakHam || '').trim()
  if (!kaynak) return []
  const desen = new RegExp(`(?:^|\\n|\\s)(${etiketler.join('|')})\\s*:\\s*`, 'g')
  const vurgular: { baslik: string; bas: number; icerikBas: number }[] = []
  let m: RegExpExecArray | null
  while ((m = desen.exec(kaynak)) !== null) {
    vurgular.push({ baslik: esAdlar?.[m[1]] || m[1], bas: m.index, icerikBas: m.index + m[0].length })
  }
  if (vurgular.length === 0) return [{ baslik: varsayilanBaslik, metin: kaynak }]
  const bolumler: AnamnezBolumu[] = []
  const onsoz = kaynak.slice(0, vurgular[0].bas).trim()
  if (onsoz) bolumler.push({ baslik: varsayilanBaslik, metin: onsoz })
  for (let i = 0; i < vurgular.length; i++) {
    const son = i + 1 < vurgular.length ? vurgular[i + 1].bas : kaynak.length
    const icerik = kaynak.slice(vurgular[i].icerikBas, son).trim()
    if (icerik) bolumler.push({ baslik: vurgular[i].baslik, metin: icerik })
  }
  return bolumler
}

export function anamnezParcala(metin: string): AnamnezBolumu[] {
  return parcala(metin, ETIKETLER, 'Anamnez', { Hikaye: 'Şikayetin Hikayesi' })
}

/** Fizik Muayene metninden Laboratuvar / Görüntüleme satırlarını kendi başlıklarına ayırır. */
export function fizikParcala(metin: string): AnamnezBolumu[] {
  return parcala(metin, ['Laboratuvar', 'Görüntüleme'], 'Fizik Muayene')
}
