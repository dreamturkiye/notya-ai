/**
 * NOTYA-AYSE-GUVENLIK-01 — a forced drug card must not hide a conflict (action audit 2026-10-02).
 *
 * In the audit's production pass the command forces its tool, so the card is always made. Two cards were made
 * for sentences Luna refused in the unforced pass: Amoksisilin for a chart with a penicillin allergy, and
 * Singulair 10 mg for a 7-year-old on 5 mg. This file pins what the card, the read-back line and the commit
 * gate do for exactly those charts — on the real registry, the real commit path and the audit's own synthetic
 * patient (lib/asistan/tests/gercekciHasta.ts), whose allergy lives on the intake form only.
 *
 *   alerji      — the form's allergy reaches the card as a `ciddi` warning; the line says it; a plain tap or a
 *                 spoken "Evet" does not commit; the explicit acknowledgement does, and is written down
 *   çatışmasız  — a card with no conflict is byte-for-byte what it was: one honesty line, "Onaylıyor musunuz?"
 *   doz         — a written dose over the source's reference is `ciddi`; a fixed dose is never multiplied by weight
 *   bilinmeyen  — no reference in the table → no dose warning, no number, and the card says it was not checked
 *   izolasyon   — another doctor's form row for the same patient id never reaches this doctor's card
 */
process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-uyari-anahtari'

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { encrypt } from '@/lib/security/encryption'
import { gercekciHastaEkle } from '@/lib/asistan/tests/gercekciHasta'
import { oneriHazirla, type HazirOneri } from '@/core/eylemler/oneri'
import { eylemOnayla } from '@/core/eylemler/onayla'
import { hastaOzetiGetir } from '@/core/eylemler/hasta'
import { alerjiParcalari, alerjiUyarilari, ciddiUyariVarMi, gunlukMgOku, ilacUyarilariHesapla, pediatrikUyarilar, UYARI_YOK_CUMLESI, type IlacUyarisi } from '@/core/eylemler/ilacUyari'
import { ciddiUyariSozu, sesCiddiUyariEngeli, sesOzetMetni, UYARI_ONAY_SOZU } from '@/core/eylemler/sesKapilari'
import { bugunTRT, type EylemBaglami, type HastaOzeti } from '@/core/eylemler/types'
import type { SupabaseClient } from '@supabase/supabase-js'

const DOKTOR = '55555555-5555-4555-8555-555555555555'
const DIGER_DOKTOR = '66666666-6666-4666-8666-666666666666'

let db: SahteVeritabani
let sb: SupabaseClient
let hasta: HastaOzeti

const ctx = (h: HastaOzeti = hasta): EylemBaglami => ({ supabase: sb, doktorId: DOKTOR, hasta: h, brans: 'pediatri', oneriId: '', bugun: bugunTRT(), saatDilimi: 'Europe/Istanbul' })
const doktordan = (v: Record<string, unknown>) => ({ ...v, alan_kaynaklari: Object.fromEntries(Object.keys(v).map((k) => [k, { kaynak: 'doktor_soyledi' }])) })
const kart = (anahtar: string, v: Record<string, unknown>, h: HastaOzeti = hasta) =>
  oneriHazirla({ ctx: ctx(h), anahtar, girdi: doktordan(v), yuzey: 'ses', suzgec: { brans: 'pediatri', hasta: h } })
const okuma = (o: HazirOneri, ad: string) =>
  sesOzetMetni({ etiket: o.etiket, hastaAd: ad, veri: o.veri, alanlar: o.alanlar, eksik: o.eksik_alanlar.filter((a) => o.zorunlu.includes(a)), ek: (o.uyarilar || []).join(' '), uyariDetay: o.uyari_detay })
const ilaclar = () => db.tablo('hasta_ilaclar')

