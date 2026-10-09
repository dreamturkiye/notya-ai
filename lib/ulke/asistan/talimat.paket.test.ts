/**
 * NOTYA-ULKE-ASISTAN-01 — THE ASSISTANT'S INSTRUCTION, ASSEMBLED, for whatever pack is active. Runs ONCE PER PACK,
 * and inside it ONCE PER ROLE: one test for each role the pack has (Uzbekistan: 40).
 *
 * For every role, in every language form of the application, the instruction the kit assembles from the pack's
 * parts must
 *   - exist (a role with a named assistant and no instruction would be an assistant that cannot answer);
 *   - hold its parts, in the kit's order: persona (the role's OWN assistant by name with its title, the seniority
 *     the pack states, the role), role scope, language rule, sources, honesty, safety, form;
 *   - name every authority and reference work the pack lists for the role, and — where the pack lists no reference
 *     work — say so in the pack's own words;
 *   - carry no placeholder that was not filled, and no other role's assistant;
 *   - carry NONE OF ANOTHER COUNTRY'S VOCABULARY (the leak scan of lib/ulke/testing/sizintiTarayici.ts);
 *   - carry nothing that looks like clinical reference content: no number but the seniority and the numbering of
 *     its own rules, no unit of dose.
 *
 * A pack without the assistant has nothing to assemble, and that is asserted too. Pure: no server, no network.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AKTIF_PAKET } from '@/countries/active'
import { AKTIF_ARAYUZ } from '@/countries/active/arayuz'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import type { DilKodu } from '@/lib/ulke/tipler'
import { asistanHastaBlogu, asistanTalimatBolumleri, asistanTalimati, rolunKaynaklari, TALIMAT_PARCA_ANAHTARLARI } from './talimat'
import type { AsistanIcerigi, AsistanTalimatParcalari } from './tipler'

const paket = AKTIF_PAKET
const icerik = AKTIF_KLINIK?.asistan ?? null
const arayuz = AKTIF_ARAYUZ
const diller = paket.uygulama?.diller ?? []
const roller = arayuz?.roller ?? []

/** The role's own assistant and the role's name in a form, as the route builds them. */
function kisi(rol: string, dil: (typeof diller)[number]): { tamAd: string; rolAdi: string } | null {
  const k = arayuz?.asistan(rol, dil)
  const ad = roller.find((r) => r.anahtar === rol)?.ad[dil]
  return k && ad ? { tamAd: k.tamAd, rolAdi: ad } : null
}

