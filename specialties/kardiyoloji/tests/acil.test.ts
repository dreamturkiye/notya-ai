import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  acilTara, hekimOnayiGerekliMi, intakeAcilKodlari,
  ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, INTAKE_ACIL_SECENEKLERI,
} from '@/specialties/kardiyoloji/engines/acil'
import { ACIL_YONLENDIRME_METNI } from '@/specialties/kardiyoloji/engines/kardiyoloji'
import { hastaDiliTemizMi } from '@/specialties/kardiyoloji/engines/portal-kalbim'

const kok = path.join(import.meta.dirname, '../../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')

describe('KARDIO-EXCEPTIONAL-01 kırmızı bayrak kapısı', () => {
  it('catches every red flag from free-text complaints', () => {
    const ornekler: Array<[string, string]> = [
      ['Göğsümde baskı var, sol kola yayılan ağrı', 'gogus_agrisi'],
      ['Ani nefes darlığım başladı, istirahatte nefes alamıyorum', 'nefes_darligi_ani'],
      ['Bayıldım, bilinç kaybı oldu', 'bayilma'],
      ['Yüz kayması ve konuşma bozukluğu var', 'inme_bulgu'],
      ['Çarpıntı ile birlikte baygınlık hissediyorum', 'carpinti_bayginlik'],
      ['Ani bacak şişliği ve nefes darlığı', 'akut_odem'],
    ]
    for (const [metin, kod] of ornekler) {
      const b = acilTara([metin])
      assert.ok(b.some((x) => x.kod === kod), `"${metin}" → ${kod} bulunmadı`)
    }
  })

  it('Turkish uppercase İ / I does not slip past the scanner', () => {
    assert.ok(acilTara(['GÖĞÜS AĞRISI VE BASKI']).some((x) => x.kod === 'gogus_agrisi'))
    assert.ok(acilTara(['BAYILDIM']).some((x) => x.kod === 'bayilma'))
  })

  it('stays quiet on ordinary cardiology complaints (no false red flag)', () => {
    for (const m of [
      'İki haftadır hafif çarpıntım var, eforla artıyor',
      'Tansiyonum yüksek çıkıyor, ilaç kullanıyorum',
      'Kontrol randevusu için geldim',
      '',
    ]) assert.equal(acilTara([m]).length, 0, m)
  })

  it('every flag is "hemen" and forces physician sign-off', () => {
    for (const k of ACIL_KODLARI) {
      const b = acilTara([], [k.kod])
      assert.equal(b.length, 1, k.kod)
      assert.equal(b[0].oncelik, 'hemen', k.kod)
      assert.ok(hekimOnayiGerekliMi(b), k.kod)
    }
    assert.equal(hekimOnayiGerekliMi([]), false)
  })

  it('intake labels map 1:1 to codes and match lib/intake/bransSorulari.ts', () => {
    assert.equal(INTAKE_ACIL_SECENEKLERI.length, ACIL_KODLARI.length)
    const intake = oku('lib/intake/bransSorulari.ts')
    const blok = intake.slice(intake.indexOf('kardiyoloji:'), intake.indexOf('kardiyoloji:') + 3500)
    for (const s of INTAKE_ACIL_SECENEKLERI) assert.ok(blok.includes(s.etiket), `intake eksik: ${s.etiket}`)
    assert.match(blok, /acilBelirtilerKardio/)
    assert.match(blok, /112/)
  })

  it('intakeAcilKodlari reads checked labels', () => {
    assert.deepEqual(intakeAcilKodlari(['Göğüs ağrısı veya baskı']), ['gogus_agrisi'])
    assert.deepEqual(intakeAcilKodlari(['Yok']), [])
    assert.deepEqual(intakeAcilKodlari(null), [])
  })

  it('patient-facing emergency text sends to 112 and carries no diagnosis or dose', () => {
    assert.match(HASTA_ACIL_METNI, /112/)
    assert.ok(hastaDiliTemizMi(HASTA_ACIL_METNI))
    assert.doesNotMatch(HASTA_ACIL_METNI, /\bmg\b/)
    assert.match(ACIL_YONLENDIRME_METNI, /112/)
  })

  it('API refuses to store an open red flag without hekimOnay (409)', () => {
    const rota = oku('app/api/doktor/kardiyoloji/route.ts')
    assert.match(rota, /hekimOnayiGerekliMi\(bayraklar\) && b\.hekimOnay !== true/)
    assert.match(rota, /status: 409/)
    assert.match(rota, /hastaSahibiMi\(sb, user\.id, patientId\)/)
  })

  it('clinician checklist has no auto-close and no dose', () => {
    assert.ok(ACIL_KONTROL_LISTESI.length >= 6)
    for (const m of ACIL_KONTROL_LISTESI) assert.doesNotMatch(m, /\bmg\b|otomatik/i, m)
  })
})
