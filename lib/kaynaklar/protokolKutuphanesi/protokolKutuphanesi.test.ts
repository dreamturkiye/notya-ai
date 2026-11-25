/**
 * TR-PROTOKOL-KUTUPHANESI — registry integrity, citation lock from the registry, source chips, monthly change detection (pure),
 * founder review validation, per-doctor isolation of announcements.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  PROTOKOL_BELGELERI, TAKIP_LISTELERI, TUM_BRANSLAR, TIP_BRANSLARI, belgeBul, bransBelgeleri, bransDogrulanmisKaynaklar,
  kayitKaynakKilidiListesi, kdEskiListe, takipHedefleri, turkKaynakYigini, bransKapsami,
} from './index'
import { kaynakCipleri, cipMetni, ifadeGeciyor, SURUM_DOGRULANMADI } from './cip'
import { takipKarsilastir, dosyaKoku, kokEslesir, listeOgeleri, htmlNormalize, icerikOzeti, surumIpucu, duyuruBasligi, type TakipKaydi } from './takip'
import { duyuruFisiltileri, duyuruGoruldu, bekleyenDuyuruFisiltileri, type SurumDuyurusu } from './duyuru'
import { incelemeKarariCoz, duyuruSatiri } from './inceleme'
import { kutuphaneGorunumu } from './kutuphane'
import { protokolKaynakTemizle, uydurmaKaynakTemizle, soapKaynakKilidi } from '../../doktor/kaynakKilidi'
import { kdDogrulanmisKaynaklar } from '../../../specialties/kadin-dogum/protocols/dogrulanmis-kaynaklar'
import { KaynakCipListesi } from '../../../components/kaynaklar/KaynakCipiGorunumu'
import { SPECIALTIES } from '../../doktor/specialties'
import { KLINIK_YENI_SLUGS } from '../../specialties/klinikDikey'

const KOK = join(__dirname, '..', '..', '..')
const oku = (p: string) => readFileSync(join(KOK, p), 'utf8')
const LOG = oku('docs/kaynak/PROTOKOL-KUTUPHANESI-ARASTIRMA.md')
const RESMI = /^https:\/\/([a-z0-9-]+\.)*(saglik\.gov\.tr|titck\.gov\.tr|sgk\.gov\.tr|tuseb\.gov\.tr|org\.tr)(\/|$)/i

describe('registry integrity', () => {
  test('40 branş keys = the 30 in lib/doktor/specialties.ts + the 10 Özel Branşlar', () => {
    assert.deepEqual([...TIP_BRANSLARI].sort(), SPECIALTIES.map((s) => s.key).sort())
    assert.equal(TUM_BRANSLAR.length, 40)
    for (const k of KLINIK_YENI_SLUGS) assert.ok(TUM_BRANSLAR.includes(k), k)
  })

  test('ids unique, every branş of every entry is one of the 40, section ids unique per document', () => {
    const idler = PROTOKOL_BELGELERI.map((b) => b.id)
    assert.equal(new Set(idler).size, idler.length, 'duplicate id')
    for (const b of PROTOKOL_BELGELERI) {
      assert.ok(/^[a-z0-9-]+$/.test(b.id), `ascii id: ${b.id}`)
      assert.ok(b.branslar.length > 0, b.id)
      for (const br of b.branslar) assert.ok(TUM_BRANSLAR.includes(br), `${b.id}: ${br}`)
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(b.sonDogrulama), b.id)
      const bol = (b.bolumler || []).map((x) => x.id)
      assert.equal(new Set(bol).size, bol.length, `${b.id} section ids`)
    }
  })

  test('every one of the 40 branşlar has documents (Özel Branşlar included) and a non-empty source stack', () => {
    for (const br of TUM_BRANSLAR) {
      assert.ok(bransBelgeleri(br).length >= 2, `${br} has ${bransBelgeleri(br).length}`)
      assert.ok(turkKaynakYigini(br).length >= 2, br)
    }
  })

  test('no edition without confirmation: an edition needs a method AND a row with an https URL in the research log', () => {
    for (const b of PROTOKOL_BELGELERI) {
      const surumlu = b.surum !== null || b.yil !== null || b.yayinNo !== undefined || b.isbn !== undefined
      if (b.durum === 'dogrulanamadi') {
        assert.equal(b.surum, null, `${b.id}: unconfirmed entry carries an edition`)
        assert.equal(b.yil, null, `${b.id}: unconfirmed entry carries a year`)
        assert.equal(b.yayinNo, undefined, b.id)
        continue
      }
      assert.ok(surumlu, `${b.id}: confirmed entry without an edition`)
      assert.ok(b.dogrulamaYontemi, `${b.id}: edition without a verification method`)
      const satir = LOG.split('\n').find((l) => l.startsWith(`| ${b.id} |`))
      assert.ok(satir, `${b.id}: no row in docs/kaynak/PROTOKOL-KUTUPHANESI-ARASTIRMA.md`)
      assert.ok(/https:\/\//.test(satir!), `${b.id}: log row without a URL`)
      if (b.yayinNo) assert.ok(satir!.includes(String(b.yayinNo)), `${b.id}: Yayın No not in the log row`)
      if (b.yil) assert.ok(satir!.includes(String(b.yil)), `${b.id}: year not in the log row`)
    }
  })

  test('official URLs only; superseded entries point at a current one', () => {
    for (const b of PROTOKOL_BELGELERI) {
      if (b.url) assert.ok(RESMI.test(b.url), `${b.id}: ${b.url}`)
      for (const u of b.takipUrl || []) assert.ok(RESMI.test(u), `${b.id}: ${u}`)
      if (b.durum === 'yerine-yenisi-geldi') assert.equal(belgeBul(b.yerineGelen || '')?.durum, 'guncel', b.id)
    }
    for (const l of TAKIP_LISTELERI) assert.ok(RESMI.test(l.url), l.id)
  })

  test('coverage numbers add up', () => {
    for (const br of TUM_BRANSLAR) {
      const k = bransKapsami(br)
      assert.ok(k.surumDogrulanmis + k.dogrulanamadi + k.yerineYenisiGeldi <= k.toplam, br)
    }
  })
})

describe('citation lock reads the registry', () => {
  const L = bransDogrulanmisKaynaklar('noroloji')

  test('SOAP lock for every branch is built from the registry (soapUret wiring)', () => {
    const s = oku('lib/doktor/soapUret.ts')
    assert.ok(s.includes('soapKaynakKilidi(dozlu, bransDogrulanmisKaynaklar(brans), protokolKaynakTemizle)'))
    assert.ok(!s.includes('kdDogrulanmisKaynaklar()'), 'SOAP must not bypass the registry')
  })

  test('the list = confirmed registry entries only; KD adds exactly its pinned legacy list', () => {
    const kayit = kayitKaynakKilidiListesi()
    assert.deepEqual(L, kayit)
    assert.ok(kayit.length > 0)
    for (const d of kayit) assert.ok(PROTOKOL_BELGELERI.some((b) => b.durum === 'guncel' && (b.yil === d.numara || b.yayinNo === d.numara)), d.etiket)
    const kd = bransDogrulanmisKaynaklar('kadin-hastaliklari-dogum')
    assert.equal(kd.length, kdEskiListe().length + kayit.length)
    // Pinned: the KD legacy Turkish entries (Ayşe's locked path uses the same list) may not grow without review.
    const kdTr = kdDogrulanmisKaynaklar().filter((d) => ['DÖBYR', 'SB-YAYIN', 'TJOD'].includes(d.aile)).map((d) => `${d.aile}:${d.numara}`)
    assert.deepEqual(kdTr.sort(), ['DÖBYR:2018', 'DÖBYR:2026', 'SB-YAYIN:1402', 'TJOD:2014', 'TJOD:2023'])
  })

  test('confirmed SB document year + Yayın No survive; unconfirmed / superseded / wrong-document years are removed', () => {
    const t = 'Migren profilaksisi: Migren Klinik Protokolü (2025) önerisi; ayrıca SB Yayın No. 1344.'
    assert.equal(protokolKaynakTemizle(t, L).metin, t)
    const ht = protokolKaynakTemizle('Hipertansiyon Klinik Protokolü 2020 hedefi 140/90 mmHg.', L)
    assert.equal(ht.metin, 'Hipertansiyon Klinik Protokolü hedefi 140/90 mmHg.')
    assert.equal(ht.bulgular.length, 1) // 2020 is confirmed only for other SB documents (KBH, demir) → not this one
    const eski = protokolKaynakTemizle('Migren tedavisi Migren Klinik Protokolü 2020 ve Yayın No. 1173 ile.', L)
    assert.ok(!eski.metin.includes('2020') && !eski.metin.includes('1173'), eski.metin)
    // A confirmed 2020 year (KBH 2020) cannot be borrowed by another document's name.
    const yanlis = protokolKaynakTemizle('Koroner Arter Hastalığı Klinik Protokolü 2020 ile izlem.', L)
    assert.equal(yanlis.metin, 'Koroner Arter Hastalığı Klinik Protokolü ile izlem.')
  })

  test('society code + year: kept only when the registry confirms it and the text is on topic', () => {
    const iyi = 'Sürekli glukoz izlem (CGM) için TEMD 2025 diyabet teknolojileri önerisi.'
    assert.equal(protokolKaynakTemizle(iyi, L).metin, iyi)
    const r = protokolKaynakTemizle('HbA1c hedefi TEMD 2024 kılavuzuna göre %7.', L)
    assert.equal(r.metin, 'HbA1c hedefi TEMD kılavuzuna göre %7.')
    const konuDisi = protokolKaynakTemizle('Kırık iyileşmesi TEMD 2025 önerisine göre izlenir.', L)
    assert.equal(konuDisi.bulgular[0].neden, 'konu-uyusmuyor')
  })

  test('the old pass (used by Ayşe’s founder-locked path) is unchanged: it does not touch SB document years', () => {
    const t = 'Hipertansiyon Klinik Protokolü 2020 ve TEMD 2024.'
    assert.equal(uydurmaKaynakTemizle(t, L).metin, t)
    assert.ok(oku('lib/asistan/ayseCevapla.ts').includes('const liste = kdMi ? kdDogrulanmisKaynaklar() : []'), 'locked file untouched')
  })

  test('SOAP lock with the registry adds the hekim-review line', () => {
    const r = soapKaynakKilidi({ soap: { plan: 'TEMD 2024 kılavuzuna göre metformin.' }, aiDegerlendirme: '' }, L, protokolKaynakTemizle)
    assert.ok(r.aiDegerlendirme?.includes('Kaynak kontrolü'))
    assert.equal((r.soap as { plan: string }).plan, 'TEMD kılavuzuna göre metformin.')
  })
})

describe('source chips', () => {
  test('named document → confirmed edition, the section the text is about, official link', () => {
    const c = kaynakCipleri('Akut atakta triptan önerilir (SB Migren Klinik Protokolü).')
    assert.equal(c.length, 1)
    assert.equal(c[0].belgeId, 'sb-kp-migren-2025')
    assert.equal(c[0].surum, 'Revizyon No. 01 (Ağustos 2025)')
    assert.equal(c[0].bolum, '3. Migren Başağrısı Tedavisi (s. 12)')
    assert.ok(c[0].url?.startsWith('https://dosyahastane.saglik.gov.tr/'))
    assert.equal(cipMetni(c[0]), 'SB Migren Klinik Protokolü · Revizyon No. 01 (Ağustos 2025) · 3. Migren Başağrısı Tedavisi (s. 12)')
  })

  test('unconfirmed edition is said plainly; superseded never chipped; nothing for plain text; at most 4', () => {
    const c = kaynakCipleri('Hipertansiyon klinik protokolü ve KOAH klinik protokolü birlikte değerlendirildi.')
    assert.deepEqual(c.map((x) => x.surum), [SURUM_DOGRULANMADI, SURUM_DOGRULANMADI])
    assert.ok(!kaynakCipleri('migren klinik protokolü').some((x) => x.belgeId === 'sb-kp-migren-2020'))
    assert.deepEqual(kaynakCipleri('Hasta iyi, kontrol 1 hafta sonra.'), [])
    assert.ok(kaynakCipleri('migren klinik protokolü, epilepsi klinik protokolü, koah klinik protokolü, astım klinik protokolü, tüber, sezaryen klinik protokolü').length <= 4)
  })

  test('short names stand alone ("sut" is not inside another word), Turkish suffixes after long names are fine', () => {
    assert.ok(ifadeGeciyor('sut kuralına göre', 'sut'))
    assert.ok(!ifadeGeciyor('absutlar', 'sut'))
    assert.ok(ifadeGeciyor('epilepsi klinik protokolüne göre', 'epilepsi klinik protokol'))
  })

  test('chip render: "Belge · sürüm · bölüm" with the official link in a new tab', () => {
    const html = renderToStaticMarkup(React.createElement(KaynakCipListesi, { cipler: kaynakCipleri('Diyabetik ayak bakımı — Diyabet Tedavi ve İzlem Klinik Protokolleri.') }))
    assert.ok(html.includes('SB Diyabet Klinik Protokolleri'))
    assert.ok(html.includes('Versiyon 1.0'))
    assert.ok(html.includes('4.5. Diyabetik Ayak Yönetimi (s. 43)'))
    assert.ok(html.includes('href="https://ekutuphane.saglik.gov.tr/Home/GetDocument/567"') && html.includes('target="_blank"'))
    assert.equal(renderToStaticMarkup(React.createElement(KaynakCipListesi, { cipler: [] })), '')
  })

  test('the chip component loads the registry lazily (not in first-load JS)', () => {
    const s = oku('components/kaynaklar/KaynakCipleri.tsx')
    assert.ok(s.includes("import('@/lib/kaynaklar/protokolKutuphanesi/cip')"))
    assert.ok(!/^import [^t].*protokolKutuphanesi\/(cip|belgeler|index)'/m.test(s))
  })
})

describe('monthly edition check (pure)', () => {
  const enc = (s: string) => new TextEncoder().encode(s)
  const hedef = { url: 'https://dosyahastane.saglik.gov.tr/Eklenti/1/0/x.pdf', belgeIdleri: ['sb-kp-diyabet'], listeId: null, belgeIsaretleri: [] }
  const liste = { url: 'https://ereglidh.saglik.gov.tr/liste.html', belgeIdleri: [], listeId: 'liste-eregli', belgeIsaretleri: ['protokol', 'rehber', 'kp'] }
  const simdi = new Date('2026-12-03T02:17:00Z')
  const ok = (govde: string, tur = 'application/pdf') => ({ httpDurum: 200, etag: null, sonDegisiklik: null, icerikTuru: tur, govde: enc(govde) })

  test('first observation is the baseline — stored, never flagged', () => {
    const r = takipKarsilastir(hedef, null, ok('A'), PROTOKOL_BELGELERI, simdi)
    assert.equal(r.bulgular.length, 0)
    assert.equal(r.kayit.hash, icerikOzeti(enc('A'), 'application/pdf'))
  })

  test('changed bytes → icerik-degisti; same bytes → nothing', () => {
    const once = takipKarsilastir(hedef, null, ok('A'), PROTOKOL_BELGELERI, simdi).kayit
    assert.equal(takipKarsilastir(hedef, once, ok('A'), PROTOKOL_BELGELERI, simdi).bulgular.length, 0)
    const r = takipKarsilastir(hedef, once, ok('B'), PROTOKOL_BELGELERI, simdi)
    assert.equal(r.bulgular[0].tur, 'icerik-degisti')
    assert.deepEqual(r.bulgular[0].belgeIdleri, ['sb-kp-diyabet'])
    assert.equal(r.kayit.degistiAt, simdi.toISOString())
  })

  test('unreachable → flagged once on the transition, not every month; previous hash kept', () => {
    const once = takipKarsilastir(hedef, null, ok('A'), PROTOKOL_BELGELERI, simdi).kayit
    const hata = { httpDurum: 404, etag: null, sonDegisiklik: null, icerikTuru: null, govde: null }
    const r1 = takipKarsilastir(hedef, once, hata, PROTOKOL_BELGELERI, simdi)
    assert.equal(r1.bulgular[0].tur, 'erisilemiyor')
    assert.equal(r1.kayit.hash, once.hash)
    assert.equal(takipKarsilastir(hedef, r1.kayit, hata, PROTOKOL_BELGELERI, simdi).bulgular.length, 0)
  })

  test('HTML hash ignores scripts / tags noise', () => {
    assert.equal(htmlNormalize('<p>Liste</p><script>var t=1</script>'), htmlNormalize('<p>Liste</p><script>var t=2</script>'))
  })

  test('listing: new revision of a known document → yeni-surum-adayi with the year hint; unknown protocol → yeni-belge-adayi; vanished → listeden-kalkti', () => {
    const sayfa = (linkler: string[]) => ok(`<html><body>${linkler.map((l) => `<a href="${l}">x</a>`).join('')}</body></html>`, 'text/html')
    const ilk = takipKarsilastir(liste, null, sayfa(['/Eklenti/589502/0/migrenklinikprotokolurevizyon28082025pdfpdf.pdf', '/Eklenti/589493/0/koah06072018pdfpdf.pdf']), PROTOKOL_BELGELERI, simdi).kayit
    const r = takipKarsilastir(liste, ilk, sayfa(['/Eklenti/600001/0/migrenklinikprotokolurevizyon14022027pdf.pdf', '/Eklenti/589493/0/koah06072018pdfpdf.pdf', '/Eklenti/600002/0/yeni-sepsis-klinik-protokolu-2027pdf.pdf']), PROTOKOL_BELGELERI, simdi)
    const tur = (t: string) => r.bulgular.filter((b) => b.tur === t)
    assert.deepEqual(tur('yeni-surum-adayi')[0].belgeIdleri, ['sb-kp-migren-2025'])
    assert.equal(tur('yeni-surum-adayi')[0].ayrinti.yil, 2027)
    assert.equal(tur('yeni-belge-adayi').length, 1)
    assert.deepEqual(tur('listeden-kalkti')[0].belgeIdleri, ['sb-kp-migren-2025'])
  })

  test('file-stem helpers', () => {
    assert.equal(dosyaKoku('https://x/Eklenti/1/0/migrenklinikprotokolurevizyon28082025pdfpdf.pdf'), 'migren')
    assert.equal(dosyaKoku('https://x/kahrevizyon25082025pdfpdf.pdf'), 'kah')
    assert.ok(kokEslesir('kah', 'kah') && !kokEslesir('kah', 'kahve') && kokEslesir('epidermolizisbullozaeb', 'epidermolizisbulloza'))
    assert.deepEqual(listeOgeleri('<a href="/Eklenti/1/0/A.pdf?x=1">a</a><a href="/sayfa.html">b</a>'), ['/eklenti/1/0/a.pdf'])
    assert.deepEqual(surumIpucu('/x/tiroidkp25082025pdf.pdf'), { yil: 2025, revizyon: false })
    assert.equal(duyuruBasligi({ baslik: 'Prematüre Retinopatisi (ROP) Klinik Protokolü 2026' }), 'Prematüre Retinopatisi (ROP) Klinik Protokolü — yeni sürümü yayımlandı')
  })

  test('watch list: unique official URLs, every listing page, no superseded document, never the SGK home page', () => {
    const h = takipHedefleri()
    assert.equal(new Set(h.map((x) => x.url)).size, h.length)
    for (const l of TAKIP_LISTELERI) assert.ok(h.some((x) => x.url === l.url && x.listeId === l.id), l.id)
    assert.ok(!h.some((x) => x.belgeIdleri.includes('sb-kp-migren-2020')))
    assert.ok(!h.some((x) => x.url === 'https://www.sgk.gov.tr'))
  })

  test('cron route: cronYetki gate, monthly schedule, 300 s', () => {
    const r = oku('app/api/cron/protokol-surum/route.ts')
    assert.ok(r.includes('if (!cronYetkiliMi(req))'))
    const v = JSON.parse(oku('vercel.json'))
    assert.ok(v.crons.some((c: { path: string; schedule: string }) => c.path === '/api/cron/protokol-surum' && c.schedule === '17 2 3 * *'))
    assert.equal(v.functions['app/api/cron/protokol-surum/route.ts'].maxDuration, 300)
    assert.ok(oku('lib/kaynaklar/protokolKutuphanesi/takipSunucu.ts').includes('AbortSignal.timeout(TAKIP_ZAMAN_ASIMI_MS)'), 'every external fetch has a timeout')
  })
})

describe('founder review', () => {
  const id = '11111111-1111-4111-8111-111111111111'
  test('validation: registry document, official link, an edition or a year', () => {
    assert.ok('hata' in incelemeKarariCoz({ id: 'x', karar: 'onayla' }))
    assert.ok('hata' in incelemeKarariCoz({ id, karar: 'onayla', duyuru: { belgeId: 'yok-boyle', surum: '2027' } }))
    assert.ok('hata' in incelemeKarariCoz({ id, karar: 'onayla', duyuru: { belgeId: 'sb-kp-migren-2025', surum: 'Rev 02', url: 'https://example.com/x.pdf' } }))
    assert.ok('hata' in incelemeKarariCoz({ id, karar: 'onayla', duyuru: { belgeId: 'sb-kp-migren-2025' } }))
    const k = incelemeKarariCoz({ id, karar: 'onayla', duyuru: { belgeId: 'sb-kp-migren-2025', surum: 'Revizyon No. 02', yil: '2027', url: 'https://dosyahastane.saglik.gov.tr/Eklenti/1/0/m.pdf' } })
    assert.ok(!('hata' in k) && k.duyuru?.yil === 2027)
    assert.deepEqual(incelemeKarariCoz({ id, karar: 'reddet', duyuru: { belgeId: 'sb-kp-migren-2025', surum: 'x' } }), { id, karar: 'reddet', not: null, duyuru: null })
  })

  test('announcement branşlar come from the registry, never from the request', () => {
    const s = duyuruSatiri({ belgeId: 'sb-kp-migren-2025', surum: 'Revizyon No. 02', yil: 2027, url: null }, id)
    assert.deepEqual(s.branslar, belgeBul('sb-kp-migren-2025')!.branslar)
    assert.equal(s.baslik, 'Migren Klinik Protokolü — yeni sürümü yayımlandı')
  })
})

describe('announcements → one Fısıltı per doctor (isolation)', () => {
  const simdi = new Date('2026-12-05T10:00:00Z')
  const d = (id: string, branslar: string[], gun = 1): SurumDuyurusu => ({ id, belge_id: 'sb-kp-migren-2025', baslik: 'Migren Klinik Protokolü — yeni sürümü yayımlandı', branslar, surum: 'Revizyon No. 02', yil: 2027, url: null, yayin_at: new Date(simdi.getTime() - gun * 86400_000).toISOString() })
  const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

  test('only the doctor’s branş, only unseen, only recent; no patient on the item', () => {
    const l = duyuruFisiltileri([d(A, ['noroloji']), d('b', ['kardiyoloji']), d('c', ['noroloji'], 200)], new Set(), 'noroloji', simdi)
    assert.equal(l.length, 1)
    assert.equal(l[0].patientId, '')
    assert.equal(l[0].kaynak, 'kaynak')
    assert.equal(l[0].hedefYol, `/dashboard/doktor/kaynaklar?duyuru=${A}`)
    assert.equal(duyuruFisiltileri([d(A, ['noroloji'])], new Set([A]), 'noroloji', simdi).length, 0)
    assert.equal(duyuruFisiltileri([d(A, ['fizyoterapi'])], new Set(), 'fizyoterapi', simdi).length, 1, 'Özel Branşlar get it too')
    assert.equal(duyuruFisiltileri([d(A, ['noroloji'])], new Set(), null, simdi).length, 0)
  })

  function sahteSb() {
    const cagrilar: { tablo: string; islem: string; arg: unknown }[] = []
    const zincir = (tablo: string, sonuc: unknown) => {
      const z: Record<string, unknown> = {}
      for (const ad of ['select', 'contains', 'gte', 'order', 'limit', 'eq', 'in']) z[ad] = (...a: unknown[]) => { cagrilar.push({ tablo, islem: ad, arg: a }); return z }
      z.upsert = (arg: unknown) => { cagrilar.push({ tablo, islem: 'upsert', arg }); return Promise.resolve({ error: null }) }
      z.then = (r: (v: unknown) => unknown) => Promise.resolve(sonuc).then(r)
      return z
    }
    const sb = { from: (t: string) => zincir(t, t === 'protokol_surum_duyurulari' ? { data: [d(A, ['noroloji'])], error: null } : { data: [], error: null }) }
    return { sb: sb as unknown as Parameters<typeof duyuruGoruldu>[0], cagrilar }
  }

  test('"seen" is written for the session doctor only; reads are narrowed by doctor_id', async () => {
    const { sb, cagrilar } = sahteSb()
    assert.equal(await duyuruGoruldu(sb, 'doktor-1', A), true)
    assert.deepEqual(cagrilar.find((c) => c.islem === 'upsert')?.arg, { doctor_id: 'doktor-1', duyuru_id: A })
    assert.equal(await duyuruGoruldu(sb, 'doktor-1', 'not-a-uuid'), false)
    const l = await bekleyenDuyuruFisiltileri(sb, 'doktor-2', 'noroloji', simdi)
    assert.equal(l.length, 1)
    assert.ok(cagrilar.some((c) => c.tablo === 'protokol_duyuru_gorulen' && c.islem === 'eq' && JSON.stringify(c.arg) === JSON.stringify(['doctor_id', 'doktor-2'])))
  })

  test('Gizle on an announcement marks it seen (never fisilti_gizlenen, which needs a patient)', () => {
    const r = oku('app/api/doktor/fisilti/gizle/route.ts')
    assert.ok(r.includes("if (item.kaynak === 'kaynak' && item.duyuruId)") && r.includes('duyuruGoruldu(supabase, user.id, item.duyuruId)'))
    assert.ok(oku('app/api/doktor/kaynaklar/route.ts').includes('duyuruGoruldu(oturum.supabase, oturum.user.id, id)'))
  })
})

describe('library page view model', () => {
  test('40 branşlar in two groups; default = the doctor’s branş; unknown ?brans ignored; unconfirmed shows no edition', () => {
    const g = kutuphaneGorunumu('pediatri', 'yok-boyle')
    assert.equal(g.branslar.length, 40)
    assert.equal(g.branslar.filter((b) => b.grup === 'Özel Branşlar').length, 10)
    assert.equal(g.secili, 'pediatri')
    assert.equal(kutuphaneGorunumu('pediatri', 'odyoloji').secili, 'odyoloji')
    for (const b of g.belgeler.filter((x) => x.durum === 'dogrulanamadi')) assert.equal(b.surum, null, b.id)
    assert.equal(g.belgeler[0].durum, 'guncel')
  })
})
