/**
 * NOTYA-EYLEM — the guarantees that make "Ayşe writes to the dosya" safe, exercised on the real
 * registry, the real commit path and a fake database (lib/security/testing/sahteSupabase.ts).
 *
 * What each block is actually protecting:
 *   T3        — a capability that must never exist cannot be added by accident
 *   gating    — one branch's action never appears for another (BRANS-ALAN-SIZMASI)
 *   tahmin    — a guessed value never becomes a record ("tahminen Eylül 2026")
 *   idempotent— a double tap writes one row, not two
 *   makullük  — a date before birth / in the future is refused at COMMIT, not just at proposal
 *   geri al   — T1 reverses cleanly and is logged; T2 and stale records refuse
 *
 * Cross-doctor isolation for the route itself lives in lib/security/hasta-izolasyon.test.ts
 * (A↔B, both directions, real handler) — the standing convention for a new patient route.
 */
process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-eylem-anahtari'

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { encrypt } from '@/lib/security/encryption'
import { eylemler, eylemBul } from '@/core/eylemler/kayit'
import { T3_YASAKLI_ANAHTARLAR } from '@/core/eylemler/yasakli'
import { aracTanimlari, uygunEylemler, ARAC_TAVANI } from '@/core/eylemler/araclar'
import { oneriHazirla, tahminleriAyikla, kaynaklariCoz, kayitNiyetiMi } from '@/core/eylemler/oneri'
import { eylemOnayla, eylemVazgec, suresiDolduMu } from '@/core/eylemler/onayla'
import { eylemGeriAl } from '@/core/eylemler/geriAl'
import { bosluklariBul, boslukBlogu } from '@/core/eylemler/bosluk'
import { asiAdiNormalize } from '@/core/eylemler/temelEylemler'
import { bugunTRT, yasAyHesapla, type EylemBaglami, type HastaOzeti } from '@/core/eylemler/types'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import type { SupabaseClient } from '@supabase/supabase-js'

const DOKTOR = '11111111-1111-4111-8111-111111111111'
const HASTA_ID = '22222222-2222-4222-8222-222222222222'

let db: SahteVeritabani
let sb: SupabaseClient

const hasta: HastaOzeti = { id: HASTA_ID, ad: 'QA Hasta EYLEM', dogumTarihi: '2024-03-15', yasAy: 18, cinsiyet: 'male' }

function ctx(over: Partial<EylemBaglami> = {}): EylemBaglami {
  return { supabase: sb, doktorId: DOKTOR, hasta, brans: 'pediatri', oneriId: '', bugunTRT: bugunTRT(), ...over }
}

beforeEach(() => {
  db = new SahteVeritabani()
  sb = db.istemci() as unknown as SupabaseClient
  db.tablo('patients').push({
    id: HASTA_ID,
    doctor_id: DOKTOR,
    name_encrypted: encrypt(JSON.stringify({ ad: 'QA Hasta EYLEM' })),
    dob_encrypted: encrypt('2024-03-15'),
    gender_encrypted: encrypt('male'),
    notes_encrypted: encrypt(JSON.stringify({ alerjiler: 'Penisilin', kronikHastaliklar: ['Astım'] })),
  })
})

/** Put a taslak in the table the way a model turn would, and hand back its id. */
async function oneriAc(anahtar: string, girdi: Record<string, unknown>, brans: SpecialtyKey | null = 'pediatri') {
  const o = await oneriHazirla({
    ctx: ctx({ brans }),
    anahtar,
    girdi,
    yuzey: 'danis',
    suzgec: { brans, hasta },
  })
  return o
}

/** Every field marked as coming from the doctor — the common case in these tests. */
function hepsiDoktordan(v: Record<string, unknown>): Record<string, unknown> {
  return { ...v, alan_kaynaklari: Object.fromEntries(Object.keys(v).map((k) => [k, { kaynak: 'doktor_soyledi' }])) }
}

