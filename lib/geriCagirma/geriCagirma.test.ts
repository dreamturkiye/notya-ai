/**
 * GERI-CAGIRMA-01 — pure rules of the Türkiye build: the reason registry and its branş gate, the generic message and
 * the counter's wording. The attribution rule and the monthly counters are in ./atif.test.ts (the same file in every build).
 * Synthetic data only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sayacCumlesi, SAYIM_KURALI, paraYaz } from './metin'
import { KOHORT_KAYNAKLARI, kohortKaynagi, nedenAnahtari, nedeninBransi, OZEL_BRANS_KAYNAGI, rotaninKaynagi } from './nedenler'
import { mesajKur, SABLON_ANAHTARLARI, TR_SABLON_METINLERI } from './sablonlar'
import { ATIF_PENCERESI_GUN, bosSayac } from './tipler'

const KOK = join(__dirname, '../..')

/** The engine's own flag list, read from its source (no engine code is executed here). */
function motorBayraklari(yol: string): string[] {
  const kaynak = readFileSync(join(KOK, yol), 'utf8')
  const m = kaynak.match(/BAYRAK_AD[^=]*=\s*\{([\s\S]*?)\n?\}/)
  assert.ok(m, `${yol}: BAYRAK_AD bulunamadı`)
  return [...m![1].matchAll(/([a-z0-9_]+)\s*:/g)].map((x) => x[1])
}
const MOTOR_YOLU: Record<string, string> = {
  'kadin-hastaliklari-dogum': 'specialties/kadin-dogum/engines/kd-kohort.ts',
}
const motorYolu = (brans: string) => MOTOR_YOLU[brans] || `specialties/${brans}/engines/kohort.ts`

describe('GERI-CAGIRMA-01 · reason registry', () => {
  it('covers the 30 medical branches, one source each, unique keys and routes', () => {
    assert.equal(KOHORT_KAYNAKLARI.length, 30)
    assert.equal(new Set(KOHORT_KAYNAKLARI.map((k) => k.brans)).size, 30)
    assert.equal(new Set(KOHORT_KAYNAKLARI.map((k) => k.kaynak)).size, 30)
    assert.equal(new Set(KOHORT_KAYNAKLARI.map((k) => k.rota)).size, 30)
  })

  it('every recall reason is a flag the branş engine itself raises — nothing is invented here', () => {
    for (const k of KOHORT_KAYNAKLARI) {
      const bayraklar = motorBayraklari(motorYolu(k.brans))
      assert.ok(k.nedenler.length > 0, k.brans)
      for (const n of k.nedenler) assert.ok(bayraklar.includes(n), `${k.brans}: '${n}' motorda yok (${bayraklar.join(', ')})`)
    }
  })

  it('clinical-state and safety flags are never one-tap recall reasons', () => {
    const yasak = /risk_acik|hba1c|egfr_45|kb_hedef|ldl_hedef|phq|esi_|kritik|skor_yuksek|vas_yuksek|olcek_yuksek|migren|ipss|kdigo|kur_gecikmis|toksisite|persentil|sakatlik|yuklenme|osas|onam_eksik|sut_eksik|asa_eksik|hava_yolu|alerji/
    for (const k of KOHORT_KAYNAKLARI) for (const n of k.nedenler) assert.ok(!yasak.test(n), `${k.brans}:${n}`)
  })

  it('reason keys carry their branş; a branş only ever resolves to its own source (leak test, both ways)', () => {
    const uro = kohortKaynagi('uroloji')!
    const kardio = kohortKaynagi('kardiyoloji')!
    assert.ok(uro.nedenler.includes('psa_gecikmis'))
    assert.ok(!kardio.nedenler.includes('psa_gecikmis'))
    assert.ok(kardio.nedenler.includes('lab_ekg_gecikmis'))
    assert.ok(!uro.nedenler.includes('lab_ekg_gecikmis'))
    assert.equal(nedeninBransi(nedenAnahtari('uroloji', 'psa_gecikmis')), 'uroloji')
    assert.equal(nedeninBransi('kontrol'), null)
    // Smear / HPV is KD's, the vaccine reason is pediatri's (and aile hekimliği's own combined flag) — nobody else's.
    for (const k of KOHORT_KAYNAKLARI) {
      if (k.brans !== 'kadin-hastaliklari-dogum') assert.ok(!k.nedenler.includes('serviks_tarama'), k.brans)
      if (k.brans !== 'pediatri') assert.ok(!k.nedenler.includes('asi_gecikti'), k.brans)
      if (k.brans !== 'uroloji') assert.ok(!k.nedenler.includes('psa_gecikmis'), k.brans)
    }
    assert.equal(kohortKaynagi('bilinmeyen-brans'), null)
    assert.equal(kohortKaynagi(null), null)
  })

  it('kohort routes map to their own source; other routes map to nothing', () => {
    assert.equal(rotaninKaynagi('/doktor-tools/uro-kohort'), 'uro-kohort')
    assert.equal(rotaninKaynagi('/doktor-tools/kd-kohort/'), 'kd-kohort')
    assert.equal(rotaninKaynagi('/ozel-branslar/sac-kohort'), OZEL_BRANS_KAYNAGI)
    assert.equal(rotaninKaynagi('/doktor-tools/epikriz'), null)
    assert.equal(rotaninKaynagi('/doktor-tools/geri-cagirma'), null)
    assert.equal(rotaninKaynagi('/ozel-branslar/sac-greft'), null)
  })
})

