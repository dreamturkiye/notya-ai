/**
 * FOTO-ARSIV-01 (g) — the "fotoğraf raporu" PDF: real render, then the text is read back out of the PDF so the Turkish glyphs
 * (ı İ ş Ş ğ Ğ ü ö ç), dates, region, tags, note and the "N gün arayla" interval are verified byte for byte.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fotoRaporuUret, type RaporGirdisi, type RaporOgesi } from './raporPdf'
import { dataUrl, sentetikPng } from './testGorselleri'

async function pdfMetni(buf: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), disableFontFace: true, useSystemFonts: false, isEvalSupported: false }).promise
  let t = ''
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent()
    t += (c.items as Array<{ str?: string }>).map((x) => x.str || '').join(' ') + '\n'
  }
  return t.replace(/\s+/g, ' ')
}

const oge = (tarih: string, ek: Partial<RaporOgesi> = {}): RaporOgesi => ({
  bolge: 'Bacak — sağ', tarih, etiketler: ['kontrol', 'ödem'], not: 'Çocuğun şişliği ışığa göre değişiyor.', yildiz: 4, anahtar: true, gorsel: dataUrl(sentetikPng(60, 40)), ...ek,
})
const girdi = (ek: Partial<RaporGirdisi> = {}): RaporGirdisi => ({
  baslik: 'Klinik fotoğraf raporu', hastaAdi: 'Işıl Şükrü Ağaoğlu', hekimAdi: 'Dr. Gökhan Örnek', uretildi: '16 Ekim 2026', duzen: 'kolaj',
  ogeler: [oge('1 Eylül 2026'), oge('18 Ekim 2026', { bolge: null, not: '', etiketler: [], anahtar: false, yildiz: 0 })], aralik: null, ...ek,
})

describe('fotoğraf raporu PDF', () => {
  it('kolaj: PDF üretilir; Türkçe karakterler, tarih, bölge, etiket, not ve alt bilgi okunur', async () => {
    const buf = await fotoRaporuUret(girdi())
    assert.equal(buf.subarray(0, 5).toString(), '%PDF-')
    const t = await pdfMetni(buf)
    for (const beklenen of ['Klinik fotoğraf raporu', 'Işıl Şükrü Ağaoğlu', 'Dr. Gökhan Örnek', '1 Eylül 2026', 'Bacak — sağ', 'kontrol', '#ödem', 'Çocuğun şişliği ışığa göre değişiyor.', 'Anahtar fotoğraf', '4/5', 'Bölge belirtilmedi', 'yapay zekâ metni içermez']) {
      assert.ok(t.includes(beklenen), `PDF metninde yok: ${beklenen}\n${t.slice(0, 400)}`)
    }
  })
  it('karşılaştırma düzeni: iki fotoğraf ve "N gün arayla" metni', async () => {
    const t = await pdfMetni(await fotoRaporuUret(girdi({ duzen: 'karsilastirma', aralik: '47 gün arayla (≈ 1,5 ay)' })))
    assert.ok(t.includes('47 gün arayla'))
    assert.ok(t.includes('1 Eylül 2026') && t.includes('18 Ekim 2026'))
  })
  it('tek düzen ve çok sayfa: sayfa numarası alt bilgide', async () => {
    const cok = Array.from({ length: 6 }, (_, i) => oge(`${i + 1} Ekim 2026`))
    const t = await pdfMetni(await fotoRaporuUret(girdi({ duzen: 'tek', ogeler: cok })))
    assert.match(t, /1 \/ \d+/)
    assert.ok(t.includes('6 Ekim 2026'))
  })
  it('rapor yapay zekâ çıktısı taşımaz', async () => {
    const t = await pdfMetni(await fotoRaporuUret(girdi()))
    assert.ok(!/Doktor incelemesi gerekir|Karar destek|differential|ayırıcı/i.test(t))
  })
})