describe('T3 — yasaklı yetenek kayıt defterine giremez', () => {
  it('hiçbir T3 anahtarı kayıtlı değil', () => {
    const kayitli = new Set(eylemler().map((e) => e.anahtar))
    const sizanlar = T3_YASAKLI_ANAHTARLAR.filter((k) => kayitli.has(k))
    assert.deepEqual(sizanlar, [], `T3 eylemi kayıt defterinde: ${sizanlar.join(', ')} (docs/AYSE-EYLEM-MIMARISI.md §3)`)
  })

  it('reçete / silme / dışarı gönderme çağrıştıran hiçbir anahtar yok', () => {
    // Anahtarın adı değişse bile yakalar: yasaklı LİSTE'ye değil, yasaklı FİİL'e bakar.
    const tehlikeli = /recete|re[çc]ete|sil$|_sil|imzala|gonder|gönder|onam|kilitle|kesinlestir/i
    const bulunan = eylemler().map((e) => e.anahtar).filter((k) => tehlikeli.test(k))
    assert.deepEqual(bulunan, [], `T3 fiili taşıyan eylem anahtarı: ${bulunan.join(', ')}`)
  })

  it('her eylem T1 ya da T2', () => {
    for (const e of eylemler()) assert.ok(e.kademe === 'T1' || e.kademe === 'T2', `${e.anahtar}: geçersiz kademe`)
  })
})

describe('Kayıt defteri tutarlı', () => {
  it('anahtarlar tekil', () => {
    const a = eylemler().map((e) => e.anahtar)
    assert.equal(new Set(a).size, a.length)
  })

  it('her zorunlu alan, alan listesinde tanımlı', () => {
    for (const e of eylemler()) {
      const tanimli = new Set(e.alanlar.map((x) => x.anahtar))
      for (const z of e.zorunlu) assert.ok(tanimli.has(z), `${e.anahtar}: zorunlu "${z}" alan listesinde yok`)
    }
  })

  it('her secim alanının seçenekleri var', () => {
    for (const e of eylemler()) {
      for (const a of e.alanlar) {
        if (a.tip === 'secim') assert.ok((a.secenekler || []).length > 0, `${e.anahtar}.${a.anahtar}: seçenek yok`)
      }
    }
  })
})

describe('Araç süzgeci ve branş kapısı', () => {
  const TUM_BRANSLAR = Object.keys(BRANS_ETIKETLERI) as SpecialtyKey[]

  it('temel eylemler her branşta var', () => {
    for (const brans of TUM_BRANSLAR) {
      const anahtarlar = uygunEylemler({ brans, hasta }).map((e) => e.anahtar)
      for (const temel of ['asi_kaydi_ekle', 'ilac_ekle', 'alerji_ekle', 'olcum_ekle', 'kontrol_randevusu_olustur']) {
        assert.ok(anahtarlar.includes(temel), `${brans}: temel eylem "${temel}" sunulmuyor (cross-specialty-parity)`)
      }
    }
  })

  it('branşa özel eylem BAŞKA branşa sızmıyor', () => {
    const sahip: Record<string, SpecialtyKey> = {
      jine_gorevi_ekle: 'kadin-hastaliklari-dogum',
      derm_gorevi_ekle: 'dermatoloji',
      dahiliye_gorevi_ekle: 'dahiliye',
    }
    for (const brans of TUM_BRANSLAR) {
      const anahtarlar = new Set(uygunEylemler({ brans, hasta }).map((e) => e.anahtar))
      for (const [anahtar, sahibi] of Object.entries(sahip)) {
        if (brans === sahibi) assert.ok(anahtarlar.has(anahtar), `${sahibi}: kendi eylemi "${anahtar}" yok`)
        else assert.ok(!anahtarlar.has(anahtar), `BRANŞ SIZMASI: "${anahtar}" ${brans} hekimine sunuldu`)
      }
    }
  })

  it('baş çevresi yalnız pediatrik ölçüm kapsamı olan branşta', () => {
    const pediatri = uygunEylemler({ brans: 'pediatri', hasta }).map((e) => e.anahtar)
    const kardiyoloji = uygunEylemler({ brans: 'kardiyoloji', hasta }).map((e) => e.anahtar)
    assert.ok(pediatri.includes('bas_cevresi_ekle'))
    assert.ok(!kardiyoloji.includes('bas_cevresi_ekle'), 'BRANŞ SIZMASI: baş çevresi kardiyoloji hekimine sunuldu')
  })

  it('branşsız hekim yalnız temel eylemleri görür', () => {
    const a = uygunEylemler({ brans: null, hasta }).map((e) => e.anahtar)
    assert.ok(a.includes('ilac_ekle'))
    assert.ok(!a.includes('derm_gorevi_ekle'))
  })

  it('hasta bağlamı yoksa araç sunulmaz', () => {
    assert.deepEqual(aracTanimlari({ brans: 'pediatri', hasta: null }), [])
  })

  it('araç sayısı tavanı aşmıyor ve tanımlar Anthropic biçiminde', () => {
    for (const brans of TUM_BRANSLAR) {
      const t = aracTanimlari({ brans, hasta })
      assert.ok(t.length <= ARAC_TAVANI, `${brans}: ${t.length} araç (tavan ${ARAC_TAVANI})`)
      for (const x of t) {
        assert.equal(typeof x.name, 'string')
        assert.equal((x.input_schema as { type: string }).type, 'object')
        assert.ok('alan_kaynaklari' in (x.input_schema as { properties: Record<string, unknown> }).properties, `${x.name}: kaynak alanı yok`)
        assert.match(x.description, /KAYIT YAPMAZ/)
      }
    }
  })

  it('kill switch (AYSE_EYLEM_KAPALI=1) araçları kapatır', () => {
    process.env.AYSE_EYLEM_KAPALI = '1'
    try {
      assert.deepEqual(aracTanimlari({ brans: 'pediatri', hasta }), [])
    } finally {
      delete process.env.AYSE_EYLEM_KAPALI
    }
  })
})

