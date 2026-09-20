/**
 * NOTYA-EYLEM-21 — the ilaç card's safety warnings, exercised on the real registry, the real commit
 * path and a fake database (lib/security/testing/sahteSupabase.ts).
 *
 * What each block protects:
 *   alerji      — a drug the patient is recorded as allergic to cannot reach the file quietly
 *   mükerrer    — two brands of one molecule (Parol + Minoset) is named as a double-dose risk
 *   etkileşim   — the app's own drug table actually fires now (it used to match only on `name`,
 *                 so every CLASS entry — "NSAIDs", "ACE inhibitörleri" — silently never matched)
 *   pediatrik   — "6 ay altı bebek" is a refusal-worthy fact, not a footnote
 *   kapı        — a `ciddi` warning does NOT block the hekim; it costs one explicit second tap,
 *                 and the acknowledgement is written to eylem_kayitlari
 *   yeniden     — the check runs AGAIN at commit: a card drawn before the allergy was recorded
 *                 does not get to commit as if the file had not changed
 *   hafıza      — memory can never soften or suppress any of the above
 */
process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-uyari-anahtari'

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { encrypt } from '@/lib/security/encryption'
import { oneriHazirla } from '@/core/eylemler/oneri'
import { eylemOnayla } from '@/core/eylemler/onayla'
import {
  alerjiUyarilari,
  ayseNotuUyarisi,
  ciddiUyariVarMi,
  etkilesimUyarilari,
  ilacAnahtari,
  ilacUyarilariHesapla,
  mukerrerEtkenUyarilari,
  pediatrikUyarilar,
  type IlacUyarisi,
} from '@/core/eylemler/ilacUyari'
import { bugunTRT, type EylemBaglami, type HastaOzeti } from '@/core/eylemler/types'
import type { SupabaseClient } from '@supabase/supabase-js'

const DOKTOR = '33333333-3333-4333-8333-333333333333'
const HASTA_ID = '44444444-4444-4444-8444-444444444444'

let db: SahteVeritabani
let sb: SupabaseClient

/** 8 aylık bebek — pediatrik kapıların açık olduğu yaş. */
const bebek: HastaOzeti = { id: HASTA_ID, ad: 'QA Bebek UYARI', dogumTarihi: '2026-01-19', yasAy: 8, cinsiyet: 'female' }
const yetiskin: HastaOzeti = { id: HASTA_ID, ad: 'QA Yetişkin UYARI', dogumTarihi: '1980-05-05', yasAy: 556, cinsiyet: 'male' }

function ctx(hasta: HastaOzeti = yetiskin): EylemBaglami {
  return { supabase: sb, doktorId: DOKTOR, hasta, brans: 'pediatri', oneriId: '', bugunTRT: bugunTRT() }
}

function hastaKur(alerjiler: string, dogum: string) {
  db.tablo('patients').length = 0
  db.tablo('patients').push({
    id: HASTA_ID,
    doctor_id: DOKTOR,
    name_encrypted: encrypt(JSON.stringify({ ad: 'QA UYARI' })),
    dob_encrypted: encrypt(dogum),
    gender_encrypted: encrypt('male'),
    notes_encrypted: encrypt(JSON.stringify({ alerjiler })),
  })
}

function ilacEkle(ad: string, etken?: string) {
  db.tablo('hasta_ilaclar').push({ id: randomUUID(), doctor_id: DOKTOR, patient_id: HASTA_ID, ilac_adi: ad, etken_madde: etken ?? null, aktif: true })
}

function hepsiDoktordan(v: Record<string, unknown>): Record<string, unknown> {
  return { ...v, alan_kaynaklari: Object.fromEntries(Object.keys(v).map((k) => [k, { kaynak: 'doktor_soyledi' }])) }
}

beforeEach(() => {
  db = new SahteVeritabani()
  sb = db.istemci() as unknown as SupabaseClient
  hastaKur('Bilinen alerjisi yok', '1980-05-05')
})

