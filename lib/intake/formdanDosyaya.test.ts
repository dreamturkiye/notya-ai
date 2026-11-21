/**
 * FORM-DOSYA-AKTAR-01 — "Formdan dosyaya aktar": what the submitted form says, as a diff against the card. Empty card
 * fields are offered (pre-ticked), different ones shown with both values (unticked), equal ones not at all; chronic
 * conditions merge; nothing about a guardian for an adult; the card PUT stores the new fields in the encrypted notes.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formAktarimGovdesi, formdanDosyayaFark, formdanKartDegerleri } from './formdanDosyaya'
import { notesOzetGuncelle, notlardanOzetAlanlari, EK_DEMOGRAFI_NOT_ANAHTARI } from '@/lib/doktor/hastaOzetKayit'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const FORM = {
  dogumTarihi: '2015-04-02', cinsiyet: 'Erkek', telefon: '0555 111 22 33', eposta: 'veli@ornek.test', il: 'Ankara',
  adres: 'Çankaya, Örnek Sk. 3', dogumYeri: 'Konya', anneAdi: 'Ayşe', babaAdi: 'Mehmet',
  veliAd: 'Ayşe', veliSoyad: 'Yılmaz', veliYakinligi: 'Anne', veliTelefon: '0555 999 88 77',
  acilKisiAdi: 'Ali Yılmaz', acilKisiYakinlik: 'Amca', acilKisiTelefon: '0532 000 00 00',
  sigortaTuru: 'Özel Sigorta', sigortaSirketi: 'Örnek Sigorta', policeNo: 'P-42',
  kanGrubu: 'B Rh+', kronikHastaliklar: ['Astım / KOAH', 'Yok'], alerjiVarMi: 'Bilinen alerjisi yok', kullaniyorMu: 'Hayır',
}
const BOS_KART = notlardanOzetAlanlari({}, { ad_soyad: 'QA Hasta', dogum_tarihi: null, cinsiyetHam: null, telefon: null, eposta: null })

describe('formdan dosyaya aktar', () => {
  it('reads the form in the card\'s shape', () => {
    const d = formdanKartDegerleri(FORM)
    assert.equal(d.veli_adi, 'Ayşe Yılmaz')
    assert.equal(d.sigorta, 'Özel Sigorta · Şirket: Örnek Sigorta · Poliçe/üyelik no: P-42')
    assert.equal(d.kan_grubu, 'B Rh+')
    assert.deepEqual(d.kronik_hastaliklar, ['Astım / KOAH'])
    assert.equal(d.alerjiler, 'Bilinen alerjisi yok')
    assert.equal(d.surekli_ilaclar, 'Yok')
    assert.equal(formdanKartDegerleri({ kanGrubu: 'Bilmiyorum' }).kan_grubu, undefined)
  })
  it('an empty card: every form value is offered, all pre-ticked ("bos")', () => {
    const f = formdanDosyayaFark(FORM, BOS_KART, { veli: true })
    assert.ok(f.length >= 18)
    assert.ok(f.every((s) => s.durum === 'bos' && s.dosyada === null))
    assert.ok(f.some((s) => s.alan === 'adres' && s.formda === 'Çankaya, Örnek Sk. 3'))
  })
  it('a doctor-entered value is never offered as a silent overwrite; equal values (other spelling) are not shown', () => {
    const kart = { ...BOS_KART, telefon: '+90 555 111 2233', kan_grubu: 'b+', sehir: 'İzmir', kronik_hastaliklar: ['Diyabet'] }
    const f = formdanDosyayaFark(FORM, kart, { veli: true })
    assert.equal(f.find((s) => s.alan === 'telefon'), undefined, 'same number, other format')
    assert.equal(f.find((s) => s.alan === 'kan_grubu'), undefined, 'b+ = B Rh+')
    const sehir = f.find((s) => s.alan === 'sehir')!
    assert.equal(sehir.durum, 'farkli'); assert.equal(sehir.dosyada, 'İzmir'); assert.equal(sehir.formda, 'Ankara')
    const kronik = f.find((s) => s.alan === 'kronik_hastaliklar')!
    assert.equal(kronik.durum, 'farkli')
    assert.deepEqual(kronik.formda, ['Diyabet', 'Astım / KOAH'], 'merged — the card\'s item stays')
  })
  it('no guardian rows for an adult (veli follows age)', () => {
    assert.ok(!formdanDosyayaFark(FORM, BOS_KART, { veli: false }).some((s) => s.alan.startsWith('veli_')))
  })
  it('only the confirmed rows go into the card PUT, and the PUT keeps them in the notes blob', () => {
    const f = formdanDosyayaFark(FORM, BOS_KART, { veli: true })
    const g = formAktarimGovdesi(f, ['adres', 'acil_kisi_telefon', 'sigorta', 'bilinmeyen'])
    assert.deepEqual(Object.keys(g).sort(), ['acil_kisi_telefon', 'adres', 'sigorta'])
    const { notes, notesDegisti } = notesOzetGuncelle({ sehir: 'Ankara' }, g)
    assert.equal(notesDegisti, true)
    assert.equal(notes.adres, 'Çankaya, Örnek Sk. 3'); assert.equal(notes.acilKisiTelefon, '0532 000 00 00'); assert.equal(notes.sehir, 'Ankara')
    const okunan = notlardanOzetAlanlari(notes, { ad_soyad: 'x', dogum_tarihi: null, cinsiyetHam: null, telefon: null, eposta: null })
    assert.equal(okunan.sigorta, 'Özel Sigorta · Şirket: Örnek Sigorta · Poliçe/üyelik no: P-42')
    assert.equal(okunan.veli_adi, null)
  })
  it('the new identity keys never reach a model (the file package drops them with the other identity keys)', () => {
    const src = readFileSync(join(__dirname, '..', 'doktor', 'hastaDosyaDerleyici.ts'), 'utf8')
    const set = src.slice(src.indexOf('const NOT_KIMLIK_ANAHTARLARI'), src.indexOf('function modeleGidenNot'))
    for (const k of Object.values(EK_DEMOGRAFI_NOT_ANAHTARI)) assert.ok(set.includes(`'${k}'`), k)
  })
})