describe('Tahmin asla değer olarak yazılmaz', () => {
  it('tahmin işaretli alan düşer; kaynaksız alan KALIR (belirsiz)', () => {
    const kaynaklar = kaynaklariCoz({ asi_adi: { kaynak: 'dosyadan', alinti: 'Hep B 1. doz yapıldı' }, uygulama_tarihi: { kaynak: 'tahmin' } })
    const { veri, dusen, belirsiz } = tahminleriAyikla(
      { asi_adi: 'Hepatit B', uygulama_tarihi: '2026-09-01', doz_no: 2 },
      kaynaklar
    )
    assert.deepEqual(veri, { asi_adi: 'Hepatit B', doz_no: 2 })
    assert.deepEqual(dusen, ['uygulama_tarihi'])
    assert.deepEqual(belirsiz, ['doz_no'])
    assert.equal(kaynaklar.doz_no?.kaynak, 'belirsiz')
  })

  it('öneride tahmin edilen zorunlu alan boş kalır ve eksik listesine düşer', async () => {
    const o = await oneriAc('asi_kaydi_ekle', {
      asi_adi: 'Hepatit B',
      uygulama_tarihi: '2026-09-01',
      alan_kaynaklari: { asi_adi: { kaynak: 'dosyadan', alinti: 'doğum epikrizi' }, uygulama_tarihi: { kaynak: 'tahmin' } },
    })
    assert.ok(o)
    assert.equal(o!.veri.asi_adi, 'Hepatit B')
    assert.equal(o!.veri.uygulama_tarihi, undefined, 'tahmin edilen tarih değer olarak yazıldı')
    assert.ok(o!.eksik_alanlar.includes('uygulama_tarihi'))
    assert.equal(o!.alan_kaynaklari.asi_adi.alinti, 'doğum epikrizi')
  })

  it('kaynaksız zorunlu alan KALIR ve belirsiz uyarısı çıkar (kart boşalmaz)', async () => {
    const o = await oneriAc('asi_kaydi_ekle', {
      asi_adi: 'Hep B',
      uygulama_tarihi: '2025-01-10',
      // alan_kaynaklari bilerek yok — model unuttu
    })
    assert.ok(o)
    assert.equal(o!.veri.asi_adi, 'Hep B')
    assert.equal(o!.veri.uygulama_tarihi, '2025-01-10')
    assert.equal(o!.alan_kaynaklari.asi_adi?.kaynak, 'belirsiz')
    assert.ok(o!.uyarilar.some((u) => /kaynak belirtilmedi/i.test(u)))
  })

  it('eksik zorunlu alanla onay REDDEDİLİR', async () => {
    const o = await oneriAc('asi_kaydi_ekle', {
      asi_adi: 'Hepatit B',
      uygulama_tarihi: '2026-09-01',
      alan_kaynaklari: { asi_adi: { kaynak: 'doktor_soyledi' }, uygulama_tarihi: { kaynak: 'tahmin' } },
    })
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, false)
    assert.equal((s as { durum: number }).durum, 400)
    assert.match((s as { hata: string }).hata, /Uygulama tarihi/)
    assert.equal(db.tablo('asilar').length, 0, 'eksik alanlı öneri kayıt yazdı')
  })

  it('bilinmeyen / gizli araç adı sessizce düşer', async () => {
    assert.equal(await oneriAc('recete_gonder', hepsiDoktordan({ x: 1 })), null)
    assert.equal(await oneriAc('derm_gorevi_ekle', hepsiDoktordan({ ad: 'lezyon kontrolü' }), 'pediatri'), null)
  })
})

