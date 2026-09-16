import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  taslakBugunkuVizit,
  jineSticky,
  jineStickyGebelikSizdiriyor,
  isoToTr,
  trTarihOku,
  normalizeSoap,
  soapFromAlanlar,
  ofisVizitOzet,
  flattenSoapAlanlar,
  BOS_SOAP,
} from '../engines/jine-ofis-vizit'
import { dueHesapla } from '../engines/jinekoloji-spine'

const ROOT = join(import.meta.dirname, '..')

describe('jine ofis vizit persist shape', () => {
  it('normalizes SOAP and flattens alanlar for additive jine_vizitler jsonb', () => {
    const soap = normalizeSoap({
      hikaye: { sikayet: 'lekelenme', sure: '2 ay', lmp: '2026-08-01', gravida_para: 'G2P1', ilac: 'levotiroksin', allerji: 'penisilin', kontrasepsiyon: 'Cu RİA' },
      muayene: { spekulum: 'serviks düzgün', bimanuel: 'uterus antevert', tvus: 'ET 6 mm' },
      degerlendirme: { degerlendirme: 'AUB — PALM bekleniyor', plan: ['TVUS', 'hemogram'] },
      tarama: { pap: 'NILM', hpv: 'neg', sonrakiDue: '2029-08-01' },
      kontrol: { tarih: '2026-12-01', neden: 'Pap tekrarı değil; RİA ip' },
    })
    assert.equal(soap.hikaye.lmp, '2026-08-01')
    assert.deepEqual(soap.degerlendirme.plan, ['TVUS', 'hemogram'])
    const alanlar = flattenSoapAlanlar(soap)
    assert.equal(alanlar.lmp, '2026-08-01')
    assert.equal(alanlar.spekulum, 'serviks düzgün')
    assert.match(ofisVizitOzet(soap), /Jinekoloji ofis muayenesi/)
    assert.match(ofisVizitOzet(soap), /Jine SAT/)
    assert.doesNotMatch(ofisVizitOzet(soap), /TDT|trimester|\bGA\b/)
    const fromLegacy = soapFromAlanlar({ lmp: '2026-07-01', gravida_para: 'G1P0', spekulum: 'eski' })
    assert.equal(fromLegacy.hikaye.lmp, '2026-07-01')
    assert.equal(fromLegacy.muayene.spekulum, 'eski')
  })

  it('carry-forward copies chronic problems / Pap due, not today complaint or exam', () => {
    const due = dueHesapla({ dob: '1988-03-01', bugun: '2026-09-16', sonPap: '2022-01-01' })
    const taslak = taslakBugunkuVizit({
      sonSoap: {
        ...BOS_SOAP,
        hikaye: { ...BOS_SOAP.hikaye, sikayet: 'dün ağrı', sure: '1 gün', lmp: '2026-08-20', gravida_para: 'G3P2', ilac: 'metformin', allerji: 'yok', kontrasepsiyon: 'KOK' },
        muayene: { spekulum: 'dün spekulum', bimanuel: 'dün bimanuel', tvus: 'dün tvus', serbest: 'dün' },
        degerlendirme: { degerlendirme: 'PCOS izlem', plan: ['dün plan'] },
        tarama: { pap: 'NILM', hpv: 'neg', sitoloji: '', histoloji: '', sonrakiDue: '2025-01-01', dueCue: '' },
        kontrol: { tarih: '2026-10-01', neden: 'yıllık' },
      },
      kadinSagligi: { son_adet_tarihi: '2026-01-01' },
      due,
      kontrasepsiyon: 'KOK',
    })
    assert.equal(taslak.hikaye.sikayet, '')
    assert.equal(taslak.hikaye.sure, '')
    assert.equal(taslak.muayene.spekulum, '')
    assert.equal(taslak.muayene.bimanuel, '')
    assert.deepEqual(taslak.degerlendirme.plan, [])
    assert.equal(taslak.hikaye.lmp, '2026-08-20')
    assert.equal(taslak.hikaye.ilac, 'metformin')
    assert.equal(taslak.hikaye.allerji, 'yok')
    assert.equal(taslak.hikaye.kontrasepsiyon, 'KOK')
    assert.equal(taslak.hikaye.gravida_para, 'G3P2')
    assert.equal(taslak.degerlendirme.degerlendirme, 'PCOS izlem')
    assert.equal(taslak.tarama.pap, 'NILM')
    assert.ok(taslak.tarama.dueCue.includes('Pap') || taslak.tarama.dueCue.includes('HPV') || taslak.tarama.sonrakiDue)
  })
})

