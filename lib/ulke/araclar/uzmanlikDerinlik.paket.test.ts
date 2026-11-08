/**
 * ULKE-BRANS-DERINLIK-09 — against THE ACTIVE PACK (run once per country): the specialty tab of the patient's file, the
 * specialty dose engine and order presets, and the portal demo fixture are gated to their own role, both ways.
 * Nothing here names a country: a pack that brings none of these passes by having none.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AKTIF_ARAYUZ } from '@/countries/active/arayuz'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { hesabinAraclari } from './paket'
import { uzmanlikAraclari, uzmanlikBolumleri } from './uzmanlikSekmesi'
import { portalDemoIcerigi } from '../portal/demo'
import type { AracKaydi } from './kayitTipleri'
import type { UlkeAraclari } from './tipler'
import type { GorunurArac } from './paket'
import type { DilKodu } from '../tipler'

const icerik: UlkeAraclari | null = (AKTIF_ARAYUZ?.araclar as UlkeAraclari | undefined) ?? null
const roller: string[] = ((AKTIF_ARAYUZ?.roller ?? []) as readonly { anahtar: string }[]).map((r) => r.anahtar)
const DOZ = /-(doz|dose)$/
const SIPARIS = /-(buyurtma|orders)$/

describe('specialty depth infrastructure: the active pack', () => {
  it('the specialty tab lists only the role\'s own scores and calculators — never another role\'s, even when one was kept on the patient', () => {
    if (!icerik) return
    for (const rol of roller) {
      const kendi = uzmanlikAraclari(icerik, rol)
      for (const x of kendi) { assert.ok(x.paket.roller?.includes(rol), `${rol}: ${x.tanim.anahtar}`); assert.ok((x.paket.roller?.length ?? 99) <= 3) }
      const baska: string | undefined = roller.find((r) => r !== rol && uzmanlikAraclari(icerik, r).some((x) => !x.paket.roller?.includes(rol)))
      if (!baska) continue
      const yabanci: GorunurArac = uzmanlikAraclari(icerik, baska).find((x) => !x.paket.roller?.includes(rol))!
      const kayit: AracKaydi = { id: 'k1', arac: yabanci.tanim.anahtar, olusturuldu: '2026-11-01T10:00:00Z', gun: '2026-11-01', takipTarihi: null, kapandi: null, girdiler: {}, sonuc: { tamam: true, sayilar: [{ anahtar: 'x', deger: 1, ondalik: 0 }], bant: null, uyarilar: [], tarihler: [] } }
      assert.deepEqual(uzmanlikBolumleri(icerik, rol, [kayit]), [], `${rol} sees ${yabanci.tanim.anahtar} of ${baska}`)
      assert.equal(uzmanlikBolumleri(icerik, baska, [kayit]).length, 1, `${baska} does not see its own ${yabanci.tanim.anahtar}`)
    }
  })

  it('a role\'s dose engine and order presets are seen by that role alone', () => {
    if (!icerik) return
    for (const rol of roller) {
      const t: GorunurArac[] = hesabinAraclari(icerik, rol).rol.filter((x) => DOZ.test(x.tanim.anahtar) || SIPARIS.test(x.tanim.anahtar))
      for (const x of t) assert.deepEqual(x.paket.roller, [rol], `${rol}: ${x.tanim.anahtar}`)
      for (const diger of roller) {
        if (diger === rol) continue
        for (const x of t) assert.ok(!hesabinAraclari(icerik, diger).rol.some((y) => y.tanim.anahtar === x.tanim.anahtar), `${x.tanim.anahtar} leaks to ${diger}`)
      }
    }
  })

  it('the portal demo fixture is example data: the role\'s own chapter, no other role\'s, marked as an example', () => {
    const paket = ulkePaketi()
    for (const dil of (paket.diller ?? []) as DilKodu[]) {
      for (const rol of roller) {
        const d = portalDemoIcerigi({ rol, dil, hekimAdi: 'Dr Example', rolAdi: 'Role', bugun: '2026-11-08' })
        if (!d) continue
        assert.equal(d.ornek, true)
        if (d.bolum) assert.equal(d.bolum.anahtar, rol)
        assert.ok(d.ozetler.every((o) => o.id === 'ornek'))
        assert.equal(d.istek, null)
      }
    }
  })
})
