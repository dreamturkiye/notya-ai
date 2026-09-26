/**
 * KURAL — TÜRKÇE (NOTYA-TURKCE-01) rehber testi.
 *  1. app/ ve components/ altındaki kullanıcıya görünen metinlerde (JSX metni, placeholder / title / aria-label /
 *     alt / label, boşluk içeren düz yazı string'leri) ASCII'ye düşmüş Türkçe kelime (Gokhan, Kayitlarda, kiz cocuk …)
 *     ya da tarayıcının İngilizce kontrol metni / sık İngilizce arayüz kalıbı yok. İstisnalar IZINLI listesinde, gerekçeli.
 *  2. Görünür <input type="file"> yok (tarayıcı "Choose File / No file chosen" yazar) — DosyaSecDugmesi kullanılır.
 *  3. Kök düzen lang="tr" ve Türkçe HTML5 doğrulama mesajlarını (TurkceDogrulama) bağlar.
 *  4. Ekranda tarih / sayı biçimi yerel ayarsız (toLocaleDateString()) çağrılmaz — tr-TR yazılır.
 * Kapsam dışı: Mali, Avukat, sandbox. Tarayıcı: lib/turkce/turkceDenetim.ts · Rapor: scripts/turkce-tara.mts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import ts from 'typescript'
import { asciiTurkceBul, dosyaTara, ingilizceBul, type Bulgu } from './turkceDenetim'
import { dogrulamaMesaji, turkceHataMesaji } from './dogrulamaMesaji'

const KOK = resolve(__dirname, '../..')
const KLASORLER = ['app', 'components']
const HARIC = /(^|\/)(mali|mali-tools|avukat|sandbox)(\/|$)|(^|\/)(mali|avukat)-chat\/|\.test\.|\.d\.ts$/

function dosyalar(klasor: string): string[] {
  const tam = join(KOK, klasor)
  if (!existsSync(tam)) return []
  const cikti: string[] = []
  const gez = (d: string) => {
    for (const ad of readdirSync(d)) {
      if (ad === 'node_modules' || ad.startsWith('.')) continue
      const yol = join(d, ad)
      const goreli = relative(KOK, yol)
      if (HARIC.test(goreli)) continue
      if (statSync(yol).isDirectory()) gez(yol)
      else if (/\.(ts|tsx)$/.test(ad)) cikti.push(goreli)
    }
  }
  gez(tam)
  return cikti
}

const TUM = KLASORLER.flatMap(dosyalar)

/**
 * Bilinçli istisnalar: { dosya, metin (bulgunun metninde geçen parça), neden }.
 * Yeni istisna eklemeden önce metni Türkçeleştirmeyi dene; istisna yalnız kullanıcıya görünmeyen ya da
 * yasal / özel ad olan metin içindir.
 */
const IZINLI: { dosya: string; metin: string; neden: string }[] = [
  { dosya: 'app/api/doktor/ilaclar/doz-oner/route.ts', metin: "ruhsatlı ilaçlar ve Türk pediatri", neden: 'aciklama, model sözleşmesindeki JSON alan adı (parser da aciklama okur); ekrana çıkmaz.' },
  { dosya: 'app/kvkk/page.tsx', metin: 'Google user data', neden: 'Google OAuth doğrulamasının aradığı Limited Use beyanı; İngilizce kalmalı.' },
  { dosya: 'app/kvkk/page.tsx', metin: 'Limited Use', neden: 'Google OAuth doğrulamasının aradığı Limited Use beyanı; İngilizce kalmalı.' },
  // @@IZINLI@@
]

const izinliMi = (b: Bulgu) => IZINLI.some((i) => i.dosya === b.dosya && b.metin.includes(i.metin))