describe('Onay: doğrulama, makullük, mükerrer, idempotans', () => {
  it('hekimin düzeltmesi kaydedilir ve satır yazılır', async () => {
    const o = await oneriAc('asi_kaydi_ekle', hepsiDoktordan({ asi_adi: 'Hepatit B', uygulama_tarihi: '2025-01-10' }))
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri', duzeltmeler: { doz_no: '2', kaynak: 'beyan' } })
    assert.equal(s.ok, true)
    const satir = db.tablo('asilar')[0]
    assert.equal(satir.asi_adi, 'Hepatit B')
    assert.equal(satir.doz_no, 2)
    assert.equal(satir.kaynak, 'beyan')
    assert.ok(satir.hekim_onay_at, 'hekim_onay_at yok — karne rozeti çıkmaz')
    assert.equal(satir.doktor_id, DOKTOR)
    assert.equal(satir.patient_id, HASTA_ID)
    const kayit = db.tablo('eylem_kayitlari')[0]
    assert.equal(kayit.hedef_tablo, 'asilar')
    assert.equal(kayit.kaynak, 'ayse_oneri', 'denetim satırı hazırlayanı yazmıyor')
    assert.equal(kayit.doctor_id, DOKTOR, 'denetim satırı onaylayanı yazmıyor')
  })

  it('Hep B → Hepatit B normalize; belge_id kaynaklardan taşınır', async () => {
    assert.equal(asiAdiNormalize('Hep B'), 'Hepatit B')
    assert.equal(asiAdiNormalize('Hepatit B aşısı'), 'Hepatit B')
    const o = await oneriAc('asi_kaydi_ekle', {
      asi_adi: 'Hep B',
      uygulama_tarihi: '2024-03-15',
      alan_kaynaklari: {
        asi_adi: { kaynak: 'dosyadan', alinti: 'doğumda Hep B yapıldı', belgeId: 'belge-epikriz-1' },
        uygulama_tarihi: { kaynak: 'dosyadan', alinti: 'doğumda', belgeId: 'belge-epikriz-1' },
      },
    })
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, true)
    const satir = db.tablo('asilar')[0]
    assert.equal(satir.asi_adi, 'Hepatit B')
    assert.equal(satir.belge_id, 'belge-epikriz-1')
    assert.ok(satir.hekim_onay_at)
  })

  it('geçmişteki sonraki_doz uyarıdır, commit 400 değildir', async () => {
    const o = await oneriAc(
      'asi_kaydi_ekle',
      hepsiDoktordan({ asi_adi: 'Hepatit B', uygulama_tarihi: '2024-03-15', sonraki_doz_tarihi: '2024-04-15' })
    )
    assert.ok(o!.uyarilar.some((u) => /Sonraki doz tarihi.*geçmişte/i.test(u)), `uyarı yok: ${JSON.stringify(o!.uyarilar)}`)
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, true, 'geçmiş sonraki_doz commit reddetti')
    assert.equal(db.tablo('asilar').length, 1)
  })

  it('mükerrer: Hep B mevcut Hepatit B ile seri eşleşir', async () => {
    db.tablo('asilar').push({ id: randomUUID(), doktor_id: DOKTOR, patient_id: HASTA_ID, asi_adi: 'Hepatit B', uygulama_tarihi: '2025-01-10' })
    const o = await oneriAc('asi_kaydi_ekle', hepsiDoktordan({ asi_adi: 'Hep B', uygulama_tarihi: '2025-01-10' }))
    assert.ok(o!.uyarilar.some((u) => /mükerrer/i.test(u)), `uyarı yok: ${JSON.stringify(o!.uyarilar)}`)
  })

  it('kayitNiyetiMi: yazıver / kaydet / dosyaya gir', () => {
    assert.equal(kayitNiyetiMi('sen yazıver'), true)
    assert.equal(kayitNiyetiMi('bunu kaydet'), true)
    assert.equal(kayitNiyetiMi('dosyaya gir'), true)
    assert.equal(kayitNiyetiMi('özetle'), false)
  })

  it('geçersiz tarih düzeltmesi 400 döner, kayıt yazılmaz', async () => {
    const o = await oneriAc('asi_kaydi_ekle', hepsiDoktordan({ asi_adi: 'KKK', uygulama_tarihi: '2025-01-10' }))
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri', duzeltmeler: { uygulama_tarihi: '2025-02-30' } })
    assert.equal(s.ok, false)
    assert.equal(db.tablo('asilar').length, 0)
  })

  it('makullük: doğum tarihinden önceki uygulama reddedilir', async () => {
    const o = await oneriAc('asi_kaydi_ekle', hepsiDoktordan({ asi_adi: 'BCG', uygulama_tarihi: '2020-01-01' }))
    assert.ok(o!.uyarilar.some((u) => /doğum tarihinden/.test(u)), 'kartta uyarı yok')
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, false, 'doğum öncesi tarih onaylandı')
    assert.equal(db.tablo('asilar').length, 0)
  })

  it('makullük: gelecekteki uygulama tarihi reddedilir', async () => {
    const yarin = new Date(Date.now() + 36 * 3600e3).toISOString().slice(0, 10)
    const o = await oneriAc('asi_kaydi_ekle', hepsiDoktordan({ asi_adi: 'KKK', uygulama_tarihi: yarin }))
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, false)
  })

  it('mükerrer: aynı gün aynı aşı uyarı olarak karta yazılır', async () => {
    db.tablo('asilar').push({ id: randomUUID(), doktor_id: DOKTOR, patient_id: HASTA_ID, asi_adi: 'Hepatit B', uygulama_tarihi: '2025-01-10' })
    const o = await oneriAc('asi_kaydi_ekle', hepsiDoktordan({ asi_adi: 'Hepatit B', uygulama_tarihi: '2025-01-10' }))
    assert.ok(o!.uyarilar.some((u) => /mükerrer/i.test(u)), `uyarı yok: ${JSON.stringify(o!.uyarilar)}`)
  })

  it('idempotans: iki kez onaylanınca tek satır yazılır', async () => {
    // QA hastasının dosyasında "Penisilin" alerjisi var ve Augmentin penisilin grubudur: NOTYA-EYLEM-21
    // ciddi uyarısı burada bilerek onaylanıyor (hekim yetkilidir) — kapının kendisi ayrıca sınanıyor.
    const o = await oneriAc('ilac_ekle', hepsiDoktordan({ ilac_adi: 'Augmentin', doz: '400 mg', kullanim_sikli: '2x1' }))
    const bir = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri', uyariGoruldu: true })
    const iki = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri', uyariGoruldu: true })
    assert.equal(bir.ok, true)
    assert.equal(iki.ok, false)
    assert.equal((iki as { durum: number }).durum, 409)
    assert.equal(db.tablo('hasta_ilaclar').length, 1, 'çift dokunuş iki satır yazdı')
  })

  it('vazgeçilen öneri onaylanamaz', async () => {
    const o = await oneriAc('ilac_ekle', hepsiDoktordan({ ilac_adi: 'Parol', doz: '250 mg', kullanim_sikli: '3x1' }))
    assert.equal(await eylemVazgec(sb, DOKTOR, o!.id), true)
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, false)
    assert.equal(db.tablo('hasta_ilaclar').length, 0)
  })

  it('24 saati geçmiş öneri düşer (suresi_doldu)', async () => {
    const o = await oneriAc('ilac_ekle', hepsiDoktordan({ ilac_adi: 'Parol', doz: '250 mg', kullanim_sikli: '3x1' }))
    const satir = db.tablo('eylem_onerileri').find((x) => x.id === o!.id)!
    satir.created_at = new Date(Date.now() - 25 * 3600e3).toISOString()
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, false)
    assert.equal((s as { durum: number }).durum, 410)
    assert.equal(db.tablo('eylem_onerileri').find((x) => x.id === o!.id)!.durum, 'suresi_doldu')
    assert.ok(suresiDolduMu({ created_at: satir.created_at as string }))
  })

  it('ilaç kaydı onaylı + aktif yazılır (Sağlığım portalı kuralı)', async () => {
    const o = await oneriAc('ilac_ekle', hepsiDoktordan({ ilac_adi: 'Ventolin', doz: '100 mcg', kullanim_sikli: 'gerektikçe' }))
    assert.equal(o!.portalaYansir, true, 'kart hastaya görüneceğini söylemiyor')
    await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    const satir = db.tablo('hasta_ilaclar')[0]
    assert.equal(satir.aktif, true)
    assert.equal(satir.onay_durumu, undefined, 'onay_durumu kolonu varsayılanına bırakılmalı (UI rotasıyla aynı)')
  })

  it('alerji dosyadaki listeye eklenir, mükerrer olan uyarır', async () => {
    const o = await oneriAc('alerji_ekle', hepsiDoktordan({ alerji: 'Amoksisilin' }))
    await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    const kayit = db.tablo('eylem_kayitlari')[0]
    assert.match(String((kayit.sonra as { alerjiler: string }).alerjiler), /Penisilin, Amoksisilin/)

    const tekrar = await oneriAc('alerji_ekle', hepsiDoktordan({ alerji: 'penisilin' }))
    assert.ok(tekrar!.uyarilar.some((u) => /zaten kayıtlı/.test(u)), 'büyük/küçük harf farkıyla mükerrer kaçtı')
  })
})

