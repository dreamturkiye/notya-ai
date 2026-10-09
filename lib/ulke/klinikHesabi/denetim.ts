/**
 * NOTYA-ULKE-KLINIK-01 — THE PACK CHECK FOR CLINIC ACCOUNTS. Called by the pack check (lib/ulke/paketDenetimi.ts)
 * where the feature `klinikHesaplari` is on; answers with a list, like every other rule there, and a country's build
 * fails on any line of it. Pure.
 *
 *   - the feature needs the signed-in application, and the pack must list the clinic's screen (and, where it has
 *     appointments, the front-desk workspace);
 *   - every setting is stated, by the country: which capabilities exist, whether a clinic's owner may enter a grant
 *     for a doctor, which allied roles may receive a share, how long an invitation and cover last, who read it;
 *   - a capability needs the feature it works on (the front desk's appointments: `randevu`; the portal link:
 *     `hastaPortali`);
 *   - THE NARROW SIDE IS THE DEFAULT, AND THE WIDE SIDE NEEDS A LAWYER: a clinic's owner may enter a grant for a
 *     doctor only in a pack whose answers a lawyer of the country has read (`inceleme.hukukcu`);
 *   - an allied role that may receive a share is a role of the pack, of the allied kind;
 *   - record retention is a slot and stays one: the kit has no purge to give a number to;
 *   - the catalogue is complete in every form, each sentence that carries a value has the place for it, and THE
 *     SENTENCE THE DOCTOR READS BEFORE GIVING THE PORTAL CAPABILITY NAMES THE PIN — whoever hands a patient the link
 *     and the PIN has seen both, and the doctor is told so.
 */
import type { UlkeArayuzu } from '../arayuz/tipler'
import { eksikAyarMi, eksikMetinMi } from '../eksik'
import { KLINIK_YETKI_TURLERI, type DilKodu, type UlkePaketi } from '../tipler'

export type KlinikSorunu = { yer: string; sorun: string }

const TESLIM = 'to be supplied'
const dolu = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0
const gun = (x: unknown): boolean => typeof x === 'number' && Number.isInteger(x) && x >= 1 && x <= 31

/** Sentences of the clinic catalogue that carry a value: path → the placeholders they must hold. */
export const KLINIK_YER_TUTUCULARI: readonly (readonly [string, readonly string[]])[] = [
  ['klinik.konumunuz', ['%']], ['klinik.cikarOnay', ['%']], ['davet.sonGecerlilik', ['%']],
  ['yetki.bitisIpucu', ['%']], ['yetki.donem', ['%1', '%2']], ['yetki.hastaIcin', ['%']], ['yetki.hekimden', ['%']],
  ['kayit.olay.verildi', ['%1', '%2']], ['kayit.olay.geri-alindi', ['%1', '%2']], ['kayit.olay.bitti', ['%1', '%2']], ['kayit.hasta', ['%']],
  ['paylasilan.hekim', ['%']], ['paylasilan.bitis', ['%']], ['paylasilan.notTarihi', ['%1', '%2']], ['paylasilan.dogum', ['%']], ['onBuro.dogum', ['%']],
]

/** Every key the catalogue must have, as paths (the type is the source; this list lets the check name what is missing in a pack that was not type-checked). */
const GRUPLAR = ['kabuk', 'konum', 'yetkiTuru', 'yetkiAciklama', 'giris', 'klinik', 'davet', 'takvim', 'yetki', 'kayit', 'paylasilan', 'onBuro'] as const

function metinleriGez(deger: unknown, yer: string, s: KlinikSorunu[]): void {
  if (eksikAyarMi(deger)) { s.push({ yer, sorun: `${TESLIM}: ${deger.__eksikAyar}` }); return }
  if (typeof deger === 'string') { if (eksikMetinMi(deger)) s.push({ yer, sorun: TESLIM }); else if (!deger.trim()) s.push({ yer, sorun: 'empty text' }); return }
  if (deger && typeof deger === 'object') for (const [k, v] of Object.entries(deger)) metinleriGez(v, `${yer}.${k}`, s)
}
const yoldan = (o: unknown, yol: string): unknown => yol.split('.').reduce<unknown>((x, k) => (x && typeof x === 'object' ? (x as Record<string, unknown>)[k] : undefined), o)

