/**
 * MBYS-YARDIMCI-02 — the helper zip (build step + download route), the doctor-only download, and "Haritayı kopyala".
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inflateRawSync } from 'node:zlib'
import { crc32, klasorDosyalari, klasoruPaketle, UZANTI_DIZINI } from './zipPaket.mjs'
import { haritaMesaji, kisiselVeriVarMi } from './haritaMesaji'

/** Minimal reader: walk the central directory and inflate every entry. */
function zipOku(zip: Buffer): Map<string, Buffer> {
  const sonOf = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  assert.ok(sonOf >= 0, 'end of central directory')
  const adet = zip.readUInt16LE(sonOf + 10)
  let p = zip.readUInt32LE(sonOf + 16)
  const out = new Map<string, Buffer>()
  for (let i = 0; i < adet; i++) {
    assert.equal(zip.readUInt32LE(p), 0x02014b50)
    const sikisik = zip.readUInt32LE(p + 20), boy = zip.readUInt32LE(p + 24), adBoy = zip.readUInt16LE(p + 28)
    const crc = zip.readUInt32LE(p + 16), yerelOf = zip.readUInt32LE(p + 42)
    const ad = zip.subarray(p + 46, p + 46 + adBoy).toString('utf8')
    const veriOf = yerelOf + 30 + zip.readUInt16LE(yerelOf + 26) + zip.readUInt16LE(yerelOf + 28)
    const veri = inflateRawSync(zip.subarray(veriOf, veriOf + sikisik))
    assert.equal(veri.length, boy)
    assert.equal(crc32(veri), crc, `${ad} crc`)
    out.set(ad, veri)
    p += 46 + adBoy
  }
  return out
}

test('crc32 matches the standard check value', () => {
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926)
})

test('the zip holds exactly the extension folder under mbys-yardimci/, byte for byte, deterministic', () => {
  const zip = klasoruPaketle(UZANTI_DIZINI)
  const icerik = zipOku(zip)
  const kaynak = klasorDosyalari(UZANTI_DIZINI)
  assert.deepEqual([...icerik.keys()].sort(), kaynak.map((d) => d.ad).sort())
  for (const d of kaynak) assert.ok(icerik.get(d.ad)!.equals(d.veri), d.ad)
  assert.ok(icerik.has('mbys-yardimci/manifest.json'))
  assert.ok(klasoruPaketle(UZANTI_DIZINI).equals(zip), 'same input → same bytes')
})

test('build step and download route are wired; the download is doctor-only', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
  assert.match(pkg.scripts.prebuild, /scripts\/mbys-yardimci-paketle\.mjs/)
  const rota = readFileSync('app/api/doktor/araclar/enabiz/mbys/yardimci/route.ts', 'utf8')
  assert.match(rota, /if \(oturum\.rol !== 'doktor'\) return NextResponse\.json\(\{ error: [^}]+\}, \{ status: 403 \}\)/)
  assert.match(rota, /'Cache-Control': 'private, no-store'/)
  assert.match(readFileSync('next.config.mjs', 'utf8'), /'\/api\/doktor\/araclar\/enabiz\/mbys\/yardimci': \['\.\/\.mbys-paket\/mbys-yardimci\.zip'/)
  const kuyruk = readFileSync('components/doktor/MbysKuyrugu.tsx', 'utf8')
  assert.match(kuyruk, /\{rol === 'doktor' && yardimci !== null && <MbysYardimciKurulum/)
  const kurulum = readFileSync('components/doktor/MbysYardimciKurulum.tsx', 'utf8')
  for (const s of ['Yardımcıyı indir', 'Paketlenmemiş öğe yükle', 'Geliştirici modu', 'Alan eşlemesi henüz doğrulanıyor', 'Form haritasını kopyala', 'Haritayı kopyala']) {
    assert.ok(kurulum.includes(s), s)
  }
  // no invented support contact
  assert.ok(!/mailto:|wa\.me\/|@notya\./.test(kurulum))
})

const yakalama = (ek: Record<string, unknown> = {}) => JSON.stringify({ arac: 'notya-mbys-harita', surum: 1, cerceveler: [{ cerceve: 0, alanlar: [{ etiket: 'T.C. Kimlik No', id: 'HastaTC' }] }], ...ek }, null, 2)

test('Haritayı kopyala: two screens → one message with both captures', () => {
  const s = haritaMesaji({ hastaKayit: yakalama({ yol: '/HastaKayit' }), muayene: yakalama({ yol: '/Muayene' }) }, { yardimciSurumu: '0.1.0', simdi: new Date('2026-10-07T10:00:00Z') })
  assert.ok(s.ok)
  assert.match(s.metin, /^Notya MBYS Yardımcısı — form haritası\nTarih: 2026-10-07\nYardımcı sürümü: 0\.1\.0/)
  assert.ok(s.metin.includes('=== Hasta Kayıt ekranı ===') && s.metin.includes('=== Muayene ekranı ==='))
  assert.deepEqual(s.eksik, [])
})

test('Haritayı kopyala: one screen is allowed and named as missing', () => {
  const s = haritaMesaji({ hastaKayit: yakalama() })
  assert.ok(s.ok && s.eksik[0] === 'muayene' && s.metin.includes('Eksik ekran: Muayene ekranı'))
})

test('Haritayı kopyala refuses non-captures and anything that looks like personal data', () => {
  assert.equal(haritaMesaji({}).ok, false)
  assert.equal(haritaMesaji({ hastaKayit: 'Ahmet Yılmaz 12345678901' }).ok, false)
  assert.equal(haritaMesaji({ hastaKayit: yakalama({ baslik: 'Hasta 10000000146' }) }).ok, false)
  assert.equal(haritaMesaji({ muayene: yakalama({ baslik: 'qa@ornek.test' }) }).ok, false)
  assert.equal(kisiselVeriVarMi('HastaTC 123'), false)
  assert.equal(kisiselVeriVarMi('••••••••••• 1234567890123'), false)
})