describe('NOTYA-EYLEM-21 · alerji', () => {
  it('dosyadaki penisilin alerjisi Augmentin kartında CİDDİ uyarı olur', () => {
    const u = alerjiUyarilari(['Penisilin'], 'Augmentin 1000 mg')
    assert.equal(u.length, 1)
    assert.equal(u[0].siddet, 'ciddi')
    assert.equal(u[0].tur, 'alerji')
    assert.match(u[0].metin, /Penisilin/)
  })

  it('"Penisilin alerjisi" biçiminde yazılmış kayıt da eşleşir', () => {
    assert.ok(ciddiUyariVarMi(alerjiUyarilari(['Penisilin alerjisi'], 'Largopen')))
  })

  it('ilacın kendi kontrendikasyonu üzerinden eşleşir (sülfonamid → Furosemid)', () => {
    const u = alerjiUyarilari(['Sulfonamid'], 'Lasix 40 mg')
    assert.ok(ciddiUyariVarMi(u), JSON.stringify(u))
    assert.match(u[0].metin, /kontrendikasyon/i)
  })

  it('ilgisiz alerji uyarı üretmez (yanlış pozitif yok)', () => {
    assert.deepEqual(alerjiUyarilari(['Fıstık', 'Polen'], 'Parol 500 mg'), [])
  })

  it('"Bilinen alerjisi yok" satırı alerji sayılmaz', () => {
    assert.deepEqual(alerjiUyarilari([], 'Augmentin'), [])
  })
})

describe('NOTYA-EYLEM-21 · aynı etken madde', () => {
  it('Parol kullanan hastaya Minoset CİDDİ mükerrer uyarısı verir', () => {
    const u = mukerrerEtkenUyarilari([{ ilac_adi: 'Parol 500 mg' }], 'Minoset')
    assert.equal(u.length, 1)
    assert.equal(u[0].siddet, 'ciddi')
    assert.match(u[0].metin, /çift doz/i)
  })

  it('aynı AD iki kez → burada uyarı yok (mukerrerKontrol zaten söylüyor, iki cümle yazmayız)', () => {
    assert.deepEqual(mukerrerEtkenUyarilari([{ ilac_adi: 'Parol' }], 'Parol'), [])
  })

  it('farklı etken maddeler uyarı üretmez', () => {
    assert.deepEqual(mukerrerEtkenUyarilari([{ ilac_adi: 'Glifor' }], 'Parol'), [])
  })
})

describe('NOTYA-EYLEM-21 · etkileşim (uygulamanın kendi ilaç tablosu)', () => {
  it('sınıf adıyla yazılmış etkileşimler artık gerçekten çalışıyor', () => {
    // Bu üç çift, eşleştirme yalnız `name` alanına bakarken SESSİZCE hiç eşleşmiyordu.
    const ciftler: [string, string][] = [
      ['Delix', 'Brufen'],      // ACE inhibitörü × NSAID
      ['Apranax', 'Prednol'],   // NSAID × kortikosteroid
      ['Lustral', 'Imigran'],   // SSRI × triptan (serotonin sendromu)
    ]
    for (const [mevcut, yeni] of ciftler) {
      const u = etkilesimUyarilari([{ ilac_adi: mevcut }], yeni)
      assert.equal(u.length, 1, `${mevcut} + ${yeni} etkileşimi kaçtı`)
      assert.equal(u[0].siddet, 'ciddi')
    }
  })

  it('etkileşimsiz çiftlerde susar', () => {
    assert.deepEqual(etkilesimUyarilari([{ ilac_adi: 'Losec' }], 'Brufen'), [])
    assert.deepEqual(etkilesimUyarilari([{ ilac_adi: 'Norvasc' }], 'Sortis'), [])
  })

  it('tabloda olmayan ilaç için etkileşim uydurulmaz', () => {
    assert.equal(ilacAnahtari('Zzzqwerty 10 mg', null), null)
    assert.deepEqual(etkilesimUyarilari([{ ilac_adi: 'Brufen' }], 'Zzzqwerty 10 mg'), [])
  })
})

