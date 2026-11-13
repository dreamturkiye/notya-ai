/**
 * PREMATURE-MODUL — leak / gate tests. Pediatri prematüre content must never render for another branş, and the KD erken doğum
 * panel must never render outside Kadın Hastalıkları ve Doğum. Gates are asserted on behaviour (tab list, tile list) and, where the
 * gate is a line of server code, on the source text of the route (same style as the other branş-gate tests).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { hastaDosyaSekmeleri } from '@/lib/doktor/hastaDosyaSekmeleri'
import { BRANS_DOKTOR_ARACLARI, ORTAK_DOKTOR_ARACLARI, doktorAraclariListesi, doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'

const kok = path.join(import.meta.dirname, '../../..')
const oku = (g: string) => fs.readFileSync(path.join(kok, g), 'utf8')

const PEDI_PREMATUR = ['/doktor-tools/pedi-prematur-takip', '/doktor-tools/pedi-duzeltilmis-yas', '/doktor-tools/pedi-prematur-kohort']
const KD_ERKEN = '/doktor-tools/kd-erken-dogum'

test('hasta dosyası: "Prematüre Planı" sekmesi yalnız pediatri + kapsamdaki bebekte; başka hiçbir seçenek kombinasyonunda yok', () => {
  const var_ = (o: Parameters<typeof hastaDosyaSekmeleri>[0]) => hastaDosyaSekmeleri(o).some((t) => t.id === 'prematur')
  assert.equal(var_({ pediatriUygun: true, gebelikUygun: false, prematurUygun: true }), true)
  assert.equal(var_({ pediatriUygun: true, gebelikUygun: false, prematurUygun: false }), false)
  assert.equal(var_({ pediatriUygun: true, gebelikUygun: false }), false)
  // prematurUygun alone (a non-pediatri doctor) can never open it
  assert.equal(var_({ pediatriUygun: false, gebelikUygun: false, prematurUygun: true }), false)
  assert.equal(var_({ pediatriUygun: false, gebelikUygun: true, prematurUygun: true }), false)
  assert.equal(var_({ pediatriUygun: false, gebelikUygun: false, deriUygun: true, prematurUygun: true }), false)
  assert.equal(var_({ pediatriUygun: false, gebelikUygun: false, gozUygun: true, prematurUygun: true }), false)
})

test('hasta dosyası sayfası: prematüre sekmesi pediatri doktorunda ve yalnız < 37 aylıkta sorgulanır; yerleştirme iki kapıya bağlı', () => {
  const sayfa = oku('app/dashboard/doktor/hastalar/[id]/page.tsx')
  assert.match(sayfa, /if \(!pid \|\| !pediatriAraci \|\| !\(yasAy >= 0 && yasAy < 37\)\) \{ setPrematurKapsamda\(false\)/)
  assert.match(sayfa, /!loading && !error && pediatriUygun && prematurKapsamda && activeTab === 'prematur'/)
  // the heavy panel is a dynamic import (performance budget: not in the shared chunk)
  assert.match(sayfa, /dinamikYukle\(\(\) => import\('@\/specialties\/pediatri\/ui\/araclar\/PrematurPlanPaneli'\)/)
})

test('Araçlar: 3 pediatri prematüre kutucuğu yalnız pediatride; KD erken doğum kutucuğu yalnız KD\'de; hiçbiri ORTAK değil', () => {
  for (const r of [...PEDI_PREMATUR, KD_ERKEN]) {
    assert.ok(!ORTAK_DOKTOR_ARACLARI.some((a) => a.route === r), `${r} ORTAK listede olamaz`)
    assert.equal(BRANS_DOKTOR_ARACLARI.filter((a) => a.route === r).length, 1, `${r} tam bir kez tanımlı`)
  }
  for (const r of PEDI_PREMATUR) assert.deepEqual(BRANS_DOKTOR_ARACLARI.find((a) => a.route === r)!.branslar, ['pediatri'])
  assert.deepEqual(BRANS_DOKTOR_ARACLARI.find((a) => a.route === KD_ERKEN)!.branslar, ['kadin-hastaliklari-dogum'])

  const yabanciPedi = [...Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'pediatri'), 'kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'Neonatoloji', null, '']
  for (const b of yabanciPedi) {
    for (const r of PEDI_PREMATUR) {
      assert.ok(!doktorAraclariListesi(b).some((a) => a.route === r), `${b} must not see ${r}`)
      assert.equal(doktorAraciBransaUygun(r, b), false, `${b} deep-link ${r}`)
    }
  }
  const yabanciKd = [...Object.keys(BRANS_ETIKETLERI).filter((b) => b !== 'kadin-hastaliklari-dogum'), 'pediatri', 'Çocuk Sağlığı ve Hastalıkları', null, '']
  for (const b of yabanciKd) {
    assert.ok(!doktorAraclariListesi(b).some((a) => a.route === KD_ERKEN), `${b} must not see ${KD_ERKEN}`)
    assert.equal(doktorAraciBransaUygun(KD_ERKEN, b), false, `${b} deep-link ${KD_ERKEN}`)
  }
  assert.ok(doktorAraclariListesi('pediatri').some((a) => a.route === PEDI_PREMATUR[0]))
  assert.ok(doktorAraclariListesi('kadin-hastaliklari-dogum').some((a) => a.route === KD_ERKEN))
})

test('araç sayfaları: kendi branş kabuğuyla ve kendi rotasıyla korunur; landing sayfasına gömülmez', () => {
  for (const r of PEDI_PREMATUR) {
    const sayfa = oku(`app${r}/page.tsx`)
    assert.match(sayfa, /PediAracKabugu/, r)
    assert.ok(sayfa.includes(`route="${r}"`), `${r} kendi rotasını korur`)
    assert.doesNotMatch(sayfa, /audit|sprint|Gökhan|\.html/i, r)
  }
  const kd = oku(`app${KD_ERKEN}/page.tsx`)
  assert.match(kd, /KdAracKabugu/)
  assert.ok(kd.includes(`route="${KD_ERKEN}"`))
  assert.doesNotMatch(kd, /audit|sprint|Gökhan|\.html/i)
  assert.doesNotMatch(oku('app/doktor-tools/page.tsx'), /PrematurPlanPaneli|PrematurKohortPaneli|ErkenDogumPaneli|DuzeltilmisYasAraci/)
})

test('API kapıları: pediatri uçları pediOturum + pediHasta, KD ucu kadinDogumBransi + hastaSahibiMi; her yöntemde hasta kapısı veriden önce', () => {
  for (const g of ['app/api/doktor/pediatri/prematur/route.ts', 'app/api/doktor/pediatri/prematur/kohort/route.ts']) {
    const k = oku(g)
    assert.match(k, /pediOturum\(req\)/, g)
    for (const m of ['GET', 'PUT', 'POST']) {
      const gov = k.split(new RegExp(`export async function ${m}\\b`))[1]
      if (!gov) continue
      const ilk = gov.split(/\nexport async function /)[0]
      if (/patientId/.test(ilk)) {
        const veri = Math.min(...['prematurKaynakVeri(', 'profilKaydet(', 'ogeKaydet('].map((f) => ilk.indexOf(f)).filter((i) => i >= 0))
        assert.ok(ilk.indexOf('pediHasta(') > -1 && ilk.indexOf('pediHasta(') < veri, `${g} ${m}: pediHasta veri okumadan önce`)
      }
    }
  }
  const kd = oku('app/api/doktor/gebelik/erken-dogum/route.ts')
  assert.match(kd, /kadinDogumBransi\(await doktorBransi\(/)
  assert.match(kd, /sadeceDoktor\(oturum\)/)
  assert.equal((kd.match(/hastaSahibiMi\(/g) || []).length, 2, 'GET ve PUT hastayı doğrular')
  assert.equal((kd.match(/\.eq\('doctor_id'/g) || []).length >= 2, true, 'gebelik okuma ve yazma doctor_id kapsamlı')
})

test('branş içeriği çapraz sızmaz: pediatri prematüre dosyaları KD motorunu, KD paneli pediatri motorunu içe aktarmaz', () => {
  for (const g of ['specialties/pediatri/engines/prematurKohort.ts', 'app/api/doktor/pediatri/_prematur.ts', 'specialties/pediatri/ui/araclar/PrematurPlanPaneli.tsx', 'specialties/pediatri/ui/araclar/PrematurKohortPaneli.tsx']) {
    assert.doesNotMatch(oku(g), /from '[^']*kadin-dogum/, g)
  }
  for (const g of ['specialties/kadin-dogum/engines/erkenDogum.ts', 'specialties/kadin-dogum/ui/araclar/ErkenDogumPaneli.tsx']) {
    assert.doesNotMatch(oku(g), /from '[^']*(pediatri|clinical\/prematur)/, g)
  }
  // shared spine files carry no KD / pediatri-prematüre wording
  for (const g of ['lib/doktor/aracUi.tsx', 'components/doktor/HastaBuyumeEgrileri.tsx']) {
    assert.doesNotMatch(oku(g), /serviks uzunluğu|erken doğum risk/i, g)
  }
})

test('KD taburcu yolu: gestasyon haftası girilmezse SAT/TDT\'den hesaplanır (40 varsayılanı prematür bebeği term yapmaz) ve erken doğum özeti karta yazılır', () => {
  const dogum = oku('app/api/doktor/gebelik/dogum/route.ts')
  assert.match(dogum, /Number\(bb\.hafta\) \|\| datingHafta \|\| 40/)
  assert.match(dogum, /gestasyonGunuTarihte\(/)
  assert.match(dogum, /kartOzeti\(erkenKayit, hafta\)/)
  assert.match(dogum, /\.eq\('doctor_id', user\.id\)/)
})
