/**
 * NOTYA-AYSE-GERI-05 (Dr. Gökhan, 2026-10-01: "aşı kaydını tablo olarak gösterirdi") — "aşıları / aşı karnesi /
 * uygulanmış aşılar" for a patient: the RECORDED vaccines as a table on screen, one short spoken line.
 * Deterministic, no model. Ported from the unmerged branch fix/ayse-voice-endpointing-vaccine-table (93829e27,
 * NOTYA-ASI-TABLO-01) and extended with the count question ("toplam kaç aşısı var").
 *
 * Before: "Aşılarını göster" was answered by the quick card with its short line, and "aşı karnesi" went down the
 * evidence path where voice Ayşe read the whole list aloud. A vaccine record is a table: it stays on screen
 * (lib/asistan/konusma.ts — tables are never read), the voice only says it is there.
 *
 * Content = the one karne model (lib/asi/karneBelgesi.ts — the same rows as the Aşı Karnesi screen / PDF, archive
 * rule included). Columns: Aşı | Tarih always; Doz only when a row has a dose number; Yaş (age at administration,
 * the karne's own `yasMetni`) only when the birth date and a vaccine date are recorded. A row with no date says so
 * ("Tarih kayıtlı değil"). Nothing is computed from a schedule here: no "eksik", no "gecikmiş", no next dose.
 * Evaluation questions ("aşıları tam mı", "eksik aşı var mı", "sıradaki aşı") are NOT this path — they keep the
 * evidence path and the schedule engine. Pure.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { ASI_KARNESI_BASLIK, dozMetni, tarihMetni, yasMetni, type AsiKarnesi } from '@/lib/asi/karneBelgesi'
import { genitif, varliklariCikar } from '@/lib/asistan/konusmaBaglami'

/** The record itself: "aşıları", "aşı karnesi", "aşı kayıtları", "uygulanmış / yapılan aşılar". */
const KAYIT = /\basi (karne|kayit|kayd|liste|tablo|gecmis|defter)\w*|\b(uygulan|yapil)(mis|an) asi\w*|\basilar\w*/
/** Singular "aşı / aşısı" is a record request only with a show-verb or as a (nearly) bare phrase. */
const TEKIL = /\basi(si|sini|yi)?\b/
const GOSTER = /\b(goster\w*|getir\w*|ac|acar|acsana|acin|listele\w*|dok|cikar\w*|ver|verir|oku|okur|bak|bakar|bakalim|neler|nelerdir|nedir)\b/
/** How many vaccines are recorded — the count is the table's row count. */
const SAYIM = /\bkac (tane )?asi(si|lari)?\b|\basi(si|lari)? (sayisi|kac tane)\b|\bkac asi (var|oldu|yapildi|yapilmis|kayitli)\b/
/** Evaluation / schedule / advice — the evidence path answers these. */
const DEGERLENDIRME = /eksik|\btam\b|tamam mi|gecik|zamani|yapilmali|yapilacak|yapilmasi|gerek|kalan|kaldi|sonraki|siradaki|sirada|ne zaman|hangi|kac doz|kacinci|durum|guncel|takvim|oner|yan etki|reaksiyon|olur mu|yapalim|yapilir mi|yapildi mi|yapilmis mi|oldu mu|olmus mu|nasil|neden|niye|hatirlat|randevu|\bsonra\b|\bonce\b/
/** The doctor is reporting or recording, not asking. */
const BILDIRIM = /\byap(tik|tim|iyoruz|acagiz|acagim)\b|\bvur(duk|dum|uldu)\b|\buygulad(ik|im)\b|kaydet|\bekle\w*|\bgir\b|\byaz\b/

export function asiKaydiSorusuMu(mesaj: string | null | undefined): boolean {
  const n = trAramaNormalize(mesaj).replace(/[?!.,;:'’]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!n || BILDIRIM.test(n)) return false
  if (SAYIM.test(n) && !/kac doz|kacinci/.test(n)) return true
  if (DEGERLENDIRME.test(n)) return false
  // A named vaccine ("KKK aşısı", "hepatit b aşıları") is a question about that vaccine, not the record.
  if (varliklariCikar(String(mesaj || '')).asi) return false
  if (KAYIT.test(n)) return true
  return TEKIL.test(n) && (GOSTER.test(n) || n.split(' ').length <= 4)
}

const hucre = (s: string) => String(s || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()

export interface AsiTablosuCevabi {
  /** Screen answer: heading + pipe table (HafifMarkdown renders it), or one line when nothing is recorded. */
  ekran: string
  /** The single spoken line — never the list. */
  konusma: string
  sutunlar: string[]
  satirlar: string[][]
}

export function asiTablosuCevabi(hastaAdi: string, karne: Pick<AsiKarnesi, 'yapilanlar' | 'hasta'>): AsiTablosuCevabi {
  const ad = String(hastaAdi || '').trim() || 'Hasta'
  const kayitlar = karne.yapilanlar || []
  if (!kayitlar.length) {
    const yok = `${ad} için kayıtlı aşı yok Hocam.`
    return { ekran: yok, konusma: yok, sutunlar: [], satirlar: [] }
  }
  const yaslar = kayitlar.map((a) => yasMetni(karne.hasta?.dogumTarihi ?? null, a.tarih))
  const dozVar = kayitlar.some((a) => a.doz !== null)
  const yasVar = yaslar.some(Boolean)
  const sutunlar = ['Aşı', 'Tarih', ...(dozVar ? ['Doz'] : []), ...(yasVar ? ['Yaş'] : [])]
  const satirlar = kayitlar.map((a, i) => [
    hucre(a.ad),
    tarihMetni(a.tarih),
    ...(dozVar ? [a.doz !== null ? dozMetni(a.doz) : ''] : []),
    ...(yasVar ? [yaslar[i]] : []),
  ])
  const satir = (h: string[]) => `| ${h.join(' | ')} |`
  const ekran = [
    `**${ad} — ${ASI_KARNESI_BASLIK}** (${kayitlar.length} kayıt)`,
    '',
    satir(sutunlar),
    satir(sutunlar.map(() => '---')),
    ...satirlar.map(satir),
  ].join('\n')
  return { ekran, konusma: `${genitif(ad)} aşı karnesini ekrana getirdim Hocam; ${kayitlar.length} kayıt var.`, sutunlar, satirlar }
}
