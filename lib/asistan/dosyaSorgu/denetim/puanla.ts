/**
 * NOTYA-AYSE-STANDART-01 — canlı denetimde bir cevabın standart KURALLARINA göre puanı (LLM'siz, saf).
 *
 * Klinik doğruluğu bu fonksiyon ölçemez (onu hekim okur — docs/AYSE-STANDART.md § Denetim); ölçtüğü yalnız biçim ve
 * dil kurallarıdır: doğrudan cevap önde mi, "yapılmadı" / "uydurdum" deniyor mu, plan anılırken kayıt cümlesi var mı,
 * açık iş sorusunda "Dikkat / Takip" bölümü var mı. scripts/ayse-denetim/canli.mts kullanır.
 */
import { SORU_SABLONLARI } from '@/lib/asistan/dosyaSorgu/kurallar'
import type { SoruTuru } from '@/lib/asistan/dosyaSorgu/soruTuru'

export interface KuralSonucu { kural: string; gecti: boolean; not?: string }
export interface CevapPuani { tur: SoruTuru; no: number; soru: string; puan: number; azami: number; kurallar: KuralSonucu[] }

/** Denetimde sorulan 10 soru, standarttaki sırayla. */
export const DENETIM_SORULARI: { tur: SoruTuru; soru: string }[] = (Object.keys(SORU_SABLONLARI) as SoruTuru[])
  .map((tur) => ({ tur, soru: SORU_SABLONLARI[tur].soru }))
  .sort((a, b) => SORU_SABLONLARI[a.tur].no - SORU_SABLONLARI[b.tur].no)

const ilkCumle = (m: string) => m.replace(/^\s*[#*>\-\s]+/, '').split(/(?<=[.!?])\s|\n/)[0] || ''

export function cevabiPuanla(tur: SoruTuru, cevap: string, o: { hastaAdi?: string } = {}): CevapPuani {
  const k: KuralSonucu[] = []
  const m = String(cevap || '')
  const ilk = ilkCumle(m)
  k.push({ kural: 'Boş olmayan cevap', gecti: m.trim().length > 0 })
  k.push({ kural: '"uydurdum / dayanağı yok / erişimim yok" yok', gecti: !/uydurdum|uydurmuşum|dayanağı yok|erişimim yok|sisteme bağlantım yok/i.test(m) })
  k.push({ kural: '"yapılmadı / uygulanmadı" yerine "kayıt bulamadım"', gecti: !/(?<!\p{L})(yapılmadı|uygulanmadı|verilmedi|bakılmadı)(?!\p{L})/iu.test(m), not: 'Kayıtta açıkça "yapılmadı" yazıyorsa hekim onaylar.' })
  k.push({ kural: 'Doğrudan cevap önde (ilk cümle kısa, dolgu değil)', gecti: ilk.length > 0 && ilk.length <= 260 && !/^(Hocam,?\s*)?(bakıyorum|bir saniye|dosyaya bakayım|Dayanak)/i.test(ilk) })
  if (o.hastaAdi) k.push({ kural: 'İlk cümle hastanın adıyla başlıyor', gecti: ilk.toLocaleLowerCase('tr-TR').includes(o.hastaAdi.toLocaleLowerCase('tr-TR').split(' ')[0]) })
  if (/planla|önerildi|istendi|yapacağız|uygulanacak/i.test(m)) {
    k.push({ kural: 'Plan anılınca kayıt cümlesi ("kayıt bulamadım / göremiyorum / sonuç yok")', gecti: /kayıt (bulamadım|göremiyorum|yok)|kaydı yok|sonuç yok|kaydına rastlamadım|görünmüyor/i.test(m) })
  }
  if (tur === 'takip' || tur === 'gozden-kacan' || tur === 'ozet') {
    const temiz = /saptamadım|açık iş (saptanmadı|yok)/i.test(m)
    k.push({ kural: '"Dikkat / Eksik kayıt / Takip" bölümü (ya da "saptamadım")', gecti: temiz || /Dikkat|Eksik kayıt|Takip/i.test(m) })
  }
  if (tur === 'asi') k.push({ kural: 'Planlanan ile uygulandığı belgelenen ayrı', gecti: !/planla/i.test(m) || /uygulandığı(na)? (dair|belgelen)|kayıt|belgelen/i.test(m) })
  if (tur === 'ilac') k.push({ kural: 'Aktif ilaç ile geçmiş reçete ayrı', gecti: /aktif|kullandığı|şu an/i.test(m) })
  const puan = k.filter((x) => x.gecti).length
  return { tur, no: SORU_SABLONLARI[tur].no, soru: SORU_SABLONLARI[tur].soru, puan, azami: k.length, kurallar: k }
}

/** docs/denetim/YYYY-MM-DD-<etiket>.md gövdesi. */
export function denetimRaporu(g: { tarih: string; etiket: string; ortam: string; sonuclar: { puan: CevapPuani; cevap: string; ms: number }[] }): string {
  const toplam = g.sonuclar.reduce((t, s) => t + s.puan.puan, 0)
  const azami = g.sonuclar.reduce((t, s) => t + s.puan.azami, 0)
  const satir: string[] = [
    `# Ayşe dosya sorgulama standardı — canlı denetim (${g.tarih}, ${g.etiket})`,
    '',
    `NOTYA-AYSE-STANDART-01 · ortam: ${g.ortam} · kural puanı ${toplam}/${azami}. Yalnız QA / sentetik hasta. Kural puanı biçim ve dil kurallarını ölçer; klinik doğruluğu hekim okur.`,
    '',
    '| # | Soru | Puan | Süre | Kalan kural |',
    '|---|------|------|------|-------------|',
    ...g.sonuclar.map((s) => `| ${s.puan.no} | ${s.puan.soru} | ${s.puan.puan}/${s.puan.azami} | ${(s.ms / 1000).toFixed(1)} sn | ${s.puan.kurallar.filter((x) => !x.gecti).map((x) => x.kural).join('; ') || '—'} |`),
    '',
  ]
  for (const s of g.sonuclar) {
    satir.push(`## ${s.puan.no}. ${s.puan.soru}`, '', s.cevap.trim() || '_(boş)_', '')
  }
  return satir.join('\n')
}
