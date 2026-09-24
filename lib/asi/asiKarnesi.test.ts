/**
 * ASI-KARNESI-01 (C) — Sağlığım dijital aşı karnesi kilitleri.
 *  - tek içerik modeli: kaynak ayrımı (karneden aktarıldı / klinikte uygulandı / beyan), sıradaki aşı yalnız hekimin tarihi
 *  - KLİNİK YORUM YOK (portal dili) · e-Nabız uyarısı ekranda, çıktıda ve PDF'te
 *  - PDF: Türkçe karakterler (ı ş ğ İ Ş Ğ ö ç ü) üretilen PDF METNİNDE bozulmadan — gömülü TrueType, Helvetica değil
 *  - yazdırma: kabuk/düğmeler gizli, beyaz zemin + sıcak koyu (kahverengi) metin, satırlar bölünmez
 *  - portalde e-posta gönderme yüzeyi YOK (Kaan, 2026-09-19 — regresyon koruması)
 *  - evrensel modül: branş kapısı yok, yalnız aşı kaydı varsa
 * Sentetik veri.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  asiKarnesiOlustur, asiKarnesiDoluMu, asiKarnesiDosyaAdi, ASI_KARNESI_YAZDIRMA_CSS, E_NABIZ_BASLIK, E_NABIZ_UYARISI,
  HASTA_KAYNAK_ETIKETI, KAYNAK_ACIKLAMASI, LOT_YER_BASLIK, PAYLAS_IPUCU, type AsiKarnesi,
} from './karneBelgesi'
import { lotYerHucresi, lotYerSatiri, notlardanLotYeri } from './asiLotYeri'
import { KARNE_NOT_ONEKI } from './karneOkuma'
import { asiKarnesiPdf, KARNE_FONT_DOSYALARI } from './karnePdf'
import { portalModulleri, type PortalUygunlukGirdisi } from '../portal/moduller'
import { emptyPortalBundle } from '../portal/emptyBundle'

// Portal bileşenleri otomatik JSX çalışma zamanıyla yazılır (React import etmez); tsx klasik dönüşüm yapar.
;(globalThis as { React?: unknown }).React = React
let AsiKarnesiView: typeof import('../../app/portal/_components/AsiKarnesiView').AsiKarnesiView
const ekran = () => renderToStaticMarkup(React.createElement(AsiKarnesiView, { karne: ORNEK(), basePath: '/portal/hasta/t', pdfUrl: '/api/portal/hasta/t/asi-karnesi/pdf' }))
before(async () => { ({ AsiKarnesiView } = await import('../../app/portal/_components/AsiKarnesiView')) })

const kok = join(import.meta.dirname, '../..')
const oku = (r: string) => readFileSync(join(kok, r), 'utf8')
const bosluk = (s: string) => s.replace(/\s+/g, ' ')

const ORNEK = () => asiKarnesiOlustur({
  asilar: [
    { asi_adi: 'KKK (Kızamık-Kızamıkçık-Kabakulak)', doz_no: 1, uygulama_tarihi: '2025-03-12', sonraki_doz_tarihi: '2027-03-01', kaynak: 'kayit', lot_no: 'MMR-LOT-77', uygulama_yeri: 'SC sol üst kol' },
    { asi_adi: 'Hepatit B', doz_no: 1, uygulama_tarihi: '2024-03-10', kaynak: 'beyan', belge_id: 'b1' },
    { asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2024-04-12', kaynak: 'beyan', notlar: KARNE_NOT_ONEKI },
    { asi_adi: 'Suçiçeği', doz_no: null, uygulama_tarihi: null, kaynak: 'beyan', notlar: null },
    { asi_adi: 'Grip', doz_no: null, uygulama_tarihi: '2025-10-01', sonraki_doz_tarihi: '2026-01-01', kaynak: 'kayit' },
    { asi_adi: '  ', doz_no: 1, uygulama_tarihi: '2025-01-01', kaynak: 'kayit' },
  ],
  hasta: { adSoyad: 'Işıl Şükrü Ağaoğlu İnce', dogumTarihi: '2024-03-10' },
  hekim: { ad: 'Dr. Gökhan Örnek', klinik: 'Çocuk Sağlığı ve Hastalıkları Uzmanı · Kadıköy/İstanbul' },
  bugunIso: '2026-09-19',
})

async function pdfMetni(buf: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({ data: buf, disableFontFace: true, useSystemFonts: false, isEvalSupported: false }).promise
  let t = ''
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent()
    t += (c.items as Array<{ str?: string }>).map((x) => x.str || '').join(' ') + '\n'
  }
  return bosluk(t)
}

describe('karne modeli (tek içerik)', () => {
  it('yapılanlar eskiden yeniye, tarihsiz en sonda; boş adlı satır atlanır', () => {
    const k = ORNEK()
    assert.deepEqual(k.yapilanlar.map((a) => `${a.ad}|${a.doz ?? '-'}|${a.tarih ?? '-'}`), [
      'Hepatit B|1|2024-03-10', 'Hepatit B|2|2024-04-12', 'KKK (Kızamık-Kızamıkçık-Kabakulak)|1|2025-03-12', 'Grip|-|2025-10-01', 'Suçiçeği|-|-',
    ])
  })
  it('kaynak ayrımı: belge izi / not öneki = karneden aktarıldı; kayit = klinikte; iz yoksa beyan', () => {
    const k = ORNEK()
    assert.deepEqual(k.yapilanlar.map((a) => a.kaynak), ['karne', 'karne', 'klinik', 'klinik', 'beyan'])
    assert.equal(HASTA_KAYNAK_ETIKETI.karne, 'Karneden aktarıldı · hekim onaylı')
    assert.equal(HASTA_KAYNAK_ETIKETI.klinik, 'Klinikte uygulandı')
    assert.notEqual(HASTA_KAYNAK_ETIKETI.beyan, HASTA_KAYNAK_ETIKETI.karne)
  })
  it('sıradaki aşı yalnız hekimin girdiği bugün/sonraki tarih — geçmiş tarih ve hesaplama yok', () => {
    const k = ORNEK()
    assert.deepEqual(k.siradakiler, [{ ad: 'KKK (Kızamık-Kızamıkçık-Kabakulak)', tarih: '2027-03-01' }])
  })
  it('sonraki dozu daha sonra kaydedilmiş aşı "sıradaki" gösterilmez (hekim hatırlatma listesiyle aynı kural)', () => {
    const k = asiKarnesiOlustur({ asilar: [
      { asi_adi: 'Hepatit A', doz_no: 1, uygulama_tarihi: '2025-09-15', sonraki_doz_tarihi: '2026-10-15', kaynak: 'kayit' },
      { asi_adi: 'Hepatit A', doz_no: 2, uygulama_tarihi: '2026-09-01', kaynak: 'kayit' },
    ], hasta: { adSoyad: null, dogumTarihi: null }, hekim: { ad: null, klinik: null }, bugunIso: '2026-09-19' })
    assert.deepEqual(k.siradakiler, [])
  })
  it('e-Nabız uyarısı modelde, resmî kaynağı açıkça söyler', () => {
    const k = ORNEK()
    assert.equal(k.uyari.baslik, E_NABIZ_BASLIK)
    assert.match(k.uyari.metin, /T\.C\. Sağlık Bakanlığı e-Nabız/)
    assert.match(k.uyari.metin, /[Oo]kul kaydı/)
    assert.match(k.uyari.metin, /yurt dışı/)
    assert.match(E_NABIZ_BASLIK, /bilgi amaçlıdır/)
  })
  it('dolu mu / dosya adı (dosya adında hasta adı yok)', () => {
    assert.equal(asiKarnesiDoluMu(ORNEK()), true)
    assert.equal(asiKarnesiDoluMu(asiKarnesiOlustur({ asilar: [], hasta: { adSoyad: null, dogumTarihi: null }, hekim: { ad: null, klinik: null }, bugunIso: '2026-09-19' })), false)
    assert.equal(asiKarnesiDosyaAdi(ORNEK()), 'asi-karnesi-2026-09-19.pdf')
  })
})

describe('NOTYA-ASI-LOT-01 — lot no / uygulama yeri', () => {
  it('karne verisi alanları taşır; bilinmeyen boş (null), uydurulmaz', () => {
    const k = ORNEK()
    const kkk = k.yapilanlar.find((a) => a.ad.startsWith('KKK'))!
    assert.equal(kkk.lotNo, 'MMR-LOT-77')
    assert.equal(kkk.uygulamaYeri, 'SC sol üst kol')
    assert.equal(lotYerHucresi(kkk), 'MMR-LOT-77 · SC sol üst kol')
    for (const a of k.yapilanlar.filter((x) => x !== kkk)) {
      assert.equal(a.lotNo, null)
      assert.equal(a.uygulamaYeri, null)
      assert.equal(lotYerHucresi(a), '')
    }
    assert.equal(lotYerHucresi({ lotNo: null, uygulamaYeri: 'IM' }), 'IM')
  })
  it('hekim listesi satırı: yalnız bilinen parça', () => {
    assert.equal(lotYerSatiri({ lot_no: 'Vaxi12345', uygulama_yeri: 'IM' }), 'Lot: Vaxi12345 · Yer: IM')
    assert.equal(lotYerSatiri({ lot_no: 'Vaxi12345' }), 'Lot: Vaxi12345')
    assert.equal(lotYerSatiri({ lot_no: '  ', uygulama_yeri: null }), '')
  })
  it('Sağlığım ekranında kayıtlıysa görünür', () => {
    assert.ok(ekran().includes(`${LOT_YER_BASLIK}: MMR-LOT-77 · SC sol üst kol`))
  })
  it('eski paketli notlar → kolonlar; diğer metin aynen ve aynı sırada kalır (093 göçünün kuralı)', () => {
    assert.deepEqual(notlardanLotYeri('Lot: Vaxi12345 · Uygulama yeri: IM · Muayene notundan aktarıldı (hekim onaylı).'),
      { lot_no: 'Vaxi12345', uygulama_yeri: 'IM', notlar: 'Muayene notundan aktarıldı (hekim onaylı).' })
    assert.deepEqual(notlardanLotYeri('ateş olursa parasetamol · Lot: AB 12 · Muayene notundan aktarıldı (hekim onaylı).'),
      { lot_no: 'AB 12', uygulama_yeri: null, notlar: 'ateş olursa parasetamol · Muayene notundan aktarıldı (hekim onaylı).' })
    assert.deepEqual(notlardanLotYeri('bir aylıkken'), { lot_no: null, uygulama_yeri: null, notlar: 'bir aylıkken' })
    assert.deepEqual(notlardanLotYeri('Lot numarası bilinmiyor'), { lot_no: null, uygulama_yeri: null, notlar: 'Lot numarası bilinmiyor' }, '"Lot:" öneki değilse dokunulmaz')
    assert.deepEqual(notlardanLotYeri('Uygulama yeri: sağ uyluk'), { lot_no: null, uygulama_yeri: 'sağ uyluk', notlar: null })
    assert.deepEqual(notlardanLotYeri(null), { lot_no: null, uygulama_yeri: null, notlar: null })
  })
  it('093 göçü yalnız ekleme + aynı kural (kolonlar nullable, "Lot:" / "Uygulama yeri:" parçası)', () => {
    const sql = oku('lib/db/migrations/093_asi_lot_yeri.sql')
    assert.match(sql, /add column if not exists lot_no text;/)
    assert.match(sql, /add column if not exists uygulama_yeri text;/)
    assert.doesNotMatch(sql.replace(/--.*$/gm, ''), /\b(drop|delete|truncate)\b/i)
    assert.match(sql, /regexp_split_to_array\(x\.notlar, '\\s\*·\\s\*'\)/)
  })
})

describe('portal dili: klinik yorum yok', () => {
  const YASAK = /\b(risk\w*|eksik\w*|gecik\w*|tanı\w*|öneri\w*|önerilir|tehlike\w*|korunmasız|bağışık\w*|yetersiz|tamamlanmamış|kaçırıl\w*)\b/i
  it('sabit metinler ve ekran metni yorum içermez', () => {
    for (const m of [E_NABIZ_BASLIK, E_NABIZ_UYARISI, PAYLAS_IPUCU, ...Object.values(HASTA_KAYNAK_ETIKETI), ...Object.values(KAYNAK_ACIKLAMASI)]) assert.doesNotMatch(m, YASAK, m)
    const html = ekran()
    assert.doesNotMatch(html.replace(/<style>[\s\S]*?<\/style>/, ''), YASAK)
  })
})

describe('Sağlığım ekranı (SSR)', () => {
  let html = ''
  before(() => { html = ekran() })
  it('e-Nabız uyarısı görünür, listeden ÖNCE ve yazdırmada gizlenen bölgenin DIŞINDA', () => {
    assert.ok(html.includes(E_NABIZ_BASLIK))
    assert.ok(html.includes(E_NABIZ_UYARISI.replace(/'/g, '&#x27;')))
    const uyari = html.indexOf('data-e-nabiz'), liste = html.indexOf('<ol class="asi-karnesi-liste"')
    assert.ok(uyari > 0 && liste > uyari)
    const gizli = html.match(/<div data-yazdirma-gizle=""[\s\S]*?<\/div><\/div>/)?.[0] || ''
    assert.ok(gizli.includes('PDF indir') && !gizli.includes('e-Nabız'))
  })
  it('kaynak ayrımı ekranda: her iki rozet ve açıklama', () => {
    assert.ok(html.includes('Karneden aktarıldı · hekim onaylı'))
    assert.ok(html.includes('Klinikte uygulandı'))
    assert.ok(html.includes('data-kaynak="karne"') && html.includes('data-kaynak="klinik"'))
  })
  it('üç eylem: PDF indir (dosya) + Yazdır; Paylaş yalnız cihaz destekliyse (SSR/desteksiz: düğme yok)', () => {
    assert.match(html, /<a class="sg-chip-btn is-active" href="\/api\/portal\/hasta\/t\/asi-karnesi\/pdf" download="asi-karnesi-2026-09-19.pdf"/)
    assert.ok(html.includes('data-eylem="yazdir"'))
    assert.ok(!html.includes('data-eylem="paylas"'), 'desteklenmeyen ortamda sessiz düğme bırakılmaz')
    assert.ok(html.includes('<style>') && html.includes('@media print'))
  })
  it('yazdırma CSS: kabuk + gezinme + düğmeler gizli, beyaz zemin sıcak koyu metin, satır bölünmez, uyarı gizlenmez', () => {
    const css = ASI_KARNESI_YAZDIRMA_CSS
    assert.match(css, /@media print/)
    const gizle = css.match(/([^{}]+)\{\s*display:\s*none !important;\s*\}/)?.[1] || ''
    for (const s of ['.sg-header', '.sg-nav', '.sg-footer', '[data-yazdirma-gizle]']) assert.ok(gizle.includes(s), s)
    assert.ok(!gizle.includes('asi-karnesi-uyari') && !gizle.includes('asi-karnesi-rozet'), 'e-Nabız uyarısı ve kaynak rozeti basılır')
    assert.match(css, /background: #fff !important;/)
    // NOTYA-YENI-GORUNUM-03 (Kaan, 2026-09-24): "no B&W rapor/pdf" yönergesi sonrası saf siyahtan
    // sıcak mürekkep tonuna (#3b2e24) geçildi; ink-economy amacı (beyaz zemin, düşük doygunluk) aynı kaldı.
    assert.match(css, /color: #3b2e24 !important;/)
    assert.match(css, /\.asi-karnesi-satir[^{]*\{[^}]*break-inside: avoid/)
  })
  it('PortalShell sınıfları gerçekten o adları taşır (CSS ile kabuk eşleşir)', () => {
    const kabuk = oku('app/portal/_components/PortalShell.tsx')
    for (const c of ['sg-header', 'sg-nav', 'sg-footer']) assert.ok(kabuk.includes(`className="${c}"`), c)
  })
})

describe('PDF — Türkçe karakter, e-Nabız, kaynak ayrımı (üretilen PDF metni)', () => {
  let metin = '', ham = ''
  it('PDF üretilir ve metni çıkarılır', async () => {
    const buf = await asiKarnesiPdf(ORNEK())
    assert.equal(buf.subarray(0, 5).toString('latin1'), '%PDF-')
    ham = buf.toString('latin1')
    metin = await pdfMetni(new Uint8Array(buf))
    assert.ok(metin.length > 100)
  })
  it('Türkçe karakterler bozulmadan: ı ş ğ İ Ş Ğ ö ç ü', () => {
    for (const k of ['Işıl Şükrü Ağaoğlu İnce', 'Aşı Karnesi', 'Kızamık-Kızamıkçık', 'Çocuk Sağlığı', 'Kadıköy/İstanbul', 'Dr. Gökhan Örnek', 'Suçiçeği', 'DOĞUM TARİHİ', 'SIRADAKİ AŞI']) {
      assert.ok(metin.includes(k), `PDF metninde yok: ${k}`)
    }
    for (const c of 'ışğİŞĞöçü') assert.ok(metin.includes(c), c)
  })
  it('gömülü TrueType (Liberation Sans) — Türkçe glifi olmayan yerleşik Helvetica değil', () => {
    assert.match(ham, /\/FontFile2/)
    assert.match(ham, /LiberationSans/)
    assert.doesNotMatch(ham, /\/BaseFont\s*\/Helvetica/)
    for (const f of Object.values(KARNE_FONT_DOSYALARI)) assert.ok(existsSync(join(kok, f)), f)
  })
  it('e-Nabız uyarısı ve kaynak ayrımı PDF\'te', () => {
    assert.ok(metin.includes(E_NABIZ_BASLIK))
    assert.ok(metin.includes('T.C. Sağlık Bakanlığı e-Nabız'))
    assert.ok(metin.includes('Karneden aktarıldı · hekim onaylı'))
    assert.ok(metin.includes('Klinikte uygulandı'))
    assert.ok(metin.includes('01.03.2027'), 'sıradaki aşı tarihi')
    assert.ok(metin.includes('Oluşturulma: 19.09.2026'))
  })
  it('NOTYA-ASI-LOT-01: "Lot / Uygulama yeri" sütunu PDF\'te; kayıtlı değer görünür', () => {
    assert.ok(metin.includes('LOT / UYGULAMA YERİ'), 'sütun başlığı')
    assert.ok(metin.includes('MMR-LOT-77 · SC sol üst kol'))
  })
  it('Vercel paketi: iki PDF rotası fontu izler (outputFileTracingIncludes)', () => {
    const cfg = oku('next.config.mjs')
    assert.match(cfg, /'\/api\/portal\/hasta\/\*\/asi-karnesi\/pdf': \[[^\]]*LiberationSans-Regular\.ttf[^\]]*LiberationSans-Bold\.ttf/)
    assert.match(cfg, /'\/api\/doktor\/asilar\/karne\/pdf': \[[^\]]*LiberationSans-Regular\.ttf/)
  })
})

describe('portalde e-posta gönderme yüzeyi YOK (Kaan, 2026-09-19 — C6 iptal)', () => {
  const YUZEYLER = [
    'app/portal/_components/AsiKarnesiView.tsx', 'app/portal/hasta/[token]/asi-karnesi/page.tsx',
    'app/api/portal/hasta/[token]/asi-karnesi/pdf/route.ts', 'lib/asi/karneBelgesi.ts', 'lib/asi/karnePaylasim.ts',
    'lib/asi/karnePdf.tsx', 'lib/asi/karneSunucu.ts', 'components/doktor/AsiKarnesiEylemleri.tsx', 'app/api/doktor/asilar/karne/pdf/route.ts',
  ]
  const kod = (r: string) => oku(r).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
  it('e-posta gönderen / adres soran hiçbir şey yok (Resend, notifyPatientEmail, mailto, e-posta alanı)', () => {
    for (const f of YUZEYLER) {
      const s = kod(f)
      assert.doesNotMatch(s, /resend|notifyPatient|sendResendEmail|nodemailer|mailto:|type=["']email["']|e-posta ile gönder|E-posta adresi/i, f)
    }
  })
  it('karne portal API\'si yalnız GET /pdf — gönder/POST rotası yok', () => {
    const kok2 = join(kok, 'app/api/portal/hasta/[token]/asi-karnesi')
    assert.deepEqual(readdirSync(kok2), ['pdf'])
    assert.deepEqual(readdirSync(join(kok2, 'pdf')), ['route.ts'])
    const r = kod('app/api/portal/hasta/[token]/asi-karnesi/pdf/route.ts')
    assert.match(r, /export async function GET/)
    assert.doesNotMatch(r, /export async function (POST|PUT|PATCH)/)
  })
  it('paylaşım yalnız cihazın Web Share API\'si; mailto ile ek denenmez', () => {
    const s = kod('lib/asi/karnePaylasim.ts')
    assert.match(s, /navigator\.canShare\(\{ files:/)
  })
})

describe('evrensel portal modülü (branş kapısı yok)', () => {
  const g = (o: Partial<PortalUygunlukGirdisi>): PortalUygunlukGirdisi => ({ doktorBransi: null, hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false, ...o })
  it('aşı kaydı varsa her branşta açılır, yoksa hiçbirinde', () => {
    for (const b of ['pediatri', 'goz-hastaliklari', 'dahiliye', 'aile-hekimligi', 'kardiyoloji', null]) {
      assert.ok(portalModulleri(g({ doktorBransi: b, asiKaydi: true })).moduller.includes('asi-karnesi'), String(b))
      assert.ok(!portalModulleri(g({ doktorBransi: b, asiKaydi: false })).moduller.includes('asi-karnesi'), String(b))
      assert.ok(!portalModulleri(g({ doktorBransi: b })).moduller.includes('asi-karnesi'), String(b))
    }
  })
  it('nav: "Aşı Karnesi" → /asi-karnesi; chapter modülünün yerini almaz, yanına eklenir', () => {
    const r = portalModulleri(g({ doktorBransi: 'goz-hastaliklari', asiKaydi: true }))
    assert.deepEqual(r.moduller, ['gozlerim', 'asi-karnesi'])
    assert.deepEqual(r.nav.map((n) => [n.label, n.path]), [['Gözlerim', '/gozlerim'], ['Aşı Karnesi', '/asi-karnesi']])
  })
  it('boş bundle: asiKarnesi null; sayfa ve bundle rotası modüle kapılı', () => {
    assert.equal(emptyPortalBundle().asiKarnesi, null)
    assert.match(oku('app/portal/hasta/[token]/asi-karnesi/page.tsx'), /portalModulAktif\(data, 'asi-karnesi'\)/)
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /asiKaydi: asiKarnesiDoluMu\(asiKarnesi\)/)
    assert.match(rota, /if \(modulAktif\('asi-karnesi'\)\) bundle\.asiKarnesi = asiKarnesi/)
  })
})

// Tip kontrolü: demo verisi modele uyar (PHI yok — sentetik).
const _demo: AsiKarnesi | null = null
void _demo
