/**
 * Paediatrics asks a child's own long-term-conditions list, in every country; every other role keeps the core list;
 * the adult items never reach a child's form of paediatrics; Türkiye's list is byte-identical (this pack test also
 * pins the Turkish source text).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { formBolumleri, formSorulari, formIcerigiSorunlari } from './sorular'
import type { HastaFormuIcerigi, Soru } from './tipler'

const KOK = join(__dirname, '../../..')
const ic: HastaFormuIcerigi | null = AKTIF_KLINIK?.hastaFormu ?? null
const COCUK = ['paediatrics', 'paediatric-surgery', 'pediatri', 'cocuk-cerrahisi']
const metinler = (q: Soru): string[] => [...Object.values(q.metin), ...(q.tur === 'tek-secim' || q.tur === 'cok-secim' ? q.secenekler.flatMap((o) => Object.values(o.ad)) : [])]
const YETISKIN = /high blood pressure|hypertension|COPD|gipertoniya|Yuqori qon bosimi|Юқори қон босими|Повышенное давление|гипертония|obstructive/i

describe('paediatric long-term conditions', () => {
  it('Türkiye keeps its text: the core adult list stays, and the child form keeps its own free text', () => {
    const k = readFileSync(join(KOK, 'lib/intake/coreAlanlar.ts'), 'utf8')
    assert.ok(k.includes("secenekler: ['Diyabet', 'Hipertansiyon', 'Astım / KOAH', 'Kalp Hastalığı', 'Böbrek Hastalığı', 'Tiroid Hastalığı', 'Kanser', 'Yok'] }"))
  })
  it('each paediatric role of the active pack gets the child list on the guardian form, never the adult items', () => {
    if (!ic) return assert.ok(true)
    const roller = COCUK.filter((r) => Object.prototype.hasOwnProperty.call(ic.roller, r))
    assert.ok(roller.length >= 1, 'the pack has a paediatric role')
    for (const rol of roller) {
      const q: Soru[] = formSorulari(ic, { rol, veli: true, cinsiyet: '' }).filter((x) => x.tur === 'cok-secim' && x.secenekler.length >= 10 && x.zorunlu)
      assert.equal(q.length, 1, rol)
      assert.ok(q[0].tur === 'cok-secim' && q[0].secenekler.length >= 12, 'a child list')
      for (const t of metinler(q[0])) assert.ok(!YETISKIN.test(t), `${rol}: ${t}`)
      // an adult seen by a paediatrician keeps the core list
      const yetiskin = formSorulari(ic, { rol, veli: false, cinsiyet: '' }).find((x) => x.anahtar === q[0].anahtar)
      assert.ok(yetiskin && yetiskin.tur === 'cok-secim' && metinler(yetiskin).some((t) => YETISKIN.test(t)))
    }
  })
  it('no other role is changed (the leak rule)', () => {
    if (!ic) return assert.ok(true)
    const cekirdek = formSorulari({ ...ic, roller: {} }, { rol: null, veli: true, cinsiyet: '' })
    for (const rol of Object.keys(ic.roller).filter((r) => !COCUK.includes(r))) {
      assert.equal(ic.roller[rol].cekirdekDegisimi, undefined, rol)
      const a: Soru[] = formBolumleri(ic, { rol, veli: true, cinsiyet: '' }).flatMap((b) => [...b.sorular]).filter((q: Soru) => cekirdek.some((c) => c.anahtar === q.anahtar))
      assert.deepEqual(a.map((q) => JSON.stringify(q)), cekirdek.map((q) => JSON.stringify(q)), rol)
    }
  })
  it('the pack check accepts the content', () => {
    if (!ic) return assert.ok(true)
    const p = ulkePaketi()
    const sorun = formIcerigiSorunlari(ic, Object.keys(ic.roller), p.diller ?? [p.varsayilanDil])
    assert.deepEqual(sorun.filter((s) => /cekirdekDegisimi/.test(s.yer)), [])
  })
})