describe('Geri al', () => {
  it('T1 geri alınır, satır silinir, iz kalır', async () => {
    const o = await oneriAc('asi_kaydi_ekle', hepsiDoktordan({ asi_adi: 'KKK', uygulama_tarihi: '2025-06-01' }))
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, true)
    assert.equal(db.tablo('asilar').length, 1)
    const g = await eylemGeriAl(sb, DOKTOR, (s as { kayitId: string }).kayitId, 'pediatri')
    assert.equal(g.ok, true)
    assert.equal(db.tablo('asilar').length, 0)
    assert.ok(db.tablo('eylem_kayitlari')[0].geri_alindi_at, 'geri alma loglanmadı')
  })

  it('iki kez geri alınamaz', async () => {
    const o = await oneriAc('asi_kaydi_ekle', hepsiDoktordan({ asi_adi: 'KKK', uygulama_tarihi: '2025-06-01' }))
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    const id = (s as { kayitId: string }).kayitId
    await eylemGeriAl(sb, DOKTOR, id, 'pediatri')
    const iki = await eylemGeriAl(sb, DOKTOR, id, 'pediatri')
    assert.equal(iki.ok, false)
    assert.equal((iki as { durum: number }).durum, 409)
  })

  it('T2 geri alınamaz — hekim ilgili ekrandan düzeltir', async () => {
    db.tablo('hasta_ilaclar').push({ id: randomUUID(), doctor_id: DOKTOR, patient_id: HASTA_ID, ilac_adi: 'Euthyrox', doz: '50 mcg', kullanim_sikli: '1x1', aktif: true })
    const o = await oneriAc('ilac_doz_degistir', hepsiDoktordan({ ilac_adi: 'Euthyrox', yeni_doz: '75 mcg' }))
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    assert.equal(s.ok, true)
    assert.equal(db.tablo('hasta_ilaclar')[0].doz, '75 mcg')
    const kayit = db.tablo('eylem_kayitlari')[0]
    assert.equal((kayit.once as { doz: string }).doz, '50 mcg', 'T2 kaydı önceki değeri saklamıyor (diff izi)')
    const g = await eylemGeriAl(sb, DOKTOR, (s as { kayitId: string }).kayitId, 'pediatri')
    assert.equal(g.ok, false)
  })

  it('24 saati geçmiş kayıt geri alınamaz', async () => {
    const o = await oneriAc('asi_kaydi_ekle', hepsiDoktordan({ asi_adi: 'KKK', uygulama_tarihi: '2025-06-01' }))
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'pediatri' })
    const kayit = db.tablo('eylem_kayitlari')[0]
    kayit.created_at = new Date(Date.now() - 25 * 3600e3).toISOString()
    const g = await eylemGeriAl(sb, DOKTOR, (s as { kayitId: string }).kayitId, 'pediatri')
    assert.equal(g.ok, false)
    assert.equal((g as { durum: number }).durum, 410)
    assert.equal(db.tablo('asilar').length, 1, 'süresi geçmiş kayıt yine de silindi')
  })
})