describe('KURAL — TÜRKÇE: kullanıcıya görünen metin (NOTYA-TURKCE-01)', () => {
  it('taranan küme boş değil (test kendini kandırmasın)', () => {
    assert.ok(TUM.length > 300, `yalnız ${TUM.length} dosya tarandı`)
    assert.ok(TUM.includes('app/layout.tsx') && TUM.some((d) => d.startsWith('components/doktor/')))
    assert.ok(!TUM.some((d) => /(^|\/)(mali|avukat)(\/|$)/.test(d)), 'Mali / Avukat kapsam dışı')
  })

  it('tarayıcı ASCII-Türkçe ve İngilizceyi yakalar, doğru yazımı geçirir', () => {
    assert.equal(asciiTurkceBul('Kayitlarda 0 hasta')?.dogru, 'kayıtlarda')
    assert.equal(asciiTurkceBul('5 yaşında kiz cocuk')?.dogru, 'kız')
    assert.equal(asciiTurkceBul('Dr. Gokhan bekliyor')?.dogru, 'Gökhan')
    assert.equal(asciiTurkceBul('Goruntuleme')?.dogru, 'görüntüleme')
    assert.equal(asciiTurkceBul('Ilac Gecmisi')?.dogru, 'ilaç')
    assert.equal(asciiTurkceBul('Görüntüleme · İlaç · Geçmiş · Kayıtlarda · kız çocuk · Dr. Gökhan'), null)
    assert.equal(asciiTurkceBul('KADIN HASTALIKLARI · AKTİF HASTA DOSYASI · UYARI'), null, 'büyük harfte ı → I doğrudur')
    assert.equal(asciiTurkceBul('specialties/cocuk-cerrahisi/prompts'), null, 'yol / slug kelime sayılmaz')
    assert.equal(ingilizceBul('Choose File', true), 'choose file')
    assert.equal(ingilizceBul('Please fill out this field.', false), 'please fill out this field')
    assert.equal(ingilizceBul('Internal Server Error', false), 'internal server error')
    assert.equal(ingilizceBul('Cancel', true), 'cancel')
    assert.equal(ingilizceBul('Kaydet', true), null)
    assert.equal(ingilizceBul('Not eklendi', true), null, '"not" Türkçe kelime')
    const ornek = dosyaTara(`export default function A() { return <div title="Kayit basarisiz" aria-label="Close">{x === 'uyari' ? 'Tamam' : 'Loading...'}</div> }`, 'ornek.tsx')
    assert.deepEqual(ornek.map((b) => b.tur).sort(), ['ascii', 'ingilizce', 'ingilizce'])
  })

  it('app/ ve components/ içinde ASCII-Türkçe ya da İngilizce arayüz metni yok', () => {
    const bulgular = TUM.flatMap((d) => dosyaTara(readFileSync(join(KOK, d), 'utf8'), d)).filter((b) => !izinliMi(b))
    const satirlar = bulgular.map((b) => `${b.dosya}:${b.satir} [${b.tur}: ${b.kelime}] ${b.metin}`)
    assert.deepEqual(satirlar, [], `Kullanıcıya görünen metin Türkçe ve Türkçe karakterli olmalı (KURAL — TÜRKÇE):\n${satirlar.join('\n')}`)
  })

  it('IZINLI listesi bayat değil (her istisna hâlâ bir bulguya denk geliyor)', () => {
    const bulgular = TUM.flatMap((d) => dosyaTara(readFileSync(join(KOK, d), 'utf8'), d))
    const bayat = IZINLI.filter((i) => !bulgular.some((b) => b.dosya === i.dosya && b.metin.includes(i.metin)))
    assert.deepEqual(bayat, [], 'Artık gerekmeyen istisnayı IZINLI listesinden sil')
  })

  it('görünür <input type="file"> yok — DosyaSecDugmesi ya da gizli girdi + Türkçe düğme', () => {
    const bulgular: string[] = []
    for (const d of TUM.filter((x) => x.endsWith('.tsx'))) {
      const kaynak = readFileSync(join(KOK, d), 'utf8')
      if (!/type=["'{]+file/.test(kaynak)) continue
      const sf = ts.createSourceFile(d, kaynak, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      const gez = (n: ts.Node) => {
        if ((ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) && n.tagName.getText(sf) === 'input') {
          const nitelikler = n.attributes.properties.filter(ts.isJsxAttribute)
          const deger = (ad: string) => nitelikler.find((a) => a.name.getText(sf) === ad)?.initializer?.getText(sf) ?? ''
          if (/^["'{]*['"]?file['"]?[}]*$/.test(deger('type'))) {
            const gizli = /display:\s*['"]none['"]/.test(deger('style')) || /\b(hidden|sr-only)\b/.test(deger('className')) || nitelikler.some((a) => a.name.getText(sf) === 'hidden')
            if (!gizli) bulgular.push(`${d}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`)
          }
        }
        ts.forEachChild(n, gez)
      }
      gez(sf)
    }
    assert.deepEqual(bulgular, [], `Tarayıcının İngilizce dosya seçicisi görünüyor — DosyaSecDugmesi kullan:\n${bulgular.join('\n')}`)
  })

  it('kök düzen: <html lang="tr"> ve Türkçe doğrulama mesajları bağlı', () => {
    const duzen = readFileSync(join(KOK, 'app/layout.tsx'), 'utf8')
    assert.match(duzen, /<html lang="tr">/)
    assert.match(duzen, /<TurkceDogrulama \/>/)
    assert.match(readFileSync(join(KOK, 'app/global-error.tsx'), 'utf8'), /<html lang="tr">/)
  })

  it('ekranda yerel ayarsız tarih / sayı biçimi yok (tr-TR yazılır)', () => {
    const desen = /\.toLocale(Date|Time)?String\(\s*\)|\.toLocale(Date|Time)?String\(\s*undefined|Intl\.(DateTimeFormat|NumberFormat)\(\s*\)/
    const bulgular: string[] = []
    for (const d of TUM) readFileSync(join(KOK, d), 'utf8').split('\n').forEach((s, i) => { if (desen.test(s)) bulgular.push(`${d}:${i + 1}: ${s.trim().slice(0, 120)}`) })
    assert.deepEqual(bulgular, [], `Tarih / sayı biçimine 'tr-TR' ver:\n${bulgular.join('\n')}`)
  })
})

describe('Türkçe HTML5 doğrulama mesajları', () => {
  const bos = { valueMissing: false, typeMismatch: false, patternMismatch: false, tooShort: false, tooLong: false, rangeUnderflow: false, rangeOverflow: false, stepMismatch: false, badInput: false }
  const alan = (type: string, v: Partial<typeof bos>, nitelik: Record<string, string> = {}, tagName = 'INPUT') => ({ type, tagName, title: nitelik.title ?? '', validity: { ...bos, ...v }, getAttribute: (a: string) => nitelik[a] ?? null })

  it('her doğrulama durumu Türkçe ve anlamlı', () => {
    assert.equal(dogrulamaMesaji(alan('text', { valueMissing: true })), 'Lütfen bu alanı doldurun.')
    assert.equal(dogrulamaMesaji(alan('checkbox', { valueMissing: true })), 'Devam etmek için bu kutuyu işaretleyin.')
    assert.equal(dogrulamaMesaji(alan('select-one', { valueMissing: true }, {}, 'SELECT')), 'Lütfen listeden bir seçim yapın.')
    assert.equal(dogrulamaMesaji(alan('file', { valueMissing: true })), 'Lütfen bir dosya seçin.')
    assert.match(dogrulamaMesaji(alan('email', { typeMismatch: true })) ?? '', /geçerli bir e-posta/)
    assert.equal(dogrulamaMesaji(alan('text', { tooShort: true }, { minlength: '11' })), 'Lütfen en az 11 karakter girin.')
    assert.equal(dogrulamaMesaji(alan('number', { rangeOverflow: true }, { max: '300' })), 'Değer en fazla 300 olmalı.')
    assert.equal(dogrulamaMesaji(alan('number', { badInput: true })), 'Lütfen geçerli bir sayı girin.')
    assert.equal(dogrulamaMesaji(alan('text', { patternMismatch: true }, { title: '11 haneli T.C. kimlik no' })), 'Lütfen istenen biçimde girin: 11 haneli T.C. kimlik no')
    assert.equal(dogrulamaMesaji(alan('text', {})), null, 'geçerli alana mesaj yazılmaz')
  })

  it('hiçbir mesaj İngilizce değil', () => {
    for (const k of Object.keys(bos) as (keyof typeof bos)[]) {
      for (const tur of ['text', 'email', 'url', 'number', 'checkbox', 'radio', 'file', 'date', 'tel']) {
        const m = dogrulamaMesaji(alan(tur, { [k]: true }, { min: '1', max: '9', minlength: '2', maxlength: '5' }))
        assert.ok(m && /[çğıİöşüÇĞÖŞÜ]/.test(m), `${k}/${tur}: ${m}`)
        assert.equal(ingilizceBul(m, true), null, `${k}/${tur}: ${m}`)
      }
    }
  })

  it('hata sayfası tarayıcının İngilizce hata metnini göstermez', () => {
    assert.equal(turkceHataMesaji('Cannot read properties of undefined (reading "id")'), null)
    assert.equal(turkceHataMesaji('Failed to fetch'), null)
    assert.equal(turkceHataMesaji('Hasta dosyası açılamadı.'), 'Hasta dosyası açılamadı.')
  })
})