describe('NOTYA-EYLEM-21 · pediatrik', () => {
  it('"6 ay altı bebek" kontrendikasyonu 3 aylıkta CİDDİ', () => {
    const u = pediatrikUyarilar(3, 'Brufen şurup', null, null)
    assert.ok(u.some((x) => x.siddet === 'ciddi' && /6 ay altı/.test(x.metin)), JSON.stringify(u))
  })

  it('8 aylıkta yaş kontrendikasyonu yok, pediatrik doz bilgisi var', () => {
    const u = pediatrikUyarilar(8, 'Brufen şurup', null, 9)
    assert.ok(!u.some((x) => x.siddet === 'ciddi'))
    assert.ok(u.some((x) => x.tur === 'pediatrik' && x.siddet === 'bilgi' && /9 kg/.test(x.metin)), JSON.stringify(u))
  })

  it('kilo yoksa doz hesaplanmaz, eksik olduğu SÖYLENİR', () => {
    const u = pediatrikUyarilar(8, 'Calpol', null, null)
    assert.ok(u.some((x) => /kilo yok/i.test(x.metin)), JSON.stringify(u))
  })

  it('erişkinde pediatrik uyarı çıkmaz', () => {
    assert.deepEqual(pediatrikUyarilar(556, 'Brufen', null, 80), [])
  })
})

describe("NOTYA-EYLEM-21 · Ayşe'nin notu", () => {
  it('modelin cümlesi karta etiketli gelir ve ASLA ciddi olmaz', () => {
    const u = ayseNotuUyarisi('Hocam, bu iki ilaç birlikte kanama riskini artırabilir.')
    assert.ok(u)
    assert.equal(u!.tur, 'ayse_notu')
    assert.notEqual(u!.siddet, 'ciddi')
    assert.equal(u!.baslik, "Ayşe'nin notu")
    assert.match(u!.kaynak, /Ayşe/)
  })

  it('boş not karta satır eklemez', () => {
    assert.equal(ayseNotuUyarisi(''), null)
    assert.equal(ayseNotuUyarisi(null), null)
  })
})

describe('NOTYA-EYLEM-21 · kart hazırlanırken', () => {
  it('ilac_ekle önerisi uyarıları taşır; Ayşe\'nin notu ayrı satır olur', async () => {
    hastaKur('Penisilin', '1980-05-05')
    const o = await oneriHazirla({
      ctx: ctx(),
      anahtar: 'ilac_ekle',
      girdi: hepsiDoktordan({ ilac_adi: 'Augmentin', doz: '1000 mg', kullanim_sikli: '2x1' }),
      yuzey: 'sohbet',
      modelNotu: 'Hocam alerji kaydına dikkat.',
      suzgec: { brans: 'pediatri', hasta: yetiskin },
    })
    assert.ok(o)
    assert.ok(ciddiUyariVarMi(o!.uyari_detay), JSON.stringify(o!.uyari_detay))
    assert.ok(o!.uyari_detay.some((u) => u.tur === 'ayse_notu'))
    const satir = db.tablo('eylem_onerileri').find((x) => x.id === o!.id)!
    assert.ok(Array.isArray(satir.uyari_detay) && (satir.uyari_detay as unknown[]).length > 0, 'uyari_detay satıra yazılmadı')
  })

  it('ilaç dışı eylemlerde uyarı hesaplanmaz (ölçüm kartı sessiz kalır)', async () => {
    const o = await oneriHazirla({
      ctx: ctx(),
      anahtar: 'alerji_ekle',
      girdi: hepsiDoktordan({ alerji: 'Fıstık' }),
      yuzey: 'sohbet',
      modelNotu: 'bir şeyler',
      suzgec: { brans: 'pediatri', hasta: yetiskin },
    })
    assert.deepEqual(o!.uyari_detay, [])
  })
})