export function klinikHesabiSorunlari(paket: UlkePaketi, arayuz: UlkeArayuzu | null, diller: readonly DilKodu[]): KlinikSorunu[] {
  const s: KlinikSorunu[] = []
  const ekle = (yer: string, sorun: string) => s.push({ yer, sorun })
  if (!paket.ozellikler.klinikHesaplari) return s
  if (!paket.ozellikler.cekirdekMuayene) ekle('ozellikler.klinikHesaplari', 'clinic accounts need the signed-in application (cekirdekMuayene)')
  if (paket.rotalar !== 'hepsi') {
    if (!paket.rotalar.sayfalar.includes('/clinic')) ekle('rotalar.sayfalar', 'clinic accounts are on and "/clinic" is not listed')
    if (paket.ozellikler.randevu && !paket.rotalar.sayfalar.includes('/desk')) ekle('rotalar.sayfalar', 'clinic accounts and appointments are on and "/desk" (the front-desk workspace) is not listed')
  }

  // ── the settings ──
  const a = paket.uygulama?.klinikHesaplari
  const Y = 'uygulama.klinikHesaplari'
  if (!a) ekle(Y, 'clinic accounts are on and the pack states no settings for them')
  else if (eksikAyarMi(a)) ekle(Y, `${TESLIM}: ${a.__eksikAyar}`)
  else {
    const inceleme = a.inceleme
    const hukukcuOkudu = Boolean(inceleme) && !eksikAyarMi(inceleme) && dolu(inceleme.hukukcu)
    if (!inceleme) ekle(`${Y}.inceleme`, 'must say who wrote these answers and whether a lawyer of the country has read them')
    else if (!eksikAyarMi(inceleme)) {
      if (typeof inceleme.makineYazimi !== 'boolean') ekle(`${Y}.inceleme.makineYazimi`, 'must be true or false')
      if (inceleme.hukukcu !== null && !dolu(inceleme.hukukcu)) ekle(`${Y}.inceleme.hukukcu`, 'must be the name of the lawyer who read the answers, or null')
    }
    const turler = a.yetkiTurleri
    if (!eksikAyarMi(turler)) {
      if (!Array.isArray(turler) || turler.length === 0) ekle(`${Y}.yetkiTurleri`, 'must list at least one capability: clinic accounts without any are members and nothing else — say so with the feature switched off')
      else {
        if (new Set(turler).size !== turler.length) ekle(`${Y}.yetkiTurleri`, 'lists a capability twice')
        for (const t of turler) if (!(KLINIK_YETKI_TURLERI as readonly string[]).includes(t)) ekle(`${Y}.yetkiTurleri`, `"${String(t)}" is not a capability of the kit`)
        if (turler.includes('on-buro-randevu') && !paket.ozellikler.randevu) ekle(`${Y}.yetkiTurleri`, 'the front desk\'s appointments capability (on-buro-randevu) needs appointments (randevu)')
        if (turler.includes('on-buro-portal') && !paket.ozellikler.hastaPortali) ekle(`${Y}.yetkiTurleri`, 'the front desk\'s portal capability (on-buro-portal) needs the patient portal (hastaPortali)')
      }
    }
    if (!eksikAyarMi(a.sahipHekimAdinaVerebilir)) {
      if (typeof a.sahipHekimAdinaVerebilir !== 'boolean') ekle(`${Y}.sahipHekimAdinaVerebilir`, 'must be true or false; every new country starts with false')
      else if (a.sahipHekimAdinaVerebilir && !hukukcuOkudu) ekle(`${Y}.sahipHekimAdinaVerebilir`, 'a clinic\'s owner may enter a grant for a doctor\'s patients only where a lawyer of the country has read these answers (inceleme.hukukcu): until then it is false')
    }
    const roller = paket.uygulama?.roller
    const rolTanimlari = Array.isArray(arayuz?.roller) ? arayuz.roller : []
    if (!eksikAyarMi(a.paylasimRolleri)) {
      if (!Array.isArray(a.paylasimRolleri)) ekle(`${Y}.paylasimRolleri`, 'must be a list of role keys ([] where no allied role may receive a share)')
      else {
        if (new Set(a.paylasimRolleri).size !== a.paylasimRolleri.length) ekle(`${Y}.paylasimRolleri`, 'lists a role twice')
        for (const r of a.paylasimRolleri) {
          if (Array.isArray(roller) && !roller.includes(r)) ekle(`${Y}.paylasimRolleri`, `"${String(r)}" is not a role of this pack`)
          else { const t = rolTanimlari.find((x) => x.anahtar === r); if (t && t.taraf !== 'klinik-muttefik') ekle(`${Y}.paylasimRolleri`, `"${r}" is not an allied role: a share is read by an allied professional`) }
        }
        if (Array.isArray(turler) && turler.includes('paylasim') && a.paylasimRolleri.length === 0) ekle(`${Y}.paylasimRolleri`, 'the share capability is on and no allied role may receive one: list the roles, or take "paylasim" out of yetkiTurleri')
      }
    }
    if (!eksikAyarMi(a.davetGecerlilikGun) && !gun(a.davetGecerlilikGun)) ekle(`${Y}.davetGecerlilikGun`, 'must be a whole number of days from 1 to 31')
    if (!eksikAyarMi(a.vekaletAzamiGun) && !gun(a.vekaletAzamiGun)) ekle(`${Y}.vekaletAzamiGun`, 'must be a whole number of days from 1 to 31')
    if (a.kayitSaklama !== null) ekle(`${Y}.kayitSaklama`, 'is a slot and must be null: the kit deletes no record row and has no purge; a retention period is built in when a lawyer of the country states it')
  }

  // ── the catalogue, once per form ──
  if (!arayuz) return s
  for (const d of diller) {
    const km = arayuz.klinikMetinleri?.[d]
    const K = `arayuz.klinikMetinleri[${d}]`
    if (!km) { ekle(K, 'clinic accounts are on and this form has no catalogue for them'); continue }
    for (const g of GRUPLAR) if (!(km as Record<string, unknown>)[g]) ekle(`${K}.${g}`, 'this part of the catalogue is missing')
    metinleriGez(km, K, s)
    for (const [yol, yerler] of KLINIK_YER_TUTUCULARI) {
      const metin = yoldan(km, yol)
      if (typeof metin !== 'string' || eksikMetinMi(metin) || !metin.trim()) continue
      for (const y of yerler) if (!(y === '%' ? /%(?!\d)/ : new RegExp(`${y}(?!\\d)`)).test(metin)) ekle(`${K}.${yol}`, `must hold "${y}" where the value is written`)
    }
    // THE PLAIN SENTENCE: before the portal capability is given, the doctor is told that the member will see the PIN.
    const cumle = yoldan(km, 'yetkiAciklama.on-buro-portal'), pin = yoldan(km, 'onBuro.pin')
    if (dolu(cumle) && dolu(pin) && !eksikMetinMi(cumle) && !eksikMetinMi(pin)) {
      const sozcuk = (/^[\p{L}\p{N}]+/u.exec(pin.trim())?.[0] ?? '').toLocaleLowerCase()
      if (!sozcuk || !cumle.toLocaleLowerCase().includes(sozcuk)) ekle(`${K}.yetkiAciklama.on-buro-portal`, `must say that the member will see the patient's link and PIN: it does not name the PIN as this form's own label does ("${pin}")`)
    }
  }
  return s
}
