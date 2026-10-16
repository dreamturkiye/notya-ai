/** MUAYENE-EKLERI-01 — uydurma-değer güvenceleri, atıf kontrolü, şema zorlama. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ATIF_DOGRULANAMADI, atifKontrol, desteklenmeyenSayilar, izinliKume, sayiNormalize, sayilariCikar, sayisalGuvence, sonucuDogrula } from './guvence'
import type { EkSonuc } from './tipler'

describe('sayı çıkarma', () => {
  it('virgül/nokta ve sondaki sıfırları eşitler', () => {
    assert.equal(sayiNormalize('12,10'), '12.1')
    assert.equal(sayiNormalize('12.0'), '12')
    assert.equal(sayiNormalize('007'), '7')
  })
  it('tarihleri sayı saymaz', () => assert.deepEqual(sayilariCikar('12.10.2026 tarihli, Hb 11,2'), ['11.2']))
})

describe('lab değer güvencesi — değer uydurma yok', () => {
  const izinli = izinliKume(['Hb', '11.2', 'g/dL', '12.0-15.5', '14.8', '4,1'])
  it('tabloda olan değerler geçer', () => {
    const s = sayisalGuvence(['Hemoglobin 11,2 g/dL ile referansın (12–15.5) altında.'], izinli)
    assert.equal(s.atilan.length, 0)
    assert.equal(s.tutulan.length, 1)
  })
  it('tabloda olmayan değer içeren cümle atılır', () => {
    const s = sayisalGuvence(['Hemoglobin 11,2 g/dL düşüktür. Ferritin 8 ng/mL ile demir eksikliği düşündürür. Lökosit 14.8 yüksek.'], izinli)
    assert.equal(s.tutulan.join(' ').includes('Ferritin'), false)
    assert.equal(s.atilan.length, 1)
    assert.ok(s.atilan[0].includes('Ferritin'))
    assert.ok(s.tutulan[0].includes('Lökosit 14.8'))
  })
  it('adet ifadeleri ve yıllar serbest, çıplak küçük sayılar değil', () => {
    assert.deepEqual(desteklenmeyenSayilar('3 değer düşük, 2026 kontrolü', izinli), [])
    assert.deepEqual(desteklenmeyenSayilar('Hb 9 g/dL', izinli), ['9'])
  })
  it('değiştirilmiş (yanlış yazılmış) değer yakalanır', () => {
    assert.deepEqual(desteklenmeyenSayilar('Hb 11.9 g/dL', izinli), ['11.9'])
  })
  it('hiç değer olmayan tablo: her sayılı cümle atılır', () => {
    const s = sayisalGuvence(['CRP 48 mg/L yüksek.'], new Set())
    assert.equal(s.atilan.length, 1)
    assert.equal(s.tutulan.length, 0)
  })
})

const sonuc = (izinliSayilar: string[]): EkSonuc => ({ tur: 'lab', durum: 'tamam', baslik: 'Hemogram', ozet: '', bulgular: [], uyarilar: [], sinirlar: [], izinliSayilar, surum: 'ek-v1' })
const ekler = [{ etiket: 'EK-1', sonuc: sonuc(['11.2', '12', '15.5']) }, { etiket: 'EK-2', sonuc: sonuc(['48']) }]

describe('SOAP atıf kontrolü (kaynak izlenebilirliği)', () => {
  it('geçerli atıf ve doğrulanan sayı aynen kalır', () => {
    const r = atifKontrol('Hb 11,2 g/dL, referans altında [EK-1]. Hekim: ateş 38.5.', ekler)
    assert.equal(r.bilinmeyen.length, 0)
    assert.equal(r.dogrulanamayan.length, 0)
    assert.ok(r.metin.includes('Hb 11,2'))
    assert.ok(!r.metin.includes(ATIF_DOGRULANAMADI))
  })
  it('bilinmeyen atıf kaldırılır', () => {
    const r = atifKontrol('CRP yüksek [EK-9].', ekler)
    assert.deepEqual(r.bilinmeyen, ['EK-9'])
    assert.ok(!r.metin.includes('EK-9'))
  })
  it('atıflı cümlede ekin sayı kümesinde olmayan sayı → doğrulanamadı notu', () => {
    const r = atifKontrol('Hb 13,4 g/dL [EK-1].', ekler)
    assert.equal(r.dogrulanamayan.length, 1)
    assert.ok(r.metin.includes(ATIF_DOGRULANAMADI))
  })
  it('başka ekin sayısı kullanılamaz', () => {
    const r = atifKontrol('CRP 48 mg/L [EK-1].', ekler)
    assert.equal(r.dogrulanamayan.length, 1)
  })
  it('birden fazla atıf: sayı herhangi birinde varsa geçer', () => {
    const r = atifKontrol('Hb 11,2 ve CRP 48 [EK-1] [EK-2].', ekler)
    assert.equal(r.dogrulanamayan.length, 0)
  })
  it('alt-bulgu atıfı (EK-1.3) ana eke bağlanır', () => {
    const r = atifKontrol('Hb 11,2 [EK-1.3].', ekler)
    assert.equal(r.bilinmeyen.length, 0)
    assert.equal(r.dogrulanamayan.length, 0)
  })
  it('atıfsız cümle (hekimin sözü) dokunulmadan kalır', () => {
    const t = 'Ateş 39.2 derece, boğaz hiperemik.'
    assert.equal(atifKontrol(t, ekler).metin, t)
  })
  it('boş metin', () => assert.equal(atifKontrol(null, ekler).metin, ''))
})

describe('şema zorlama (sonucuDogrula)', () => {
  it('geçersiz tür/durum → null', () => {
    assert.equal(sonucuDogrula({ tur: 'x', durum: 'tamam' }, 'EK-1'), null)
    assert.equal(sonucuDogrula({ tur: 'lab', durum: 'belki' }, 'EK-1'), null)
    assert.equal(sonucuDogrula(null, 'EK-1'), null)
  })
  it('bulgulara kimlik atar, uzunlukları ve sayıyı sınırlar', () => {
    const s = sonucuDogrula({
      tur: 'lab', durum: 'tamam', baslik: 'B'.repeat(500), ozet: 'x',
      bulgular: Array.from({ length: 60 }, (_, i) => ({ metin: `m${i}`, kaynak: 'belge', duzey: 'kritik' })),
      izinliSayilar: ['1', '2'],
    }, 'EK-3')!
    assert.equal(s.baslik.length, 120)
    assert.equal(s.bulgular.length, 24)
    assert.equal(s.bulgular[0].id, 'EK-3.1')
  })
  it('lab değerlerinin sayıları izinli kümeye eklenir; istemci uydurma sayı ekleyemez bulgu içeriği üzerinden', () => {
    const s = sonucuDogrula({ tur: 'lab', durum: 'tamam', labDegerleri: [{ test: 'Hb', deger: '11,2', referans: '12-15.5', bayrak: 'L' }] }, 'EK-1')!
    assert.ok(s.izinliSayilar.includes('11.2') && s.izinliSayilar.includes('15.5'))
    assert.ok(!s.izinliSayilar.includes('99'))
  })
  it('aşı satırları: geçersiz tarih/doz null olur', () => {
    const s = sonucuDogrula({ tur: 'asi', durum: 'tamam', asiSatirlari: [{ asiAdi: 'KPA', dozNo: 99, uygulamaTarihi: '2026-13-45x', kaynakTuru: 'bu_muayene' }] }, 'EK-1')!
    const a = s.asiSatirlari![0]
    assert.equal(a.dozNo, null)
    assert.equal(a.uygulamaTarihi, null)
    assert.equal(a.kaynakTuru, 'bu_muayene')
  })
  it('hata durumunda neden zorunlu', () => {
    assert.equal(sonucuDogrula({ tur: 'lab', durum: 'hata' }, 'EK-1')!.hataNedeni, 'Değerlendirilemedi.')
  })
})
