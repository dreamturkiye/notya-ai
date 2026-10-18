import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'
import { ozelBransKilidi, ozelBransSlug, ozelPromptMetni } from '@/lib/klinik/ozelPrompt'
import { dermatolojiMi } from '@/specialties/dermatoloji/prompts'
import { dozKilitliBrans, soapSistemPromptu } from '@/lib/doktor/soapUret'

describe('Özel Branş prompt kilidi', () => {
  it('on dalın system.md dosyası doz ve tanı kilitlerini taşır', () => {
    for (const slug of KLINIK_YENI_SLUGS) {
      const m = ozelPromptMetni(slug)
      assert.match(m, /Doz yazılmaz/, slug)
      assert.match(m, /Tanı kilitlemez/, slug)
      assert.ok(m.length > 40 && m.length < 800, slug)
      const dosya = fs.readFileSync(path.join(process.cwd(), 'specialties', slug, 'prompts', 'system.md'), 'utf8')
      assert.equal(dosya.trim(), m, slug)
    }
  })

  it('çıplak dermatoloji TUS kalır; klinik dermatoloji kendi kilidini alır', () => {
    assert.equal(ozelBransSlug('dermatoloji'), null)
    assert.equal(ozelBransSlug('klinik-dermatoloji'), 'klinik-dermatoloji')
    assert.equal(dermatolojiMi('dermatoloji'), true)
    assert.equal(dermatolojiMi('klinik-dermatoloji'), false)
    const tus = soapSistemPromptu({ transcript: '', specialty: 'dermatoloji' })
    assert.match(tus, /DERMATOLOJİ SİSTEM KİLİDİ/)
    assert.match(tus, /Sen Ayşe Kaya/)
    assert.doesNotMatch(tus, /ÖZEL BRANŞ KİLİDİ/)
    assert.doesNotMatch(tus, /Klinik dermatoloji kilidi/)
    const klinik = soapSistemPromptu({ transcript: '', specialty: 'klinik-dermatoloji' })
    assert.match(klinik, /ÖZEL BRANŞ KİLİDİ/)
    assert.match(klinik, /Klinik dermatoloji kilidi/)
    assert.doesNotMatch(klinik, /DERMATOLOJİ SİSTEM KİLİDİ/)
    assert.doesNotMatch(klinik, /Bolognia/)
    assert.doesNotMatch(klinik, /Sen Ayşe Kaya/)
    assert.equal(dozKilitliBrans('klinik-dermatoloji'), true)
    assert.equal(dozKilitliBrans('sac-ekimi'), true)
    assert.equal(dozKilitliBrans('kardiyoloji'), false)
  })

  it('her dalın SOAP kilidi kendi metnidir; pediatri ve TUS sızmaz', () => {
    for (const slug of KLINIK_YENI_SLUGS) {
      const d = soapSistemPromptu({ transcript: '', specialty: slug })
      assert.match(d, /ÖZEL BRANŞ KİLİDİ/, slug)
      assert.match(d, /Doz yazılmaz/, slug)
      assert.doesNotMatch(d, /Baş çevresi/, slug)
      assert.doesNotMatch(d, /Neyzi standart/, slug)
      assert.doesNotMatch(d, /DERMATOLOJİ SİSTEM KİLİDİ/, slug)
      assert.doesNotMatch(d, /Bolognia Dermatology/, slug)
      assert.doesNotMatch(d, /Nelson Textbook/, slug)
      const yaban = soapSistemPromptu({ transcript: '', specialty: 'pediatri' })
      assert.doesNotMatch(yaban, new RegExp(ozelPromptMetni(slug).slice(0, 24)))
    }
    const ses = fs.readFileSync(path.join(process.cwd(), 'lib/asistan/klinikCevapla.ts'), 'utf8')
    assert.match(ses, /system\.md/)
    const hafiza = fs.readFileSync(path.join(process.cwd(), 'app/api/doktor/hafiza/route.ts'), 'utf8')
    assert.match(hafiza, /ozelBransKilidi/)
  })
})