describe('jine mode sticky — no pregnancy GA/TDT', () => {
  it('chips are SAT / yaş / kontrasepsiyon / Pap-HPV / kontrol; gebe is a chip not mixed SAT', () => {
    const due = dueHesapla({ dob: '1990-01-01', bugun: '2026-09-16', sonHpv: '2020-01-01' })
    const s = jineSticky({
      lmp: '2026-08-10',
      yas: 36,
      kontrasepsiyon: 'Cu RİA',
      due,
      sonrakiKontrol: '2026-12-01',
      gebe: true,
    })
    assert.equal(jineStickyGebelikSizdiriyor(s.chips), false)
    assert.ok(s.chips.every((c) => !/TDT|hafta|trimester|\bGA\b|gebelik SAT/i.test(`${c.etiket} ${c.deger}`)))
    assert.equal(s.chips.find((c) => c.kod === 'lmp')?.etiket, 'Jine SAT')
    assert.equal(s.chips.find((c) => c.kod === 'lmp')?.deger, '10.08.2026')
    assert.equal(s.chips.find((c) => c.kod === 'yas')?.deger, '36')
    assert.equal(s.gebeChip, 'Aktif gebelik → Klinik/Doğum spine')
    const bos = jineSticky({ lmp: null, yas: null, kontrasepsiyon: null, due: [], sonrakiKontrol: null, gebe: false })
    assert.equal(bos.gebeChip, null)
    assert.equal(jineStickyGebelikSizdiriyor(bos.chips), false)
  })

  it('TR date parse is gg.aa.yyyy, never mm/dd/yyyy', () => {
    assert.equal(isoToTr('2026-09-16'), '16.09.2026')
    assert.equal(trTarihOku('16.09.2026'), '2026-09-16')
    assert.equal(trTarihOku('16/09/2026'), '2026-09-16')
    assert.equal(trTarihOku('2026-09-16'), '2026-09-16')
    assert.equal(trTarihOku('09/16/2026'), null) // ABD sırası geçersiz gün
    assert.equal(trTarihOku('32.01.2026'), null)
    assert.equal(trTarihOku(''), null)
  })
})

describe('jine ofis visit wiring', () => {
  it('HastaGebelik jine mode mounts visit spine + sticky, not gebe sticky; sevk CTA always actionable', () => {
    const geb = readFileSync(join(ROOT, '..', '..', 'components', 'doktor', 'HastaGebelik.tsx'), 'utf8')
    const sevkUi = readFileSync(join(ROOT, 'ui', 'SevkCta.tsx'), 'utf8')
    const strip = readFileSync(join(ROOT, 'ui', 'StickyJineStrip.tsx'), 'utf8')
    const vizit = readFileSync(join(ROOT, 'ui', 'BugunkuJineMuayene.tsx'), 'utf8')
    const api = readFileSync(join(ROOT, '..', '..', 'app', 'api', 'doktor', 'jinekoloji', 'route.ts'), 'utf8')
    const gebApi = readFileSync(join(ROOT, '..', '..', 'app', 'api', 'doktor', 'gebelik', 'route.ts'), 'utf8')
    assert.match(geb, /BugunkuJineMuayene/)
    assert.match(geb, /jine-moduller/)
    assert.match(geb, /Doğum Gerçekleşti/)
    assert.match(geb, /etkinMod === 'lohusa'/)
    assert.match(geb, /TrTarihAlan/)
    assert.match(readFileSync(join(ROOT, 'ui', 'TrTarihAlan.tsx'), 'utf8'), /gg\.aa\.yyyy/)
    assert.doesNotMatch(geb, /mm\/dd\/yyyy/)
    assert.doesNotMatch(geb, /placeholder="MM/)
    assert.match(strip, /jine-sticky-strip/)
    assert.match(strip, /Bugünkü jinekoloji muayenesi/)
    assert.doesNotMatch(strip, /TDT/)
    assert.doesNotMatch(strip, /Hafta/)
    assert.match(vizit, /data-kd="bugunku-jine"/)
    assert.match(vizit, /Pap sonucu gir/)
    assert.match(vizit, /Kolposkopi görüntüsü ekle/)
    assert.match(vizit, /Kontrol randevusu/)
    assert.match(vizit, /adim: 'ofis_vizit'/)
    assert.doesNotMatch(vizit, /\bSave\b|\bLoading\b|\bSubmit\b/)
    assert.match(api, /adim === 'ofis_vizit'/)
    assert.match(api, /soap/)
    assert.match(gebApi, /action === 'sevk'/)
    assert.match(sevkUi, /Sevk oluştur \/ not ekle/)
    assert.match(sevkUi, /önerisi yok/)
    assert.doesNotMatch(sevkUi, /if \(!sevk\) return null/)
    const migr = readFileSync(join(ROOT, '..', '..', 'lib', 'db', 'migrations', '034_jine_ofis_vizit.sql'), 'utf8')
    assert.match(migr, /jine_vizitler add column if not exists soap/)
    assert.doesNotMatch(migr, /create table.*specialty_records/i)
    assert.match(migr, /not specialty_records\.payload/)
  })
})
