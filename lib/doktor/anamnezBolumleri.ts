/**
 * NOTYA-BASLIK-01 (canlı defter, Dr. Gökhan) — Anamnez metni ekranda TEK blok değil,
 * Türk anamnez bölümleri kendi başlıklarıyla gösterilir: Şikayet, Şikayetin Hikayesi,
 * Özgeçmiş, Soygeçmiş, Alışkanlıklar, Sistem Sorgusu. Motor bu etiketlerle üretir; bu
 * ayrıştırıcı görüntü katmanında böler — veri alanı (content_subjektif) tek parça kalır,
 * düzenleme/öğrenme/PDF sözleşmesi bozulmaz. Etiketsiz eski notlar tek "Anamnez" bölümü olur.
 */
export interface AnamnezBolumu { baslik: string; metin: string }

const ETIKETLER = ['Şikayetin Hikayesi', 'Şikayet', 'Hikaye', 'Özgeçmiş', 'Soygeçmiş', 'Alışkanlıklar', 'Sistem Sorgusu']

export function anamnezParcala(metin: string): AnamnezBolumu[] {
  const kaynak = String(metin || '').trim()
  if (!kaynak) return []
  const desen = new RegExp(`(?:^|\\n|\\s)(${ETIKETLER.join('|')})\\s*:\\s*`, 'g')
  const vurgular: { baslik: string; bas: number; icerikBas: number }[] = []
  let m: RegExpExecArray | null
  while ((m = desen.exec(kaynak)) !== null) {
    vurgular.push({ baslik: m[1] === 'Hikaye' ? 'Şikayetin Hikayesi' : m[1], bas: m.index, icerikBas: m.index + m[0].length })
  }
  if (vurgular.length === 0) return [{ baslik: 'Anamnez', metin: kaynak }]
  const bolumler: AnamnezBolumu[] = []
  const onsoz = kaynak.slice(0, vurgular[0].bas).trim()
  if (onsoz) bolumler.push({ baslik: 'Anamnez', metin: onsoz })
  for (let i = 0; i < vurgular.length; i++) {
    const son = i + 1 < vurgular.length ? vurgular[i + 1].bas : kaynak.length
    const icerik = kaynak.slice(vurgular[i].icerikBas, son).trim()
    if (icerik) bolumler.push({ baslik: vurgular[i].baslik, metin: icerik })
  }
  return bolumler
}
