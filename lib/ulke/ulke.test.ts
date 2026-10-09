/**
 * NOTYA-ULKE-01 — the country foundation, with NO country configured (= Türkiye, exactly as before).
 *
 *   1. No country configured → Türkiye. The Türkiye pack reproduces today's values, read from the code that held them.
 *   2. Every pack has the same shape; every switched-on language carries every key of every switched-on surface.
 *   3. Fail closed: an unlisted feature is off; an unknown country is an error, not a guess.
 *
 * The same questions asked of an Uzbekistan build: lib/ulke/ulke.uz.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { aktifUlke, aracUlkedeGecerli, dilSec, ozellikAcik, ulkePaketi } from './ulke'
import { metin, yuzeyMetinleri } from './metin'
import { rotaAcikMi } from './rotaKapisi'
import { ulkeYolOnEki, ulkeYolu, YOL_ON_EKI_BICIMI } from './yol'
import { ULKE_KODLARI, type Ozellik, type UlkePaketi } from './tipler'
import { TUM_ULKELER } from '../../countries/tumu'
import { sizintiTara } from './testing/sizintiTarayici'
import { cepTelefonuDogrula } from '../iletisim/cepTelefonu'
import { tcKimlikGecerli } from '../enabiz/mbys/kontrol'
import { VARSAYILAN_SAAT_DILIMI } from '../doktor/selam'

const KOK = resolve(__dirname, '../..')
const oku = (p: string) => readFileSync(join(KOK, p), 'utf8')
const derleme = async (kod: string) => (await import(pathToFileURL(join(KOK, 'countries', kod, 'derleme.mjs')).href)).default as { kod: string; saatDilimi: string; bolunmemisUygulama: boolean; yonlendirmeler: unknown[]; yolOnEki?: string }

describe('no country configured = Türkiye, as before', () => {
  it('the active country is tr and the active pack is the Türkiye pack', () => {
    assert.equal(process.env.NOTYA_COUNTRY, undefined, 'this file must run without NOTYA_COUNTRY')
    assert.equal(aktifUlke(), 'tr')
    assert.equal(ulkePaketi(), TUM_ULKELER.tr.paket)
  })

  it('time zone, redirects: the values next.config.mjs held on main, unchanged', async () => {
    const d = await derleme('tr')
    assert.equal(d.saatDilimi, 'Europe/Istanbul')
    assert.equal(ulkePaketi().saatDilimi, d.saatDilimi)
    assert.equal(ulkePaketi().saatDilimi, VARSAYILAN_SAAT_DILIMI)
    const config = oku('next.config.mjs')
    assert.match(config, /TZ: ulkeDerleme\.saatDilimi/)
    // The redirect list is still the literal in next.config.mjs, line for line as on main, returned only for the
    // pre-split application; another country never gets it.
    assert.equal(d.bolunmemisUygulama, true)
    const liste = /if \(!ulkeDerleme\.bolunmemisUygulama\) return ulkeDerleme\.yonlendirmeler\n\s+return \[([\s\S]*?)\n\s+\]\n\s+\},/.exec(config)
    assert.ok(liste, 'redirect block not found in next.config.mjs')
    assert.deepEqual(liste![1].split('\n').map((s) => s.trim()).filter((s) => s.startsWith('{')), [
      "{ source: '/', destination: '/doktor', permanent: false },",
      "{ source: '/login', destination: '/giris', permanent: true },",
      "{ source: '/signin', destination: '/giris', permanent: true },",
      "{ source: '/doktor-tools/bekleyen-konsultasyonlar', destination: '/doktor-tools/konsultasyonlar', permanent: true },",
    ])
    assert.match(config, /const ULKE = process\.env\.NOTYA_COUNTRY \|\| 'tr'/)
  })

  it('path prefix: Türkiye is the domain root — no basePath is set and every address is what it was', async () => {
    // NOTYA-UZ-MUAYENE-01: another country may be served under a path of the main site; Türkiye must not notice.
    const d = await derleme('tr')
    assert.equal(d.yolOnEki, '')
    assert.equal(ulkePaketi().yolOnEki, undefined)
    assert.equal(ulkeYolOnEki(), '')
    for (const y of ['/', '/doktor', '/giris?x=1', '/api/users/me', '#top', '/?a=1#b']) assert.equal(ulkeYolu(y), y)
    const config = oku('next.config.mjs')
    // The ONLY place basePath is written: spread in when the country's build file names a prefix, absent otherwise.
    assert.equal((config.match(/basePath/g) || []).length, 1, 'basePath is written in exactly one place')
    assert.match(config, /\.\.\.\(YOL_ON_EKI \? \{ basePath: YOL_ON_EKI \} : \{\}\),/)
    assert.match(config, /const YOL_ON_EKI = ulkeDerleme\.yolOnEki \|\| ''/)
    assert.doesNotMatch(config, /assetPrefix|trailingSlash|async rewrites/, 'no forwarding rule and no other path setting belongs in this file')
  })

  it('language, currency, formats', () => {
    const p = ulkePaketi()
    assert.deepEqual([p.diller, p.acikDiller, p.varsayilanDil], [['tr'], ['tr'], 'tr'])
    assert.deepEqual(p.paraBirimi, { kod: 'TRY', simge: '₺', ondalikHane: 2 })
    assert.equal(p.bicim.yerel, 'tr-TR')
    // The pack's rules produce what the screens print today with toLocale*('tr-TR').
    assert.equal(new Date(Date.UTC(2026, 9, 8, 9, 0)).toLocaleDateString(p.bicim.yerel, { timeZone: p.saatDilimi }), '08.10.2026')
    assert.equal((1490.5).toLocaleString(p.bicim.yerel), `1${p.bicim.binlikAyraci}490${p.bicim.ondalikAyraci}5`)
  })

  it('phone and national id: the SAME validators the application uses, not copies', () => {
    const p = ulkePaketi()
    for (const ham of ['0532 123 45 67', '5321234567', '+90 532 123 45 67', '0212 123 45 67', '+1 202 555 0143', '', 'abc', '123']) {
      assert.equal(p.telefon.cepGecerliMi(ham), cepTelefonuDogrula(ham).ok, ham)
    }
    assert.equal(p.ulusalKimlik!.gecerliMi, tcKimlikGecerli)
    assert.equal(p.ulusalKimlik!.hane, 11)
    assert.equal(p.ulusalKimlik!.gecerliMi('10000000146'), true)
    assert.equal(p.ulusalKimlik!.gecerliMi('10000000147'), false)
  })

  it('root shell: the title and description app/layout.tsx carried on main', () => {
    const p = ulkePaketi()
    assert.equal(p.kabuk.baslik, 'Notya AI — Yapay Zekâ Uzman Asistanı')
    assert.equal(p.kabuk.aciklama, 'Doktorun cebindeki dünyaca ünlü uzman. Sesli komutla hasta oluştur, tanı al, reçete yaz.')
    assert.equal(p.kabuk.zemin, '#0A1628')
  })

  it('the whole application is open: every route, visible to search engines as today', () => {
    const p = ulkePaketi()
    assert.equal(p.rotalar, 'hepsi')
    assert.equal(p.aramaMotorlarinaGizli, false)
    for (const yol of ['/', '/doktor', '/klinik', '/giris/doktor', '/dashboard/doktor', '/doktor-tools/erecete', '/api/users/me', '/api/doktor/hastalar', '/robots.txt', '/anything/at/all']) {
      assert.equal(rotaAcikMi(p.rotalar, yol), true, yol)
    }
    for (const o of ['bolunmemisUygulama', 'doktorAraclari', 'asistan', 'sesProfili', 'goruntuDegerlendirme'] as Ozellik[]) {
      assert.equal(ozellikAcik(o), true, o)
    }
  })

  it('middleware: the pre-split application keeps its own middleware.ts, untouched; the country gate lives in middleware.ulke.ts', () => {
    assert.doesNotMatch(oku('middleware.ts'), /AKTIF_PAKET|lib\/ulke|countries\//)
    const m = oku('middleware.ulke.ts')
    // The gate sits before NextResponse.next(), so a blocked path never reaches the application.
    assert.ok(m.indexOf('rotaAcikMi(izin, pathname)') > 0 && m.indexOf('rotaAcikMi(izin, pathname)') < m.indexOf('NextResponse.next()'))
    // Built by mistake for a pack that claims the whole application, it closes everything rather than opening everything.
    assert.match(m, /AKTIF_PAKET\.rotalar === 'hepsi' \? \{ sayfalar: \[\], apiOnEkleri: \[\] \}/)
    assert.match(oku('next.config.mjs'), /\.\.\.\(ulkeDerleme\.bolunmemisUygulama \? \{\} : \{ pageExtensions: \['ulke\.tsx', 'ulke\.ts', 'mjs'\] \}\)/)
  })
})

describe('fail closed', () => {
  it('a feature the pack does not list is off — including a key nobody has defined', () => {
    // Türkiye's own landing, login and sign-up are still the pre-split screens, not the core ones.
    for (const o of ['acilisSayfasi', 'cekirdekGiris', 'davetliKayit', 'bekletmeSayfasi'] as Ozellik[]) assert.equal(ozellikAcik(o), false, o)
    assert.equal(ozellikAcik('olmayan-ozellik' as Ozellik), false)
    assert.equal(ozellikAcik('toString' as Ozellik), false)
    assert.equal(ozellikAcik('constructor' as Ozellik), false)
  })

  it('a tool is valid only when the tool names the country AND the pack lists the route', () => {
    assert.equal(aracUlkedeGecerli('/doktor-tools/erecete', ['tr']), true)
    assert.equal(aracUlkedeGecerli('/doktor-tools/erecete', ['uz']), false)
    assert.equal(aracUlkedeGecerli('/doktor-tools/erecete', []), false)
    assert.equal(aracUlkedeGecerli('/doktor-tools/erecete', null), false)
    assert.equal(aracUlkedeGecerli('/doktor-tools/yeni-arac', ['tr']), false, 'named by the tool but not listed by the pack')
  })

  it('a language that is not switched on resolves to the country own default, never to another country', () => {
    assert.equal(dilSec('tr'), 'tr')
    for (const ham of ['uz-Latn', 'ru', 'en', '', null, undefined]) assert.equal(dilSec(ham), 'tr')
  })

  it('text: an unknown surface throws instead of showing something else', () => {
    assert.equal(metin('hesap', 'girisReddi'), 'E-posta veya şifre hatalı.')
    assert.throws(() => yuzeyMetinleri('olmayan' as 'hesap'), /No fallback/)
  })

  it('an unknown country code stops the process — it is never treated as Türkiye', () => {
    const calistir = (ulke: string) => execFileSync('npx', ['--yes', 'tsx', '-e', "const { AKTIF_PAKET } = require('./countries/active'); console.log(AKTIF_PAKET.kod)"], {
      cwd: KOK, env: { ...process.env, NOTYA_COUNTRY: ulke }, stdio: ['ignore', 'pipe', 'pipe'],
    }).toString().trim()
    assert.equal(calistir('tr'), 'tr')
    assert.equal(calistir('uz'), 'uz')
    assert.throws(() => calistir('xx'), /not a country this build knows/)
    assert.throws(() => calistir('TR'), /not a country this build knows/)
  })

  it('the build config refuses an unknown country', () => {
    const config = oku('next.config.mjs')
    assert.match(config, /if \(!\/\^\[a-z\]\{2\}\$\/\.test\(ULKE\) \|\| !existsSync\(/)
    assert.match(config, /throw new Error\(`NOTYA_COUNTRY=/)
  })
})

describe('every country pack: same shape, complete text, own content only', () => {
  const paketler = ULKE_KODLARI.map((k) => [k, TUM_ULKELER[k].paket] as const)

  it('same keys in every pack, and the code matches the folder', () => {
    // `uygulama` (settings of the signed-in application) is the one optional part: present exactly where that
    // feature is on (NOTYA-UZ-MUAYENE-01) — Türkiye's pack does not gain a field for a screen it does not have.
    // `yolOnEki` (path prefix) is the other: present only for a country served under a path of the main site.
    const anahtarlar = (p: UlkePaketi) => Object.keys(p).filter((k) => k !== 'uygulama' && k !== 'yolOnEki').sort()
    for (const [kod, p] of paketler) {
      assert.equal(p.kod, kod)
      assert.deepEqual(anahtarlar(p), anahtarlar(TUM_ULKELER.tr.paket), kod)
      assert.equal(Boolean(p.uygulama), p.ozellikler.cekirdekMuayene === true, `${kod}: application settings and the feature go together`)
      for (const d of p.uygulama?.diller ?? []) assert.ok(p.diller.includes(d), `${kod}: application language ${d} is not a declared language`)
      if (p.uygulama) assert.ok(p.uygulama.diller.includes(p.varsayilanDil), `${kod}: the default language must be an application language`)
      assert.match(p.iz, new RegExp(`^notya-ulke-paketi:${kod}:[0-9a-f]{10}$`))
    }
    assert.equal(new Set(paketler.map(([, p]) => p.iz)).size, paketler.length, 'markers must be unique')
  })

  it('time zone in the pack equals the build-level file of the same country', async () => {
    for (const [kod, p] of paketler) {
      const d = await derleme(kod)
      assert.equal(d.kod, kod)
      assert.equal(d.bolunmemisUygulama, p.ozellikler.bolunmemisUygulama === true, `${kod}: build file and pack disagree on the pre-split application`)
      if (!d.bolunmemisUygulama) assert.ok(Array.isArray(d.yonlendirmeler), kod)
      assert.equal(p.saatDilimi, d.saatDilimi, kod)
      assert.doesNotThrow(() => new Intl.DateTimeFormat('en-US', { timeZone: p.saatDilimi }), kod)
      // NOTYA-UZ-MUAYENE-01: the path prefix is written twice (the build cannot import the pack); the two must agree.
      assert.equal(p.yolOnEki ?? '', d.yolOnEki ?? '', `${kod}: path prefix in the pack and in the build file disagree`)
      assert.match(p.yolOnEki ?? '', YOL_ON_EKI_BICIMI, kod)
      if (p.rotalar === 'hepsi') assert.equal(p.yolOnEki, undefined, `${kod}: the pre-split application is served at the domain root`)
    }
  })

  it('languages: switched-on ⊆ declared, default is switched on', () => {
    for (const [kod, p] of paketler) {
      for (const d of p.acikDiller) assert.ok(p.diller.includes(d), `${kod}: ${d}`)
      assert.ok(p.acikDiller.includes(p.varsayilanDil), kod)
    }
  })

  it('every switched-on language carries every key of every switched-on surface (the Turkish source defines the keys)', () => {
    const kaynak = TUM_ULKELER.tr.paket.metinler.tr!
    for (const [kod, p] of paketler) {
      assert.deepEqual(Object.keys(p.metinler).sort(), [...p.acikDiller].sort(), `${kod}: one catalogue per switched-on language, no more`)
      for (const dil of p.acikDiller) {
        for (const yuzey of p.yuzeyler) {
          const m = p.metinler[dil]?.[yuzey] as Record<string, string> | undefined
          assert.ok(m, `${kod}/${dil}: surface ${yuzey} missing`)
          const beklenen = Object.keys(kaynak[yuzey] ?? {}).sort()
          assert.ok(beklenen.length > 0, `Turkish source has no keys for ${yuzey}`)
          assert.deepEqual(Object.keys(m).sort(), beklenen, `${kod}/${dil}/${yuzey}`)
          for (const [k, v] of Object.entries(m)) assert.ok(typeof v === 'string' && v.trim().length > 0, `${kod}/${dil}/${yuzey}.${k} empty`)
        }
      }
    }
  })

  it('a non-Turkish pack never repeats the Turkish sentence and carries nothing of another country', () => {
    const kaynak = TUM_ULKELER.tr.paket.metinler.tr! as Record<string, Record<string, string>>
    for (const [kod, p] of paketler) {
      if (kod === 'tr') continue
      const hepsi: string[] = [p.kabuk.baslik, p.kabuk.aciklama, p.paraBirimi.simge, p.ulusalKimlik?.ad ?? '', p.telefon.ornek]
      for (const dil of p.acikDiller) {
        for (const yuzey of p.yuzeyler) {
          for (const [k, v] of Object.entries(p.metinler[dil]![yuzey] as Record<string, string>)) {
            assert.notEqual(v, kaynak[yuzey]?.[k], `${kod}/${dil}/${yuzey}.${k} is the Turkish text`)
            hepsi.push(v)
          }
        }
      }
      assert.deepEqual(sizintiTara(hepsi.join('\n'), { hedefUlke: kod, kaynak: `countries/${kod} pack text` }), [])
    }
  })

  it('Uzbekistan: Uzbek (Latin, default), Uzbek (Cyrillic) and Russian; Asia/Tashkent; UZS; no tool; hidden from search', () => {
    const p = TUM_ULKELER.uz.paket
    assert.deepEqual(p.diller, ['uz-Latn', 'uz-Cyrl', 'ru'])
    assert.equal(p.varsayilanDil, 'uz-Latn')
    // Cyrillic is declared but not switched on until its catalogue exists (checklist E2).
    assert.deepEqual(p.acikDiller, ['uz-Latn', 'ru'])
    assert.equal(p.saatDilimi, 'Asia/Tashkent')
    assert.equal(p.paraBirimi.kod, 'UZS')
    assert.deepEqual(p.araclar, [])
    assert.equal(p.aramaMotorlarinaGizli, true)
    assert.equal(p.yolOnEki, '/uzbek', 'Kaan, 2026-10-08: Uzbekistan is served at notya.io/uzbek')
    assert.notEqual(p.rotalar, 'hepsi')
    assert.equal(p.ozellikler.bolunmemisUygulama, undefined, 'only the pack whose content IS the pre-split application may open it')
    for (const o of ['doktorAraclari', 'asistan', 'sesProfili', 'goruntuDegerlendirme'] as Ozellik[]) assert.equal(p.ozellikler[o], undefined, o)
    for (const ham of ['+998 90 123 45 67', '998901234567', '90 123 45 67', '901234567']) assert.equal(p.telefon.cepGecerliMi(ham), true, ham)
    for (const ham of ['', '0532 123 45 67', '+90 532 123 45 67', '12345', 'abc']) assert.equal(p.telefon.cepGecerliMi(ham), false, ham)
    assert.equal(p.ulusalKimlik!.gecerliMi('12345678901234'), true)
    assert.equal(p.ulusalKimlik!.gecerliMi('10000000146'), false, 'a Turkish id number is not an Uzbek one')
  })

  it('only a pack that opens the whole pre-split application may use rotalar: hepsi', () => {
    for (const [kod, p] of paketler) {
      assert.equal(p.rotalar === 'hepsi', p.ozellikler.bolunmemisUygulama === true, kod)
      if (p.rotalar !== 'hepsi') {
        for (const o of p.rotalar.apiOnEkleri) assert.ok(o.startsWith('/api/') && o.endsWith('/'), `${kod}: ${o}`)
        for (const s of p.rotalar.sayfalar) assert.ok(s === '/' || (s.startsWith('/') && !s.endsWith('/') && !s.startsWith('/api')), `${kod}: ${s}`)
      }
    }
  })
})