/** An adult with no allergy and no medication — the card nothing should fire on. */
function yetiskinEkle(): HastaOzeti {
  const id = db.ekle('patients', {
    doctor_id: DOKTOR, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: 'QA Yetişkin GÜVENLİK' })),
    dob_encrypted: encrypt('1980-05-05'), gender_encrypted: encrypt('male'),
    notes_encrypted: encrypt(JSON.stringify({ alerjiler: 'Bilinen alerjisi yok' })),
  }).id as string
  return { id, ad: 'QA Yetişkin GÜVENLİK', dogumTarihi: '1980-05-05', yasAy: 556, cinsiyet: 'male' }
}

beforeEach(async () => {
  db = new SahteVeritabani()
  sb = db.istemci() as unknown as SupabaseClient
  const id = gercekciHastaEkle(db, encrypt, DOKTOR)
  hasta = (await hastaOzetiGetir(sb, DOKTOR, id))!
  assert.ok(hasta.yasAy !== null && hasta.yasAy >= 72 && hasta.yasAy < 180, 'sentetik hasta 6–14 yaş bandında olmalı')
})

describe('NOTYA-AYSE-GUVENLIK-01 · alerji çatışması olan kart', () => {
  const amoksisilin = () => kart('ilac_ekle', { ilac_adi: 'Amoksisilin', etken_madde: 'Amoksisilin', doz: '250 mg', kullanim_sikli: 'günde iki kez' })

  it('(a) yalnız ilk kayıt formunda duran penisilin alerjisi Amoksisilin kartında CİDDİ uyarıdır', async () => {
    const o = (await amoksisilin())!
    const alerji = o.uyari_detay.filter((u) => u.tur === 'alerji')
    assert.equal(alerji.length, 1, JSON.stringify(o.uyari_detay))
    assert.equal(alerji[0].siddet, 'ciddi')
    assert.match(alerji[0].metin, /Penisilin \(ürtiker, 3 yaşında amoksisilin sonrası\)/, 'parantez içindeki virgül kaydı bölmez')
    const satir = db.tablo('eylem_onerileri').find((x) => x.id === o.id)!
    assert.ok((satir.uyari_detay as IlacUyarisi[]).some((u) => u.tur === 'alerji' && u.siddet === 'ciddi'), 'uyarı öneri satırına yazılır — kart onu oradan çizer')
  })

  it('(b) okunan / yazılan onay cümlesi çatışmayı onaydan ÖNCE söyler ve tek "Evet" istemez', async () => {
    const o = (await amoksisilin())!
    const soz = okuma(o, hasta.ad)
    assert.match(soz, /Dikkat Hocam: Alerji kaydı — Dosyada "Penisilin/)
    assert.ok(soz.indexOf('Dikkat Hocam') < soz.indexOf(UYARI_ONAY_SOZU), 'uyarı onay isteğinden önce gelir')
    assert.ok(soz.endsWith(UYARI_ONAY_SOZU), soz)
    assert.ok(!/Onaylıyor musunuz\?/.test(soz), 'ciddi uyarıda tek kelimelik onay sorulmaz')
    assert.ok(!/kaydedildi/i.test(soz))
  })

  it('(c) düz onay alerji çatışmasını geçiremez: dokunuş 409, sözlü "Evet" engeli; hiçbir şey yazılmaz', async () => {
    const o = (await amoksisilin())!
    const once = ilaclar().length
    assert.ok(sesCiddiUyariEngeli(o.uyari_detay), 'sözlü "Evet" kapısı kapalı')
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o.id, brans: 'pediatri', uyariGoruldu: false })
    assert.equal(s.ok, false)
    assert.equal((s as { durum: number }).durum, 409)
    assert.equal((s as { uyariOnayiGerekli?: boolean }).uyariOnayiGerekli, true)
    assert.equal(ilaclar().length, once, 'Amoksisilin dosyaya yazılmadı')
    assert.equal(db.tablo('eylem_kayitlari').length, 0)
    assert.equal(db.tablo('eylem_onerileri').find((x) => x.id === o.id)!.durum, 'taslak', 'kapı öneriyi tüketmez')
  })

  it('(c) açık onay ("Uyarıyı gördüm, kaydet") kaydeder ve hangi uyarının görüldüğü denetime yazılır', async () => {
    const o = (await amoksisilin())!
    const once = ilaclar().length
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o.id, brans: 'pediatri', uyariGoruldu: true })
    assert.equal(s.ok, true, JSON.stringify(s))
    assert.equal(ilaclar().length, once + 1)
    const onay = db.tablo('eylem_kayitlari')[0].uyari_onayi as { goruldu: boolean; ciddi: boolean; uyarilar: IlacUyarisi[] }
    assert.equal(onay.goruldu, true)
    assert.equal(onay.ciddi, true)
    assert.ok(onay.uyarilar.some((u) => u.tur === 'alerji'))
  })

  it('alerji sınıfı da yakalanır: aynı dosyada Augmentin kartı', async () => {
    const o = (await kart('ilac_ekle', { ilac_adi: 'Augmentin', doz: '400 mg', kullanim_sikli: '2x1' }))!
    assert.ok(o.uyari_detay.some((u) => u.tur === 'alerji' && u.siddet === 'ciddi'), JSON.stringify(o.uyari_detay))
  })

  it('formda "alerjisi yok" işaretliyse açıklama kutusu alerji sayılmaz; ilgisiz ilaçta alerji uyarısı çıkmaz', async () => {
    const form = db.tablo('hasta_intake_formlari')[0]
    form.form_data_encrypted = encrypt(JSON.stringify({ alerjiVarMi: 'Bilinen alerjisi yok', alerjiAciklama: 'Penisilin' }))
    assert.ok(!(await ilacUyarilariHesapla(ctx(), { ilacAdi: 'Amoksisilin', doz: '250 mg' })).some((u) => u.tur === 'alerji'))
    form.form_data_encrypted = encrypt(JSON.stringify({ alerjiVarMi: 'Evet', alerjiAciklama: 'Penisilin (ürtiker, 3 yaşında amoksisilin sonrası)' }))
    assert.ok(!(await ilacUyarilariHesapla(ctx(), { ilacAdi: 'Calpol', doz: '250 mg' })).some((u) => u.tur === 'alerji'), 'yanlış pozitif yok')
  })

  it('serbest yazım: parantez içi virgül bölünmez; "penisiline alerjisi var" da eşleşir', () => {
    assert.deepEqual(alerjiParcalari('Penisilin (ürtiker, 3 yaşında amoksisilin sonrası), fıstık; Bilinen alerjisi yok'), ['Penisilin (ürtiker, 3 yaşında amoksisilin sonrası)', 'fıstık'])
    assert.deepEqual(alerjiParcalari('Bilinen alerjisi yok'), [])
    assert.equal(alerjiUyarilari(['Penisiline alerjisi var'], 'Amoksisilin', null).length, 1)
    assert.equal(alerjiUyarilari(['Parasetamol (döküntü, 2 yaşında)'], 'Calpol', null).length, 1)
    assert.equal(alerjiUyarilari(['Fıstık alerjisi var'], 'Amoksisilin', null).length, 0)
  })
})