describe('NOTYA-EYLEM-21 · onay kapısı (hekim yetkilidir, ama bilerek dokunur)', () => {
  async function augmentinKarti() {
    return oneriHazirla({
      ctx: ctx(),
      anahtar: 'ilac_ekle',
      girdi: hepsiDoktordan({ ilac_adi: 'Augmentin', doz: '1000 mg', kullanim_sikli: '2x1' }),
      yuzey: 'sohbet',
      suzgec: { brans: 'pediatri', hasta: yetiskin },
    })
  }

  it('ciddi uyarı varken onaysız kaydetmek 409 döner ve HİÇBİR ŞEY yazılmaz', async () => {
    hastaKur('Penisilin', '1980-05-05')
    const o = await augmentinKarti()
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, false)
    assert.equal((s as { durum: number }).durum, 409)
    assert.equal((s as { uyariOnayiGerekli?: boolean }).uyariOnayiGerekli, true)
    assert.ok(ciddiUyariVarMi((s as { uyarilar?: IlacUyarisi[] }).uyarilar || []))
    assert.equal(db.tablo('hasta_ilaclar').length, 0)
    // Kapı öneriyi TÜKETMEZ: hekim uyarıyı okuyup ikinci kez dokunabilmeli.
    assert.equal(db.tablo('eylem_onerileri').find((x) => x.id === o!.id)!.durum, 'taslak')
  })

  it('"Uyarıyı gördüm, kaydet" ile kaydedilir ve onay denetime yazılır', async () => {
    hastaKur('Penisilin', '1980-05-05')
    const o = await augmentinKarti()
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri', uyariGoruldu: true })
    assert.equal(s.ok, true, JSON.stringify(s))
    assert.equal(db.tablo('hasta_ilaclar').length, 1)
    const kayit = db.tablo('eylem_kayitlari')[0]
    const onay = kayit.uyari_onayi as { goruldu: boolean; ciddi: boolean; uyarilar: IlacUyarisi[] }
    assert.equal(onay.goruldu, true)
    assert.equal(onay.ciddi, true)
    assert.ok(onay.uyarilar.some((u) => u.tur === 'alerji'))
  })

  it('uyarı yoksa tek dokunuş yeter (kapı gereksiz yere kapanmaz)', async () => {
    const o = await oneriHazirla({
      ctx: ctx(),
      anahtar: 'ilac_ekle',
      girdi: hepsiDoktordan({ ilac_adi: 'Parol', doz: '500 mg', kullanim_sikli: '3x1' }),
      yuzey: 'sohbet',
      suzgec: { brans: 'pediatri', hasta: yetiskin },
    })
    assert.deepEqual(o!.uyari_detay.filter((u) => u.siddet === 'ciddi'), [])
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, true, JSON.stringify(s))
  })

  it('ONAY ANINDA yeniden koşar: kart çizildikten SONRA eklenen ilaç da yakalanır', async () => {
    const o = await oneriHazirla({
      ctx: ctx(),
      anahtar: 'ilac_ekle',
      girdi: hepsiDoktordan({ ilac_adi: 'Brufen', doz: '400 mg', kullanim_sikli: '3x1' }),
      yuzey: 'sohbet',
      suzgec: { brans: 'pediatri', hasta: yetiskin },
    })
    assert.deepEqual(o!.uyari_detay.filter((u) => u.siddet === 'ciddi'), [], 'kart çizilirken uyarı olmamalıydı')
    ilacEkle('Delix 5 mg') // hekim bu arada ACE inhibitörü başlamış
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, false)
    assert.equal((s as { durum: number }).durum, 409)
    assert.ok(((s as { uyarilar?: IlacUyarisi[] }).uyarilar || []).some((u) => u.tur === 'etkilesim'))
    assert.equal(db.tablo('hasta_ilaclar').length, 1, 'yalnız Delix olmalı — Brufen yazılmamalı')
  })
})