describe('Branş görevi (P3)', () => {
  it('dermatoloji hekimi derm görevi açabilir, kayıt derm tablosuna düşer', async () => {
    const o = await oneriAc('derm_gorevi_ekle', hepsiDoktordan({ ad: 'Nevüs kontrolü' }), 'dermatoloji')
    assert.ok(o)
    const s = await eylemOnayla({ supabase: sb, doktorId: DOKTOR, oneriId: o!.id, brans: 'dermatoloji' })
    assert.equal(s.ok, true)
    const satir = db.tablo('derm_gorevleri')[0]
    assert.equal(satir.ad, 'Nevüs kontrolü')
    assert.equal(satir.durum, 'acik')
    assert.equal(satir.kod, 'ayse_eylem')
    assert.equal(db.tablo('jine_gorevleri').length, 0)
  })
})

describe('Proaktif boşluk teklifi (P2)', () => {
  const bos = { asi: 0, ilac: 0, alerjiVar: false, olcumVar: false }

  it('belgede geçen ama yapılandırılmış kayıtta olmayan kategoriler bulunur', () => {
    assert.deepEqual(bosluklariBul('Doğum epikrizi: Hepatit B 1. doz yapıldı. Boy 50 cm.', bos).sort(), ['asi', 'olcum'])
  })

  it('kayıt zaten varsa boşluk yok', () => {
    assert.deepEqual(bosluklariBul('Hepatit B 1. doz yapıldı', { ...bos, asi: 3 }), [])
  })

  it('yalnız ilk doktor turunda söyler — dırdır etmez', () => {
    assert.match(boslukBlogu(['asi'], 1), /BİR KEZ SÖYLE/)
    assert.equal(boslukBlogu(['asi'], 2), '')
    assert.equal(boslukBlogu([], 1), '')
  })
})

describe('Yardımcılar', () => {
  it('yaş ay hesabı doğum günü geçmemişken bir ay eksik sayar', () => {
    assert.equal(yasAyHesapla('2024-03-15', '2025-03-14'), 11)
    assert.equal(yasAyHesapla('2024-03-15', '2025-03-15'), 12)
    assert.equal(yasAyHesapla(null, '2025-03-15'), null)
  })

  it('eylemBul bilinmeyen anahtarda null döner', () => {
    assert.equal(eylemBul('olmayan_eylem'), null)
    assert.ok(eylemBul('ilac_ekle'))
  })
})