describe('NOTYA-AYSE-GUVENLIK-01 · çatışması olmayan kart değişmedi', () => {
  it('uyarı bloğu yalnız dürüstlük satırıdır; cümle "Onaylıyor musunuz?" ile biter; tek dokunuş kaydeder', async () => {
    const y = yetiskinEkle()
    const o = (await kart('ilac_ekle', { ilac_adi: 'Parol', doz: '500 mg', kullanim_sikli: '3x1' }, y))!
    assert.deepEqual(o.uyari_detay.map((u) => [u.tur, u.siddet, u.metin]), [['kapsam_notu', 'bilgi', UYARI_YOK_CUMLESI]])
    assert.equal(ciddiUyariSozu(o.uyari_detay), null)
    assert.equal(okuma(o, y.ad), 'QA Yetişkin GÜVENLİK için İlaç ekle hazırladım. İlaç: Parol. Doz: 500 mg. Kullanım: 3x1. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz?')
    assert.equal(sesCiddiUyariEngeli(o.uyari_detay), null)
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o.id, brans: 'pediatri' })
    assert.equal(s.ok, true, JSON.stringify(s))
  })

  it('ciddi olmayan uyarı (bilgi / orta) onay cümlesini ve kapıyı değiştirmez', () => {
    const bilgi: IlacUyarisi[] = [{ tur: 'pediatrik', siddet: 'bilgi', baslik: 'Pediatrik doz', metin: 'x', kaynak: 'k' }, { tur: 'etkilesim', siddet: 'orta', baslik: 'İlaç etkileşimi', metin: 'y', kaynak: 'k' }]
    const soz = sesOzetMetni({ etiket: 'İlaç ekle', hastaAd: 'QA', veri: { ilac_adi: 'Parol' }, alanlar: [{ anahtar: 'ilac_adi', etiket: 'İlaç', tip: 'metin' }], eksik: [], uyariDetay: bilgi })
    assert.equal(soz, 'QA için İlaç ekle hazırladım. İlaç: Parol. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz?')
    assert.equal(sesCiddiUyariEngeli(bilgi), null)
  })
})

