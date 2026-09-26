/**
 * NOTYA-PAKET-01 kapı 2 — düz metin. Canlı yazım yok.
 * Başlık iddiası yok. e-Nabız dosyası yalnız enabizIzin === true iken.
 */
import { enabizEpikriz, type EnabizPaket } from '@/lib/enabiz/paket'
import type { SeansPaketGovde } from './tip'

const EYLEM: Record<string, string> = { basla: 'başla', durdur: 'durdur', devam: 'devam', son_doz: 'son doz' }

export function mbysMetni(g: SeansPaketGovde, opt: { tarih: string; hastaAd: string }): string {
  const ilac = g.ilaclar.map((i) => `${i.ad} — ${EYLEM[i.eylem] || i.eylem}${i.sure ? ` (${i.sure})` : ''}`).join('\n')
  const icd = g.icd10.map((t) => `${t.kod}${t.ad ? ` ${t.ad}` : ''}`).join(', ')
  return [
    opt.tarih,
    `Hasta: ${opt.hastaAd || '—'}`,
    g.sikayet ? `Şikayet: ${g.sikayet}` : '',
    g.fizikOzeti ? `Fizik: ${g.fizikOzeti}` : '',
    icd ? `ICD: ${icd}` : '',
    g.islemTaslak.length ? `İşlem: ${g.islemTaslak.join(', ')}` : '',
    ilac ? `İlaç:\n${ilac}` : '',
    '',
    'Notya taslağı. MBYS’ye hekim yapıştırır / kaydeder.',
  ].filter((s) => s !== '').join('\n')
}

/** true değilse dosya yok. false ise çağıran durum=enabiz_red yazar. */
export function enabizDosyasi(g: SeansPaketGovde, opt: { hastaAd: string; hastaId?: string }): EnabizPaket | null {
  if (g.enabizIzin !== true) return null
  const tani = g.icd10.map((t) => `${t.kod}${t.ad ? ` ${t.ad}` : ''}`).join(', ')
  const ilac = g.ilaclar.map((i) => `${i.ad} (${EYLEM[i.eylem] || i.eylem})`).join(', ')
  return enabizEpikriz({
    hastaAd: opt.hastaAd || 'Hasta',
    hastaId: opt.hastaId,
    taniVeTedavi: [tani, ilac].filter(Boolean).join('\n'),
    taburcuOzeti: [g.sikayet, g.fizikOzeti].filter(Boolean).join('\n') || '—',
  })
}
