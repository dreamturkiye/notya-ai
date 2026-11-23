/**
 * ESNEK-MUAYENE-B — pure modules: shadow-mode fact comparison + offer (B1), learning candidates + never-learned guard +
 * regression guard (B2), autonomy ladder (B3), fark notu never-inventing merge (B4), suggestion profile (B5), working-pattern
 * profile (B6), time meter (B7). Synthetic text only — no patient, no account.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { notlariKarsilastir, olgulariCikar, kayanEslesme, teklifUygunMu, gunlukGolge, GOLGE_ASGARI_NOT } from './olgu'
import { ogrenilemezMi, korumaliImza, imzaAyniMi } from './koruma'
import { golgedenSozlukAdaylari, golgedenBicimAdaylari, dogrulamadanAdaylar, korumaliAdayMi, adayAnahtari, bicimKurali, listeStili, bolumEtiketleri, adayCumlesi, type Oneri } from './aday'
import { adayiSina, aktiflesirMi, kuralCoz, ifadeVarMi, type GecmisNot } from './regresyon'
import { notIsle, yeniAlan, hekimIndir, alanGorunumu, notGorunumu, onayliOlmasiGerekenler, b3TeklifUygun, cumleKorumaliMi, type AlanDurumu } from './ozerklik'
import { farkNotuBirlestir, farkMetni, farkOgeleri, farkIzleri } from './farkNotu'
import { oneriSiniflandir, oneriMaddeleri, notGeriBildirimi, turDurumu, profiliUygula, maddeKabulMu, receteKabulMu } from './oneriProfili'
import { calismaSekli, onayAliskanligi, anaSayfaKarari } from './tanima'
import { tabanSec, donemOzeti, zamanSatiri, toplamOzet } from './zamanOlcer'
import { ESNEK_TR, sayiEkiTr } from './metinTr'
import { katla, kelimeler, gunDakikasi } from './metinAraclari'
import { sozlukKur, genislet } from '@/core/elNotu/sozluk'
import { GENEL_TR_TOHUM } from '@/core/elNotu/tohum/genelTr'
import { KBB_TR_TOHUM } from '@/core/elNotu/tohum/kbbTr'
import { personelKesinlestirmeEngeli } from '@/lib/esnek/ozerklikServisi'

const KBB = sozlukKur([], KBB_TR_TOHUM, GENEL_TR_TOHUM)
const kbbGenislet = (s: string) => genislet(KBB, s).metin

describe('B1 — clinical-content comparison (facts, not wording)', () => {
  it('the same findings in other words are the same content (lexicon + synonyms)', () => {
    const k = notlariKarsilastir('Muayene: KBB muayenesinde septum orta hatta, tonsiller hipertrofik', 'Muayene: septum orta hat, tonsiller hipertrofik', kbbGenislet)
    assert.equal(k.sayim.farkli, 0)
    assert.equal(k.sayim.eksik, 0)
    assert.equal(k.ayniIcerik, true)
  })
  it('a different side is a different fact (taraf), never "same content"', () => {
    const k = notlariKarsilastir('Sağ submandibular bezde taş', 'Sol submandibular bezde taş')
    assert.equal(k.sayim.farkli, 1)
    const f = k.ogeler.find((o) => o.durum === 'farkli')!
    assert.ok(f.durum === 'farkli' && f.neden.includes('taraf'))
    assert.equal(k.ayniIcerik, false)
  })
  it('presence vs absence and a different number are differences', () => {
    const a = notlariKarsilastir('Ateş yok', 'Ateş var')
    assert.ok(a.ogeler.some((o) => o.durum === 'farkli' && o.neden.includes('olumsuzluk')))
    const b = notlariKarsilastir('Taş 6 mm', 'Taş 8 mm')
    assert.ok(b.ogeler.some((o) => o.durum === 'farkli' && o.neden.includes('sayi')))
  })
  it('missing and extra facts are counted; one missing fact = not the same content', () => {
    const k = notlariKarsilastir('Septum orta hatta. Kulak zarı doğal.', 'Septum orta hatta. Kulak zarı doğal. Nazal pasaj açık.')
    assert.equal(k.sayim.eksik, 1)
    assert.equal(k.ayniIcerik, false)
    const f = notlariKarsilastir('Septum orta hatta. Tonsil hipertrofik.', 'Septum orta hatta.')
    assert.equal(f.sayim.fazla, 1)
  })
  it("Notya's unconfirmed reading is never counted as the same", () => {
    const k = notlariKarsilastir('Kulak zarı ⟦s1-l2-w3|hiperemik?⟧', 'Kulak zarı hiperemik')
    assert.ok(k.ogeler.some((o) => o.durum === 'farkli' && o.neden.includes('okunamadi')))
  })
  it('facts carry section labels and comma finding lists split under a label', () => {
    const o = olgulariCikar('Muayene: septum orta hat, tonsil hipertrofik\nPlan: kontrol')
    assert.equal(o.length, 3)
    assert.equal(o[0].bolum, 'Muayene')
    assert.equal(o[2].bolum, 'Plan')
  })
})

describe('B1 — rolling match, the offer and the daily line', () => {
  const kayit = (n: number, ayni: number, gun = '2026-11-23') => Array.from({ length: n }, (_, i) => ({ ayniIcerik: i < ayni, skor: i < ayni ? 1 : 0.7, gun }))
  it('offers at ≥ 90% with enough notes; not below the target; not with too few notes', () => {
    assert.equal(teklifUygunMu(kayit(20, 18)), true)
    assert.equal(teklifUygunMu(kayit(20, 17)), false)
    assert.equal(teklifUygunMu(kayit(GOLGE_ASGARI_NOT - 1, GOLGE_ASGARI_NOT - 1)), false)
    assert.equal(kayanEslesme(kayit(40, 40)).not, 30, 'window is the last 30 comparisons')
  })
  it('daily numbers and the Turkish line ("Bugünkü 18 notun 15\'ini …")', () => {
    const g = gunlukGolge([...kayit(18, 15), ...kayit(5, 5, '2026-11-22')], '2026-11-23')
    assert.deepEqual(g, { toplam: 18, ayni: 15 })
    assert.equal(ESNEK_TR.golge.gunluk(18, 15), "Bugünkü 18 notun 15'ini sekreterinizle aynı içerikte yazdım.")
    assert.equal(sayiEkiTr(3), 'ünü'); assert.equal(sayiEkiTr(6), 'sını'); assert.equal(sayiEkiTr(9), 'unu')
    assert.equal(sayiEkiTr(20), 'sini'); assert.equal(sayiEkiTr(40), 'ını'); assert.equal(sayiEkiTr(2), 'sini'); assert.equal(sayiEkiTr(100), 'ünü')
  })
})

describe('B2 — NEVER learned: right/left, doses, numbers, allergies, negation, patient identity', () => {
  for (const m of ['sağ', 'sol', 'bilateral', '5 mg', '2x1', '12', 'yok', 'Ø', 'negatif', 'alerji', 'penisilin alerjisi', 'TC 12345678901', 'ayse@ornek.test', '↓']) {
    it(`refuses "${m}"`, () => assert.equal(ogrenilemezMi(m), true))
  }
  it('refuses the patient\'s own name parts; allows plain clinical words', () => {
    assert.equal(ogrenilemezMi('Zeynep hanım', ['Zeynep', 'Demirtaş']), true)
    assert.equal(ogrenilemezMi('kulak zarı'), false)
    assert.equal(ogrenilemezMi('Fizik Muayene'), false)
  })
  it('candidates touching a protected class are never created', () => {
    assert.equal(korumaliAdayMi({ tur: 'sozluk', kisaltma: 'SL', anlam: 'sol' }), true)
    assert.equal(korumaliAdayMi({ tur: 'sozluk', kisaltma: 'Ø', anlam: 'yok' }), true)
    assert.equal(korumaliAdayMi({ tur: 'sozluk', kisaltma: 'KZ', anlam: 'kulak zarı' }), false)
    assert.equal(korumaliAdayMi({ tur: 'kural', anahtar: 'x', deger: '"5 mg" yerine "10 mg" yaz' }), true)
  })
  it('protected signature: same sides / negations / numbers → same signature', () => {
    assert.equal(imzaAyniMi('Sağ kulak zarı hiperemik, ateş yok', 'sağ KZ hiperemik, ateş yok'), true)
    assert.equal(imzaAyniMi('Sağ kulak', 'Sol kulak'), false)
    assert.ok(korumaliImza('Amoksisilin 500 mg 2x1').some((x) => x.startsWith('doz:')))
  })
})

describe('B2 — candidates from shadow mode and Doğrula', () => {
  const yok = () => false
  it('an abbreviation the secretary wrote out becomes a lexicon candidate', () => {
    const k = notlariKarsilastir('KZ hiperemik', 'kulak zarı hiperemik')
    const a = golgedenSozlukAdaylari(k, yok, 'g1')
    assert.equal(a.length, 1)
    assert.deepEqual(a[0].oneri, { tur: 'sozluk', kisaltma: 'KZ', anlam: 'kulak zarı' })
    assert.equal(a[0].anahtar, adayAnahtari(a[0].oneri))
  })
  it('a side abbreviation is never a candidate even when the secretary wrote it out', () => {
    const k = notlariKarsilastir('SĞ KZ hiperemik', 'sağ kulak zarı hiperemik')
    assert.ok(golgedenSozlukAdaylari(k, yok, 'g1').every((a) => a.oneri.tur !== 'sozluk' || !/sa[gğ]/i.test(a.oneri.anlam)))
  })
  it('a candidate carrying the patient\'s name is refused', () => {
    const k = notlariKarsilastir('AY geldi şikayeti', 'Ayşe geldi şikayeti')
    assert.equal(golgedenSozlukAdaylari(k, yok, 'g1', ['Ayşe']).length, 0)
  })
  it('format candidates: section order and plan list style from the secretary\'s note', () => {
    const not = 'Şikayet: boğaz ağrısı\nMuayene: tonsil hipertrofik\nTanı: tonsillit\nPlan:\n1. Kontrol\n2. Gargara'
    const a = golgedenBicimAdaylari(not, 'g2')
    assert.ok(a.some((x) => x.oneri.tur === 'bicim' && x.oneri.alt === 'bolum_sirasi'))
    assert.ok(a.some((x) => x.oneri.tur === 'bicim' && x.oneri.alt === 'plan_liste' && x.oneri.stil === 'numarali'))
    assert.deepEqual(bolumEtiketleri(not), ['Şikayet', 'Muayene', 'Tanı', 'Plan'])
    assert.equal(listeStili('- a\n- b'), 'tire')
    const kural = bicimKurali({ tur: 'bicim', alt: 'plan_liste', stil: 'numarali' }, ESNEK_TR.ogrenme)
    assert.equal(kural.deger, 'Plan maddelerini numaralı yaz')
    assert.ok(!/\d/.test(kural.deger))
  })
  it('Doğrula: a short reading answered with an expansion → candidate; protected / number answers never', () => {
    const a = dogrulamadanAdaylar([
      { id: '1', okunan: 'KZ', cevap: 'kulak zarı', sinif: 'kelime' },
      { id: '2', okunan: 'SL', cevap: 'sol', sinif: 'kelime' },
      { id: '3', okunan: 'DZ', cevap: '5 mg', sinif: 'kelime' },
      { id: '4', okunan: 'KZ', cevap: 'kulak zarı', sinif: 'korumali' },
    ])
    assert.equal(a.length, 1)
    assert.equal(a[0].kanit, '1')
  })
  it('activated candidates read as one plain sentence', () => {
    assert.equal(adayCumlesi({ tur: 'sozluk', kisaltma: 'KZ', anlam: 'kulak zarı' }, ESNEK_TR.ogrenme), '"KZ" yazdığınızda "kulak zarı" olarak okuyorum.')
  })
})

describe('B2 — regression guard against the doctor\'s past approved notes', () => {
  const not = (id: string, alanlar: Record<string, string>, kaynakMetni?: string): GecmisNot => ({ id, alanlar, kaynakMetni })
  const bag = { hekimSozlugu: [], bransTohum: [], genelTohum: GENEL_TR_TOHUM }
  it('lexicon: supported by past notes → passes; contradicted (other meaning approved) → breaks', () => {
    const o: Oneri = { tur: 'sozluk', kisaltma: 'KZ', anlam: 'kulak zarı' }
    const iyi = adayiSina(o, [not('n1', { objektif: 'Kulak zarı hiperemik' }, 'KZ hiperemik')], [], bag)
    assert.equal(iyi.gecti, true); assert.equal(iyi.destek, 1)
    const baska = { ...bag, genelTohum: [...GENEL_TR_TOHUM, { kisaltma: 'KZ', anlam: 'kalp zarı', kaynak: 'genel' as const, baglam: 'kelime' as const }] }
    const kotu = adayiSina(o, [not('n2', { objektif: 'Kalp zarı normal' }, 'KZ normal')], [], baska)
    assert.equal(kotu.gecti, false); assert.deepEqual(kotu.kirilanNotlar, ['n2'])
  })
  it('lexicon: the doctor\'s own different entry is never overwritten (conflict)', () => {
    const r = adayiSina({ tur: 'sozluk', kisaltma: 'KZ', anlam: 'kulak zarı' }, [], [], { ...bag, hekimSozlugu: [{ kisaltma: 'KZ', anlam: 'kulak zarları', kaynak: 'hekim', baglam: 'kelime' }] })
    assert.equal(r.neden, 'celiski'); assert.equal(r.gecti, false)
  })
  it('a transformation that would change a protected token never passes (hard rule)', () => {
    const r = adayiSina({ tur: 'sozluk', kisaltma: 'XQ', anlam: 'sağ' }, [not('n3', { objektif: 'sağ kulak' }, 'XQ kulak ağrısı')], [], bag)
    assert.ok(r.korumaliDegisen > 0); assert.equal(r.gecti, false)
  })
  it('phrasing rule ("A" yerine "B"): breaks when the doctor approved A elsewhere; evidence notes excluded', () => {
    const o: Oneri = { tur: 'kural', anahtar: 'terim-x', deger: '"hiperemik" yerine "kızarık" yaz' }
    assert.deepEqual(kuralCoz(o.deger), { tur: 'terim', once: 'hiperemik', sonra: 'kızarık' })
    const kir = adayiSina(o, [not('k1', { objektif: 'kızarık' }), not('k2', { objektif: 'zar hiperemik' })], ['k1'])
    assert.equal(kir.gecti, false); assert.deepEqual(kir.kirilanNotlar, ['k2'])
    const gec = adayiSina(o, [not('k1', { objektif: 'kızarık' }), not('k3', { objektif: 'kızarık zar' })], ['k1'])
    assert.equal(gec.gecti, true); assert.equal(gec.destek, 1)
  })
  it('format rule: a past approved plan with the other list style breaks it', () => {
    const o: Oneri = { tur: 'bicim', alt: 'plan_liste', stil: 'numarali' }
    assert.equal(adayiSina(o, [not('p1', { plan: '1. a\n2. b' })]).gecti, true)
    assert.equal(adayiSina(o, [not('p1', { plan: '1. a\n2. b' }), not('p2', { plan: '- a\n- b' })]).gecti, false)
  })
  it('activation needs two independent pieces of evidence AND a clean test', () => {
    const temiz = adayiSina({ tur: 'bicim', alt: 'plan_liste', stil: 'numarali' }, [])
    assert.equal(aktiflesirMi(1, temiz), false)
    assert.equal(aktiflesirMi(2, temiz), true)
  })
  it('whole-phrase match allows Turkish suffixes, not inner substrings', () => {
    assert.equal(ifadeVarMi('Taşları azalmış', 'taş'), true)
    assert.equal(ifadeVarMi('Ataşman', 'taş'), false)
  })
})

describe('B3 — field-level autonomy ladder', () => {
  const ilerlet = (d: AlanDurumu, n: number, b3 = false) => { let x = d; for (let i = 0; i < n; i++) x = notIsle(x, false, b3); return x }
  it('B0 → B1 after 5, → B2 after 20 uncorrected notes; B3 only with the doctor\'s yes (40)', () => {
    assert.equal(ilerlet(yeniAlan('plan'), 4).basamak, 0)
    assert.equal(ilerlet(yeniAlan('plan'), 5).basamak, 1)
    assert.equal(ilerlet(yeniAlan('plan'), 20).basamak, 2)
    assert.equal(ilerlet(yeniAlan('plan'), 60).basamak, 2, 'no B3 without the doctor opening it')
    assert.equal(ilerlet(yeniAlan('plan'), 40, true).basamak, 3)
  })
  it('any correction drops the field one step and restarts its count', () => {
    const d = notIsle(ilerlet(yeniAlan('objektif'), 20), true, false)
    assert.equal(d.basamak, 1); assert.equal(d.seri, 0)
  })
  it('drugs / doses and diagnosis codes never rise above B1', () => {
    assert.equal(ilerlet(yeniAlan('content_ilaclar'), 100, true).basamak, 1)
    assert.equal(ilerlet(yeniAlan('icd10_codes'), 100, true).basamak, 1)
  })
  it('the doctor lowers a field any time; it does not jump straight back', () => {
    const d = hekimIndir(ilerlet(yeniAlan('plan'), 25), 1)
    assert.equal(d.basamak, 1); assert.equal(d.hekimTavani, 1)
    assert.equal(ilerlet(d, 50).basamak, 1, 'his ceiling holds')
  })
  it('a side / dose / allergy sentence is yellow at every step', () => {
    assert.equal(cumleKorumaliMi('Sağ kulak zarı hiperemik'), true)
    assert.equal(cumleKorumaliMi('Septum orta hatta'), false)
    const g = alanGorunumu('objektif', 'Septum orta hatta. Sağ kulak zarı hiperemik.', 3)
    assert.equal(g.durum, 'sari'); assert.deepEqual(g.sariCumleler, ['Sağ kulak zarı hiperemik.']); assert.equal(g.digerSari, 0)
    assert.equal(alanGorunumu('objektif', 'Septum orta hatta.', 2).durum, 'otomatik')
    assert.equal(alanGorunumu('content_ilaclar', 'Amoksisilin 500 mg 2x1', 3).durum, 'sari')
  })
  it('one tap at B2, batch at B3, never with an open reading; protected items listed for acknowledgement', () => {
    const al = [alanGorunumu('subjektif', 'Boğaz ağrısı.', 2), alanGorunumu('objektif', 'Sağ tonsil hipertrofik.', 2), alanGorunumu('content_ilaclar', 'Amoksisilin 500 mg', 1)]
    const n = notGorunumu(al, false)
    assert.equal(n.tekDokunus, true); assert.equal(n.topluUygun, false)
    assert.equal(notGorunumu(al, true).tekDokunus, false)
    const liste = onayliOlmasiGerekenler(al)
    assert.ok(liste.some((x) => x.alan === 'content_ilaclar'))
    assert.ok(liste.some((x) => x.alan === 'objektif' && /Sağ/.test(x.metin)))
    const b3 = notGorunumu([alanGorunumu('subjektif', 'Boğaz ağrısı.', 3), alanGorunumu('plan', 'Kontrol.', 3)], false)
    assert.equal(b3.topluUygun, true)
  })
  it('a sentence without provenance on a source-built note is yellow (not auto-accepted)', () => {
    const g = alanGorunumu('plan', 'Kontrol. Gargara.', 2, { kaynakli: true, izli: new Set(['Kontrol.']) })
    assert.equal(g.digerSari, 1); assert.equal(notGorunumu([g], false).tekDokunus, false)
  })
  it('the B3 offer needs every free field at the B3 count', () => {
    const al = ['subjektif', 'objektif', 'plan'].map((a) => ({ ...ilerlet(yeniAlan(a as 'plan'), 40), alan: a as 'plan' }))
    assert.equal(b3TeklifUygun(al), true)
    assert.equal(b3TeklifUygun([...al.slice(0, 2), { ...al[2], seri: 3 }]), false)
  })
  it('Phase A optional approval: a secretary never finalizes drugs / diagnosis codes / an allergy proposal', () => {
    assert.equal(personelKesinlestirmeEngeli({ content_ilaclar: [{ ad: 'x' }] }), 'ilac')
    assert.equal(personelKesinlestirmeEngeli({ icd10_codes: [{ code: 'J03' }] }), 'tani_kodu')
    assert.equal(personelKesinlestirmeEngeli({ kaynak_ozeti: { dosyaOnerileri: [{ tur: 'alerji' }] } }), 'alerji')
    assert.equal(personelKesinlestirmeEngeli({ content_ilaclar: [], icd10_codes: [] }), null)
  })
})

describe('B4 — fark notu: merge with the previous muayene, never inventing', () => {
  const onceki = {
    subjektif: 'Sağ submandibular bölgede ağrı ve şişlik.',
    objektif: 'Sağ submandibular bezde 6 mm taş. Ağız tabanı ödemli değil.',
    degerlendirme: 'Sialolitiazis.',
    plan: '1. Antibiyotik 10 gün\n2. Sialagog',
  }
  const s = farkNotuBirlestir(onceki, 'taş ↓, ağrı Ø, sialendoskopi 12.12', ESNEK_TR.fark.kelimeler)
  it('parses the change line (operators anywhere in the item)', () => {
    const o = farkOgeleri('taş ↓, ağrı Ø, sialendoskopi 12.12')
    assert.deepEqual(o.map((x) => x.degisim), ['azaldi', 'yok', 'serbest'])
    assert.equal(o[2].tarihli, true)
  })
  it('changed items highlighted with the previous statement beside them', () => {
    const tas = s.bolumler.objektif.find((x) => x.durum === 'degisti')!
    assert.match(tas.metin, /^taş: azalmış \(önceki muayene: Sağ submandibular bezde 6 mm taş\.\)$/)
    assert.ok(s.bolumler.subjektif.some((x) => x.durum === 'degisti' && /ağrı: yok/.test(x.metin)))
  })
  it('unchanged items stated as unchanged; the previous plan is never restated as today\'s plan', () => {
    assert.ok(s.bolumler.degerlendirme.some((x) => x.durum === 'degismedi' && x.metin === 'Sialolitiazis.'))
    assert.ok(s.bolumler.objektif.some((x) => x.durum === 'degismedi' && /Ağız tabanı/.test(x.metin)))
    assert.ok(!s.bolumler.plan.some((x) => /Antibiyotik/.test(x.metin)))
    assert.ok(s.bolumler.plan.some((x) => x.durum === 'yeni' && x.metin === 'sialendoskopi 12.12'))
  })
  it('provenance on every sentence', () => {
    const iz = farkIzleri(s)
    for (const b of Object.values(iz)) for (const x of b!) assert.ok(x.etiketler.length >= 1 && x.etiketler.every((e) => /^K[12]\./.test(e)))
  })
  it('NEVER invents: every word of the note comes from the two sources or the build\'s fixed words', () => {
    const metin = farkMetni(s, ESNEK_TR.fark.kelimeler, '12 Kasım 2026')
    const kaynak = new Set(kelimeler([...Object.values(onceki), 'taş ↓, ağrı Ø, sialendoskopi 12.12', '12 Kasım 2026'].join(' ')).map(katla))
    const k = ESNEK_TR.fark.kelimeler
    const sabit = new Set(kelimeler([...Object.values(k.degisim), k.onceki(''), k.degisen, k.degismeyen(''), k.yeni, k.hekiminNotu].join(' ')).map(katla))
    const yeniKelime = kelimeler(Object.values(metin).join('\n')).map(katla).filter((w) => !kaynak.has(w) && !sabit.has(w) && w !== '•')
    assert.deepEqual(yeniKelime, [])
    assert.ok(!/\b10 gün\b/.test(metin.plan), 'a previous plan number never reappears')
  })
  it('an item naming nothing previous is labelled as the doctor\'s note, never merged into a finding', () => {
    const r = farkNotuBirlestir(onceki, 'öksürük +', ESNEK_TR.fark.kelimeler)
    assert.ok(r.bolumler.objektif.some((x) => x.durum === 'yeni' && x.metin.startsWith('Kontrolde (hekimin notu)')))
  })
})

describe('B5 — suggestion profile', () => {
  it('classifies suggestion types; safety first', () => {
    assert.equal(oneriSiniflandir('Penisilin alerjisi var — amoksisilin ile etkileşim'), 'guvenlik')
    assert.equal(oneriSiniflandir('Ayırıcı tanıda peritonsiller apse düşünülmeli'), 'ayirici_tani')
    assert.equal(oneriSiniflandir('Boyun USG istenebilir'), 'tetkik')
    assert.equal(oneriSiniflandir('2 hafta sonra kontrol'), 'takip')
  })
  it('accepted when the content reached the final note; prescriptions by substance', () => {
    assert.equal(maddeKabulMu('Boyun ultrasonografisi istenebilir', 'Plan: boyun ultrasonografisi'), true)
    assert.equal(maddeKabulMu('Boyun ultrasonografisi istenebilir', 'Plan: kontrol'), false)
    assert.equal(receteKabulMu({ etkenMadde: 'Amoksisilin' }, '[{"ad":"Amoksisilin 500"}]'), true)
    const gb = notGeriBildirimi({ aiDegerlendirme: '- Boyun ultrasonografisi istenebilir\n- Ayırıcı tanıda apse düşünülmeli', receteOnerisi: [{ etkenMadde: 'Klaritromisin' }], sonMetin: 'boyun ultrasonografisi' })
    assert.deepEqual(gb.sort((a, b) => a.tur.localeCompare(b.tur)), [{ tur: 'ayirici_tani', kabul: false }, { tur: 'recete', kabul: false }, { tur: 'tetkik', kabul: true }])
  })
  it('always-rejected types quiet down, accepted ones surface, SAFETY NEVER QUIETED (not even by the doctor)', () => {
    assert.equal(turDurumu({ tur: 'ayirici_tani', kabul: 0, red: 8 }), 'sessiz')
    assert.equal(turDurumu({ tur: 'ayirici_tani', kabul: 0, red: 8 }, 'goster'), 'normal')
    assert.equal(turDurumu({ tur: 'tetkik', kabul: 4, red: 1 }), 'one_cikar')
    assert.equal(turDurumu({ tur: 'guvenlik', kabul: 0, red: 50 }), 'normal')
    assert.equal(turDurumu({ tur: 'guvenlik', kabul: 0, red: 50 }, 'sessiz'), 'normal')
    const m = oneriMaddeleri('- Ayırıcı tanıda apse düşünülmeli\n- Penisilin alerjisi: amoksisilin verme\n- Boyun USG')
    const r = profiliUygula(m, { ayirici_tani: 'sessiz', guvenlik: 'normal', tetkik: 'one_cikar' })
    assert.equal(r.gorunen[0].tur, 'guvenlik')
    assert.equal(r.gorunen[1].tur, 'tetkik')
    assert.deepEqual(r.sessiz.map((x) => x.tur), ['ayirici_tani'])
  })
})

describe('B6 — how the doctor works', () => {
  it('paper doctor / voice doctor / mixed, only with enough visits', () => {
    assert.equal(calismaSekli(Array(8).fill({ elNotu: true, transkript: false })), 'kagit')
    assert.equal(calismaSekli(Array(8).fill({ elNotu: false, transkript: true })), 'ses')
    assert.equal(calismaSekli([...Array(4).fill({ elNotu: true, transkript: false }), ...Array(4).fill({ elNotu: false, transkript: true })]), 'karma')
    assert.equal(calismaSekli(Array(3).fill({ elNotu: true, transkript: false })), null)
  })
  it('end-of-day approver with his usual time; one notification at or after it', () => {
    const anlar = Array.from({ length: 12 }, (_, i) => ({ gun: `2026-11-${String(10 + (i % 6)).padStart(2, '0')}`, dakika: 18 * 60 + 40 + (i % 3) * 5, gecikmeDk: 300 }))
    const o = onayAliskanligi(anlar)!
    assert.equal(o.tur, 'gun_sonu'); assert.equal(o.saatDk, 18 * 60 + 45)
    assert.equal(anaSayfaKarari({ sekil: 'kagit', onay: o, simdiDk: 17 * 60, bekleyen: 4, bugunGosterildi: false }).bildirim.goster, false)
    const k = anaSayfaKarari({ sekil: 'kagit', onay: o, simdiDk: 18 * 60 + 45, bekleyen: 4, bugunGosterildi: false })
    assert.equal(k.bildirim.goster, true); assert.equal(k.elNotuOnce, true); assert.equal(k.mikrofonOner, false)
    assert.equal(anaSayfaKarari({ sekil: 'ses', onay: o, simdiDk: 19 * 60, bekleyen: 0, bugunGosterildi: false }).bildirim.goster, false, 'nothing waiting → no notification')
    assert.equal(onayAliskanligi(anlar.map((a) => ({ ...a, dakika: 11 * 60, gecikmeDk: 5 })))!.tur, 'anlik')
  })
  it('local time helper', () => assert.equal(gunDakikasi(new Date('2026-11-23T15:30:00Z')), 18 * 60 + 30))
})

describe('B7 — time meter (honest numbers only)', () => {
  const kayit = [{ sure_ms: 120000, patient_id: 'p1' }, { sure_ms: 60000, patient_id: 'p2' }]
  it('baseline priority: shadow measured → shadow declared → the doctor\'s own', () => {
    assert.deepEqual(tabanSec({ golgeOlculenMs: Array(5).fill(480000), golgeBeyanDk: Array(9).fill(5), hekimDk: 3 }), { dk: 8, kaynak: 'golge_olculen', not: 5 })
    assert.equal(tabanSec({ golgeOlculenMs: [480000], golgeBeyanDk: Array(5).fill(6), hekimDk: 3 })!.kaynak, 'golge_beyan')
    assert.equal(tabanSec({ golgeOlculenMs: [], golgeBeyanDk: [], hekimDk: 3 })!.kaynak, 'hekim')
    assert.equal(tabanSec({ golgeOlculenMs: [], golgeBeyanDk: [], hekimDk: null }), null)
  })
  it('"Bugün N hasta · dokümantasyon X dk (önce Y dk) · kazanç Z dk"; no baseline → no "önce", no gain', () => {
    const t = { dk: 8, kaynak: 'golge_olculen' as const, not: 5 }
    assert.equal(zamanSatiri(donemOzeti(kayit, t), ESNEK_TR.zaman), 'Bugün 2 hasta · dokümantasyon 3 dk (önce 16 dk) · kazanç 13 dk')
    assert.equal(zamanSatiri(donemOzeti(kayit, null), ESNEK_TR.zaman), 'Bugün 2 hasta · dokümantasyon 3 dk')
    assert.equal(zamanSatiri(donemOzeti([], t), ESNEK_TR.zaman), null)
  })
  it('the week is the sum of its days', () => {
    const t = { dk: 5, kaynak: 'hekim' as const, not: 0 }
    const w = toplamOzet([donemOzeti(kayit, t), donemOzeti([{ sure_ms: 60000, patient_id: 'p1' }], t)], t)
    assert.equal(w.hasta, 3); assert.equal(w.dokumantasyonDk, 4); assert.equal(w.onceDk, 15); assert.equal(w.kazancDk, 11)
    assert.equal(zamanSatiri(w, ESNEK_TR.zaman, 'hafta'), 'Bu hafta 3 hasta · dokümantasyon 4 dk (önce 15 dk) · kazanç 11 dk')
  })
})