describe('NOTYA-AYSE-GUVENLIK-01 · doz, kaynaktaki referansın üzerinde', () => {
  it('Singulair 10 mg, 7 yaşında (kayıtlı 5 mg akşam): kartta CİDDİ doz uyarısı; cümle söyler; düz onay geçmez', async () => {
    const o = (await kart('ilac_doz_degistir', { ilac_adi: 'Singulair', yeni_doz: '10 mg' }))!
    const asim = o.uyari_detay.filter((u) => u.tur === 'pediatrik_asim')
    assert.equal(asim.length, 1, JSON.stringify(o.uyari_detay))
    assert.equal(asim[0].siddet, 'ciddi')
    assert.match(asim[0].metin, /Yazılan günlük doz \(10 mg\), kaynakta bu yaş grubu için verilen dozun \(5 mg\/gün\) ÜZERİNDE\./)
    assert.match(asim[0].metin, /KÜB'den teyit edin\./, 'hiçbir giriş hekim onaylı değil — hüküm teyit ister')
    const soz = okuma(o, hasta.ad)
    assert.match(soz, /Dikkat Hocam: Pediatrik doz aşımı — Yazılan günlük doz \(10 mg\)/)
    assert.ok(soz.endsWith(UYARI_ONAY_SOZU))
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o.id, brans: 'pediatri' })
    assert.equal((s as { durum?: number }).durum, 409)
    assert.equal(ilaclar().find((r) => r.ilac_adi === 'Singulair')!.doz, '5 mg', 'doz değişmedi')
    const acik = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o.id, brans: 'pediatri', uyariGoruldu: true })
    assert.equal(acik.ok, true, JSON.stringify(acik))
    assert.equal(ilaclar().find((r) => r.ilac_adi === 'Singulair')!.doz, '10 mg', 'hekim yetkilidir — bilerek onaylayınca yazılır')
  })

  it('sabit doz kiloyla ÇARPILMAZ: Singulair kartında "98,4–123 mg/gün" gibi bir sayı yok', async () => {
    const u = await ilacUyarilariHesapla(ctx(), { ilacAdi: 'Singulair', doz: '5 mg', kullanimSikligi: 'akşam' })
    const satir = u.find((x) => x.tur === 'pediatrik')!
    assert.match(satir.metin, /Sabit doz \(kiloya göre hesaplanmaz\)/)
    assert.match(satir.metin, /6–14 yaş: 5 mg\/gün/)
    assert.ok(!/98|123|kg için/.test(satir.metin), satir.metin)
    assert.ok(!u.some((x) => x.siddet === 'ciddi'), '5 mg bu yaş bandının dozudur — uyarı yok')
    assert.ok(!u.some((x) => x.tur === 'doz_denetimsiz'), 'denetlendi; "denetlenemedi" denmez')
  })

  it('doz değişikliği günlük toplamı satırın MEVCUT sıklığıyla hesaplar (yalnız doz söylendi)', async () => {
    // Sınanan: yeni doz tek başına "günde 1 doz" sayılmaz. Tavanı tabloda kaynaklı bir ilaçla (amoksisilin) gösterilir.
    db.ekle('hasta_ilaclar', { patient_id: hasta.id, doctor_id: DOKTOR, ilac_adi: 'Largopen', etken_madde: 'amoksisilin', doz: '250 mg', kullanim_sikli: '3x1', aktif: true, durum: 'aktif', created_at: new Date().toISOString() })
    // 24,6 kg → kaynaktaki tavan 90 mg/kg/gün = 2214 mg/gün. 1000 mg × 3 = 3000 mg aşar; 1000 mg tek doz aşmazdı.
    const o = (await kart('ilac_doz_degistir', { ilac_adi: 'Largopen', yeni_doz: '1000 mg' }))!
    const asim = o.uyari_detay.find((u) => u.tur === 'pediatrik_asim')
    assert.ok(asim, JSON.stringify(o.uyari_detay))
    assert.match(asim!.metin, /Yazılan günlük doz \(3000 mg\) kaynaktaki tavanı \(2214 mg\/gün\) AŞIYOR\./)
  })

  it('kiloya göre tavan: referansın altındaki doz uyarı üretmez (yanlış alarm yok)', () => {
    const u = pediatrikUyarilar(85, 'Amoksisilin', null, 24.6, gunlukMgOku('250 mg', 'günde iki kez'))
    assert.ok(!u.some((x) => x.siddet === 'ciddi'), JSON.stringify(u))
    assert.ok(!u.some((x) => x.tur === 'doz_denetimsiz'))
  })

  it('yazılan doz okunuşu: sözle sıklık, "saatte bir", "2x250 mg"; mg/kg ve sıklıksız "gerektiğinde" hüküm üretmez', () => {
    assert.equal(gunlukMgOku('250 mg', 'günde iki kez'), 500)
    assert.equal(gunlukMgOku('250 mg', 'Günde 3 kez'), 750)
    assert.equal(gunlukMgOku('500 mg 3x1'), 1500)
    assert.equal(gunlukMgOku('2x250 mg'), 500)
    assert.equal(gunlukMgOku('500 mg', '8 saatte bir'), 1500)
    assert.equal(gunlukMgOku('250 mg', 'sabah akşam'), 500)
    assert.equal(gunlukMgOku('10 mg', 'akşam'), 10)
    assert.equal(gunlukMgOku('10 miligram'), 10)
    assert.equal(gunlukMgOku('10 mg', 'günde bir kez'), 10)
    assert.equal(gunlukMgOku('45 mg/kg/gün', 'günde 2 kez'), null, 'kilogram başına doz mutlak miligram değildir')
    assert.equal(gunlukMgOku('100 mg', 'gerektiğinde'), null)
    assert.equal(gunlukMgOku('2 puf', 'günde 2 kez'), null)
    assert.equal(gunlukMgOku('', ''), null)
  })
})