describe('GERI-CAGIRMA-01 · the message is generic', () => {
  it('names the doctor, carries the personal link, and has no clinical reason — for every template and every branş label', () => {
    const etiketler: string[] = []
    for (const k of KOHORT_KAYNAKLARI) {
      const kaynak = readFileSync(join(KOK, motorYolu(k.brans)), 'utf8')
      const m = kaynak.match(/BAYRAK_AD[^=]*=\s*\{([\s\S]*?)\n?\}/)![1]
      for (const x of m.matchAll(/:\s*'([^']+)'/g)) etiketler.push(x[1])
    }
    assert.ok(etiketler.length > 100)
    const klinik = /psa|hba1c|smear|hpv|aşı|asi\b|tarama|tetkik|tahlil|lab|dxa|ekg|spirometri|odyo|gebelik|lohusa|ogtt|anti-d|gbs|lityum|ilaç|ilac|tanı|sonuç|biyolojik|fototerapi|endoskopi|hepatit|diyaliz|alçı|yara|indirim|kampanya|fırsat|ücretsiz|%/i
    for (const anahtar of SABLON_ANAHTARLARI) {
      for (const veliDili of [false, true]) {
        for (const link of ['https://www.notya.io/portal/hasta/tok/randevu?gc=1', null]) {
          const m = mesajKur(anahtar, { hastaAdi: 'QA Hasta', veliDili, doktorAdi: 'Dr. QA Hekim', link })
          assert.ok(m.metin.includes('Dr. QA Hekim'))
          assert.ok(m.konu.includes('Dr. QA Hekim'))
          if (link) assert.ok(m.metin.includes(link)); else assert.ok(/arayabilirsiniz/.test(m.metin))
          assert.ok(!klinik.test(m.metin.replace(link || '', '')), `${anahtar}: ${m.metin}`)
          for (const e of etiketler) assert.ok(!m.metin.includes(e), `${anahtar}: '${e}' mesajda`)
        }
      }
    }
  })

  it('default template says "kontrol zamanınız geldi"; a minor is addressed through the guardian, an adult never is', () => {
    const y = mesajKur('kontrol', { hastaAdi: 'Ayşe', doktorAdi: 'Dr. X', link: null })
    assert.match(y.metin, /^Merhaba Ayşe, kontrol zamanınız geldi\./)
    const v = mesajKur('kontrol', { hastaAdi: 'Ali', veliDili: true, doktorAdi: 'Dr. X', link: null })
    assert.match(v.metin, /^Merhaba, Ali için kontrol zamanı geldi\./)
    assert.ok(!/için/.test(y.metin.split('\n')[0].replace('Randevu için', '')))
    assert.deepEqual(Object.keys(TR_SABLON_METINLERI.etiket).sort(), [...SABLON_ANAHTARLARI].sort())
  })
})

describe('GERI-CAGIRMA-01 · wording and visibility', () => {
  it('the sentence says what is measured — and nothing more', () => {
    assert.equal(sayacCumlesi({ ay: '2026-11', gonderilen: 20, randevuAlan: 14, gelen: 9, tahsilatKurus: 1_240_000 }, 'TRY'), `Bu ay geri çağırma sonrası 14 hasta randevu aldı · bunlardan 9 hasta muayeneye geldi · kaydedilen tahsilat ${paraYaz(1_240_000, 'TRY')}`)
    assert.equal(sayacCumlesi({ ay: '2026-11', gonderilen: 20, randevuAlan: 14, gelen: 9, tahsilatKurus: 0 }, 'TRY'), 'Bu ay geri çağırma sonrası 14 hasta randevu aldı · bunlardan 9 hasta muayeneye geldi')
    assert.equal(sayacCumlesi({ ay: '2026-11', gonderilen: 20, randevuAlan: 3, gelen: 0, tahsilatKurus: 0 }, 'TRY'), 'Bu ay geri çağırma sonrası 3 hasta randevu aldı')
    assert.equal(sayacCumlesi({ ay: '2026-11', gonderilen: 5, randevuAlan: 0, gelen: 0, tahsilatKurus: 0 }, 'TRY'), 'Bu ay 5 hasta geri çağrıldı · henüz randevu alan yok')
    assert.equal(sayacCumlesi(bosSayac('2026-11'), 'TRY'), 'Bu ay henüz geri çağırma yapılmadı')
  })

  it('no overclaim anywhere in the copy', () => {
    const metinler = [SAYIM_KURALI, sayacCumlesi({ ay: '2026-11', gonderilen: 20, randevuAlan: 14, gelen: 9, tahsilatKurus: 1 }, 'TRY')].join(' ')
    assert.ok(!/kazandırdı|kazandınız|kazanç|gelir artışı|garanti|sayesinde 1|tahmini/i.test(metinler.replace('tahmin içermez', '')))
    // The tooltip states the rule with the same number the code uses.
    assert.ok(SAYIM_KURALI.includes(`${ATIF_PENCERESI_GUN} gün`))
    assert.ok(/kanıtlamaz/.test(SAYIM_KURALI))
    assert.ok(/kaydedilmiş tahsilat/.test(SAYIM_KURALI))
  })
})