describe(`assistant instruction — pack "${paket.kod}"`, () => {
  if (!icerik || !arayuz) {
    it('the pack brings no assistant: the feature is off and nothing can be assembled', () => {
      assert.notEqual(paket.ozellikler.ulkeAsistani, true, 'the feature is on and the clinical half brings no assistant')
    })
    return
  }

  it('the pack lists roles, forms and a seniority', () => {
    assert.ok(roller.length > 0 && diller.length > 0)
    assert.ok(Number.isInteger(icerik.kidemYili) && icerik.kidemYili >= 1)
  })

  for (const r of roller) {
    it(`role "${r.anahtar}": the instruction holds its parts in every form and nothing of another country`, () => {
      for (const dil of diller) {
        const yer = `${paket.kod}/${r.anahtar}/${dil}`
        const k = kisi(r.anahtar, dil)
        assert.ok(k, `${yer}: the role has no assistant of its own or no name in this form`)
        const p = icerik.parcalar(r.anahtar, dil)
        assert.ok(p, `${yer}: the pack has no instruction parts`)
        for (const anahtar of TALIMAT_PARCA_ANAHTARLARI) assert.ok(p[anahtar]?.trim(), `${yer}: the part "${anahtar}" is empty`)
        const b = asistanTalimatBolumleri(icerik, r.anahtar, dil, k)
        const tam = asistanTalimati(icerik, r.anahtar, dil, k)
        assert.ok(b && tam, `${yer}: the instruction was not assembled`)

        // ORDER: the seven parts, each present, one after the other.
        let son = -1
        for (const parca of [b.kimlik, b.kapsam, b.dil, b.kaynaklar, b.durustluk, b.guvenlik, b.bicim]) {
          const i = tam.indexOf(parca)
          assert.ok(parca.trim() && i > son, `${yer}: a part is missing or out of order`)
          son = i
        }
        // PERSONA: the role's own assistant by its full name, the role, the pack's years of practice.
        assert.ok(b.kimlik.includes(k.tamAd), `${yer}: the persona does not name the role's assistant`)
        assert.ok(b.kimlik.includes(k.rolAdi), `${yer}: the persona does not name the role`)
        assert.ok(b.kimlik.includes(String(icerik.kidemYili)), `${yer}: the persona does not state the seniority`)
        // ROLE SCOPE names the role; the fixed parts are the pack's own sentences, unchanged.
        assert.ok(b.kapsam.includes(k.rolAdi), `${yer}: the scope does not name the role`)
        assert.equal(b.dil, p.dil); assert.equal(b.durustluk, p.durustluk); assert.equal(b.guvenlik, p.guvenlik); assert.equal(b.bicim, p.bicim)
        // SOURCES: every entry the pack lists is named; no reference work → the pack's sentence that none was given.
        const kaynaklar = rolunKaynaklari(icerik, r.anahtar)
        assert.ok(kaynaklar, `${yer}: the role is not listed among the sources (an empty list must be stated)`)
        for (const kaynak of kaynaklar) assert.ok(b.kaynaklar.includes(kaynak.ad[dil]), `${yer}: a listed source is not named`)
        if (!kaynaklar.some((x) => x.tur === 'eser')) assert.ok(b.kaynaklar.includes(p.kaynakYok), `${yer}: no reference work is listed and the instruction does not say so`)
        assert.ok(b.kaynaklar.endsWith(p.kaynakSon), `${yer}: the sources block does not end with the pack's closing sentence`)
        // NO HOLE: every placeholder was filled.
        assert.doesNotMatch(tam, /%\d|%(?![\p{L}\p{N}])/u, `${yer}: a placeholder was left in the instruction`)
        // NO OTHER ROLE'S ASSISTANT.
        for (const diger of roller) {
          if (diger.anahtar === r.anahtar) continue
          const d = arayuz.asistan(diger.anahtar, dil)
          if (d && d.tamAd !== k.tamAd) assert.ok(!tam.includes(d.tamAd), `${yer}: names the assistant of "${diger.anahtar}"`)
        }
        // NOTHING OF ANOTHER COUNTRY.
        assert.deepEqual(sizintiTara(tam, { hedefUlke: paket.kod, kaynak: `assistant instruction ${yer}` }), [])
        // NO REFERENCE CONTENT: the only numbers are the seniority and the numbering of the rules ("1)").
        const sayilar: string[] = [...(tam.replace(k.tamAd, '').match(/\d+(?![)\d])/g) ?? [])].filter((n: string): boolean => n !== String(icerik.kidemYili))
        assert.deepEqual(sayilar, [], `${yer}: the instruction carries a number that is neither the seniority nor a rule's number`)
        assert.doesNotMatch(tam, /\d\s?(mg|мг|ml|мл|mcg|мкг|IU|ME|МЕ)\b/u, `${yer}: the instruction carries a dose`)

        // The second block: with no patient, and with one — the data follows the pack's own sentence.
        assert.equal(asistanHastaBlogu(icerik, r.anahtar, dil, null), p.hastaYok)
        const hasta = asistanHastaBlogu(icerik, r.anahtar, dil, 'X')
        assert.ok(hasta && hasta.startsWith(p.hasta) && hasta.endsWith('X'), `${yer}: the patient block is not the pack's sentence followed by the data`)
        assert.deepEqual(sizintiTara(`${p.hasta}\n${p.hastaYok}`, { hedefUlke: paket.kod, kaynak: `assistant patient block ${yer}` }), [])
      }
    })
  }

  it('a role the pack does not have, a form it does not offer and a role without a person get NO instruction', () => {
    const r = roller[0].anahtar
    const dil = diller[0]
    assert.equal(asistanTalimati(icerik, 'no-such-role', dil, kisi(r, dil)), null)
    assert.equal(asistanTalimati(icerik, r, dil, null), null)
    assert.equal(asistanTalimati(icerik, r, 'xx-Nope' as (typeof diller)[number], kisi(r, dil)), null)
    assert.equal(asistanHastaBlogu(icerik, 'no-such-role', dil, null), null)
  })

  it('a part that is missing, or a source without a name in the form, leaves NO instruction rather than one with a hole', () => {
    const r = roller[0].anahtar
    const dil = diller[0]
    const k = kisi(r, dil)
    for (const anahtar of TALIMAT_PARCA_ANAHTARLARI) {
      const eksik: AsistanIcerigi = { ...icerik, parcalar: (rol: string, d: DilKodu): AsistanTalimatParcalari | null => { const p = icerik.parcalar(rol, d); return p ? { ...p, [anahtar]: ' ' } : null } }
      assert.equal(asistanTalimati(eksik, r, dil, k), null, `an empty "${anahtar}" still gave an instruction`)
    }
    const adsiz = { ...icerik, kaynaklar: { ortak: [{ tur: 'eser' as const, ad: {}, dayanak: 'x', dogrulayan: null }], roller: icerik.kaynaklar.roller } }
    assert.equal(asistanTalimati(adsiz, r, dil, k), null)
    const listesiz = { ...icerik, kaynaklar: { ortak: icerik.kaynaklar.ortak, roller: {} } }
    assert.equal(asistanTalimati(listesiz, r, dil, k), null, 'a role that is not listed among the sources still gave an instruction')
  })

  it('a reference work on a role\'s list is named, and the "none was given" sentence is then left out', () => {
    const r = roller[0].anahtar
    const dil = diller[0]
    const p = icerik.parcalar(r, dil)!
    const eserli = { ...icerik, kaynaklar: { ortak: [], roller: { ...icerik.kaynaklar.roller, [r]: [{ tur: 'eser' as const, ad: Object.fromEntries(diller.map((d) => [d, 'SYNTHETIC REFERENCE WORK'])), dayanak: 'test', dogrulayan: 'QA' }] } } }
    const b = asistanTalimatBolumleri(eserli, r, dil, kisi(r, dil))!
    assert.ok(b.kaynaklar.includes('SYNTHETIC REFERENCE WORK'))
    assert.ok(!b.kaynaklar.includes(p.kaynakYok))
  })
})