describe('NOTYA-AYSE-GUVENLIK-01 · referansı olmayan ilaç', () => {
  it('tabloda olmayan ilaç: doz uyarısı YOK, sayı YOK; kart kontrol edilemediğini söyler; tek onay yeter', async () => {
    const o = (await kart('ilac_ekle', { ilac_adi: 'Zzzqwerty', doz: '900 mg', kullanim_sikli: '3x1' }))!
    assert.deepEqual(o.uyari_detay.map((u) => u.tur), ['kapsam_disi'])
    assert.equal(o.uyari_detay[0].siddet, 'bilgi')
    assert.match(o.uyari_detay[0].metin, /Notya ilaç tablosunda yok/)
    assert.match(o.uyari_detay[0].metin, /doz/, 'dozun kontrol edilmediği de söylenir')
    assert.ok(!/\d+\s*mg/.test(o.uyari_detay[0].metin), 'uydurulmuş doz sayısı yok')
    assert.ok(!ciddiUyariVarMi(o.uyari_detay))
    assert.match(okuma(o, hasta.ad), /Onaylıyor musunuz\?$/)
  })

  it('tabloda var ama kaynaklı üst sınırı yok (Zyrtec): hüküm yok, kiloyla çarpılmış sayı yok, "denetlenmedi" denir', async () => {
    const u = await ilacUyarilariHesapla(ctx(), { ilacAdi: 'Zyrtec şurup', doz: '50 mg', kullanimSikligi: 'akşamları' })
    assert.ok(!u.some((x) => x.tur === 'pediatrik_asim'), 'kaynakta sınır yoksa aşım hükmü verilmez')
    assert.ok(!u.some((x) => x.siddet === 'ciddi'))
    const not = u.find((x) => x.tur === 'doz_denetimsiz')
    assert.ok(not, JSON.stringify(u))
    assert.equal(not!.siddet, 'bilgi')
    assert.match(not!.metin, /kaynaklı bir doz üst sınırı yok; yazılan doz otomatik denetlenmedi/)
    const satir = u.find((x) => x.tur === 'pediatrik')!
    assert.ok(!/kg için/.test(satir.metin), 'sabit doz kiloyla çarpılmaz')
  })

  it('montelukast bandı olmayan yaşta (15–17) hüküm verilmez — erişkin dozu çocuk bandıyla ölçülmez', () => {
    const u = pediatrikUyarilar(16 * 12, 'Singulair', null, 55, 10)
    assert.ok(!u.some((x) => x.tur === 'pediatrik_asim'), JSON.stringify(u))
    assert.ok(u.some((x) => x.tur === 'doz_denetimsiz'))
  })

  it('erişkinde doz satırı da "denetlenmedi" satırı da çıkmaz', () => {
    assert.deepEqual(pediatrikUyarilar(556, 'Singulair', null, 80, 100), [])
  })
})