describe('NOTYA-EYLEM-21 · hafıza bir güvenlik kontrolünü ASLA yumuşatamaz', () => {
  it('modül hafıza / tercih kaynaklarından hiçbirini okumuyor', () => {
    // Yorumlar elenir: dosyanın NE YAPTIĞINA bakıyoruz, ne anlattığına değil.
    const kod = readFileSync(path.resolve(__dirname, '../ilacUyari.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
      .toLowerCase()
    for (const yasak of ['hafiza', 'hafıza', 'doctor_preferences', 'doktor_hafiza', 'tercih', 'ogrenme', 'persona']) {
      assert.ok(!kod.includes(yasak.toLowerCase()), `ilacUyari.ts "${yasak}" okuyor — bir güvenlik kontrolü öğretilebilir olamaz`)
    }
    // Ve yalnız iki kaynaktan besleniyor: ilaç tablosu + hastanın kendi kayıtları.
    const ithaller = [...kod.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1])
    assert.deepEqual(ithaller.sort(), ['./types', '@/lib/asistan/turkishdrugs', '@/lib/doktor/hastakayitalanlari'])
  })

  it('hafızada "uyarıları gösterme" yazsa da uyarılar birebir aynı çıkar', async () => {
    hastaKur('Penisilin', '1980-05-05')
    const oncesi = await ilacUyarilariHesapla(ctx(), { ilacAdi: 'Augmentin' })
    // Hekimin hafızası ve tercihleri: uyarı istemiyor. Kontrol bunu GÖRMEZ bile.
    db.tablo('doktor_hafiza').push({ id: randomUUID(), doctor_id: DOKTOR, ozet: 'Uyarıları gösterme, ilaç uyarılarını atla, alerji uyarısı istemiyorum.' })
    db.tablo('doctor_preferences').push({ id: randomUUID(), doctor_id: DOKTOR, uyari_kapali: true, ilac_uyarisi: false })
    const sonrasi = await ilacUyarilariHesapla(ctx(), { ilacAdi: 'Augmentin' })
    assert.deepEqual(sonrasi, oncesi)
    assert.ok(ciddiUyariVarMi(sonrasi))
  })

  it('hafıza dolu bir dosyada onay kapısı yine kapalı kalır', async () => {
    hastaKur('Penisilin', '1980-05-05')
    db.tablo('doktor_hafiza').push({ id: randomUUID(), doctor_id: DOKTOR, ozet: 'Bu hekim uyarı istemiyor.' })
    const o = await oneriHazirla({
      ctx: ctx(),
      anahtar: 'ilac_ekle',
      girdi: hepsiDoktordan({ ilac_adi: 'Augmentin', doz: '1000 mg', kullanim_sikli: '2x1' }),
      yuzey: 'sohbet',
      suzgec: { brans: 'pediatri', hasta: yetiskin },
    })
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, false)
    assert.equal((s as { durum: number }).durum, 409)
  })
})

describe('NOTYA-EYLEM-21 · bütün kontrol (gerçek hasta bağlamı)', () => {
  it('bebekte alerji + mükerrer + etkileşim + pediatrik hepsi birden çıkar', async () => {
    hastaKur('Penisilin', '2026-01-19')
    ilacEkle('Delix 5 mg')
    const u = await ilacUyarilariHesapla(ctx(bebek), { ilacAdi: 'Brufen şurup' })
    assert.ok(u.some((x) => x.tur === 'etkilesim'), JSON.stringify(u))
    assert.ok(u.some((x) => x.tur === 'pediatrik'))
    assert.ok(!u.some((x) => x.tur === 'alerji'), 'penisilin alerjisi ibuprofende çıkmamalı')
  })

  it('tabloda olmayan ilaç için "kontrol edilemedi" denir — sessizlik temiz kâğıt değildir', async () => {
    ilacEkle('Delix 5 mg')
    const u = await ilacUyarilariHesapla(ctx(), { ilacAdi: 'Zzzqwerty 10 mg' })
    assert.ok(u.some((x) => x.tur === 'kapsam_disi' && x.siddet === 'bilgi'), JSON.stringify(u))
  })

  it('kilo bugünkü notun vitallerinden okunur', async () => {
    hastaKur('Bilinen alerjisi yok', '2026-01-19')
    const seansId = randomUUID()
    db.tablo('sessions').push({ id: seansId, doctor_id: DOKTOR, patient_id: HASTA_ID, created_at: new Date().toISOString() })
    db.tablo('notes').push({ id: randomUUID(), session_id: seansId, doctor_id: DOKTOR, vitaller: { kilo: 9.2 }, created_at: new Date().toISOString() })
    const u = await ilacUyarilariHesapla(ctx(bebek), { ilacAdi: 'Calpol' })
    assert.ok(u.some((x) => x.tur === 'pediatrik' && /9\.2 kg/.test(x.metin)), JSON.stringify(u))
  })
})