describe('NOTYA-AYSE-GUVENLIK-01 · doktorlar arası izolasyon değişmedi', () => {
  it('aynı hasta kimliğine başka doktorun yazdığı form satırı bu doktorun kartına alerji taşımaz', async () => {
    const y = yetiskinEkle()
    db.ekle('hasta_intake_formlari', { patient_id: y.id, doktor_id: DIGER_DOKTOR, created_at: new Date().toISOString(), form_data_encrypted: encrypt(JSON.stringify({ alerjiVarMi: 'Evet', alerjiAciklama: 'Penisilin' })) })
    const u = await ilacUyarilariHesapla(ctx(y), { ilacAdi: 'Amoksisilin', doz: '500 mg', kullanimSikligi: '3x1' })
    assert.ok(!u.some((x) => x.tur === 'alerji'), JSON.stringify(u))
  })

  it('başka doktor bu hastaya kart hazırlayamaz ve bu doktorun kartını açık onayla da kaydedemez', async () => {
    const o = (await kart('ilac_ekle', { ilac_adi: 'Amoksisilin', doz: '250 mg', kullanim_sikli: 'günde iki kez' }))!
    const once = ilaclar().length
    const s = await eylemOnayla({ supabase: sb, doktorId: DIGER_DOKTOR, oneriId: o.id, brans: 'pediatri', uyariGoruldu: true })
    assert.equal(s.ok, false)
    assert.equal((s as { durum: number }).durum, 404, 'yabancı öneri yok sayılır')
    assert.equal(ilaclar().length, once)
    const yabanci = await ilacUyarilariHesapla({ ...ctx(), doktorId: DIGER_DOKTOR }, { ilacAdi: 'Amoksisilin', doz: '250 mg' })
    assert.ok(!yabanci.some((x) => x.tur === 'alerji'), 'başka doktorun bağlamı bu hastanın alerjisini okuyamaz')
  })
})
